import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { UserRole } from '../types/roles';
import { BillingEnhancedController } from '../controllers/billing-enhanced.controller';

const router = Router();

const isStaff = authorize({ requireRole: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ACCOUNTANT, UserRole.RECEPTIONIST] });
const isAdmin = authorize({ requireRole: [UserRole.ADMIN, UserRole.SUPER_ADMIN] });

// Packages
router.get('/packages', authenticate, isStaff, BillingEnhancedController.listPackages);
router.post('/packages', authenticate, isAdmin, BillingEnhancedController.createPackage);
router.put('/packages/:id', authenticate, isAdmin, BillingEnhancedController.updatePackage);

// Deposits
router.get('/deposits', authenticate, isStaff, BillingEnhancedController.listDeposits);
router.post('/deposits', authenticate, isStaff, BillingEnhancedController.receiveDeposit);
router.post('/deposits/:id/adjust', authenticate, isStaff, BillingEnhancedController.adjustDeposit);
router.post('/deposits/:id/refund', authenticate, isAdmin, BillingEnhancedController.refundDeposit);

// Enhanced Bill Operations
router.post('/bills/:id/payment', authenticate, isStaff, BillingEnhancedController.recordPayment);
router.post('/bills/:id/discount', authenticate, isAdmin, BillingEnhancedController.applyDiscount);
router.post('/bills/:id/waiver', authenticate, isAdmin, BillingEnhancedController.applyWaiver);
router.post('/bills/:id/refund', authenticate, isAdmin, BillingEnhancedController.processRefund);

// GST & Revenue Reports
router.get('/reports/gst-summary', authenticate, isStaff, BillingEnhancedController.gstSummary);
router.get('/reports/revenue', authenticate, isStaff, BillingEnhancedController.revenueReport);
router.get('/reports/outstanding', authenticate, isStaff, BillingEnhancedController.outstandingReport);

export default router;
