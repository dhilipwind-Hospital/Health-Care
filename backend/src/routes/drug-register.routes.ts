import { Router } from 'express';
import { DrugRegisterController } from '../controllers/drug-register.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/scheduled-medicines', authenticate, DrugRegisterController.getScheduledMedicines);
router.get('/report', authenticate, DrugRegisterController.getDrugRegisterReport);
router.get('/', authenticate, DrugRegisterController.listDrugRegister);
router.post('/', authenticate, DrugRegisterController.createDrugRegisterEntry);

router.get('/ndps/daily-balance', authenticate, DrugRegisterController.getNdpsDailyBalance);
router.get('/ndps/periodic-return', authenticate, DrugRegisterController.getNdpsPeriodicReturn);
router.get('/ndps', authenticate, DrugRegisterController.listNdpsRegister);
router.post('/ndps', authenticate, DrugRegisterController.createNdpsEntry);

export default router;
