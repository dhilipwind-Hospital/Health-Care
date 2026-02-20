
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
        console.log('🧹 Cleaning up old Care Hospital data...');

        // Cleanup
        try { await AppDataSource.query(`DELETE FROM appointments WHERE reason LIKE '%Care Hospital%'`); } catch (e) { }
        try { await AppDataSource.query(`DELETE FROM services WHERE "organization_id" IN (SELECT id FROM organizations WHERE name LIKE 'Care Hospital%')`); } catch (e) { }
        try { await AppDataSource.query(`DELETE FROM departments WHERE "organization_id" IN (SELECT id FROM organizations WHERE name LIKE 'Care Hospital%')`); } catch (e) { }
        try { await AppDataSource.query(`DELETE FROM users WHERE email LIKE '%carehosp.com' OR email LIKE '%carehosp.demo'`); } catch (e) { }
        try { await AppDataSource.query(`DELETE FROM organizations WHERE name LIKE 'Care Hospital%'`); } catch (e) { }

        console.log('🚀 Seeding Care Hospital (Mumbai + Bangalore) with FULL Patient Data...');

        const password = await bcrypt.hash('Password@123', 10);

        const orgRepo = AppDataSource.getRepository(Organization);
        const userRepo = AppDataSource.getRepository(User);
        const deptRepo = AppDataSource.getRepository(Department);
        const apptRepo = AppDataSource.getRepository(Appointment);
        const serviceRepo = AppDataSource.getRepository(Service);

        // --- CREATE ORGANIZATIONS ---
        const mumbaiOrg = orgRepo.create({
            name: 'Care Hospital',
            subdomain: 'care-mumbai-' + Date.now(),
            address: 'Mumbai, Maharashtra',
            phone: '+91-22-12345678',
            email: 'mumbai@carehosp.com',
            isActive: true,
            settings: { subscription: { plan: 'enterprise', status: 'active' } }
        });
        await orgRepo.save(mumbaiOrg);
        console.log(`✅ Created: Care Hospital - Mumbai`);

        const bangaloreOrg = orgRepo.create({
            name: 'Care Hospital',
            subdomain: 'care-blr-' + Date.now(),
            address: 'Bangalore, Karnataka',
            phone: '+91-80-87654321',
            email: 'bangalore@carehosp.com',
            isActive: true,
            settings: { subscription: { plan: 'enterprise', status: 'active' } }
        });
        await orgRepo.save(bangaloreOrg);
        console.log(`✅ Created: Care Hospital - Bangalore`);

        // --- TIER 2: CEO (Master Key for both locations) ---
        const ceoEmail = 'ceo@carehosp.com';
        console.log(`👔 Creating Tier 2 CEO: ${ceoEmail}...`);
        for (const org of [mumbaiOrg, bangaloreOrg]) {
            await userRepo.save(userRepo.create({
                firstName: 'Care', lastName: 'CEO', email: ceoEmail,
                password, role: UserRole.ADMIN, organizationId: org.id, isActive: true
            }));
        }

        // --- TIER 3: Branch Admins (Locked) ---
        console.log(`🏥 Creating Tier 3 Branch Admins...`);
        await userRepo.save(userRepo.create({
            firstName: 'Mumbai', lastName: 'Admin', email: 'admin.mumbai@carehosp.demo',
            password, role: UserRole.ADMIN, organizationId: mumbaiOrg.id, isActive: true
        }));
        await userRepo.save(userRepo.create({
            firstName: 'Bangalore', lastName: 'Admin', email: 'admin.blr@carehosp.demo',
            password, role: UserRole.ADMIN, organizationId: bangaloreOrg.id, isActive: true
        }));

        // --- SEED FULL CLINICAL DATA ---
        const setupBranch = async (org: Organization, city: string, suffix: string) => {
            console.log(`\n📊 Seeding FULL data for ${city}...`);

            // Departments
            const deptData = [
                { name: 'Cardiology', desc: `Cardiology department at Care Hospital ${city}` },
                { name: 'Orthopedics', desc: `Orthopedics department at Care Hospital ${city}` },
                { name: 'General Medicine', desc: `General Medicine at Care Hospital ${city}` },
                { name: 'Pediatrics', desc: `Pediatrics department at Care Hospital ${city}` }
            ];
            const depts: any[] = [];
            for (const d of deptData) {
                const dept = await deptRepo.save(deptRepo.create({
                    name: d.name, description: d.desc, organizationId: org.id
                }));
                depts.push(dept);
            }
            console.log(`   ✓ ${depts.length} Departments created`);

            // Services
            const services: any[] = [];
            const serviceData = [
                { name: 'ECG', dept: 0 },
                { name: 'X-Ray', dept: 1 },
                { name: 'General Checkup', dept: 2 },
                { name: 'Vaccination', dept: 3 }
            ];
            for (const s of serviceData) {
                const svc = await serviceRepo.save(serviceRepo.create({
                    name: s.name,
                    description: `${s.name} service at Care Hospital ${city}`,
                    organizationId: org.id,
                    departmentId: depts[s.dept].id,
                    status: 'active',
                    averageDuration: 30
                }));
                services.push(svc);
            }
            console.log(`   ✓ ${services.length} Services created`);

            // Doctors
            const doctorData = [
                { first: 'Dr. Ramesh', last: 'Kumar', spec: 'Cardiologist', dept: 0 },
                { first: 'Dr. Priya', last: 'Sharma', spec: 'Orthopedic Surgeon', dept: 1 },
                { first: 'Dr. Suresh', last: 'Patel', spec: 'General Physician', dept: 2 },
                { first: 'Dr. Anita', last: 'Desai', spec: 'Pediatrician', dept: 3 }
            ];
            const doctors: any[] = [];
            for (let i = 0; i < doctorData.length; i++) {
                const d = doctorData[i];
                const doc = await userRepo.save(userRepo.create({
                    firstName: d.first, lastName: d.last,
                    email: `doc${i}.${suffix}@carehosp.demo`, password,
                    role: UserRole.DOCTOR, organizationId: org.id, isActive: true,
                    departmentId: depts[d.dept].id,
                    specialization: d.spec
                }));
                doctors.push(doc);
            }
            console.log(`   ✓ ${doctors.length} Doctors created`);

            // Nurses
            const nurses: any[] = [];
            for (let i = 0; i < 3; i++) {
                const nurse = await userRepo.save(userRepo.create({
                    firstName: `Nurse ${suffix}`, lastName: `${i + 1}`,
                    email: `nurse${i}.${suffix}@carehosp.demo`, password,
                    role: UserRole.NURSE, organizationId: org.id, isActive: true,
                    departmentId: depts[i % depts.length].id
                }));
                nurses.push(nurse);
            }
            console.log(`   ✓ ${nurses.length} Nurses created`);

            // Patients with FULL details
            const patientData = [
                { first: 'Rajesh', last: 'Verma', phone: '9876543210', gender: 'male', dob: '1985-03-15', addr: `123 Main St, ${city}` },
                { first: 'Sunita', last: 'Mehta', phone: '9876543211', gender: 'female', dob: '1990-07-22', addr: `456 Park Ave, ${city}` },
                { first: 'Amit', last: 'Singh', phone: '9876543212', gender: 'male', dob: '1978-11-08', addr: `789 Lake Rd, ${city}` },
                { first: 'Priya', last: 'Nair', phone: '9876543213', gender: 'female', dob: '1995-02-28', addr: `321 Hill St, ${city}` },
                { first: 'Vikram', last: 'Reddy', phone: '9876543214', gender: 'male', dob: '1982-09-10', addr: `654 River Ln, ${city}` },
                { first: 'Kavita', last: 'Joshi', phone: '9876543215', gender: 'female', dob: '1988-05-18', addr: `987 Ocean Dr, ${city}` },
                { first: 'Arjun', last: 'Kapoor', phone: '9876543216', gender: 'male', dob: '2010-01-25', addr: `147 Forest Rd, ${city}` },
                { first: 'Meera', last: 'Pillai', phone: '9876543217', gender: 'female', dob: '1975-12-03', addr: `258 Garden St, ${city}` }
            ];
            const patients: any[] = [];
            for (let i = 0; i < patientData.length; i++) {
                const p = patientData[i];
                const patient = await userRepo.save(userRepo.create({
                    firstName: p.first, lastName: p.last,
                    email: `patient${i}.${suffix}@carehosp.demo`, password,
                    phone: p.phone,
                    gender: p.gender as any,
                    dateOfBirth: new Date(p.dob),
                    address: p.addr,
                    city: city,
                    state: city === 'Mumbai' ? 'Maharashtra' : 'Karnataka',
                    country: 'India',
                    role: UserRole.PATIENT, organizationId: org.id, isActive: true
                }));
                patients.push(patient);
            }
            console.log(`   ✓ ${patients.length} Patients created with FULL details`);

            // Appointments (Today + Past)
            const today = new Date();
            let apptCount = 0;
            for (let dayOffset = 0; dayOffset >= -7; dayOffset--) {
                const apptDate = new Date(today);
                apptDate.setDate(today.getDate() + dayOffset);

                for (let i = 0; i < 3; i++) {
                    const start = new Date(apptDate);
                    start.setHours(9 + i * 2, 0, 0, 0);
                    const end = new Date(start);
                    end.setHours(start.getHours() + 1);

                    await apptRepo.save(apptRepo.create({
                        organizationId: org.id,
                        patient: patients[(apptCount) % patients.length],
                        doctor: doctors[(apptCount) % doctors.length],
                        service: services[(apptCount) % services.length],
                        startTime: start,
                        endTime: end,
                        status: dayOffset === 0
                            ? (i % 2 === 0 ? AppointmentStatus.CONFIRMED : AppointmentStatus.PENDING)
                            : AppointmentStatus.COMPLETED,
                        reason: `Care Hospital ${city} - ${services[(apptCount) % services.length].name}`,
                        mode: AppointmentMode.IN_PERSON,
                        appointmentType: AppointmentType.STANDARD
                    }));
                    apptCount++;
                }
            }
            console.log(`   ✓ ${apptCount} Appointments created (Today + 7 days history)`);

            // Receptionist
            await userRepo.save(userRepo.create({
                firstName: 'Reception', lastName: suffix,
                email: `reception.${suffix}@carehosp.demo`, password,
                role: UserRole.RECEPTIONIST, organizationId: org.id, isActive: true
            }));
            console.log(`   ✓ 1 Receptionist created`);

            // Lab Technician
            await userRepo.save(userRepo.create({
                firstName: 'Lab Tech', lastName: suffix,
                email: `labtech.${suffix}@carehosp.demo`, password,
                role: UserRole.LAB_TECHNICIAN, organizationId: org.id, isActive: true
            }));
            console.log(`   ✓ 1 Lab Technician created`);

            // Pharmacist
            await userRepo.save(userRepo.create({
                firstName: 'Pharma', lastName: suffix,
                email: `pharma.${suffix}@carehosp.demo`, password,
                role: UserRole.PHARMACIST, organizationId: org.id, isActive: true
            }));
            console.log(`   ✓ 1 Pharmacist created`);

            return { depts, doctors, nurses, patients, services };
        };

        await setupBranch(mumbaiOrg, 'Mumbai', 'MUM');
        await setupBranch(bangaloreOrg, 'Bangalore', 'BLR');

        console.log('\n✨ CARE HOSPITAL SEED COMPLETE! ✨');
        console.log('================================================');
        console.log('🌐 TIER 2 (CEO - Master Key):');
        console.log('   Email:    ceo@carehosp.com');
        console.log('   Pass:     Password@123');
        console.log('   Access:   Mumbai + Bangalore (SWITCHER ENABLED)');
        console.log('================================================');
        console.log('🏥 TIER 3 (Branch Admins - Locked):');
        console.log('   Mumbai:     admin.mumbai@carehosp.demo / Password@123');
        console.log('   Bangalore:  admin.blr@carehosp.demo / Password@123');
        console.log('================================================');
        console.log('👨‍⚕️ DOCTORS (Per Branch):');
        console.log('   Mumbai:     doc0.MUM@carehosp.demo (Cardiologist)');
        console.log('   Bangalore:  doc0.BLR@carehosp.demo (Cardiologist)');
        console.log('================================================');
        console.log('👤 PATIENTS (8 per branch with full details):');
        console.log('   Mumbai:     patient0.MUM@carehosp.demo');
        console.log('   Bangalore:  patient0.BLR@carehosp.demo');
        console.log('================================================');
        console.log('🔑 All passwords: Password@123');
        console.log('================================================');

        process.exit(0);
    } catch (e) {
        console.error('❌ Seeding Failed', e);
        process.exit(1);
    }
}

seed();
