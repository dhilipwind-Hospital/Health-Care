
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Organization } from '../models/Organization';
import { Department } from '../models/Department';
import { Appointment, AppointmentStatus, AppointmentMode, AppointmentType } from '../models/Appointment';
import { Service } from '../models/Service';
import { UserRole } from '../types/roles';
import * as bcrypt from 'bcryptjs';

async function seed() {
    try {
        await AppDataSource.initialize();
        console.log('🧹 Cleaning up old Dhilip Hospital data...');

        // Cleanup existing Dhilip data
        try { await AppDataSource.query(`DELETE FROM appointments WHERE reason LIKE '%Dhilip%'`); } catch (e) { }
        try { await AppDataSource.query(`DELETE FROM services WHERE "organization_id" IN (SELECT id FROM organizations WHERE name LIKE 'Dhilip%')`); } catch (e) { }
        try { await AppDataSource.query(`DELETE FROM departments WHERE "organization_id" IN (SELECT id FROM organizations WHERE name LIKE 'Dhilip%')`); } catch (e) { }
        try { await AppDataSource.query(`DELETE FROM users WHERE email LIKE '%dhilip.com' OR email LIKE '%dhilip.demo'`); } catch (e) { }
        try { await AppDataSource.query(`DELETE FROM organizations WHERE name LIKE 'Dhilip%'`); } catch (e) { }

        console.log('🚀 Seeding Dhilip Hospital (Chennai + Pune)...');

        const password = await bcrypt.hash('Password@123', 10);

        const orgRepo = AppDataSource.getRepository(Organization);
        const userRepo = AppDataSource.getRepository(User);
        const deptRepo = AppDataSource.getRepository(Department);
        const apptRepo = AppDataSource.getRepository(Appointment);
        const serviceRepo = AppDataSource.getRepository(Service);

        // --- CREATE ORGANIZATIONS ---
        const chennaiOrg = orgRepo.create({
            name: 'Dhilip Hospital',
            subdomain: 'dhilip-chennai-' + Date.now(),
            address: 'Chennai',
            isActive: true,
            settings: { subscription: { plan: 'professional', status: 'active' } }
        });
        await orgRepo.save(chennaiOrg);
        console.log(`✅ Created: Dhilip Hospital - Chennai`);

        const puneOrg = orgRepo.create({
            name: 'Dhilip Hospital',
            subdomain: 'dhilip-pune-' + Date.now(),
            address: 'Pune',
            isActive: true,
            settings: { subscription: { plan: 'professional', status: 'active' } }
        });
        await orgRepo.save(puneOrg);
        console.log(`✅ Created: Dhilip Hospital - Pune`);

        // --- TIER 2: CEO (Same email in both orgs = Switcher enabled) ---
        const ceoEmail = 'ceo@dhilip.com';
        console.log(`👔 Creating Tier 2 CEO: ${ceoEmail}...`);
        for (const org of [chennaiOrg, puneOrg]) {
            await userRepo.save(userRepo.create({
                firstName: 'Dhilip', lastName: 'CEO', email: ceoEmail,
                password, role: UserRole.ADMIN, organizationId: org.id, isActive: true
            }));
        }

        // --- TIER 3: Branch Admins (Unique emails = Locked to branch) ---
        console.log(`🏥 Creating Tier 3 Branch Admins...`);
        await userRepo.save(userRepo.create({
            firstName: 'Chennai', lastName: 'Manager', email: 'admin.chennai@dhilip.demo',
            password, role: UserRole.ADMIN, organizationId: chennaiOrg.id, isActive: true
        }));
        await userRepo.save(userRepo.create({
            firstName: 'Pune', lastName: 'Manager', email: 'admin.pune@dhilip.demo',
            password, role: UserRole.ADMIN, organizationId: puneOrg.id, isActive: true
        }));

        // --- SEED CLINICAL DATA FOR EACH LOCATION ---
        const setupBranch = async (org: Organization, suffix: string, patientCount: number, apptCount: number) => {
            console.log(`  📊 Seeding data for ${org.address}...`);

            // Department
            const dept = await deptRepo.save(deptRepo.create({
                name: 'General Medicine',
                description: `General Medicine at Dhilip ${org.address}`,
                organizationId: org.id
            }));

            // Service
            const service = await serviceRepo.save(serviceRepo.create({
                name: 'Consultation',
                description: 'General Consultation',
                organizationId: org.id,
                departmentId: dept.id,
                status: 'active',
                averageDuration: 30
            }));

            // Doctors
            const doctors = [];
            for (let i = 0; i < 2; i++) {
                const doc = await userRepo.save(userRepo.create({
                    firstName: `Dr. ${suffix}`, lastName: `Doc${i}`,
                    email: `doc${i}.${suffix}@dhilip.demo`, password,
                    role: UserRole.DOCTOR, organizationId: org.id, isActive: true,
                    departmentId: dept.id
                }));
                doctors.push(doc);
            }

            // Patients
            const patients = [];
            for (let i = 0; i < patientCount; i++) {
                const p = await userRepo.save(userRepo.create({
                    firstName: `Patient ${suffix}`, lastName: `${i}`,
                    email: `patient${i}.${suffix}@dhilip.demo`, password,
                    role: UserRole.PATIENT, organizationId: org.id, isActive: true
                }));
                patients.push(p);
            }

            // Appointments (Today)
            const today = new Date();
            for (let i = 0; i < apptCount; i++) {
                const start = new Date(today);
                start.setHours(9 + i, 0, 0, 0);
                const end = new Date(start);
                end.setHours(start.getHours() + 1);

                await apptRepo.save(apptRepo.create({
                    organizationId: org.id,
                    patient: patients[i % patients.length],
                    doctor: doctors[i % doctors.length],
                    service: service,
                    startTime: start,
                    endTime: end,
                    status: i % 2 === 0 ? AppointmentStatus.CONFIRMED : AppointmentStatus.COMPLETED,
                    reason: 'Dhilip Hospital Checkup',
                    mode: AppointmentMode.IN_PERSON,
                    appointmentType: AppointmentType.STANDARD
                }));
            }
        };

        await setupBranch(chennaiOrg, 'CHN', 8, 6);
        await setupBranch(puneOrg, 'PUNE', 5, 4);

        console.log('\n✨ DHILIP HOSPITAL SEED COMPLETE! ✨');
        console.log('------------------------------------------------');
        console.log('🌐 TIER 2 (CEO - Master Key):');
        console.log('   Email:    ceo@dhilip.com');
        console.log('   Pass:     Password@123');
        console.log('   Access:   Chennai + Pune (SWITCHER ENABLED)');
        console.log('------------------------------------------------');
        console.log('🏥 TIER 3 (Branch Admins - Locked):');
        console.log('   Chennai:  admin.chennai@dhilip.demo / Password@123');
        console.log('   Pune:     admin.pune@dhilip.demo / Password@123');
        console.log('------------------------------------------------');

        process.exit(0);
    } catch (e) {
        console.error('❌ Seeding Failed', e);
        process.exit(1);
    }
}

seed();
