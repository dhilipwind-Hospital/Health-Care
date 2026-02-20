import { Router } from 'express';
import { PatientHistoryController } from '../controllers/patient-history.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantContext } from '../middleware/tenant.middleware';
import { errorHandler } from '../middleware/error.middleware';

const router = Router();

// Apply middleware
router.use(authenticate);
router.use(tenantContext);

/**
 * @swagger
 * tags:
 *   name: Patients
 *   description: Patient management and history
 */

// History summary and timeline
router.get('/:id/history/summary', errorHandler(PatientHistoryController.getHistorySummary));
router.get('/:id/history/timeline', errorHandler(PatientHistoryController.getHistoryTimeline));

// Specific history modules
router.get('/:id/vitals', errorHandler(PatientHistoryController.getVitals));
router.get('/:id/procedures', errorHandler(PatientHistoryController.getProcedures));
router.get('/:id/documents', errorHandler(PatientHistoryController.getDocuments));
router.get('/:id/notes', errorHandler(PatientHistoryController.getClinicalNotes));

export default router;
