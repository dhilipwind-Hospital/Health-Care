import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { tenantContext } from '../../middleware/tenant.middleware';
import { UserRole, Permission } from '../../types/roles';
import { errorHandler } from '../../middleware/error.middleware';
import { MedicineController } from '../../controllers/pharmacy/medicine.controller';
import { PrescriptionController } from '../../controllers/pharmacy/prescription.controller';
import { InventoryController } from '../../controllers/pharmacy/inventory.controller';

const router = Router();

// Middleware for pharmacy-related roles
const isPharmacistOrAdmin = authorize({
  requireOneOf: [Permission.MANAGE_INVENTORY],
  requireRole: [UserRole.PHARMACIST, UserRole.ADMIN, UserRole.SUPER_ADMIN]
});

const isPharmacist = authorize({
  requireRole: UserRole.PHARMACIST
});

const isDoctor = authorize({
  requireRole: UserRole.DOCTOR
});

const isAdmin = authorize({
  requireRole: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
});

// Medicine routes
// Allow doctors to view medicines for prescriptions
router.get('/medicines', authenticate, errorHandler(MedicineController.getAllMedicines));
router.get('/medicines/low-stock', authenticate, isPharmacistOrAdmin, errorHandler(MedicineController.getLowStockMedicines));
router.get('/medicines/expiring', authenticate, isPharmacistOrAdmin, errorHandler(MedicineController.getExpiringMedicines));
router.get('/medicines/:id', authenticate, isPharmacistOrAdmin, errorHandler(MedicineController.getMedicineById));
router.post('/medicines', authenticate, isPharmacistOrAdmin, errorHandler(MedicineController.createMedicine));
router.put('/medicines/:id', authenticate, isPharmacistOrAdmin, errorHandler(MedicineController.updateMedicine));
router.delete('/medicines/:id', authenticate, isAdmin, errorHandler(MedicineController.deleteMedicine));

// Prescription routes
// Stock check endpoint for doctors to verify availability before prescribing
router.post('/prescriptions/check-stock', authenticate, tenantContext, isDoctor, async (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    const user = (req as any).user;
    const tenantId = (req as any).tenant?.id || user?.organizationId;

    if (!tenantId) {
      return res.status(400).json({ message: 'Organization context required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items array is required' });
    }

    const { AppDataSource } = await import('../../config/database');
    const { Medicine } = await import('../../models/pharmacy/Medicine');
    const medicineRepo = AppDataSource.getRepository(Medicine);

    const stockStatus = [];
    for (const item of items) {
      const medicine = await medicineRepo.findOne({
        where: { id: item.medicineId, organizationId: tenantId }
      });

      if (!medicine) {
        stockStatus.push({
          medicineId: item.medicineId,
          medicineName: 'Unknown',
          requested: item.quantity || 1,
          available: 0,
          status: 'not_found'
        });
        continue;
      }

      const requested = Number(item.quantity) || 1;
      let status: 'available' | 'low' | 'out_of_stock' = 'available';

      if (medicine.currentStock === 0) {
        status = 'out_of_stock';
      } else if (medicine.currentStock < requested || medicine.currentStock <= medicine.reorderLevel) {
        status = 'low';
      }

      stockStatus.push({
        medicineId: medicine.id,
        medicineName: medicine.name,
        requested,
        available: medicine.currentStock,
        reorderLevel: medicine.reorderLevel,
        status
      });
    }

    const hasIssues = stockStatus.some(s => s.status !== 'available');

    return res.json({
      success: true,
      hasIssues,
      stockStatus
    });
  } catch (error) {
    console.error('Stock check error:', error);
    return res.status(500).json({ message: 'Failed to check stock' });
  }
});

router.post('/prescriptions', authenticate, tenantContext, isDoctor, errorHandler(PrescriptionController.createPrescription));
router.get('/prescriptions/patient/:patientId', authenticate, tenantContext, errorHandler(PrescriptionController.getPatientPrescriptions));
router.get('/prescriptions/doctor', authenticate, tenantContext, isDoctor, errorHandler(PrescriptionController.getDoctorPrescriptions));
router.get('/prescriptions/pending', authenticate, tenantContext, isPharmacistOrAdmin, errorHandler(PrescriptionController.getPendingPrescriptions));
router.get('/prescriptions/admin', authenticate, tenantContext, isAdmin, errorHandler(PrescriptionController.getPendingPrescriptions)); // Admin view (uses same controller, supports status filter)
router.get('/prescriptions/all', authenticate, tenantContext, isPharmacistOrAdmin, errorHandler(PrescriptionController.getAllPrescriptions));

// Root GET /prescriptions - handles query params for flexible access
router.get('/prescriptions', authenticate, tenantContext, (req: Request, res: Response) => {
  // If patientId query param exists, use getPatientPrescriptions
  if (req.query.patientId) {
    req.params.patientId = req.query.patientId as string;
    return PrescriptionController.getPatientPrescriptions(req, res);
  }
  // Default: return pending prescriptions
  return PrescriptionController.getPendingPrescriptions(req, res);
});

router.get('/prescriptions/:id', authenticate, tenantContext, errorHandler(PrescriptionController.getPrescriptionById));
router.put('/prescriptions/:id/dispense', authenticate, tenantContext, isPharmacistOrAdmin, errorHandler(PrescriptionController.dispensePrescription));
router.put('/prescriptions/:id/cancel', authenticate, tenantContext, isDoctor, errorHandler(PrescriptionController.cancelPrescription));

// Inventory routes
router.post('/inventory/add-stock', authenticate, isPharmacistOrAdmin, errorHandler(InventoryController.addStock));
router.post('/inventory/adjust-stock', authenticate, isPharmacistOrAdmin, errorHandler(InventoryController.adjustStock));
router.post('/inventory/damaged-stock', authenticate, isPharmacistOrAdmin, errorHandler(InventoryController.recordDamagedStock));
router.get('/inventory/transactions', authenticate, isPharmacistOrAdmin, errorHandler(InventoryController.getTransactionHistory));
router.get('/inventory/reports', authenticate, isPharmacistOrAdmin, errorHandler(InventoryController.generateInventoryReport));

export default router;
