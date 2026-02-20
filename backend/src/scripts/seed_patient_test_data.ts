
import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import { UserRole } from '../types/roles';
import { Admission, AdmissionStatus } from '../models/inpatient/Admission';
import { Appointment, AppointmentStatus, AppointmentType, AppointmentMode } from '../models/Appointment';
import { Prescription, PrescriptionStatus } from '../models/pharmacy/Prescription';
import { LabOrder } from '../models/LabOrder';
import { VitalSign } from '../models/inpatient/VitalSign';
import { Department } from '../models/Department';
import { Service } from '../models/Service';
import { Bed, BedStatus } from '../models/inpatient/Bed';
import { Room, RoomType } from '../models/inpatient/Room';
import { Ward } from '../models/inpatient/Ward';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';

const SEED_ORG_NAME = 'General Hospital';
const SEED_ORG_DOMAIN = 'general-hospital';
const ADMIN_EMAIL = 'admin@hospital.com';
const DOCTOR_EMAIL = 'doctor@hospital.com';
const PATIENT_EMAIL = 'patient@example.com';
const COMMON_PASSWORD = 'password123';

async function seedData() {
    try {
        console.log('🌱 Starting seed process...');
        if (!AppDataSource.isInitialized) {
            await AppDataSource.setOptions({ synchronize: false });
            await AppDataSource.initialize();
        }

        // 1. Create/Get Organization
        let org = await AppDataSource.getRepository(Organization).findOne({ where: { subdomain: SEED_ORG_DOMAIN } });
        if (!org) {
            console.log('Creating Organization...');
            org = AppDataSource.getRepository(Organization).create({
                name: SEED_ORG_NAME,
                subdomain: SEED_ORG_DOMAIN,
                email: 'contact@generalhospital.com',
                phone: '555-0123',
                address: '123 Medical Drive',
                settings: {
                    subscription: {
                        plan: 'enterprise',
                        status: 'active'
                    },
                    features: {
                        inpatient: true,
                        pharmacy: true,
                        laboratory: true
                    }
                },
                isActive: true
            });
            await AppDataSource.getRepository(Organization).save(org);
        }
        console.log(`✅ Organization: ${org.name} (${org.id})`);

        // 2. Create Departments
        const departments = ['Cardiology', 'General Practice', 'Orthopedics', 'Pediatrics'];
        const savedDepts: Department[] = [];

        for (const deptName of departments) {
            let dept = await AppDataSource.getRepository(Department).findOne({
                where: { name: deptName, organization: { id: org.id } }
            });
            if (!dept) {
                dept = AppDataSource.getRepository(Department).create({
                    name: deptName,
                    organization: org,
                    description: `${deptName} Department`,
                    status: 'active'
                });
                await AppDataSource.getRepository(Department).save(dept);
            }
            savedDepts.push(dept);
        }

        // 2b. Create Service
        let service = await AppDataSource.getRepository(Service).findOne({ where: { name: 'General Consultation', organization: { id: org.id } } });
        if (!service) {
            service = AppDataSource.getRepository(Service).create({
                name: 'General Consultation',
                description: 'Standard checkup',
                department: savedDepts[1],
                organization: org,
                averageDuration: 30,
                status: 'active'
            });
            await AppDataSource.getRepository(Service).save(service);
        }

        // 3. Create Users
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(COMMON_PASSWORD, salt);

        // Admin
        let admin = await AppDataSource.getRepository(User).findOne({ where: { email: ADMIN_EMAIL } });
        if (!admin) {
            admin = AppDataSource.getRepository(User).create({
                firstName: 'Admin',
                lastName: 'User',
                email: ADMIN_EMAIL,
                phone: '555-0001',
                password: hashedPassword,
                role: UserRole.ADMIN,
                organization: org
            });
            await AppDataSource.getRepository(User).save(admin);
        }

        // Doctor
        let doctor = await AppDataSource.getRepository(User).findOne({ where: { email: DOCTOR_EMAIL } });
        if (!doctor) {
            doctor = AppDataSource.getRepository(User).create({
                firstName: 'Gregory',
                lastName: 'House',
                email: DOCTOR_EMAIL,
                phone: '555-0002',
                password: hashedPassword,
                role: UserRole.DOCTOR,
                organization: org,
                department: savedDepts[0],
                specialization: 'Diagnostician',
                qualification: 'MD',
                experience: 15,
                consultationFee: 150
            });
            await AppDataSource.getRepository(User).save(doctor);
        }

        // Patient
        let patient = await AppDataSource.getRepository(User).findOne({ where: { email: PATIENT_EMAIL } });
        if (!patient) {
            patient = AppDataSource.getRepository(User).create({
                firstName: 'John',
                lastName: 'Doe',
                email: PATIENT_EMAIL,
                phone: '555-9999',
                password: hashedPassword,
                role: UserRole.PATIENT,
                organization: org,
                dateOfBirth: new Date('1985-05-15'),
                gender: 'Male',
                address: '42 Wallaby Way',
                city: 'Sydney',
                primaryDepartment: savedDepts[1]
            });
            await AppDataSource.getRepository(User).save(patient);
        }

        // 4. Create History Data
        // A. Appointments
        const reasons = ['Annual Checkup', 'Flu Symptoms', 'Left Knee Pain', 'Follow-up', 'Consultation'];
        for (let i = 0; i < 5; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (i * 30 + 5));
            date.setMilliseconds(0); // Clear ms for consistent comparison

            // Check if appointment already exists at this time
            const existing = await AppDataSource.getRepository(Appointment).findOne({
                where: {
                    patient: { id: patient.id },
                    startTime: date
                }
            });

            if (existing) continue;

            const visit = AppDataSource.getRepository(Appointment).create({
                patient: patient,
                doctor: doctor,
                organization: org,
                service: service,
                startTime: date,
                endTime: new Date(date.getTime() + 30 * 60000),
                status: AppointmentStatus.COMPLETED,
                reason: reasons[i],
                appointmentType: AppointmentType.STANDARD,
                mode: AppointmentMode.IN_PERSON,
                notes: `Patient complained about ${reasons[i].toLowerCase()}. Vitals normal.`,
                organizationId: org.id
            });
            await AppDataSource.getRepository(Appointment).save(visit);
        }
        console.log(`✅ Added 5 Past Appointments`);

        // B. Admissions
        let ward = await AppDataSource.getRepository(Ward).findOne({ where: { wardNumber: 'W-SURG-01' } });
        if (!ward) {
            ward = AppDataSource.getRepository(Ward).create({
                name: 'Surgical Ward',
                wardNumber: 'W-SURG-01',
                department: savedDepts[2], // Orthopedics
                capacity: 20,
                organization: org,
                organizationId: org.id,
                isActive: true
            });
            await AppDataSource.getRepository(Ward).save(ward);
        }

        let room = await AppDataSource.getRepository(Room).findOne({ where: { roomNumber: '301', ward: { id: ward.id } } });
        if (!room) {
            room = AppDataSource.getRepository(Room).create({
                roomNumber: '301',
                roomType: RoomType.PRIVATE,
                capacity: 1,
                dailyRate: 500,
                ward: ward,
                organization: org,
                organizationId: org.id,
                wardId: ward.id
            });
            await AppDataSource.getRepository(Room).save(room);
        }

        let bed = await AppDataSource.getRepository(Bed).findOne({ where: { bedNumber: '301-A', room: { id: room.id } } });
        if (!bed) {
            bed = AppDataSource.getRepository(Bed).create({
                bedNumber: '301-A',
                status: BedStatus.AVAILABLE,
                room: room,
                organization: org,
                organizationId: org.id,
                roomId: room.id
            });
            await AppDataSource.getRepository(Bed).save(bed);
        }

        const admDate = new Date();
        admDate.setMonth(admDate.getMonth() - 6);
        const disDate = new Date(admDate);
        disDate.setDate(disDate.getDate() + 4);

        let admission = await AppDataSource.getRepository(Admission).findOne({ where: { patient: { id: patient.id }, admissionNumber: 'ADM-TEST-001' } });

        if (!admission) {
            admission = AppDataSource.getRepository(Admission).create({
                patient: patient,
                organization: org,
                admissionNumber: 'ADM-TEST-001',
                admissionDateTime: admDate,
                dischargeDateTime: disDate,
                admissionReason: 'Acute Appendicitis',
                status: AdmissionStatus.DISCHARGED,
                admittingDoctor: doctor,
                bed: bed,
                isEmergency: true,
                organizationId: org.id,
                patientId: patient.id,
                admittingDoctorId: doctor.id
            });
            await AppDataSource.getRepository(Admission).save(admission);
            console.log(`✅ Added Admission`);
        }

        // C. Vitals (Using Inpatient VitalSign linked to Admission)
        if (admission) {
            for (let i = 0; i < 5; i++) {
                const date = new Date(admission.admissionDateTime);
                date.setHours(date.getHours() + (i * 6)); // Every 6 hours during admission

                // Check for existing vital
                const existing = await AppDataSource.getRepository(VitalSign).findOne({
                    where: {
                        admission: { id: admission.id },
                        recordedAt: date
                    }
                });
                if (existing) continue;

                const vital = AppDataSource.getRepository(VitalSign).create({
                    admission: admission,
                    organization: org,
                    recordedBy: doctor,
                    recordedAt: date,
                    systolicBP: 110 + i,
                    diastolicBP: 70 + i,
                    heartRate: 70 + (i * 2),
                    temperature: 36.5,
                    oxygenSaturation: 98,
                    weight: 75,
                    organizationId: org.id,
                    admissionId: admission.id,
                    recordedById: doctor.id
                });
                await AppDataSource.getRepository(VitalSign).save(vital);
            }
            console.log(`✅ Added 5 Inpatient Vital Signs Records`);
        }

        // D. Prescriptions
        for (let i = 0; i < 3; i++) {
            // Check if prescription already exists for today
            const existing = await AppDataSource.getRepository(Prescription).findOne({
                where: {
                    patient: { id: patient.id },
                    diagnosis: 'General Malaise',
                    status: PrescriptionStatus.PENDING
                }
            });
            if (existing) continue;

            const p = AppDataSource.getRepository(Prescription).create({
                patient: patient,
                doctor: doctor,
                organization: org,
                status: PrescriptionStatus.PENDING,
                notes: 'Take with food',
                prescriptionDate: new Date(),
                diagnosis: 'General Malaise',
                organizationId: org.id,
                patientId: patient.id,
                doctorId: doctor.id
            });
            await AppDataSource.getRepository(Prescription).save(p);
        }
        console.log(`✅ Added Prescriptions`);

        // E. Lab Orders
        for (let i = 0; i < 3; i++) {
            const orderNum = `LAB-${1000 + i}`;
            const existing = await AppDataSource.getRepository(LabOrder).findOne({ where: { orderNumber: orderNum } });
            if (existing) continue;

            const l = AppDataSource.getRepository(LabOrder).create({
                patient: patient,
                doctor: doctor,
                organization: org,
                status: 'completed',
                orderNumber: orderNum,
                isUrgent: false,
                orderDate: new Date(),
                diagnosis: 'Routine Check',
                clinicalNotes: 'All clear',
                organizationId: org.id,
                patientId: patient.id,
                doctorId: doctor.id
            });
            await AppDataSource.getRepository(LabOrder).save(l);
        }
        console.log(`✅ Added Lab Orders`);

        console.log('\n==================================================');
        console.log('🎉 SEEDING COMPLETE');
        console.log('==================================================');
        console.log(`Organization: ${SEED_ORG_NAME}`);
        console.log(`Admin User:   ${ADMIN_EMAIL} / ${COMMON_PASSWORD}`);
        console.log(`Doctor User:  ${DOCTOR_EMAIL} / ${COMMON_PASSWORD}`);
        console.log(`Patient User: ${PATIENT_EMAIL} / ${COMMON_PASSWORD}`);
        console.log('==================================================\n');

        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedData();
