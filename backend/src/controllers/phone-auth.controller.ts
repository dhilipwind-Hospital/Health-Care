import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { verifyFirebaseToken, isFirebaseAdminConfigured } from '../services/firebase-admin.service';
import { generateTokens } from '../utils/jwt';
import { RefreshToken } from '../models/RefreshToken';
import { UserRole } from '../types/roles';

export class PhoneAuthController {
  // Verify phone number and link to existing user or create new user
  static verifyPhoneAndAuth = async (req: Request, res: Response) => {
    try {
      const { firebaseIdToken, phoneNumber } = req.body;

      if (!firebaseIdToken || !phoneNumber) {
        return res.status(400).json({ message: 'Firebase ID token and phone number are required' });
      }

      if (!isFirebaseAdminConfigured()) {
        return res.status(503).json({ message: 'Phone authentication service is not configured' });
      }

      // Verify Firebase token
      const decodedToken = await verifyFirebaseToken(firebaseIdToken);
      if (!decodedToken) {
        return res.status(401).json({ message: 'Invalid Firebase token' });
      }

      // Verify phone number matches
      if (decodedToken.phone_number !== phoneNumber) {
        return res.status(400).json({ message: 'Phone number mismatch' });
      }

      const userRepository = AppDataSource.getRepository(User);

      // Check if user exists with this phone number
      let user = await userRepository.findOne({ 
        where: { phone: phoneNumber },
        relations: ['organization']
      });

      if (!user) {
        // Create new user with phone number
        user = userRepository.create({
          phone: phoneNumber,
          role: UserRole.PATIENT,
          isActive: true,
          firstName: 'Phone',
          lastName: 'User',
          email: `phone_${phoneNumber.replace(/\+/g, '')}@placeholder.local`
        });
        await userRepository.save(user);
      }

      // Generate JWT tokens
      const tokens = generateTokens(user);

      // Save refresh token
      const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
      const refreshToken = refreshTokenRepository.create({
        token: tokens.refreshToken,
        user: user,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdByIp: req.ip
      });
      await refreshTokenRepository.save(refreshToken);

      // Prepare user response
      const { password: _, ...userData } = user;

      return res.status(200).json({
        message: 'Phone verified successfully',
        user: userData,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn
      });

    } catch (error: any) {
      console.error('Phone auth error:', error);
      return res.status(500).json({ 
        message: 'Phone authentication failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  // Link phone number to existing authenticated user
  static linkPhoneToUser = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { firebaseIdToken, phoneNumber } = req.body;

      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      if (!firebaseIdToken || !phoneNumber) {
        return res.status(400).json({ message: 'Firebase ID token and phone number are required' });
      }

      if (!isFirebaseAdminConfigured()) {
        return res.status(503).json({ message: 'Phone authentication service is not configured' });
      }

      // Verify Firebase token
      const decodedToken = await verifyFirebaseToken(firebaseIdToken);
      if (!decodedToken) {
        return res.status(401).json({ message: 'Invalid Firebase token' });
      }

      // Verify phone number matches
      if (decodedToken.phone_number !== phoneNumber) {
        return res.status(400).json({ message: 'Phone number mismatch' });
      }

      const userRepository = AppDataSource.getRepository(User);

      // Check if phone is already linked to another user
      const existingUser = await userRepository.findOne({ where: { phone: phoneNumber } });
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: 'Phone number is already linked to another account' });
      }

      // Update user's phone number
      await userRepository.update(userId, {
        phone: phoneNumber
      });

      const updatedUser = await userRepository.findOne({ where: { id: userId } });

      return res.status(200).json({
        message: 'Phone number linked successfully',
        user: updatedUser
      });

    } catch (error: any) {
      console.error('Link phone error:', error);
      return res.status(500).json({ 
        message: 'Failed to link phone number',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  // Check phone verification status
  static checkPhoneStatus = async (req: Request, res: Response) => {
    try {
      return res.status(200).json({
        configured: isFirebaseAdminConfigured(),
        message: isFirebaseAdminConfigured() 
          ? 'Phone authentication is available' 
          : 'Phone authentication is not configured'
      });
    } catch (error) {
      return res.status(500).json({ message: 'Error checking phone auth status' });
    }
  };
}
