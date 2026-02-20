import { Router } from 'express';
import { IncidentReportController } from '../controllers/incident-report.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/types', authenticate, IncidentReportController.getTypes);
router.get('/severities', authenticate, IncidentReportController.getSeverities);
router.get('/dashboard', authenticate, IncidentReportController.getDashboard);
router.get('/', authenticate, IncidentReportController.list);
router.get('/:id', authenticate, IncidentReportController.getById);
router.post('/', authenticate, IncidentReportController.create);
router.put('/:id', authenticate, IncidentReportController.update);
router.patch('/:id/status', authenticate, IncidentReportController.updateStatus);
router.post('/:id/capa', authenticate, IncidentReportController.addCapa);
router.post('/:id/capa/complete', authenticate, IncidentReportController.completeCapa);

export default router;
