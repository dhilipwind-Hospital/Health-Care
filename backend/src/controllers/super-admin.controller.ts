import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Organization } from '../models/Organization';
import { Bill } from '../models/Bill';
import { Appointment } from '../models/Appointment';
import { UserRole } from '../types/roles';

export class SuperAdminController {

    /**
     * Get high-level platform statistics
     * Aggregates data across ALL organizations
     */
    static async getDashboardStats(req: Request, res: Response) {
        try {
            const orgRepo = AppDataSource.getRepository(Organization);
            const userRepo = AppDataSource.getRepository(User);
            const billRepo = AppDataSource.getRepository(Bill);
            const apptRepo = AppDataSource.getRepository(Appointment);

            // Parallelize count queries for performance
            const [
                totalOrgs,
                activeOrgs,
                totalUsers,
                totalDoctors,
                totalPatients,
                totalRevenueResult
            ] = await Promise.all([
                orgRepo.count(),
                orgRepo.count({ where: { isActive: true } }),
                userRepo.count(),
                userRepo.count({ where: { role: UserRole.DOCTOR } }),
                userRepo.count({ where: { role: UserRole.PATIENT } }),
                billRepo.createQueryBuilder('bill')
                    .select('SUM(bill.amount)', 'total')
                    .where('bill.status = :status', { status: 'paid' })
                    .getRawOne()
            ]);

            // Calculate growth (Mock comparison for now, can be real DB diff later)
            const newOrgsThisMonth = 0; // Placeholder for now

            return res.status(200).json({
                success: true,
                data: {
                    organizations: {
                        total: totalOrgs,
                        active: activeOrgs,
                        inactive: totalOrgs - activeOrgs
                    },
                    users: {
                        total: totalUsers,
                        doctors: totalDoctors,
                        patients: totalPatients
                    },
                    financials: {
                        totalRevenue: parseFloat(totalRevenueResult?.total || '0'),
                        currency: 'USD' // Default currency
                    },
                    systemHealth: (await AppDataSource.query('SELECT 1').then(() => '100%').catch(() => 'Degraded'))
                }
            });
        } catch (error) {
            console.error('SuperAdmin Stats Error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch dashboard statistics'
            });
        }
    }

    /**
     * Get list of all organizations/tenants
     */
    static async getTenants(req: Request, res: Response) {
        try {
            const orgRepo = AppDataSource.getRepository(Organization);
            const tenants = await orgRepo.find({
                order: { createdAt: 'DESC' },
                take: 10 // Limit for dashboard view
            });

            return res.status(200).json({
                success: true,
                data: tenants
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch tenants'
            });
        }
    }

    /**
     * Get recent signups or pending approvals
     */
    static async getPendingApprovals(req: Request, res: Response) {
        try {
            // Assuming 'isActive: false' means pending approval for this context
            const orgRepo = AppDataSource.getRepository(Organization);
            const pending = await orgRepo.find({
                where: { isActive: false },
                order: { createdAt: 'DESC' },
                take: 5
            });

            return res.status(200).json({
                success: true,
                data: pending
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch pending approvals'
            });
        }
    }

    /**
     * Global Search across Users and Organizations
     */
    static async globalSearch(req: Request, res: Response) {
        try {
            const { query } = req.query;
            if (!query || String(query).length < 2) {
                return res.status(400).json({ success: false, message: 'Search query must be at least 2 characters' });
            }

            const searchTerm = `%${String(query).toLowerCase()}%`;
            const orgRepo = AppDataSource.getRepository(Organization);
            const userRepo = AppDataSource.getRepository(User);

            // Parallel Search
            const [orgs, users] = await Promise.all([
                orgRepo.createQueryBuilder('org')
                    .where('LOWER(org.name) LIKE :q OR LOWER(org.subdomain) LIKE :q', { q: searchTerm })
                    .take(5)
                    .getMany(),
                userRepo.createQueryBuilder('user')
                    .leftJoinAndSelect('user.organization', 'organization')
                    .where('LOWER(user.email) LIKE :q OR LOWER(user.firstName) LIKE :q OR LOWER(user.lastName) LIKE :q', { q: searchTerm })
                    .take(10)
                    .getMany()
            ]);

            // Format Results
            const results = [
                ...orgs.map(o => ({
                    id: o.id,
                    type: 'ORGANIZATION',
                    title: o.name,
                    subtitle: o.subdomain,
                    status: o.isActive ? 'Active' : 'Inactive'
                })),
                ...users.map(u => ({
                    id: u.id,
                    type: u.role.toUpperCase(), // DOCTOR, PATIENT, ADMIN
                    title: `${u.firstName} ${u.lastName}`,
                    subtitle: `${u.email} • ${u.organization?.name || 'No Org'}`,
                    status: u.isActive ? 'Active' : 'Inactive',
                    orgId: u.organizationId
                }))
            ];

            return res.status(200).json({
                success: true,
                data: results
            });

        } catch (error) {
            console.error('Global Search Error:', error);
            return res.status(500).json({
                success: false,
                message: 'Global search failed'
            });
        }
    }

    /**
     * Impersonate an organization administrator
     */
    static async impersonate(req: Request, res: Response) {
        try {
            const { orgId } = req.body;
            if (!orgId) {
                return res.status(400).json({ success: false, message: 'Organization ID is required' });
            }

            const userRepo = AppDataSource.getRepository(User);

            // Find an active admin for this organization
            const targetAdmin = await userRepo.findOne({
                where: {
                    organizationId: orgId,
                    role: UserRole.ADMIN,
                    isActive: true
                }
            });

            if (!targetAdmin) {
                return res.status(404).json({
                    success: false,
                    message: 'No active administrator found for this organization'
                });
            }

            // Generate tokens for the target admin
            const { generateTokens } = await import('../utils/jwt');
            const tokens = generateTokens(targetAdmin);

            return res.status(200).json({
                success: true,
                data: {
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    user: {
                        id: targetAdmin.id,
                        email: targetAdmin.email,
                        firstName: targetAdmin.firstName,
                        lastName: targetAdmin.lastName,
                        role: targetAdmin.role,
                        organizationId: targetAdmin.organizationId
                    }
                }
            });
        } catch (error) {
            console.error('Impersonation Error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to initiate impersonation'
            });
        }
    }
}
