import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { AuditLog } from '../models/AuditLog';
import { UserRole } from '../types/roles';

export class AuditLogController {

    /**
     * Log an action (Internal Use / API)
     * Can be called directly by other controllers
     */
    static async log(
        userId: string,
        organizationId: string,
        action: string,
        entityType: string,
        entityId: string,
        details: any,
        req?: Request
    ) {
        try {
            const auditRepo = AppDataSource.getRepository(AuditLog);
            const log = auditRepo.create({
                userId,
                organizationId,
                action,
                entityType,
                entityId,
                details,
                ipAddress: req?.ip || 'unknown',
                userAgent: req?.headers['user-agent'] || 'unknown'
            });
            await auditRepo.save(log);
        } catch (error) {
            console.error('Failed to create audit log:', error);
            // Don't throw - logging failure shouldn't crash the main app flow
        }
    }

    /**
     * Get Logs (Super Admin: All, Org Admin: Own Org)
     */
    static async getLogs(req: Request, res: Response) {
        try {
            const { page = 1, limit = 20, orgId, userId, action } = req.query;
            const skip = (Number(page) - 1) * Number(limit);

            const auditRepo = AppDataSource.getRepository(AuditLog);
            const query = auditRepo.createQueryBuilder('log')
                .leftJoinAndSelect('log.user', 'user')
                .leftJoinAndSelect('log.organization', 'organization')
                .orderBy('log.createdAt', 'DESC')
                .skip(skip)
                .take(Number(limit));

            // Role-based filtering
            if (req.user?.role !== UserRole.SUPER_ADMIN) {
                // Regular admins view their own org only
                query.andWhere('log.organizationId = :myOrgId', { myOrgId: req.user.organizationId });
            } else if (orgId) {
                // Super admin filtering by specific org
                query.andWhere('log.organizationId = :filterOrgId', { filterOrgId: orgId });
            }

            if (userId) query.andWhere('log.userId = :userId', { userId });
            if (action) query.andWhere('log.action = :action', { action });

            const [logs, total] = await query.getManyAndCount();

            return res.json({
                success: true,
                data: logs.map(log => ({
                    id: log.id,
                    action: log.action,
                    entity: `${log.entityType} #${log.entityId}`,
                    actor: log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System',
                    organization: log.organization?.name || 'Platform',
                    time: log.createdAt,
                    details: log.details,
                    ip: log.ipAddress
                })),
                pagination: {
                    current: Number(page),
                    pageSize: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            });

        } catch (error) {
            console.error('Fetch logs error:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch system logs' });
        }
    }
}
