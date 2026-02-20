/**
 * Seed Script: Tellme Organization - Complete Setup
 * 
 * Creates the "Tellme" organization and populates it with departments and doctors
 * for the AI Symptom Checker feature.
 * 
 * Usage:
 *   npx ts-node src/scripts/seed-tellme-complete.ts
 */

import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import { Department } from '../models/Department';
import { Service } from '../models/Service';
import * as bcrypt from 'bcryptjs';

// ============================================
// CONFIGURATION
// ============================================

const SERVICES_CONFIG = [
    { name: 'General Consultation', description: 'Regular health checkup and consultation', department: 'General Medicine', duration: 30 },
    { name: 'Follow-up Visit', description: 'Follow-up on previous treatment', department: 'General Medicine', duration: 15 },
    { name: 'Cardiac Consultation', description: 'Heart health assessment', department: 'Cardiology', duration: 45 },
    { name: 'ECG Service', description: 'Electrocardiogram test', department: 'Cardiology', duration: 20 },
    { name: 'Orthopedic Consultation', description: 'Bone and joint assessment', department: 'Orthopedics', duration: 30 },
    { name: 'Physiotherapy Session', description: 'Physical therapy and rehabilitation', department: 'Orthopedics', duration: 60 },
    { name: 'Pediatric Checkup', description: 'Child health and growth assessment', department: 'Pediatrics', duration: 30 },
    { name: 'Vaccination', description: 'Scheduled immunizations', department: 'Pediatrics', duration: 15 },
    { name: 'Gynecology Consultation', description: 'Women health assessment', department: 'Gynecology', duration: 30 },
    { name: 'Neurology Consultation', description: 'Nervous system assessment', department: 'Neurology', duration: 45 },
    { name: 'Dermatology Consultation', description: 'Skin condition assessment', department: 'Dermatology', duration: 20 },
    { name: 'Eye Checkup', description: 'Vision test and eye health', department: 'Ophthalmology', duration: 30 },
    { name: 'ENT Consultant', description: 'Ear, Nose, Throat assessment', department: 'ENT', duration: 30 }
];

const ORG_CONFIG = {
    name: 'Tellme',
    subdomain: 'tellme',
    description: 'AI-Powered Healthcare Provider',
    email: 'admin@tellme.com',
    phone: '+1 555 0123 456',
    address: '123 AI Boulevard, Tech City'
};

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

const DOCTORS_CONFIG = [
    // General Medicine
    { firstName: 'Anand', lastName: 'Sharma', department: 'General Medicine', specialization: 'General Physician', qualification: 'MBBS, MD', experience: 12, consultationFee: 400 },
    { firstName: 'Priya', lastName: 'Menon', department: 'General Medicine', specialization: 'Internal Medicine', qualification: 'MBBS, MD', experience: 8, consultationFee: 350 },

    // Cardiology
    { firstName: 'Vikram', lastName: 'Patel', department: 'Cardiology', specialization: 'Interventional Cardiology', qualification: 'MBBS, DM Cardiology', experience: 15, consultationFee: 700 },
    { firstName: 'Meera', lastName: 'Krishnan', department: 'Cardiology', specialization: 'Clinical Cardiology', qualification: 'MBBS, MD, DM', experience: 10, consultationFee: 600 },

    // Orthopedics
    { firstName: 'Rajesh', lastName: 'Kumar', department: 'Orthopedics', specialization: 'Orthopedic Surgery', qualification: 'MBBS, MS Ortho', experience: 14, consultationFee: 500 },
    { firstName: 'Sunita', lastName: 'Reddy', department: 'Orthopedics', specialization: 'Physiotherapy', qualification: 'BPT, MPT', experience: 9, consultationFee: 400 },

    // Pediatrics
    { firstName: 'Lakshmi', lastName: 'Iyer', department: 'Pediatrics', specialization: 'Pediatric Care', qualification: 'MBBS, MD Pediatrics', experience: 16, consultationFee: 450 },
    { firstName: 'Suresh', lastName: 'Nair', department: 'Pediatrics', specialization: 'Neonatology', qualification: 'MBBS, MD, DM', experience: 11, consultationFee: 500 },

    // Neurology
    { firstName: 'Venkatesh', lastName: 'Pillai', department: 'Neurology', specialization: 'Neurologist', qualification: 'MBBS, DM Neurology', experience: 15, consultationFee: 650 },

    // Dermatology
    { firstName: 'Revathi', lastName: 'Shankar', department: 'Dermatology', specialization: 'Clinical Dermatology', qualification: 'MBBS, MD Dermatology', experience: 12, consultationFee: 450 },

    // Ophthalmology
    { firstName: 'Padmini', lastName: 'Srinivasan', department: 'Ophthalmology', specialization: 'Eye Care', qualification: 'MBBS, MS Ophthalmology', experience: 17, consultationFee: 450 },

    // ENT
    { firstName: 'Senthil', lastName: 'Murugan', department: 'ENT', specialization: 'ENT Specialist', qualification: 'MBBS, MS ENT', experience: 14, consultationFee: 400 }
];

const PATIENTS_CONFIG = [
    { firstName: 'John', lastName: 'Doe', email: 'john.doe@gmail.com' },
    { firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@gmail.com' }
];

async function seedTellmeComplete() {
    try {
        console.log('\n🏥 Starting Tellme Organization Complete Seed...\n');

        // Initialize database
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
            console.log('✅ Database connected\n');
        }

        const orgRepo = AppDataSource.getRepository(Organization);
        const userRepo = AppDataSource.getRepository(User);
        const deptRepo = AppDataSource.getRepository(Department);

        // ===== STEP 1: Create Organization =====
        console.log('📌 Type 1: Creating/Finding Organization...');

        let organization = await orgRepo.findOne({ where: { subdomain: ORG_CONFIG.subdomain } });

        if (!organization) {
            const newOrg = orgRepo.create({
                name: ORG_CONFIG.name,
                subdomain: ORG_CONFIG.subdomain,
                description: ORG_CONFIG.description,
                email: ORG_CONFIG.email,
                phone: ORG_CONFIG.phone,
                address: ORG_CONFIG.address,
                isActive: true,
                settings: {
                    branding: { primaryColor: '#E91E63', secondaryColor: '#F06292' }
                }
            } as any);
            organization = await orgRepo.save(newOrg) as any;
            console.log(`   ✅ Created: ${(organization as any).name}`);
        } else {
            console.log(`   ⏭️  Exists: ${(organization as any).name}`);
        }

        const orgId = (organization as any).id;

        // ===== STEP 2: Create Admin =====
        console.log('\n👤 Creating Admin...');
        const adminEmail = `admin@${ORG_CONFIG.subdomain}.com`;
        const defaultPassword = 'Password@123';

        let admin = await userRepo.findOne({ where: { email: adminEmail, organizationId: orgId } });
        if (!admin) {
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);
            admin = userRepo.create({
                email: adminEmail,
                password: hashedPassword,
                firstName: 'Tellme',
                lastName: 'Admin',
                role: 'admin' as any,
                organizationId: orgId,
                isActive: true
            });
            await userRepo.save(admin);
            console.log(`   ✅ Admin created: ${adminEmail}`);
        }

        // ===== STEP 3: Create Departments =====
        console.log('\n🏥 Creating Departments...');
        const createdDepts: Map<string, Department> = new Map();

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
            }
            createdDepts.set(deptConfig.name, dept as Department);
        }

        // ===== STEP 3.5: Create Services =====
        console.log('\n🏥 Creating Services...');
        const serviceRepo = AppDataSource.getRepository(Service);

        for (const svcConfig of SERVICES_CONFIG) {
            const dept = createdDepts.get(svcConfig.department);
            if (dept) {
                let service = await serviceRepo.findOne({
                    where: { name: svcConfig.name, organizationId: orgId }
                });

                if (!service) {
                    const newService = serviceRepo.create({
                        name: svcConfig.name,
                        description: svcConfig.description,
                        organizationId: orgId,
                        departmentId: (dept as any).id,
                        averageDuration: svcConfig.duration,
                        status: 'active'
                    });
                    await serviceRepo.save(newService);
                    console.log(`   ✅ Service: ${svcConfig.name} (${svcConfig.department})`);
                }
            } else {
                console.log(`   ⚠️ Skipped Service: ${svcConfig.name} (Department ${svcConfig.department} not found)`);
            }
        }

        // ===== STEP 4: Create Doctors =====
        console.log('\n👨‍⚕️ Creating Doctors...');

        for (const docConfig of DOCTORS_CONFIG) {
            const email = `dr.${docConfig.firstName.toLowerCase()}@${ORG_CONFIG.subdomain}.com`;
            const dept = createdDepts.get(docConfig.department);

            const existingDoctor = await userRepo.findOne({ where: { email, organizationId: orgId } });
            if (!existingDoctor) {
                const hashedPassword = await bcrypt.hash(defaultPassword, 10);
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
                    availableTo: '17:00',
                    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
                } as any);
                await userRepo.save(newDoctor);
                console.log(`   ✅ Dr. ${docConfig.firstName} ${docConfig.lastName} (${docConfig.department})`);
            }
        }

        // ===== STEP 5: Create Patients =====
        console.log('\n🧑 Creating Patients...');

        for (const patConfig of PATIENTS_CONFIG) {
            const existing = await userRepo.findOne({ where: { email: patConfig.email, organizationId: orgId } });
            if (!existing) {
                const hashedPassword = await bcrypt.hash(defaultPassword, 10);
                const newPatient = userRepo.create({
                    email: patConfig.email,
                    password: hashedPassword,
                    firstName: patConfig.firstName,
                    lastName: patConfig.lastName,
                    role: 'patient' as any,
                    organizationId: orgId,
                    isActive: true,
                    gender: 'male',
                    dateOfBirth: new Date('1990-01-01')
                } as any);
                await userRepo.save(newPatient);
                console.log(`   ✅ Patient: ${patConfig.firstName} ${patConfig.lastName}`);
            }
        }

        console.log('\n═══════════════════════════════════════════════════════════════════════════════');
        console.log('                        🎉 TELLME SETUP COMPLETE 🎉');
        console.log('═══════════════════════════════════════════════════════════════════════════════');
        console.log(`\n🔑 Login Credentials (Password: ${defaultPassword})`);
        console.log(`   Admin:   ${adminEmail}`);
        console.log(`   Patient: ${PATIENTS_CONFIG[0].email}`);
        console.log(`   Doctor:  dr.anand@tellme.com`);
        console.log('\n✅ Departments & Doctors ready for Symptom Checker!');
        console.log('═══════════════════════════════════════════════════════════════════════════════\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Seed failed:', error);
        process.exit(1);
    }
}

seedTellmeComplete();
