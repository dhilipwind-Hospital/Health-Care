import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Location } from '../models/Location';
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import { getTenantId } from '../middleware/tenant.middleware';
import { NotFoundException, BadRequestException, ForbiddenException } from '../exceptions/http.exception';
import * as bcrypt from 'bcryptjs';
import { EmailService } from '../services/email.service';

/**
 * Location Controller
 * 
 * Manages CRUD operations for organization locations/branches.
 * All operations are scoped to the current organization (tenant).
 */

/**
 * Create a new location for the organization
 * POST /api/locations
 * 
 * Optional fields for Branch Admin:
 *   adminEmail, adminPassword, adminFirstName, adminLastName
 *   If provided, a branch admin user is created and assigned to this location,
 *   and a welcome email with credentials is sent.
 */
export const createLocation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.tenant) {
            throw new BadRequestException('No active Organization found. Please create an Organization first.');
        }
        const tenantId = getTenantId(req);
        const user = (req as any).user;

        // Only admins can create locations
        if (user.role !== 'admin' && user.role !== 'super_admin') {
            throw new ForbiddenException('Only admins can create locations');
        }

        const {
            name, code, address, city, state, country, phone, email, isMainBranch, settings,
            // Optional Branch Admin fields
            adminEmail, adminPassword, adminFirstName, adminLastName
        } = req.body;

        // Validate required fields
        if (!name || !code) {
            throw new BadRequestException('Name and code are required');
        }

        // Validate code format (alphanumeric, uppercase, max 10 chars)
        const codeRegex = /^[A-Z0-9]{1,10}$/;
        const normalizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (!codeRegex.test(normalizedCode)) {
            throw new BadRequestException('Code must be 1-10 alphanumeric characters');
        }

        // If branch admin is requested, validate those fields
        if (adminEmail && !adminPassword) {
            throw new BadRequestException('Admin password is required when creating a branch admin');
        }

        const locationRepo = AppDataSource.getRepository(Location);
        const orgRepo = AppDataSource.getRepository(Organization);

        // Verify organization exists
        const organization = await orgRepo.findOne({ where: { id: tenantId } });
        if (!organization) {
            throw new NotFoundException('Organization not found');
        }

        // Check if code already exists for this organization
        const existingLocation = await locationRepo.findOne({
            where: { organizationId: tenantId, code: normalizedCode }
        });
        if (existingLocation) {
            throw new BadRequestException(`Location with code '${normalizedCode}' already exists`);
        }

        // If this is marked as main branch, unset any existing main branch
        if (isMainBranch) {
            await locationRepo.update(
                { organizationId: tenantId, isMainBranch: true },
                { isMainBranch: false }
            );
        }

        // Create the location
        const location = locationRepo.create({
            organizationId: tenantId,
            name: name.trim(),
            code: normalizedCode,
            address: address?.trim(),
            city: city?.trim(),
            state: state?.trim(),
            country: country?.trim() || 'India',
            phone: phone?.trim(),
            email: email?.trim(),
            isMainBranch: isMainBranch || false,
            isActive: true,
            settings: settings || {}
        });

        await locationRepo.save(location);

        // Optional: Create Branch Admin if admin details provided
        let branchAdmin: any = null;
        if (adminEmail) {
            const userRepo = AppDataSource.getRepository(User);

            // Check if this email already exists in this organization
            const existingUser = await userRepo.findOne({
                where: { email: adminEmail.trim().toLowerCase(), organizationId: tenantId }
            });

            if (existingUser) {
                // User exists — just assign them to this location
                existingUser.locationId = location.id;
                await userRepo.save(existingUser);
                branchAdmin = {
                    id: existingUser.id,
                    email: existingUser.email,
                    firstName: existingUser.firstName,
                    lastName: existingUser.lastName,
                    isNew: false
                };
                console.log(`👤 Existing user ${existingUser.email} assigned to location ${location.name}`);
            } else {
                // Create new branch admin user
                const hashedPassword = await bcrypt.hash(adminPassword, 10);
                const newAdmin = userRepo.create({
                    email: adminEmail.trim().toLowerCase(),
                    password: hashedPassword,
                    firstName: (adminFirstName || 'Branch').trim(),
                    lastName: (adminLastName || 'Admin').trim(),
                    phone: phone?.trim() || '0000000000',
                    role: 'admin' as any,
                    organizationId: tenantId,
                    locationId: location.id,
                    isActive: true,
                });
                await userRepo.save(newAdmin);
                branchAdmin = {
                    id: newAdmin.id,
                    email: newAdmin.email,
                    firstName: newAdmin.firstName,
                    lastName: newAdmin.lastName,
                    isNew: true
                };
                console.log(`👤 New branch admin ${newAdmin.email} created for location ${location.name}`);

                // Send welcome email to the new branch admin
                try {
                    await EmailService.sendUniversalWelcomeEmail(
                        newAdmin.email,
                        newAdmin.firstName,
                        adminPassword,
                        organization.name,
                        organization.subdomain,
                        'admin'
                    );
                    console.log(`📧 Welcome email sent to branch admin ${newAdmin.email}`);
                } catch (emailError) {
                    console.error(`❌ Failed to send branch admin welcome email:`, emailError);
                }
            }
        }

        res.status(201).json({
            success: true,
            message: branchAdmin
                ? `Location created successfully${branchAdmin.isNew ? ' with new branch admin' : ' (existing user assigned)'}`
                : 'Location created successfully',
            data: location,
            branchAdmin: branchAdmin || null
        });
    } catch (error) {
        next(error);
    }
};

/**
 * List all locations for the organization
 * GET /api/locations
 * 
 * Super Admin can pass ?orgId=<uuid> to view locations for a specific organization.
 * If no orgId is provided, Super Admin sees locations for the tenant context (first org).
 */
export const listLocations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user;
        const { includeInactive, orgId } = req.query;

        const locationRepo = AppDataSource.getRepository(Location);

        // Determine which organization's locations to fetch
        let targetOrgId: string | undefined;

        if (user?.role === 'super_admin' && orgId) {
            // Super Admin can query any organization's locations
            targetOrgId = orgId as string;
        } else if (req.tenant) {
            targetOrgId = req.tenant.id;
        }

        // If no org context at all, return empty
        if (!targetOrgId) {
            return res.json({
                success: true,
                data: [],
                total: 0
            });
        }

        const whereCondition: any = { organizationId: targetOrgId };
        if (includeInactive !== 'true') {
            whereCondition.isActive = true;
        }

        const locations = await locationRepo.find({
            where: whereCondition,
            order: { isMainBranch: 'DESC', name: 'ASC' }
        });

        res.json({
            success: true,
            data: locations,
            total: locations.length
        });
    } catch (error) {
        next(error);
    }
};

/**
 * List ALL locations across ALL organizations (Super Admin only)
 * GET /api/locations/all
 */
export const listAllLocations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user;

        if (user?.role !== 'super_admin') {
            throw new ForbiddenException('Only super admins can view all locations');
        }

        const { includeInactive } = req.query;
        const locationRepo = AppDataSource.getRepository(Location);

        const whereCondition: any = {};
        if (includeInactive !== 'true') {
            whereCondition.isActive = true;
        }

        const locations = await locationRepo.find({
            where: whereCondition,
            relations: ['organization'],
            order: { organizationId: 'ASC', isMainBranch: 'DESC', name: 'ASC' }
        });

        // Group by organization for easier frontend consumption
        const grouped: Record<string, { organization: any; locations: any[] }> = {};
        for (const loc of locations) {
            if (!grouped[loc.organizationId]) {
                grouped[loc.organizationId] = {
                    organization: loc.organization ? {
                        id: loc.organization.id,
                        name: loc.organization.name,
                        subdomain: loc.organization.subdomain
                    } : { id: loc.organizationId, name: 'Unknown', subdomain: '' },
                    locations: []
                };
            }
            const { organization: _org, ...locationData } = loc as any;
            grouped[loc.organizationId].locations.push(locationData);
        }

        res.json({
            success: true,
            data: locations,
            grouped: Object.values(grouped),
            total: locations.length
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get a specific location
 * GET /api/locations/:id
 */
export const getLocation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = getTenantId(req);
        const { id } = req.params;

        const locationRepo = AppDataSource.getRepository(Location);

        const location = await locationRepo.findOne({
            where: { id, organizationId: tenantId }
        });

        if (!location) {
            throw new NotFoundException('Location not found');
        }

        res.json({
            success: true,
            data: location
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update a location
 * PUT /api/locations/:id
 */
export const updateLocation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = getTenantId(req);
        const user = (req as any).user;
        const { id } = req.params;

        // Only admins can update locations
        if (user.role !== 'admin' && user.role !== 'super_admin') {
            throw new ForbiddenException('Only admins can update locations');
        }

        const { name, code, address, city, state, country, phone, email, isMainBranch, isActive, settings } = req.body;

        const locationRepo = AppDataSource.getRepository(Location);

        const location = await locationRepo.findOne({
            where: { id, organizationId: tenantId }
        });

        if (!location) {
            throw new NotFoundException('Location not found');
        }

        // If changing code, validate it's unique
        if (code && code.toUpperCase() !== location.code) {
            const normalizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
            const existingLocation = await locationRepo.findOne({
                where: { organizationId: tenantId, code: normalizedCode }
            });
            if (existingLocation && existingLocation.id !== id) {
                throw new BadRequestException(`Location with code '${normalizedCode}' already exists`);
            }
            location.code = normalizedCode;
        }

        // If this is marked as main branch, unset any existing main branch
        if (isMainBranch && !location.isMainBranch) {
            await locationRepo.update(
                { organizationId: tenantId, isMainBranch: true },
                { isMainBranch: false }
            );
        }

        // Update fields
        if (name !== undefined) location.name = name.trim();
        if (address !== undefined) location.address = address?.trim();
        if (city !== undefined) location.city = city?.trim();
        if (state !== undefined) location.state = state?.trim();
        if (country !== undefined) location.country = country?.trim();
        if (phone !== undefined) location.phone = phone?.trim();
        if (email !== undefined) location.email = email?.trim();
        if (isMainBranch !== undefined) location.isMainBranch = isMainBranch;
        if (isActive !== undefined) location.isActive = isActive;
        if (settings !== undefined) {
            location.settings = { ...location.settings, ...settings };
        }

        await locationRepo.save(location);

        res.json({
            success: true,
            message: 'Location updated successfully',
            data: location
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete (deactivate) a location
 * DELETE /api/locations/:id
 */
export const deleteLocation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = getTenantId(req);
        const user = (req as any).user;
        const { id } = req.params;

        // Only admins can delete locations
        if (user.role !== 'admin' && user.role !== 'super_admin') {
            throw new ForbiddenException('Only admins can delete locations');
        }

        const locationRepo = AppDataSource.getRepository(Location);

        const location = await locationRepo.findOne({
            where: { id, organizationId: tenantId }
        });

        if (!location) {
            throw new NotFoundException('Location not found');
        }

        // Don't allow deleting main branch - must transfer first
        if (location.isMainBranch) {
            throw new BadRequestException('Cannot delete the main branch. Please set another location as main branch first.');
        }

        // Soft delete - just deactivate
        location.isActive = false;
        await locationRepo.save(location);

        res.json({
            success: true,
            message: 'Location deactivated successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get location statistics
 * GET /api/locations/:id/stats
 */
export const getLocationStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = getTenantId(req);
        const { id } = req.params;

        const locationRepo = AppDataSource.getRepository(Location);

        const location = await locationRepo.findOne({
            where: { id, organizationId: tenantId }
        });

        if (!location) {
            throw new NotFoundException('Location not found');
        }

        // For now, return basic stats
        // In future, we can count users, appointments, etc. by location
        res.json({
            success: true,
            data: {
                location: {
                    id: location.id,
                    name: location.name,
                    code: location.code
                },
                stats: {
                    // Placeholder stats - can be enhanced later
                    users: 0,
                    doctors: 0,
                    patients: 0,
                    appointmentsToday: 0
                }
            }
        });
    } catch (error) {
        next(error);
    }
};
