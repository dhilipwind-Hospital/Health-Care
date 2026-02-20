import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { UserRole } from '../types/roles';
import { DialysisController } from '../controllers/dialysis.controller';

const router = Router();

const isStaff = authorize({ requireRole: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DOCTOR, UserRole.NURSE] });

// Machines
router.get('/machines', authenticate, isStaff, DialysisController.listMachines);
router.post('/machines', authenticate, isStaff, DialysisController.createMachine);
router.put('/machines/:id', authenticate, isStaff, DialysisController.updateMachine);

// Sessions
router.get('/sessions', authenticate, isStaff, DialysisController.listSessions);
router.post('/sessions', authenticate, isStaff, DialysisController.createSession);
router.get('/sessions/:id', authenticate, isStaff, DialysisController.getSession);
router.put('/sessions/:id', authenticate, isStaff, DialysisController.updateSession);
router.patch('/sessions/:id/start', authenticate, isStaff, DialysisController.startSession);
router.patch('/sessions/:id/complete', authenticate, isStaff, DialysisController.completeSession);

// Patient Profiles
router.get('/profiles', authenticate, isStaff, DialysisController.listProfiles);
router.post('/profiles', authenticate, isStaff, DialysisController.createProfile);
router.get('/profiles/:patientId', authenticate, isStaff, DialysisController.getProfile);
router.put('/profiles/:id', authenticate, isStaff, DialysisController.updateProfile);

export default router;
