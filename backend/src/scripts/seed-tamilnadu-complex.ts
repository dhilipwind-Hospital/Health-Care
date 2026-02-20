
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Organization } from '../models/Organization';
import { Department } from '../models/Department';
import { Appointment, AppointmentStatus, AppointmentMode, AppointmentType } from '../models/Appointment';
import { Bed, BedStatus } from '../models/inpatient/Bed';
import { Room, RoomType } from '../models/inpatient/Room';
import { Ward } from '../models/inpatient/Ward';
import { Service } from '../models/Service';
import { Admission, AdmissionStatus } from '../models/inpatient/Admission';
import { UserRole } from '../types/roles';
import * as bcrypt from 'bcryptjs';

async function seed() {
    try {
        await AppDataSource.initialize();
        console.log('🧹 Cleaning up old Tamil Nadu data...');

        // Comprehensive cleanup
        try { await AppDataSource.query(`DELETE FROM admissions WHERE "admissionNumber" LIKE 'TN%'`); } catch (e) { }
        try { await AppDataSource.query(`DELETE FROM beds WHERE "bedNumber" LIKE 'TN%'`); } catch (e) { }
        try { await AppDataSource.query(`DELETE FROM rooms WHERE "roomNumber" LIKE 'TN%'`); } catch (e) { }
        try { await AppDataSource.query(`DELETE FROM wards WHERE "wardNumber" LIKE 'TN%'`); } catch (e) { }
        try { await AppDataSource.query(`DELETE FROM appointments WHERE reason LIKE '%Tamil%'`); } catch (e) { }
        try { await AppDataSource.query(`DELETE FROM services WHERE name = 'General Consultation' AND "organization_id" IN (SELECT id FROM organizations WHERE name LIKE 'Tamil Nadu%')`); } catch (e) { }
        try { await AppDataSource.query(`DELETE FROM departments WHERE name IN ('Emergency', 'Cardiology', 'General Medicine') AND "organization_id" IN (SELECT id FROM organizations WHERE name LIKE 'Tamil Nadu%')`); } catch (e) { }
        try { await AppDataSource.query(`DELETE FROM users WHERE email LIKE '%tamilnadu.demo' OR email = 'superadmin@hospital.com' OR email = 'ceo@tamilnadu.com'`); } catch (e) { }
        try { await AppDataSource.query(`DELETE FROM organizations WHERE name LIKE 'Tamil Nadu%' OR subdomain = 'saas-admin'`); } catch (e) { }

        console.log('🚀 Seeding 3-Tier Multi-Location System...');

        const password = await bcrypt.hash('Password@123', 10);
        const superPass = await bcrypt.hash('SuperAdmin@2025', 10);

        const orgRepo = AppDataSource.getRepository(Organization);
        const userRepo = AppDataSource.getRepository(User);
        const deptRepo = AppDataSource.getRepository(Department);
        const apptRepo = AppDataSource.getRepository(Appointment);
        const wardRepo = AppDataSource.getRepository(Ward);
        const roomRepo = AppDataSource.getRepository(Room);
        const bedRepo = AppDataSource.getRepository(Bed);
        const admRepo = AppDataSource.getRepository(Admission);
        const serviceRepo = AppDataSource.getRepository(Service);

        // --- TIER 1: PLATFORM OWNER ---
        console.log('💎 Creating Tier 1: Platform Owner (SaaS Master)...');
        const saasOrg = orgRepo.create({
            name: 'Ayphen Systems (Platform Management)',
            subdomain: 'saas-admin',
            address: 'Global Hub',
            isActive: true,
            settings: { subscription: { plan: 'enterprise', status: 'active' } }
        });
        await orgRepo.save(saasOrg);

        await userRepo.save(userRepo.create({
            firstName: 'SaaS', lastName: 'Master', email: 'superadmin@hospital.com',
            password: superPass, role: UserRole.SUPER_ADMIN, organizationId: saasOrg.id, isActive: true
        }));


        // --- CLINICAL ORGANIZATIONS ---

        const chennaiOrg = orgRepo.create({
            name: 'Tamil Nadu Hospital',
            subdomain: 'tn-chn-' + Date.now(),
            address: 'Chennai',
            isActive: true,
            settings: { subscription: { plan: 'professional' } }
        });
        await orgRepo.save(chennaiOrg);

        const delhiOrg = orgRepo.create({
            name: 'Tamil Nadu Hospital',
            subdomain: 'tn-del-' + Date.now(),
            address: 'Delhi',
            isActive: true,
            settings: { subscription: { plan: 'professional' } }
        });
        await orgRepo.save(delhiOrg);

        // --- TIER 2: HOSPITAL GROUP CEO (Master Key for Group) ---
        console.log('👔 Creating Tier 2: Hospital Group CEO (Multi-Location Admin)...');
        const ceoEmail = 'ceo@tamilnadu.com';
        for (const org of [chennaiOrg, delhiOrg]) {
            await userRepo.save(userRepo.create({
                firstName: 'TN', lastName: 'CEO', email: ceoEmail,
                password, role: UserRole.ADMIN, organizationId: org.id, isActive: true
            }));
        }

        // --- TIER 3: BRANCH ADMINS (Locked to Branch) ---
        console.log('🏥 Creating Tier 3: Local Branch Admins...');
        await userRepo.save(userRepo.create({
            firstName: 'Chennai', lastName: 'Admin', email: 'admin.chn@tamilnadu.demo',
            password, role: UserRole.ADMIN, organizationId: chennaiOrg.id, isActive: true
        }));

        await userRepo.save(userRepo.create({
            firstName: 'Delhi', lastName: 'Admin', email: 'admin.del@tamilnadu.demo',
            password, role: UserRole.ADMIN, organizationId: delhiOrg.id, isActive: true
        }));

        // 4. Setup Location function
        const setupLocation = async (org: Organization, suffix: string, patientCount: number, doctorCount: number, apptCount: number, admissionCount: number) => {
            console.log(`Setting up Clinical Data for ${org.address}...`);

            // Departments
            const depts = [];
            for (const dName of ['General Medicine', 'Emergency', 'Cardiology']) {
                const d = await deptRepo.save(deptRepo.create({
                    name: dName,
                    description: `The ${dName} department at ${org.name} ${org.address}`,
                    organizationId: org.id
                }));
                depts.push(d);
            }

            // Services
            const service = await serviceRepo.save(serviceRepo.create({
                name: 'General Consultation',
                description: 'Routine checkup for Tamil Nadu residents',
                organizationId: org.id,
                departmentId: depts[0].id,
                status: 'active',
                averageDuration: 30
            }));

            // Doctors
            const doctors = [];
            for (let i = 0; i < doctorCount; i++) {
                const d = await userRepo.save(userRepo.create({
                    firstName: `Dr. ${suffix}`, lastName: `Strange ${i}`,
                    email: `doc${i}.${suffix}@tamilnadu.demo`, password,
                    role: UserRole.DOCTOR, organizationId: org.id, isActive: true,
                    departmentId: depts[i % depts.length].id
                }));
                doctors.push(d);
            }

            // Patients
            const patients = [];
            for (let i = 0; i < patientCount; i++) {
                const p = await userRepo.save(userRepo.create({
                    firstName: `Patient ${suffix}`, lastName: `${i} Demo`,
                    email: `p${i}.${suffix}@tamilnadu.demo`, password,
                    role: UserRole.PATIENT, organizationId: org.id, isActive: true
                }));
                patients.push(p);
            }

            // Ward -> Room -> Beds
            const ward = await wardRepo.save(wardRepo.create({
                name: `TN-Ward-${suffix}`,
                wardNumber: `TN-W-${suffix}-${Date.now() % 1000}-${Math.floor(Math.random() * 1000)}`,
                departmentId: depts[0].id,
                capacity: 20,
                organizationId: org.id
            }));

            const room = await roomRepo.save(roomRepo.create({
                roomNumber: `TN-R-${suffix}-${Date.now() % 1000}-${Math.floor(Math.random() * 1000)}`,
                roomType: RoomType.GENERAL,
                wardId: ward.id,
                capacity: 10,
                dailyRate: 500,
                organizationId: org.id
            }));

            const beds = [];
            for (let i = 0; i < 20; i++) {
                const b = await bedRepo.save(bedRepo.create({
                    bedNumber: `TN-B-${suffix}-${i}-${Date.now() % 1000}-${Math.floor(Math.random() * 1000)}`,
                    roomId: room.id,
                    organizationId: org.id,
                    status: BedStatus.AVAILABLE
                }));
                beds.push(b);
            }

            // Admissions
            for (let i = 0; i < admissionCount; i++) {
                const bed = beds[i];
                bed.status = BedStatus.OCCUPIED;
                await bedRepo.save(bed);

                const adm = admRepo.create({
                    admissionNumber: `TN-ADM-${suffix}-${i}-${Date.now() % 1000}-${Math.floor(Math.random() * 1000)}`,
                    patient: patients[i],
                    admittingDoctor: doctors[0],
                    bed: bed,
                    admissionDateTime: new Date(),
                    admissionReason: 'Tamil Nadu Demo Admission',
                    status: AdmissionStatus.ADMITTED,
                    organizationId: org.id,
                    isEmergency: i === 0
                });
                await admRepo.save(adm);
            }

            // Appointments (Today)
            const today = new Date();
            for (let i = 0; i < apptCount; i++) {
                const start = new Date(today);
                start.setHours(9 + i, 0, 0, 0);
                const end = new Date(start);
                end.setHours(start.getHours() + 1);

                const appt = apptRepo.create({
                    organizationId: org.id,
                    patient: patients[i % patients.length],
                    doctor: doctors[i % doctors.length],
                    service: service,
                    startTime: start,
                    endTime: end,
                    status: i % 2 === 0 ? AppointmentStatus.CONFIRMED : AppointmentStatus.COMPLETED,
                    reason: 'Tamil Nadu Routine Checkup',
                    mode: AppointmentMode.IN_PERSON,
                    appointmentType: AppointmentType.STANDARD
                });
                await apptRepo.save(appt);
            }
        };

        // Execution
        await setupLocation(chennaiOrg, 'CHN', 15, 3, 12, 10);
        await setupLocation(delhiOrg, 'DEL', 10, 3, 8, 5);

        console.log('\n✨ 3-TIER SEED COMPLETE! ✨');
        console.log('------------------------------------------------');
        console.log('🟢 TIER 1: PLATFORM OWNER');
        console.log('   Email:    superadmin@hospital.com');
        console.log('   Pass:     SuperAdmin@2025');
        console.log('   Context:  Management Only');
        console.log('------------------------------------------------');
        console.log('� TIER 2: HOSPITAL GROUP CEO');
        console.log('   Email:    ceo@tamilnadu.com');
        console.log('   Pass:     Password@123');
        console.log('   Context:  Chennai + Delhi (HAS SWITCHER)');
        console.log('------------------------------------------------');
        console.log('🏥 TIER 3: LOCAL BRANCH ADMINS');
        console.log('   Chennai:  admin.chn@tamilnadu.demo');
        console.log('   Delhi:    admin.del@tamilnadu.demo');
        console.log('   Pass:     Password@123');
        console.log('   Context:  Locked to Branch (NO SWITCHER)');
        console.log('------------------------------------------------');

        process.exit(0);
    } catch (e) {
        console.error('❌ Seeding Failed', e);
        process.exit(1);
    }
}

seed();
