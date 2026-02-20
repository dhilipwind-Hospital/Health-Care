import { Router } from 'express';
import { DutyRosterController } from '../controllers/duty-roster.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/shifts', authenticate, DutyRosterController.getShiftTypes);
router.get('/duties', authenticate, DutyRosterController.listDuties);
router.post('/duties', authenticate, DutyRosterController.createDuty);
router.put('/duties/:id', authenticate, DutyRosterController.updateDuty);
router.delete('/duties/:id', authenticate, DutyRosterController.deleteDuty);
router.get('/leaves', authenticate, DutyRosterController.listLeaves);
router.post('/leaves', authenticate, DutyRosterController.createLeave);
router.patch('/leaves/:id/approve', authenticate, DutyRosterController.approveLeave);

export default router;
