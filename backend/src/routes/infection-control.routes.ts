import { Router } from 'express';
import { InfectionControlController } from '../controllers/infection-control.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/types', authenticate, InfectionControlController.getInfectionTypes);
router.get('/dashboard', authenticate, InfectionControlController.getDashboard);
router.get('/infections', authenticate, InfectionControlController.listInfections);
router.post('/infections', authenticate, InfectionControlController.createInfection);
router.put('/infections/:id', authenticate, InfectionControlController.updateInfection);
router.get('/audits', authenticate, InfectionControlController.listAudits);
router.post('/audits', authenticate, InfectionControlController.createAudit);

export default router;
