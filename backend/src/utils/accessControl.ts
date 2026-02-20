import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Appointment } from '../models/Appointment';
import { Referral } from '../models/Referral';

/**
 * Checks if a doctor has access to a patient's medical records based on:
 * 1. Same organization (always required)
 * 2. FR-001: Same department (Doctor's dept matches Patient's primary dept)
 * 3. Referral: Patient has been referred to Doctor's department
 * 4. Treated: Doctor has had an appointment with the patient
 */
export const checkDoctorPatientAccess = async (doctorId: string, patientId: string, organizationId: string): Promise<boolean> => {
    const userRepo = AppDataSource.getRepository(User);

    // 1. Same Organization Check
    const [doctor, patient] = await Promise.all([
        userRepo.findOne({ where: { id: doctorId, organizationId } }),
        userRepo.findOne({ where: { id: patientId, organizationId } })
    ]);

    if (!doctor || !patient) return false;

    // Admin access (optional: admins can see all within organization)
    if (doctor.role === 'admin' || doctor.role === 'super_admin') return true;

    // 2. FR-001: Same Department Check
    if (doctor.departmentId && patient.primaryDepartmentId && doctor.departmentId === patient.primaryDepartmentId) {
        return true;
    }

    // 3. Referral Check
    if (doctor.departmentId) {
        const referralRepo = AppDataSource.getRepository(Referral);
        const referral = await referralRepo.findOne({
            where: {
                patientId,
                departmentId: doctor.departmentId
            }
        });
        if (referral) return true;
    }

    // 4. Treated Patient Check
    const apptRepo = AppDataSource.getRepository(Appointment);
    const appointment = await apptRepo.findOne({
        where: {
            patient: { id: patientId },
            doctor: { id: doctorId }
        }
    });

    if (appointment) return true;

    return false;
};
