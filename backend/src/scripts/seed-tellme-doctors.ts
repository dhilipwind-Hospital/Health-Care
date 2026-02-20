/**
 * Seed Script: Tellme Organization - Complete Department & Doctor Data
 * 
 * Adds departments and doctors to the existing "Tellme" organization
 * to enable the AI Symptom Checker feature.
 * 
 * Usage:
 *   npx ts-node src/scripts/seed-tellme-doctors.ts
 *   
 * Or via Docker:
 *   docker exec -it hospital-website-backend-1 npx ts-node src/scripts/seed-tellme-doctors.ts
 */

import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import { Department } from '../models/Department';
import * as bcrypt from 'bcryptjs';

// ============================================
// CONFIGURATION - Departments matching Symptom Checker
// ============================================

const DEPARTMENTS_CONFIG = [
    { name: 'General Medicine', description: 'Primary care, fever, cold, general health checkups', status: 'active' },
    { name: 'Cardiology', description: 'Heart and cardiovascular care', status: 'active' },
    { name: 'Orthopedics', description: 'Bone, joint, and musculoskeletal care', status: 'active' },
    { name: 'Pediatrics', description: 'Healthcare for children and adolescents', status: 'active' },
    { name: 'Gynecology', description: "Women's health and maternity care", status: 'active' },
    { name: 'Neurology', description: 'Brain, spine, and nervous system disorders', status: 'active' },
    { name: 'Dermatology', description: 'Skin care and treatment of skin conditions', status: 'active' },
    { name: 'Ophthalmology', description: 'Eye care and vision correction', status: 'active' },
    { name: 'ENT', description: 'Ear, Nose, and Throat specialist services', status: 'active' },
    { name: 'Gastroenterology', description: 'Digestive system disorders', status: 'active' },
    { name: 'Pulmonology', description: 'Respiratory and lung diseases', status: 'active' },
    { name: 'Psychiatry', description: 'Mental health and psychological care', status: 'active' },
    { name: 'Emergency Medicine', description: '24/7 emergency and trauma care', status: 'active' }
];

// Doctors for each department
const DOCTORS_CONFIG = [
    // General Medicine (2 doctors)
    { firstName: 'Anand', lastName: 'Sharma', department: 'General Medicine', specialization: 'General Physician', qualification: 'MBBS, MD', experience: 12, consultationFee: 400 },
    { firstName: 'Priya', lastName: 'Menon', department: 'General Medicine', specialization: 'Internal Medicine', qualification: 'MBBS, MD', experience: 8, consultationFee: 350 },

    // Cardiology (2 doctors)
    { firstName: 'Vikram', lastName: 'Patel', department: 'Cardiology', specialization: 'Interventional Cardiology', qualification: 'MBBS, DM Cardiology', experience: 15, consultationFee: 700 },
    { firstName: 'Meera', lastName: 'Krishnan', department: 'Cardiology', specialization: 'Clinical Cardiology', qualification: 'MBBS, MD, DM', experience: 10, consultationFee: 600 },

    // Orthopedics (2 doctors)
    { firstName: 'Rajesh', lastName: 'Kumar', department: 'Orthopedics', specialization: 'Orthopedic Surgery', qualification: 'MBBS, MS Ortho', experience: 14, consultationFee: 500 },
    { firstName: 'Sunita', lastName: 'Reddy', department: 'Orthopedics', specialization: 'Physiotherapy', qualification: 'BPT, MPT', experience: 9, consultationFee: 400 },

    // Pediatrics (2 doctors)
    { firstName: 'Lakshmi', lastName: 'Iyer', department: 'Pediatrics', specialization: 'Pediatric Care', qualification: 'MBBS, MD Pediatrics', experience: 16, consultationFee: 450 },
    { firstName: 'Suresh', lastName: 'Nair', department: 'Pediatrics', specialization: 'Neonatology', qualification: 'MBBS, MD, DM', experience: 11, consultationFee: 500 },

    // Gynecology (2 doctors)
    { firstName: 'Kavitha', lastName: 'Rao', department: 'Gynecology', specialization: 'Obstetrics & Gynecology', qualification: 'MBBS, MS OBG', experience: 18, consultationFee: 550 },
    { firstName: 'Deepa', lastName: 'Sundaram', department: 'Gynecology', specialization: 'Fertility Specialist', qualification: 'MBBS, MD, DNB', experience: 13, consultationFee: 600 },

    // Neurology (2 doctors)
    { firstName: 'Venkatesh', lastName: 'Pillai', department: 'Neurology', specialization: 'Neurologist', qualification: 'MBBS, DM Neurology', experience: 15, consultationFee: 650 },
    { firstName: 'Saranya', lastName: 'Das', department: 'Neurology', specialization: 'Stroke Medicine', qualification: 'MBBS, DM Neurology', experience: 10, consultationFee: 600 },

    // Dermatology (2 doctors)
    { firstName: 'Revathi', lastName: 'Shankar', department: 'Dermatology', specialization: 'Clinical Dermatology', qualification: 'MBBS, MD Dermatology', experience: 12, consultationFee: 450 },
    { firstName: 'Ganesh', lastName: 'Natarajan', department: 'Dermatology', specialization: 'Cosmetic Dermatology', qualification: 'MBBS, MD, DVD', experience: 8, consultationFee: 500 },

    // Ophthalmology (1 doctor)
    { firstName: 'Padmini', lastName: 'Srinivasan', department: 'Ophthalmology', specialization: 'Eye Care', qualification: 'MBBS, MS Ophthalmology', experience: 17, consultationFee: 450 },

    // ENT (1 doctor)
    { firstName: 'Senthil', lastName: 'Murugan', department: 'ENT', specialization: 'ENT Specialist', qualification: 'MBBS, MS ENT', experience: 14, consultationFee: 400 },

    // Gastroenterology (1 doctor)
    { firstName: 'Murali', lastName: 'Krishnan', department: 'Gastroenterology', specialization: 'Gastroenterologist', qualification: 'MBBS, DM Gastro', experience: 13, consultationFee: 550 },

    // Pulmonology (1 doctor)
    { firstName: 'Bala', lastName: 'Subramanian', department: 'Pulmonology', specialization: 'Pulmonologist', qualification: 'MBBS, DM Pulmonology', experience: 15, consultationFee: 550 },

    // Psychiatry (1 doctor)
    { firstName: 'Asha', lastName: 'Verma', department: 'Psychiatry', specialization: 'Psychiatrist', qualification: 'MBBS, MD Psychiatry', experience: 11, consultationFee: 600 },

    // Emergency Medicine (1 doctor)
    { firstName: 'Vijay', lastName: 'Anand', department: 'Emergency Medicine', specialization: 'Emergency Medicine', qualification: 'MBBS, MD Emergency', experience: 10, consultationFee: 500 }
];

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function seedTellmeDoctors() {
    try {
        console.log('\n🏥 Starting Tellme Organization Doctor Seed Script...\n');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('   Organization: Tellme');
        console.log('═══════════════════════════════════════════════════════════════\n');

        // Initialize database
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
            console.log('✅ Database connected\n');
        }

        const orgRepo = AppDataSource.getRepository(Organization);
        const userRepo = AppDataSource.getRepository(User);
        const deptRepo = AppDataSource.getRepository(Department);

        // ===== STEP 1: Find Tellme Organization =====
        console.log('📌 Finding Tellme Organization...');

        // Try to find by name (case insensitive search)
        let organization = await orgRepo
            .createQueryBuilder('org')
            .where('LOWER(org.name) LIKE :name', { name: '%tellme%' })
            .getOne();

        if (!organization) {
            // Try by subdomain
            organization = await orgRepo.findOne({ where: { subdomain: 'tellme' } });
        }

        if (!organization) {
            console.log('   ❌ Tellme organization not found!');
            console.log('   💡 Available organizations:');
            const orgs = await orgRepo.find({ take: 10 });
            orgs.forEach(o => console.log(`      - ${o.name} (subdomain: ${(o as any).subdomain || 'N/A'})`));
            console.log('\n   Please ensure the Tellme organization exists or provide the correct name.');
            process.exit(1);
        }

        console.log(`   ✅ Found: ${organization.name} (ID: ${organization.id})\n`);
        const orgId = organization.id;

        // ===== STEP 2: Create Departments =====
        console.log('🏥 Creating/Updating Departments...');
        const createdDepts: Map<string, Department> = new Map();
        let deptCreated = 0;

        for (const deptConfig of DEPARTMENTS_CONFIG) {
            let dept = await deptRepo.findOne({
                where: { name: deptConfig.name, organizationId: orgId }
            });

            if (!dept) {
                const newDept = deptRepo.create({
                    name: deptConfig.name,
                    description: deptConfig.description,
                    status: deptConfig.status,
                    organizationId: orgId
                } as any);
                dept = await deptRepo.save(newDept) as any;
                console.log(`   ✅ Created: ${deptConfig.name}`);
                deptCreated++;
            } else {
                console.log(`   ⏭️  Exists: ${deptConfig.name}`);
            }
            createdDepts.set(deptConfig.name, dept as Department);
        }
        console.log(`\n   📊 ${deptCreated} new departments created\n`);

        // ===== STEP 3: Create Doctors =====
        console.log('👨‍⚕️ Creating Doctors...');
        const doctorPassword = 'Doctor@Tellme2026';
        let doctorCreated = 0;

        for (const docConfig of DOCTORS_CONFIG) {
            const email = `dr.${docConfig.firstName.toLowerCase()}.${docConfig.lastName.toLowerCase()}@tellme.com`;
            const dept = createdDepts.get(docConfig.department);

            const existingDoctor = await userRepo.findOne({ where: { email, organizationId: orgId } });
            if (!existingDoctor) {
                const hashedPassword = await bcrypt.hash(doctorPassword, 10);
                const newDoctor = userRepo.create({
                    email,
                    password: hashedPassword,
                    firstName: docConfig.firstName,
                    lastName: docConfig.lastName,
                    phone: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
                    role: 'doctor' as any,
                    organizationId: orgId,
                    departmentId: dept ? (dept as any).id : null,
                    isActive: true,
                    qualification: docConfig.qualification,
                    experience: docConfig.experience,
                    consultationFee: docConfig.consultationFee,
                    specialization: docConfig.specialization,
                    availableFrom: '09:00',
                    availableTo: '18:00',
                    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                } as any);
                await userRepo.save(newDoctor);
                console.log(`   ✅ Dr. ${docConfig.firstName} ${docConfig.lastName} (${docConfig.department})`);
                doctorCreated++;
            } else {
                console.log(`   ⏭️  Exists: Dr. ${docConfig.firstName} ${docConfig.lastName}`);
            }
        }

        // ===== SUMMARY =====
        console.log('\n');
        console.log('═══════════════════════════════════════════════════════════════════════════════');
        console.log('                        🎉 TELLME DOCTORS SEED COMPLETE 🎉');
        console.log('═══════════════════════════════════════════════════════════════════════════════');
        console.log(`\n📌 Organization: ${organization.name}`);
        console.log(`\n🏥 Departments: ${DEPARTMENTS_CONFIG.length} (${deptCreated} new)`);
        console.log(`👨‍⚕️ Doctors: ${DOCTORS_CONFIG.length} (${doctorCreated} new)`);

        console.log('\n═══════════════════════════════════════════════════════════════════════════════');
        console.log('                         DEPARTMENTS WITH DOCTORS');
        console.log('═══════════════════════════════════════════════════════════════════════════════');

        for (const deptName of DEPARTMENTS_CONFIG.map(d => d.name)) {
            const doctorsInDept = DOCTORS_CONFIG.filter(d => d.department === deptName);
            console.log(`\n🏥 ${deptName}:`);
            doctorsInDept.forEach(doc => {
                console.log(`   • Dr. ${doc.firstName} ${doc.lastName} - ${doc.specialization}`);
            });
        }

        console.log('\n═══════════════════════════════════════════════════════════════════════════════');
        console.log('                              🔑 DOCTOR LOGIN');
        console.log('═══════════════════════════════════════════════════════════════════════════════');
        console.log(`\n👨‍⚕️ Doctor Email Pattern: dr.[firstname].[lastname]@tellme.com`);
        console.log(`   Password: ${doctorPassword}`);
        console.log(`\n   Examples:`);
        console.log(`   • dr.anand.sharma@tellme.com (General Medicine)`);
        console.log(`   • dr.vikram.patel@tellme.com (Cardiology)`);
        console.log(`   • dr.rajesh.kumar@tellme.com (Orthopedics)`);
        console.log('═══════════════════════════════════════════════════════════════════════════════\n');

        console.log('✅ You can now use the AI Symptom Checker to see doctors in View Doctors popup!\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Seed failed:', error);
        process.exit(1);
    }
}

// Run the seed
seedTellmeDoctors();
