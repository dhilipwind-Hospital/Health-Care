import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import { Department } from '../models/Department';
import { UserRole } from '../types/roles';
import * as bcrypt from 'bcryptjs';

/**
 * Seed Script: Cross-Location Access Test Data
 * 
 * Creates two organizations (iPhone Chennai & iPhone Pune) with doctors and patients
 * for testing the cross-location consent-based access feature.
 */
async function seedCrossLocationTestData() {
    try {
        console.log('🚀 Starting Cross-Location Test Data Seed...\n');

        await AppDataSource.initialize();
        console.log('✅ Database connected\n');

        const orgRepo = AppDataSource.getRepository(Organization);
        const userRepo = AppDataSource.getRepository(User);
        const deptRepo = AppDataSource.getRepository(Department);

        // Common password for all test users
        const password = 'Test@2025';
        const hashedPassword = await bcrypt.hash(password, 10);

        // =========================================================
        // ORGANIZATION 1: iPhone Chennai
        // =========================================================
        console.log('📍 Creating Organization: iPhone Chennai...');

        let iphoneChennai = await orgRepo.findOne({ where: { subdomain: 'iphone-chennai' } });
        if (!iphoneChennai) {
            iphoneChennai = orgRepo.create({
                name: 'iPhone Hospital Chennai',
                subdomain: 'iphone-chennai',
                email: 'admin@iphone-chennai.hospital.com',
                address: 'Anna Nagar, Chennai, Tamil Nadu',
                phone: '+91 44 1234 5678',
                isActive: true
            });
            await orgRepo.save(iphoneChennai);
            console.log('  ✅ Created iPhone Chennai organization');
        } else {
            console.log('  ℹ️  iPhone Chennai already exists');
        }

        // Create department for Chennai
        let chennaiDept = await deptRepo.findOne({
            where: { name: 'General Medicine', organization: { id: iphoneChennai.id } }
        });
        if (!chennaiDept) {
            chennaiDept = deptRepo.create({
                name: 'General Medicine',
                description: 'General Medical Services',
                organization: iphoneChennai
            });
            await deptRepo.save(chennaiDept);
        }

        // Doctor Apple (Chennai)
        let doctorApple = await userRepo.findOne({ where: { email: 'apple.doctor@iphone-chennai.com' } });
        if (!doctorApple) {
            doctorApple = userRepo.create({
                firstName: 'Apple',
                lastName: 'Doctor',
                email: 'apple.doctor@iphone-chennai.com',
                phone: '+91 9876543210',
                password: hashedPassword,
                role: UserRole.DOCTOR,
                isActive: true,
                organization: iphoneChennai,
                department: chennaiDept
            });
            await userRepo.save(doctorApple);
            console.log('  ✅ Created Doctor: Apple (Chennai)');
        } else {
            console.log('  ℹ️  Doctor Apple already exists');
        }

        // Patient Apple (Chennai)
        let patientApple = await userRepo.findOne({ where: { email: 'apple.patient@iphone-chennai.com' } });
        if (!patientApple) {
            patientApple = userRepo.create({
                firstName: 'Apple',
                lastName: 'Patient',
                email: 'apple.patient@iphone-chennai.com',
                phone: '+91 9876543211',
                password: hashedPassword,
                role: UserRole.PATIENT,
                isActive: true,
                organization: iphoneChennai,
                primaryDepartment: chennaiDept
            });
            await userRepo.save(patientApple);
            console.log('  ✅ Created Patient: Apple (Chennai)');
        } else {
            console.log('  ℹ️  Patient Apple already exists');
        }

        // =========================================================
        // ORGANIZATION 2: iPhone Pune
        // =========================================================
        console.log('\n📍 Creating Organization: iPhone Pune...');

        let iphonePune = await orgRepo.findOne({ where: { subdomain: 'iphone-pune' } });
        if (!iphonePune) {
            iphonePune = orgRepo.create({
                name: 'iPhone Hospital Pune',
                subdomain: 'iphone-pune',
                email: 'admin@iphone-pune.hospital.com',
                address: 'Koregaon Park, Pune, Maharashtra',
                phone: '+91 20 1234 5678',
                isActive: true
            });
            await orgRepo.save(iphonePune);
            console.log('  ✅ Created iPhone Pune organization');
        } else {
            console.log('  ℹ️  iPhone Pune already exists');
        }

        // Create department for Pune
        let puneDept = await deptRepo.findOne({
            where: { name: 'General Medicine', organization: { id: iphonePune.id } }
        });
        if (!puneDept) {
            puneDept = deptRepo.create({
                name: 'General Medicine',
                description: 'General Medical Services',
                organization: iphonePune
            });
            await deptRepo.save(puneDept);
        }

        // Doctor Fold (Pune)
        let doctorFold = await userRepo.findOne({ where: { email: 'fold.doctor@iphone-pune.com' } });
        if (!doctorFold) {
            doctorFold = userRepo.create({
                firstName: 'Fold',
                lastName: 'Doctor',
                email: 'fold.doctor@iphone-pune.com',
                phone: '+91 9876543220',
                password: hashedPassword,
                role: UserRole.DOCTOR,
                isActive: true,
                organization: iphonePune,
                department: puneDept
            });
            await userRepo.save(doctorFold);
            console.log('  ✅ Created Doctor: Fold (Pune)');
        } else {
            console.log('  ℹ️  Doctor Fold already exists');
        }

        // Patient Fold (Pune)
        let patientFold = await userRepo.findOne({ where: { email: 'fold.patient@iphone-pune.com' } });
        if (!patientFold) {
            patientFold = userRepo.create({
                firstName: 'Fold',
                lastName: 'Patient',
                email: 'fold.patient@iphone-pune.com',
                phone: '+91 9876543221',
                password: hashedPassword,
                role: UserRole.PATIENT,
                isActive: true,
                organization: iphonePune,
                primaryDepartment: puneDept
            });
            await userRepo.save(patientFold);
            console.log('  ✅ Created Patient: Fold (Pune)');
        } else {
            console.log('  ℹ️  Patient Fold already exists');
        }

        // =========================================================
        // SUMMARY
        // =========================================================
        console.log('\n' + '='.repeat(60));
        console.log('✅ CROSS-LOCATION TEST DATA CREATED SUCCESSFULLY!');
        console.log('='.repeat(60));

        console.log('\n📋 CREDENTIALS (Password for all: Test@2025)\n');

        console.log('┌─────────────────────────────────────────────────────────────────┐');
        console.log('│ 🏥 ORGANIZATION 1: iPhone Hospital Chennai                      │');
        console.log('├─────────────────────────────────────────────────────────────────┤');
        console.log(`│ 👨‍⚕️ Doctor Apple                                                 │`);
        console.log(`│    Email: apple.doctor@iphone-chennai.com                       │`);
        console.log(`│    ID: ${doctorApple?.id}               │`);
        console.log('├─────────────────────────────────────────────────────────────────┤');
        console.log(`│ 🧑 Patient Apple                                                │`);
        console.log(`│    Email: apple.patient@iphone-chennai.com                      │`);
        console.log(`│    ID: ${patientApple?.id}               │`);
        console.log('└─────────────────────────────────────────────────────────────────┘');

        console.log('\n┌─────────────────────────────────────────────────────────────────┐');
        console.log('│ 🏥 ORGANIZATION 2: iPhone Hospital Pune                         │');
        console.log('├─────────────────────────────────────────────────────────────────┤');
        console.log(`│ 👨‍⚕️ Doctor Fold                                                  │`);
        console.log(`│    Email: fold.doctor@iphone-pune.com                           │`);
        console.log(`│    ID: ${doctorFold?.id}               │`);
        console.log('├─────────────────────────────────────────────────────────────────┤');
        console.log(`│ 🧑 Patient Fold                                                 │`);
        console.log(`│    Email: fold.patient@iphone-pune.com                          │`);
        console.log(`│    ID: ${patientFold?.id}               │`);
        console.log('└─────────────────────────────────────────────────────────────────┘');

        console.log('\n📝 TEST SCENARIO:');
        console.log('   1. Login as Doctor Fold (Pune)');
        console.log('   2. Go to /doctor/cross-location-access');
        console.log('   3. Search for Patient Apple (Chennai)');
        console.log('   4. Request access - Patient Apple will get an email');
        console.log('   5. Approve the request and Doctor Fold can now view records!\n');

        await AppDataSource.destroy();
        console.log('✅ Database connection closed');

    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
}

seedCrossLocationTestData();
