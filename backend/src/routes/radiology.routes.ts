import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { UserRole } from '../types/roles';
import { RadiologyController } from '../controllers/radiology.controller';

const router = Router();

const isStaff = authorize({ requireRole: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.LAB_TECHNICIAN] });
const isRadiologist = authorize({ requireRole: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DOCTOR] });

// Orders
router.get('/orders', authenticate, isStaff, RadiologyController.listOrders);
router.post('/orders', authenticate, isStaff, RadiologyController.createOrder);
router.get('/orders/:id', authenticate, isStaff, RadiologyController.getOrder);
router.put('/orders/:id', authenticate, isStaff, RadiologyController.updateOrder);
router.patch('/orders/:id/status', authenticate, isStaff, RadiologyController.updateOrderStatus);

// Reports
router.post('/orders/:id/report', authenticate, isRadiologist, RadiologyController.createReport);
router.put('/orders/:id/report', authenticate, isRadiologist, RadiologyController.updateReport);
router.patch('/orders/:id/report/verify', authenticate, isRadiologist, RadiologyController.verifyReport);
router.post('/orders/:id/critical', authenticate, isRadiologist, RadiologyController.flagCritical);

// Templates
router.get('/templates', authenticate, isStaff, RadiologyController.listTemplates);
router.post('/templates', authenticate, isRadiologist, RadiologyController.createTemplate);
router.put('/templates/:id', authenticate, isRadiologist, RadiologyController.updateTemplate);

// Analytics
router.get('/analytics', authenticate, isStaff, RadiologyController.analytics);

export default router;
