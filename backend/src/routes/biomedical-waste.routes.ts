import { Router } from 'express';
import { BiomedicalWasteController } from '../controllers/biomedical-waste.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/categories', authenticate, BiomedicalWasteController.getCategories);
router.get('/disposal-methods', authenticate, BiomedicalWasteController.getDisposalMethods);
router.get('/daily-summary', authenticate, BiomedicalWasteController.getDailySummary);
router.get('/monthly-report', authenticate, BiomedicalWasteController.getMonthlyReport);
router.get('/', authenticate, BiomedicalWasteController.list);
router.get('/:id', authenticate, BiomedicalWasteController.getById);
router.post('/', authenticate, BiomedicalWasteController.create);
router.put('/:id', authenticate, BiomedicalWasteController.update);
router.post('/:id/dispose', authenticate, BiomedicalWasteController.recordDisposal);

export default router;
