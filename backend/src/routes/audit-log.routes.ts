import { Router } from 'express';
import { AuditLogController } from '../controllers/audit-log.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../types/roles';

const router = Router();

// Only Admins and Super Admins can view logs
router.get('/', authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), AuditLogController.getLogs);

export default router;
