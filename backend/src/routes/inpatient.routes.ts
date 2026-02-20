import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { UserRole, Permission } from '../types/roles';
import { errorHandler } from '../middleware/error.middleware';
import {
  WardController,
  RoomController,
  BedController,
  AdmissionController,
  NursingCareController,
  DoctorRoundsController
} from '../controllers/inpatient';
import { tenantContext } from '../middleware/tenant.middleware';

const router = Router();

// Middleware for different roles
const isDoctor = authorize({
  requireRole: UserRole.DOCTOR
});

const isNurse = authorize({
  requireRole: UserRole.NURSE
});

const isDoctorOrNurse = authorize({
  requireRole: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DOCTOR, UserRole.NURSE]
});

const isAdmin = authorize({
  requireRole: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
});

const isAdminOrNurse = authorize({
  requireRole: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.NURSE]
});

// ============ WARD ROUTES ============
router.get('/wards', authenticate, tenantContext, errorHandler(WardController.getAllWards));
router.get('/wards/:id', authenticate, tenantContext, errorHandler(WardController.getWardById));
router.post('/wards', authenticate, tenantContext, isAdmin, errorHandler(WardController.createWard));
router.put('/wards/:id', authenticate, tenantContext, isAdmin, errorHandler(WardController.updateWard));
router.delete('/wards/:id', authenticate, tenantContext, isAdmin, errorHandler(WardController.deleteWard));
router.get('/wards/:id/occupancy', authenticate, tenantContext, errorHandler(WardController.getWardOccupancy));

// ============ ROOM ROUTES ============
router.get('/rooms', authenticate, tenantContext, errorHandler(RoomController.getAllRooms));
router.get('/rooms/ward/:wardId', authenticate, tenantContext, errorHandler(RoomController.getRoomsByWard));
router.get('/rooms/:id', authenticate, tenantContext, errorHandler(RoomController.getRoomById));
router.post('/rooms', authenticate, tenantContext, isAdmin, errorHandler(RoomController.createRoom));
router.put('/rooms/:id', authenticate, tenantContext, isAdmin, errorHandler(RoomController.updateRoom));
router.delete('/rooms/:id', authenticate, tenantContext, isAdmin, errorHandler(RoomController.deleteRoom));

// ============ BED ROUTES ============
router.get('/beds', authenticate, tenantContext, errorHandler(BedController.getAllBeds));
router.get('/beds/room/:roomId', authenticate, tenantContext, errorHandler(BedController.getBedsByRoom));
router.get('/beds/available', authenticate, tenantContext, errorHandler(BedController.getAvailableBeds));
router.get('/beds/:id', authenticate, tenantContext, errorHandler(BedController.getBedById));
router.post('/beds', authenticate, tenantContext, isAdmin, errorHandler(BedController.createBed));
router.put('/beds/:id', authenticate, tenantContext, isAdmin, errorHandler(BedController.updateBed));
router.put('/beds/:id/status', authenticate, tenantContext, isAdminOrNurse, errorHandler(BedController.changeBedStatus));
router.delete('/beds/:id', authenticate, tenantContext, isAdmin, errorHandler(BedController.deleteBed));

// ============ ADMISSION ROUTES ============
router.post('/admissions', authenticate, tenantContext, isDoctorOrNurse, errorHandler(AdmissionController.createAdmission));
router.get('/admissions', authenticate, tenantContext, errorHandler(AdmissionController.getAllAdmissions));
router.get('/admissions/current', authenticate, tenantContext, errorHandler(AdmissionController.getCurrentAdmissions));
router.get('/admissions/:id', authenticate, tenantContext, errorHandler(AdmissionController.getAdmissionById));
router.get('/admissions/patient/:patientId', authenticate, tenantContext, errorHandler(AdmissionController.getPatientAdmissions));
router.get('/admissions/doctor/:doctorId', authenticate, tenantContext, errorHandler(AdmissionController.getDoctorPatients));
router.put('/admissions/:id/transfer', authenticate, tenantContext, isDoctorOrNurse, errorHandler(AdmissionController.transferPatient));
router.put('/admissions/:id/discharge', authenticate, tenantContext, isDoctor, errorHandler(AdmissionController.dischargePatient));

// ============ NURSING CARE ROUTES ============

// Nursing Notes
router.post('/nursing-notes', authenticate, tenantContext, isNurse, errorHandler(NursingCareController.createNursingNote));
router.get('/nursing-notes/admission/:admissionId', authenticate, tenantContext, errorHandler(NursingCareController.getNursingNotesByAdmission));

// Vital Signs
router.post('/vital-signs', authenticate, tenantContext, isDoctorOrNurse, errorHandler(NursingCareController.recordVitalSigns));
router.get('/vital-signs/admission/:admissionId', authenticate, tenantContext, errorHandler(NursingCareController.getVitalSignsByAdmission));
router.get('/vital-signs/admission/:admissionId/latest', authenticate, tenantContext, errorHandler(NursingCareController.getLatestVitalSigns));

// Medication Administration
router.post('/medications', authenticate, tenantContext, isNurse, errorHandler(NursingCareController.administerMedication));
router.get('/medications/admission/:admissionId', authenticate, tenantContext, errorHandler(NursingCareController.getMedicationsByAdmission));

// Care History
router.get('/care-history/:admissionId', authenticate, tenantContext, errorHandler(NursingCareController.getCareHistory));

// ============ DOCTOR ROUNDS ROUTES ============

// Doctor Notes
router.post('/doctor-notes', authenticate, tenantContext, isDoctorOrNurse, errorHandler(DoctorRoundsController.createDoctorNote));
router.get('/doctor-notes/admission/:admissionId', authenticate, tenantContext, errorHandler(DoctorRoundsController.getDoctorNotesByAdmission));
router.get('/doctor-rounds/patients', authenticate, tenantContext, isDoctorOrNurse, errorHandler(DoctorRoundsController.getDoctorPatients));

// Discharge Summary
router.post('/discharge-summary', authenticate, tenantContext, isDoctorOrNurse, errorHandler(DoctorRoundsController.createDischargeSummary));
router.get('/discharge-summary/admission/:admissionId', authenticate, tenantContext, errorHandler(DoctorRoundsController.getDischargeSummary));
router.put('/discharge-summary/:id', authenticate, tenantContext, isDoctorOrNurse, errorHandler(DoctorRoundsController.updateDischargeSummary));

export default router;
