
import { Router, Request, Response } from 'express';
import { PrescriptionController } from '../controllers/pharmacy/prescription.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { tenantContext } from '../middleware/tenant.middleware';
import { errorHandler } from '../middleware/error.middleware';
import { UserRole } from '../types/roles';

const router = Router();

// Create a new prescription (doctors only)
router.post(
  '/',
  authenticate,
  tenantContext,
  authorize({ requireRole: UserRole.DOCTOR }),
  errorHandler(PrescriptionController.createPrescription)
);

// Get prescriptions by doctor (explicit path)
router.get(
  '/doctor/:doctorId',
  authenticate,
  tenantContext,
  authorize({ requireRole: [UserRole.DOCTOR, UserRole.ADMIN] }),
  errorHandler(PrescriptionController.getDoctorPrescriptions)
);

// Get prescriptions by patient (explicit path)
router.get(
  '/patient/:patientId',
  authenticate,
  tenantContext,
  errorHandler(PrescriptionController.getPatientPrescriptions)
);

// Get prescriptions for pharmacy (explicit path)
router.get(
  '/pharmacy',
  authenticate,
  tenantContext,
  authorize({ requireRole: [UserRole.PHARMACIST, UserRole.ADMIN] }),
  errorHandler(PrescriptionController.getPendingPrescriptions)
);

// Root GET - handles query params for flexibility
router.get(
  '/',
  authenticate,
  tenantContext,
  (req: Request, res: Response, next) => {
    // If patientId query param exists, use getPatientPrescriptions
    if (req.query.patientId) {
      req.params.patientId = req.query.patientId as string;
      return PrescriptionController.getPatientPrescriptions(req, res);
    }
    // If doctorId query param exists, use getDoctorPrescriptions
    if (req.query.doctorId) {
      req.params.doctorId = req.query.doctorId as string;
      return PrescriptionController.getDoctorPrescriptions(req, res);
    }
    // Default: return pending prescriptions for pharmacy
    return PrescriptionController.getPendingPrescriptions(req, res);
  }
);

// Get a single prescription by ID
router.get(
  '/:id',
  authenticate,
  tenantContext,
  errorHandler(PrescriptionController.getPrescriptionById)
);

// Dispense prescription (pharmacy)
router.put(
  '/:id/dispense',
  authenticate,
  tenantContext,
  authorize({ requireRole: [UserRole.PHARMACIST, UserRole.ADMIN] }),
  errorHandler(PrescriptionController.dispensePrescription)
);

// Cancel a prescription
router.put(
  '/:id/cancel',
  authenticate,
  tenantContext,
  authorize({ requireRole: [UserRole.DOCTOR, UserRole.ADMIN] }),
  errorHandler(PrescriptionController.cancelPrescription)
);

export default router;
