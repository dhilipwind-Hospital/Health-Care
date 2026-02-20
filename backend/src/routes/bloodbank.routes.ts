import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { UserRole } from '../types/roles';
import { BloodBankController } from '../controllers/bloodbank.controller';

const router = Router();

const isStaff = authorize({ requireRole: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.LAB_TECHNICIAN] });

// Donors
router.get('/donors', authenticate, isStaff, BloodBankController.listDonors);
router.post('/donors', authenticate, isStaff, BloodBankController.createDonor);
router.get('/donors/:id', authenticate, isStaff, BloodBankController.getDonor);
router.put('/donors/:id', authenticate, isStaff, BloodBankController.updateDonor);
router.post('/donors/:id/defer', authenticate, isStaff, BloodBankController.deferDonor);

// Inventory
router.get('/inventory', authenticate, isStaff, BloodBankController.listInventory);
router.post('/inventory', authenticate, isStaff, BloodBankController.addBloodBag);
router.patch('/inventory/:id/status', authenticate, isStaff, BloodBankController.updateBagStatus);
router.get('/inventory/expiring', authenticate, isStaff, BloodBankController.getExpiring);
router.get('/inventory/stock-summary', authenticate, isStaff, BloodBankController.stockSummary);

// Cross Match
router.get('/cross-match', authenticate, isStaff, BloodBankController.listCrossMatch);
router.post('/cross-match', authenticate, isStaff, BloodBankController.createCrossMatch);
router.put('/cross-match/:id', authenticate, isStaff, BloodBankController.updateCrossMatch);

// Transfusion
router.get('/transfusions', authenticate, isStaff, BloodBankController.listTransfusions);
router.post('/transfusions', authenticate, isStaff, BloodBankController.startTransfusion);
router.put('/transfusions/:id', authenticate, isStaff, BloodBankController.updateTransfusion);
router.post('/transfusions/:id/reaction', authenticate, isStaff, BloodBankController.reportReaction);

export default router;
