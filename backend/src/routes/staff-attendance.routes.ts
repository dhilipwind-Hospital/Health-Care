import { Router } from 'express';
import { StaffAttendanceController } from '../controllers/staff-attendance.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/clock-in', authenticate, StaffAttendanceController.clockIn);
router.post('/clock-out', authenticate, StaffAttendanceController.clockOut);
router.get('/today', authenticate, StaffAttendanceController.getToday);
router.get('/summary', authenticate, StaffAttendanceController.getSummary);
router.get('/', authenticate, StaffAttendanceController.list);
router.post('/mark', authenticate, StaffAttendanceController.mark);

export default router;
