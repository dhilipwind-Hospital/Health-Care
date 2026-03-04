import { Router, Request, Response } from 'express';
import { TelemedicineController } from '../controllers/telemedicine.controller';
import { authenticate } from '../middleware/auth.middleware';
import { AppDataSource } from '../config/database';
import { TelemedicineConsultation } from '../models/Telemedicine';

const router = Router();

// /sessions aliases (must come before /:id to avoid UUID parse error)
router.get('/sessions', authenticate, TelemedicineController.list);
router.post('/sessions', authenticate, TelemedicineController.create);
router.put('/sessions/:id', authenticate, TelemedicineController.update);
router.delete('/sessions/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(TelemedicineConsultation);
    const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
    const where: any = { id: req.params.id };
    if (orgId) where.organizationId = orgId;
    const consultation = await repo.findOne({ where });
    if (!consultation) return res.status(404).json({ success: false, message: 'Session not found' });
    await repo.remove(consultation);
    res.json({ success: true, message: 'Session deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/types', authenticate, TelemedicineController.getTypes);
router.get('/today', authenticate, TelemedicineController.getTodaySchedule);
router.get('/', authenticate, TelemedicineController.list);
router.get('/:id', authenticate, TelemedicineController.getById);
router.post('/', authenticate, TelemedicineController.create);
router.put('/:id', authenticate, TelemedicineController.update);
router.post('/:id/start', authenticate, TelemedicineController.startConsultation);
router.post('/:id/end', authenticate, TelemedicineController.endConsultation);
router.post('/:id/consent', authenticate, TelemedicineController.recordConsent);

export default router;
