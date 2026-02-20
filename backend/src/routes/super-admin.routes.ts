import { Router } from 'express';
import { SuperAdminController } from '../controllers/super-admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../types/roles';

const router = Router();

// BASE PATH: /api/super-admin

// All routes require authentication and SUPER_ADMIN role
router.use(authenticate);
router.use(authorize([UserRole.SUPER_ADMIN]));

router.get('/stats', SuperAdminController.getDashboardStats);
router.get('/tenants', SuperAdminController.getTenants);
router.get('/approvals', SuperAdminController.getPendingApprovals);
router.get('/search', SuperAdminController.globalSearch);
router.post('/impersonate', SuperAdminController.impersonate);

export default router;
