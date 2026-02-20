import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User, UserResponse } from '../models/User';
import { validate } from 'class-validator';
import { generateTokens, TokenPayload } from '../utils/jwt';
import { RefreshToken } from '../models/RefreshToken';
import { PasswordResetToken } from '../models/PasswordResetToken';
import { Location } from '../models/Location';
import * as crypto from 'crypto';
import { UserRole } from '../types/roles';
import { EmailService } from '../services/email.service';

type ErrorWithMessage = {
  message: string;
  [key: string]: any;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

export class AuthController {
  static login = async (req: Request, res: Response) => {
    try {
      let { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Normalize email
      email = String(email).trim().toLowerCase();

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { email },
        relations: ['organization'] // Include organization data
      });

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isPasswordValid = await user.validatePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: 'Account is deactivated' });
      }

      // Ensure user has a valid UUID primary key (legacy records may have empty id)
      if (!user.id || user.id.trim() === '') {
        user.id = crypto.randomUUID();
        await AppDataSource.getRepository(User).save(user);
      }

      // Generate JWT tokens
      const tokens = generateTokens(user);

      // Create refresh token in database
      const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
      const refreshToken = refreshTokenRepository.create({
        token: tokens.refreshToken,
        user: user,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdByIp: req.ip
      });
      await refreshTokenRepository.save(refreshToken);

      // Prepare user data for response (exclude password)
      const { password: _, ...userData } = user;

      // Set HTTP-only cookie for refresh token
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Find all associated organizations for this email (ADMIN ONLY)
      let availableLocations: any[] = [];
      let availableBranches: any[] = []; // NEW: Branches within current organization
      console.log(`[AuthDebug] Login MultiLog Check for ${user.email}, Role: ${user.role}`);

      if (user.role === 'admin' || user.role === 'super_admin') {
        const allUserAccounts = await userRepository.find({
          where: { email }, // Note: 'email' var is from req body, but verified via user lookup
          relations: ['organization']
        });

        console.log(`[AuthDebug] Login Found ${allUserAccounts.length} accounts.`);

        availableLocations = allUserAccounts
          .filter(u => u.organization && u.isActive)
          .map(u => ({
            id: u.organization!.id,
            name: u.organization!.name,
            subdomain: u.organization!.subdomain,
            city: u.city || u.organization!.address
          }));

        // Fetch branches (Locations)
        const locationRepo = AppDataSource.getRepository(Location);

        if (user.role === 'super_admin') {
          // Super Admin: fetch ALL locations across ALL organizations
          const allBranches = await locationRepo.find({
            where: { isActive: true },
            relations: ['organization'],
            order: { organizationId: 'ASC', isMainBranch: 'DESC', name: 'ASC' }
          });
          availableBranches = allBranches.map(branch => ({
            id: branch.id,
            name: branch.name,
            code: branch.code,
            city: branch.city,
            isMainBranch: branch.isMainBranch,
            organizationId: branch.organizationId,
            organizationName: (branch as any).organization?.name || ''
          }));
        } else if (user.organizationId) {
          // Org Admin: fetch branches within their organization
          if (!user.locationId) {
            const allBranches = await locationRepo.find({
              where: { organizationId: user.organizationId, isActive: true },
              order: { isMainBranch: 'DESC', name: 'ASC' }
            });
            availableBranches = allBranches.map(branch => ({
              id: branch.id,
              name: branch.name,
              code: branch.code,
              city: branch.city,
              isMainBranch: branch.isMainBranch
            }));
          } else {
            const assignedBranch = await locationRepo.findOne({
              where: { id: user.locationId, isActive: true }
            });
            if (assignedBranch) {
              availableBranches = [{
                id: assignedBranch.id,
                name: assignedBranch.name,
                code: assignedBranch.code,
                city: assignedBranch.city,
                isMainBranch: assignedBranch.isMainBranch
              }];
            }
          }
        }
      }

      return res.json({
        message: 'Login successful',
        user: {
          ...userData,
          currentBranchId: user.locationId || null, // Include current branch assignment
        },
        availableLocations, // Organizations user can switch to
        availableBranches, // Branches within current organization
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn
      });

    } catch (error: unknown) {
      console.error('Login error:', error);
      return res.status(500).json({
        message: 'An error occurred during login',
        error: process.env.NODE_ENV === 'development' ? getErrorMessage(error) : undefined
      });
    }
  };

  static register = async (req: Request, res: Response) => {
    try {
      let { firstName, lastName, email, phone, password, confirmPassword, gender, country, city } = req.body;

      // Check if passwords match
      if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
      }

      // Enforce strong password: min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit, 1 special
      const passwordStr = String(password);
      const policy = {
        min: 8,
        upper: /[A-Z]/,
        lower: /[a-z]/,
        digit: /\d/,
        special: /[@$!%*?&]/
      };
      const violations: string[] = [];
      if (!passwordStr || passwordStr.length < policy.min) violations.push('at least 8 characters');
      if (!policy.upper.test(passwordStr)) violations.push('one uppercase letter');
      if (!policy.lower.test(passwordStr)) violations.push('one lowercase letter');
      if (!policy.digit.test(passwordStr)) violations.push('one number');
      if (!policy.special.test(passwordStr)) violations.push('one special character');
      if (violations.length) {
        return res.status(400).json({ message: `Password must contain ${violations.join(', ')}` });
      }

      // MULTI-TENANT: Get organization context
      // Patients register without an organization - they choose hospital later via ChooseHospital page
      // organizationId can be null for patients until they select a hospital
      const orgId = (req as any).tenant?.id || req.body.organizationId || null;

      // Check if user already exists
      const userRepository = AppDataSource.getRepository(User);
      // Normalize email
      email = String(email).trim().toLowerCase();

      const existingUser = await userRepository.findOne({ where: { email } });

      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }

      // Create new user
      const user = new User();
      user.firstName = firstName;
      user.lastName = lastName;
      user.email = email;
      user.phone = phone;
      user.password = password;
      user.gender = gender; // Save gender
      user.country = country; // Save country
      user.city = city; // Save city
      user.role = UserRole.PATIENT; // Default role
      user.isActive = true;
      user.organizationId = orgId; // MULTI-TENANT: Assign organization

      // Validate user input
      const errors = await validate(user);
      if (errors.length > 0) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.map(e => e.constraints)
        });
      }

      // Hash password and save user
      await user.hashPassword();
      await userRepository.save(user);

      // Send welcome email (don't wait for it)
      // Send welcome email
      try {
        // Use fire-and-forget but log failure
        EmailService.sendWelcomeEmail(user.email, user.firstName)
          .then(sent => sent ? console.log(`✅ Welcome email sent to ${user.email}`) : console.error(`❌ Failed to send welcome email to ${user.email}`))
          .catch(err => console.error(`❌ Error sending welcome email to ${user.email}:`, err));
      } catch (emailError) {
        console.error('Email service not available:', emailError);
      }

      // Prepare response (exclude password)
      const userResponse: UserResponse = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role as UserRole,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      const tail = String(user.id || '').replace(/-/g, '').slice(-6).toUpperCase();
      const sub = String(((req as any)?.tenant?.subdomain) || '').toUpperCase();
      const displayPatientId = sub ? `PID-${sub}-${tail}` : `PID-${tail}`;

      return res.status(201).json({
        message: 'Registration successful',
        user: userResponse,
        displayPatientId
      });

    } catch (error: unknown) {
      console.error('Registration error:', error);
      return res.status(500).json({
        message: 'An error occurred during registration',
        error: process.env.NODE_ENV === 'development' ? getErrorMessage(error) : undefined
      });
    }
  };

  static logout = async (req: Request, res: Response) => {
    try {
      // Get refresh token from cookies or request body
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

      if (refreshToken) {
        // Delete the refresh token from database
        const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
        await refreshTokenRepository.delete({ token: refreshToken });

        // Clear the refresh token cookie
        res.clearCookie('refreshToken');
      }

      return res.status(200).json({ message: 'Successfully logged out' });
    } catch (error: unknown) {
      console.error('Logout error:', error);
      return res.status(500).json({
        message: 'An error occurred during logout',
        error: process.env.NODE_ENV === 'development' ? getErrorMessage(error) : undefined
      });
    }
  };

  static refreshToken = async (req: Request, res: Response) => {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required' });
      }

      // Verify the refresh token
      const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
      const storedToken = await refreshTokenRepository.findOne({
        where: { token: refreshToken },
        relations: ['user']
      });

      // Check if token exists and is not expired
      if (!storedToken || storedToken.isExpired) {
        if (storedToken) {
          // Remove expired token from database
          await refreshTokenRepository.remove(storedToken);
        }
        return res.status(401).json({ message: 'Invalid or expired refresh token' });
      }

      // Get user from token
      const user = storedToken.user;
      if (!user) {
        return res.status(401).json({ message: 'Invalid or expired refresh token' });
      }

      // Generate new tokens
      const tokens = generateTokens(user);

      // Update refresh token in database
      storedToken.token = tokens.refreshToken;
      storedToken.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      storedToken.isRevoked = false;
      storedToken.revokedByIp = null;
      storedToken.revokedAt = null;
      storedToken.replacedByToken = null;

      await refreshTokenRepository.save(storedToken);

      // Set HTTP-only cookie for new refresh token
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return res.status(200).json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn
      });
    } catch (error: unknown) {
      console.error('Refresh token error:', error);
      return res.status(500).json({
        message: 'Failed to refresh token',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  };

  static forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { email } });

      // For security reasons, we don't reveal if the email exists or not
      if (!user) {
        // In production, we would still return a 200 response to prevent email enumeration
        if (process.env.NODE_ENV === 'development') {
          return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({ message: 'If your email exists in our system, you will receive a password reset link' });
      }

      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      // Save token to database with 15-minute expiration
      const resetTokenRepository = AppDataSource.getRepository(PasswordResetToken);

      // Delete any existing tokens for this email
      await resetTokenRepository.delete({ email });

      // Create new reset token
      const passwordResetToken = resetTokenRepository.create({
        email,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        userId: user.id
      });
      await resetTokenRepository.save(passwordResetToken);

      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

      // Send email with reset link
      try {
        await EmailService.sendPasswordResetEmail(email, user.firstName, resetUrl);
        console.log(`✅ Password reset email sent to ${email}`);
      } catch (emailError) {
        console.error('❌ Failed to send reset email:', emailError);
        // Continue - don't fail the request if email fails
      }

      console.log(`Password reset link for ${email}: ${resetUrl}`);

      return res.status(200).json({
        message: 'If your email exists in our system, you will receive a password reset link',
        // In development, return the reset URL for testing
        ...(process.env.NODE_ENV === 'development' && { resetUrl })
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      return res.status(500).json({
        message: 'Failed to process password reset request',
        error: process.env.NODE_ENV === 'development' ? getErrorMessage(error) : undefined
      });
    }
  };

  static resetPassword = async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
      }

      // Hash the provided token to compare with stored hash
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Find the reset token in database
      const resetTokenRepository = AppDataSource.getRepository(PasswordResetToken);
      const resetTokenRecord = await resetTokenRepository.findOne({
        where: { token: hashedToken },
        relations: ['user']
      });

      // Validate token exists, not expired, and not used
      if (!resetTokenRecord ||
        resetTokenRecord.expiresAt < new Date() ||
        resetTokenRecord.isUsed) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }

      const user = resetTokenRecord.user;
      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }

      // Validate new password strength
      const passwordStr = String(newPassword);
      const policy = {
        min: 8,
        upper: /[A-Z]/,
        lower: /[a-z]/,
        digit: /\d/,
        special: /[@$!%*?&]/
      };
      const violations: string[] = [];
      if (!passwordStr || passwordStr.length < policy.min) violations.push('at least 8 characters');
      if (!policy.upper.test(passwordStr)) violations.push('one uppercase letter');
      if (!policy.lower.test(passwordStr)) violations.push('one lowercase letter');
      if (!policy.digit.test(passwordStr)) violations.push('one number');
      if (!policy.special.test(passwordStr)) violations.push('one special character');
      if (violations.length) {
        return res.status(400).json({ message: `Password must contain ${violations.join(', ')}` });
      }

      // Update the password
      const userRepository = AppDataSource.getRepository(User);
      user.password = newPassword;
      await user.hashPassword();
      await userRepository.save(user);

      // Mark token as used
      resetTokenRecord.isUsed = true;
      await resetTokenRepository.save(resetTokenRecord);

      // Delete all other reset tokens for this user (except the current one)
      await resetTokenRepository
        .createQueryBuilder()
        .delete()
        .where('userId = :userId AND id != :currentId', {
          userId: user.id,
          currentId: resetTokenRecord.id
        })
        .execute();

      // Send confirmation email
      try {
        await EmailService.sendEmail({
          to: user.email,
          subject: '✅ Password Successfully Changed',
          html: `
            <h2>Password Changed Successfully</h2>
            <p>Hello ${user.firstName},</p>
            <p>Your password has been successfully changed. If you did not make this change, please contact support immediately.</p>
            <p>For security, you may want to review your recent account activity.</p>
          `
        });
      } catch (emailError) {
        console.error('Failed to send password change confirmation:', emailError);
      }

      return res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (error) {
      console.error('Reset password error:', error);
      return res.status(500).json({
        message: 'Failed to reset password',
        error: process.env.NODE_ENV === 'development' ? getErrorMessage(error) : undefined
      });
    }
  };

  static getCurrentUser = async (req: Request, res: Response) => {
    try {
      // The user is already attached to req by the auth middleware
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      // Fetch fresh user data from database
      const userRepository = AppDataSource.getRepository(User);
      // Added organizationId and locationId to select for location switching logic
      const currentUser = await userRepository.findOne({
        where: { id: user.id },
        select: ['id', 'email', 'firstName', 'lastName', 'role', 'phone', 'isActive', 'createdAt', 'updatedAt', 'organizationId', 'locationId'],
        relations: ['organization'] // Added relation for frontend display
      });

      if (!currentUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (!currentUser.isActive) {
        return res.status(403).json({ message: 'Account is deactivated' });
      }

      const tail = String(currentUser.id || '').replace(/-/g, '').slice(-6).toUpperCase();
      const sub = String(((req as any)?.tenant?.subdomain) || '').toUpperCase();
      const displayPatientId = sub ? `PID-${sub}-${tail}` : `PID-${tail}`;

      // Find all associated organizations for this email (ADMIN & SUPER_ADMIN ONLY)
      let availableLocations: any[] = [];
      let availableBranches: any[] = []; // NEW
      console.log(`[AuthDebug] Checking MultiLog for ${currentUser.email}, Role: ${currentUser.role}`);

      // Tier 1 & 2: Super Admin or Multi-location Admins (CEOs) get the switcher
      if (currentUser.role === 'super_admin' || currentUser.role === 'admin') {
        const allUserAccounts = await userRepository.find({
          where: { email: currentUser.email },
          relations: ['organization']
        });

        console.log(`[AuthDebug] Found ${allUserAccounts.length} accounts.`);

        // Only show switcher if they have at least 2 active accounts
        if (allUserAccounts.length > 1 || currentUser.role === 'super_admin') {
          availableLocations = allUserAccounts
            .filter(u => u.organization && u.isActive)
            .map(u => ({
              id: u.organization!.id,
              name: u.organization!.name,
              subdomain: u.organization!.subdomain,
              city: u.city || u.organization!.address
            }));
          console.log(`[AuthDebug] Mapped ${availableLocations.length} available locations.`);
        }

        // Fetch Branches (Locations)
        const locationRepo = AppDataSource.getRepository(Location);

        if (currentUser.role === 'super_admin') {
          // Super Admin: fetch ALL locations across ALL organizations
          const allBranches = await locationRepo.find({
            where: { isActive: true },
            relations: ['organization'],
            order: { organizationId: 'ASC', isMainBranch: 'DESC', name: 'ASC' }
          });
          availableBranches = allBranches.map(branch => ({
            id: branch.id,
            name: branch.name,
            code: branch.code,
            city: branch.city,
            isMainBranch: branch.isMainBranch,
            organizationId: branch.organizationId,
            organizationName: (branch as any).organization?.name || ''
          }));
          console.log(`[AuthDebug] Super Admin: found ${availableBranches.length} branches across all orgs.`);
        } else if (currentUser.organizationId) {
          // Org Admin: fetch branches within their organization
          if (!currentUser.locationId) {
            const allBranches = await locationRepo.find({
              where: { organizationId: currentUser.organizationId, isActive: true },
              order: { isMainBranch: 'DESC', name: 'ASC' }
            });
            availableBranches = allBranches.map(branch => ({
              id: branch.id,
              name: branch.name,
              code: branch.code,
              city: branch.city,
              isMainBranch: branch.isMainBranch
            }));
          } else {
            const assignedBranch = await locationRepo.findOne({
              where: { id: currentUser.locationId, isActive: true }
            });
            if (assignedBranch) {
              availableBranches = [{
                id: assignedBranch.id,
                name: assignedBranch.name,
                code: assignedBranch.code,
                city: assignedBranch.city,
                isMainBranch: assignedBranch.isMainBranch
              }];
            }
          }
        }
      } else {
        console.log('[AuthDebug] User is not eligible for multi-loc (Doctor/Patient/etc).');
      }

      return res.json({
        ...currentUser,
        availableLocations,
        availableBranches,
        currentBranchId: currentUser.locationId || null,
        displayPatientId
      });
    } catch (error) {
      console.error('Get current user error:', error);
      return res.status(500).json({
        message: 'Failed to get user information',
        error: process.env.NODE_ENV === 'development' ? getErrorMessage(error) : undefined
      });
    }
  };

  // Switch Organization (Multi-location support)
  static switchOrganization = async (req: Request, res: Response) => {
    try {
      const { targetOrganizationId } = req.body;
      const currentUserId = (req as any).user.id;
      const userRepository = AppDataSource.getRepository(User);

      const currentUser = await userRepository.findOne({ where: { id: currentUserId } });
      if (!currentUser) return res.status(404).json({ message: 'User not found' });

      // Find the user account in the target organization with the same email
      const targetUser = await userRepository.findOne({
        where: {
          email: currentUser.email,
          organizationId: targetOrganizationId
        },
        relations: ['organization']
      });

      if (!targetUser) {
        return res.status(403).json({ message: 'Access to target organization denied' });
      }

      // Generate new tokens for the target user context
      const tokens = generateTokens(targetUser);

      // Return the new access token
      return res.json({
        accessToken: tokens.accessToken,
        user: {
          id: targetUser.id,
          email: targetUser.email,
          organizationId: targetUser.organizationId,
          role: targetUser.role
        }
      });

    } catch (e) {
      console.error('Switch organization error:', e);
      return res.status(500).json({ message: 'Failed to switch organization' });
    }
  };
}
