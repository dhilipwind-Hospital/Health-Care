import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { UserRole } from '../types/roles';
import { OtController } from '../controllers/ot.controller';

const router = Router();

const isAdminOrDoctor = authorize({ requireRole: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DOCTOR, UserRole.NURSE] });

// OT Rooms
router.get('/rooms', authenticate, isAdminOrDoctor, OtController.listRooms);
router.post('/rooms', authenticate, isAdminOrDoctor, OtController.createRoom);
router.put('/rooms/:id', authenticate, isAdminOrDoctor, OtController.updateRoom);
router.patch('/rooms/:id/status', authenticate, isAdminOrDoctor, OtController.updateRoomStatus);

// Surgeries
router.get('/surgeries', authenticate, isAdminOrDoctor, OtController.listSurgeries);
router.post('/surgeries', authenticate, isAdminOrDoctor, OtController.createSurgery);
router.get('/surgeries/:id', authenticate, isAdminOrDoctor, OtController.getSurgery);
router.put('/surgeries/:id', authenticate, isAdminOrDoctor, OtController.updateSurgery);
router.patch('/surgeries/:id/status', authenticate, isAdminOrDoctor, OtController.updateSurgeryStatus);
router.delete('/surgeries/:id', authenticate, isAdminOrDoctor, OtController.deleteSurgery);

// Surgery Queue (emergency priority sorted)
router.get('/queue', authenticate, isAdminOrDoctor, OtController.getSurgeryQueue);

// Checklist (WHO Surgical Safety)
router.get('/surgeries/:id/checklist', authenticate, isAdminOrDoctor, OtController.getChecklist);
router.put('/surgeries/:id/checklist', authenticate, isAdminOrDoctor, OtController.upsertChecklist);

// Anesthesia Record
router.get('/surgeries/:id/anesthesia', authenticate, isAdminOrDoctor, OtController.getAnesthesia);
router.put('/surgeries/:id/anesthesia', authenticate, isAdminOrDoctor, OtController.upsertAnesthesia);

// Analytics
router.get('/analytics', authenticate, isAdminOrDoctor, OtController.analytics);

// Doctors list (real DB query, backward compatible)
router.get('/doctors/list', authenticate, isAdminOrDoctor, OtController.listDoctors);

export default router;
