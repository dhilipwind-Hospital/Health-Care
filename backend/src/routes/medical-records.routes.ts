import { Router } from 'express';
import { MedicalRecordsController } from '../controllers/medical-records.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/file-types', authenticate, MedicalRecordsController.getFileTypes);
router.get('/dashboard', authenticate, MedicalRecordsController.getDashboard);
router.get('/', authenticate, MedicalRecordsController.list);
router.get('/patient/:patientId', authenticate, MedicalRecordsController.getByPatient);
router.post('/', authenticate, MedicalRecordsController.create);
router.put('/:id', authenticate, MedicalRecordsController.update);
router.post('/:id/scanned', authenticate, MedicalRecordsController.markScanned);
router.post('/:id/indexed', authenticate, MedicalRecordsController.markIndexed);
router.delete('/:id', authenticate, MedicalRecordsController.delete);

export default router;
