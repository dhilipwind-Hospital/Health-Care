/**
 * Seed Script: Dhilip Healthcare Organization
 * 
 * Creates a complete healthcare organization with:
 * - 5 Locations across major Indian cities
 * - Group Admin + Branch Admins
 * - Doctors, Nurses, Receptionists, Pharmacists, Lab Technicians
 * - Departments and Services
 * - Sample patients with appointments
 * - Pharmacy inventory
 * - Lab tests
 * 
 * Usage:
 *   npx ts-node src/scripts/seed-dhilip-healthcare.ts
 */

import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';
import { Location } from '../models/Location';
import { User } from '../models/User';
import { Department } from '../models/Department';
import { Service } from '../models/Service';
import { Appointment, AppointmentStatus } from '../models/Appointment';
import { Medicine } from '../models/pharmacy/Medicine';
import { LabTest } from '../models/LabTest';
import * as bcrypt from 'bcryptjs';

// ===================== CONFIGURATION =====================

const ORG_CONFIG = {
    name: 'Dhilip Healthcare',
    subdomain: 'dhilip',
    description: 'A premium multi-specialty healthcare network providing world-class medical services across India',
    email: 'info@dhiliphealthcare.com',
    phone: '+91 1800 555 1234',
    logo: '🏥',
    settings: {
        theme: 'pink',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        features: {
            telemedicine: true,
            laboratory: true,
            pharmacy: true,
            inpatient: true,
            billing: true
        }
    }
};

const LOCATIONS_CONFIG = [
    {
        name: 'Dhilip Healthcare Chennai - Headquarters',
        code: 'CHN',
        address: '123 Mount Road, Guindy',
        city: 'Chennai',
        state: 'Tamil Nadu',
        phone: '+91 44 4567 8901',
        email: 'chennai@dhiliphealthcare.com',
        isMainBranch: true,
        capacity: { beds: 300, opds: 80, emergencyBeds: 30, icuBeds: 20 }
    },
    {
        name: 'Dhilip Healthcare Coimbatore',
        code: 'CBE',
        address: '456 Race Course Road',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        phone: '+91 422 234 5678',
        email: 'coimbatore@dhiliphealthcare.com',
        isMainBranch: false,
        capacity: { beds: 200, opds: 50, emergencyBeds: 20, icuBeds: 15 }
    },
    {
        name: 'Dhilip Healthcare Madurai',
        code: 'MDU',
        address: '789 Anna Nagar Main Road',
        city: 'Madurai',
        state: 'Tamil Nadu',
        phone: '+91 452 345 6789',
        email: 'madurai@dhiliphealthcare.com',
        isMainBranch: false,
        capacity: { beds: 180, opds: 45, emergencyBeds: 18, icuBeds: 12 }
    },
    {
        name: 'Dhilip Healthcare Trichy',
        code: 'TRY',
        address: '101 Thennur High Road',
        city: 'Tiruchirappalli',
        state: 'Tamil Nadu',
        phone: '+91 431 456 7890',
        email: 'trichy@dhiliphealthcare.com',
        isMainBranch: false,
        capacity: { beds: 150, opds: 40, emergencyBeds: 15, icuBeds: 10 }
    },
    {
        name: 'Dhilip Healthcare Salem',
        code: 'SLM',
        address: '202 Omalur Main Road',
        city: 'Salem',
        state: 'Tamil Nadu',
        phone: '+91 427 567 8901',
        email: 'salem@dhiliphealthcare.com',
        isMainBranch: false,
        capacity: { beds: 120, opds: 35, emergencyBeds: 12, icuBeds: 8 }
    }
];

const DEPARTMENTS_CONFIG = [
    { name: 'General Medicine', description: 'Primary care and internal medicine', icon: '🩺', status: 'active' },
    { name: 'Cardiology', description: 'Heart and cardiovascular care', icon: '❤️', status: 'active' },
    { name: 'Orthopedics', description: 'Bone, joint, and muscle care', icon: '🦴', status: 'active' },
    { name: 'Pediatrics', description: 'Child healthcare services', icon: '👶', status: 'active' },
    { name: 'Gynecology & Obstetrics', description: "Women's health and maternity", icon: '🤰', status: 'active' },
    { name: 'Neurology', description: 'Brain and nervous system care', icon: '🧠', status: 'active' },
    { name: 'Dermatology', description: 'Skin care and treatments', icon: '🧴', status: 'active' },
    { name: 'Ophthalmology', description: 'Eye care services', icon: '👁️', status: 'active' },
    { name: 'ENT', description: 'Ear, Nose, and Throat care', icon: '👂', status: 'active' },
    { name: 'Dental', description: 'Oral health and dental care', icon: '🦷', status: 'active' },
    { name: 'Emergency Medicine', description: '24/7 emergency care', icon: '🚑', status: 'active' },
    { name: 'Radiology', description: 'Diagnostic imaging services', icon: '📷', status: 'active' }
];

const SERVICES_CONFIG = [
    { name: 'General Consultation', price: 500, duration: 20 },
    { name: 'Specialist Consultation', price: 800, duration: 30 },
    { name: 'Emergency Consultation', price: 1500, duration: 45 },
    { name: 'Follow-up Visit', price: 300, duration: 15 },
    { name: 'Health Checkup - Basic', price: 2500, duration: 120 },
    { name: 'Health Checkup - Premium', price: 5000, duration: 180 },
    { name: 'ECG', price: 400, duration: 15 },
    { name: 'X-Ray', price: 600, duration: 20 },
    { name: 'Ultrasound', price: 1200, duration: 30 },
    { name: 'CT Scan', price: 4500, duration: 45 },
    { name: 'MRI Scan', price: 8000, duration: 60 },
    { name: 'Blood Test Panel', price: 800, duration: 10 },
    { name: 'Vaccination', price: 500, duration: 15 },
    { name: 'Physiotherapy Session', price: 600, duration: 45 },
    { name: 'Minor Surgery', price: 5000, duration: 60 }
];

const STAFF_CONFIG = {
    groupAdmin: { password: 'DhilipAdmin@2025' },
    branchAdmin: { password: 'BranchAdmin@2025' },
    doctors: { countPerDept: 2, password: 'Doctor@2025' },
    nurses: { count: 15, password: 'Nurse@2025' },
    receptionists: { count: 5, password: 'Reception@2025' },
    pharmacists: { count: 3, password: 'Pharma@2025' },
    labTechnicians: { count: 4, password: 'Lab@2025' }
};

const MEDICINES_CONFIG = [
    { name: 'Paracetamol 500mg', genericName: 'Acetaminophen', category: 'Pain Relief', unitPrice: 2.5, stock: 1000, reorderLevel: 200 },
    { name: 'Amoxicillin 500mg', genericName: 'Amoxicillin', category: 'Antibiotic', unitPrice: 12.0, stock: 500, reorderLevel: 100 },
    { name: 'Omeprazole 20mg', genericName: 'Omeprazole', category: 'Gastric', unitPrice: 8.0, stock: 600, reorderLevel: 120 },
    { name: 'Metformin 500mg', genericName: 'Metformin', category: 'Diabetes', unitPrice: 5.0, stock: 800, reorderLevel: 150 },
    { name: 'Amlodipine 5mg', genericName: 'Amlodipine', category: 'Cardiac', unitPrice: 6.0, stock: 500, reorderLevel: 100 },
    { name: 'Cetirizine 10mg', genericName: 'Cetirizine', category: 'Allergy', unitPrice: 3.0, stock: 700, reorderLevel: 140 },
    { name: 'Azithromycin 500mg', genericName: 'Azithromycin', category: 'Antibiotic', unitPrice: 20.0, stock: 300, reorderLevel: 60 },
    { name: 'Atorvastatin 10mg', genericName: 'Atorvastatin', category: 'Cardiac', unitPrice: 8.0, stock: 400, reorderLevel: 80 },
    { name: 'Vitamin D3 1000IU', genericName: 'Cholecalciferol', category: 'Supplement', unitPrice: 4.0, stock: 1000, reorderLevel: 200 },
    { name: 'Pantoprazole 40mg', genericName: 'Pantoprazole', category: 'Gastric', unitPrice: 10.0, stock: 500, reorderLevel: 100 },
    { name: 'Dolo 650', genericName: 'Paracetamol', category: 'Pain Relief', unitPrice: 3.0, stock: 1500, reorderLevel: 300 },
    { name: 'Crocin Advance', genericName: 'Paracetamol', category: 'Pain Relief', unitPrice: 4.0, stock: 1200, reorderLevel: 250 }
];

const LAB_TESTS_CONFIG = [
    { name: 'Complete Blood Count (CBC)', code: 'HEM001', category: 'hematology', price: 350, turnaroundTime: 4 },
    { name: 'Blood Glucose Fasting', code: 'BIO001', category: 'biochemistry', price: 120, turnaroundTime: 2 },
    { name: 'Blood Glucose PP', code: 'BIO002', category: 'biochemistry', price: 120, turnaroundTime: 2 },
    { name: 'HbA1c', code: 'BIO003', category: 'biochemistry', price: 500, turnaroundTime: 6 },
    { name: 'Lipid Profile', code: 'BIO004', category: 'biochemistry', price: 700, turnaroundTime: 4 },
    { name: 'Liver Function Test (LFT)', code: 'BIO005', category: 'biochemistry', price: 900, turnaroundTime: 6 },
    { name: 'Kidney Function Test (KFT)', code: 'BIO006', category: 'biochemistry', price: 800, turnaroundTime: 6 },
    { name: 'Thyroid Profile (T3, T4, TSH)', code: 'HOR001', category: 'endocrine', price: 1000, turnaroundTime: 8 },
    { name: 'Urine Routine', code: 'URI001', category: 'microbiology', price: 200, turnaroundTime: 2 },
    { name: 'Stool Routine', code: 'MIC001', category: 'microbiology', price: 250, turnaroundTime: 4 },
    { name: 'Vitamin D', code: 'BIO007', category: 'biochemistry', price: 1200, turnaroundTime: 8 },
    { name: 'Vitamin B12', code: 'BIO008', category: 'biochemistry', price: 800, turnaroundTime: 8 },
    { name: 'Iron Profile', code: 'BIO009', category: 'biochemistry', price: 600, turnaroundTime: 6 },
    { name: 'Dengue NS1 Antigen', code: 'SER001', category: 'serology', price: 800, turnaroundTime: 4 },
    { name: 'COVID-19 RT-PCR', code: 'MOL001', category: 'molecular', price: 500, turnaroundTime: 24 }
];

// ===================== SEED FUNCTION =====================

async function seedDhilipHealthcare() {
    try {
        console.log('\n');
        console.log('═══════════════════════════════════════════════════════════════════════');
        console.log('                    🏥 DHILIP HEALTHCARE SEED SCRIPT                   ');
        console.log('═══════════════════════════════════════════════════════════════════════');
        console.log(`\n📌 Organization: ${ORG_CONFIG.name}`);
        console.log(`   Subdomain: ${ORG_CONFIG.subdomain}`);
        console.log(`   Locations: ${LOCATIONS_CONFIG.length}`);
        console.log('═══════════════════════════════════════════════════════════════════════\n');

        // Initialize database
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
        console.log('✅ Database connected\n');

        const orgRepo = AppDataSource.getRepository(Organization);
        const locationRepo = AppDataSource.getRepository(Location);
        const userRepo = AppDataSource.getRepository(User);
        const deptRepo = AppDataSource.getRepository(Department);
        const serviceRepo = AppDataSource.getRepository(Service);
        const appointmentRepo = AppDataSource.getRepository(Appointment);
        const medicineRepo = AppDataSource.getRepository(Medicine);
        const labTestRepo = AppDataSource.getRepository(LabTest);

        // ===== STEP 1: Create Organization =====
        console.log('🏢 Creating Organization...');
        let organization = await orgRepo.findOne({ where: { subdomain: ORG_CONFIG.subdomain } });

        if (organization) {
            console.log(`  ⏭️  Organization exists: ${organization.name}`);
        } else {
            organization = orgRepo.create({
                name: ORG_CONFIG.name,
                subdomain: ORG_CONFIG.subdomain,
                email: ORG_CONFIG.email,
                phone: ORG_CONFIG.phone,
                description: ORG_CONFIG.description,
                settings: ORG_CONFIG.settings as any,
                isActive: true
            });
            await orgRepo.save(organization);
            console.log(`  ✅ Created: ${ORG_CONFIG.name}`);
        }
        const orgId = organization.id;

        // ===== STEP 2: Create Locations =====
        console.log('\n📍 Creating Locations...');
        const createdLocations: Location[] = [];

        for (const locConfig of LOCATIONS_CONFIG) {
            let location = await locationRepo.findOne({
                where: { code: locConfig.code, organizationId: orgId }
            });

            if (!location) {
                location = locationRepo.create({
                    name: locConfig.name,
                    code: locConfig.code,
                    address: locConfig.address,
                    city: locConfig.city,
                    state: locConfig.state,
                    phone: locConfig.phone,
                    email: locConfig.email,
                    isMainBranch: locConfig.isMainBranch,
                    settings: locConfig.capacity as any,
                    organizationId: orgId,
                    isActive: true
                });
                await locationRepo.save(location);
                console.log(`  ✅ Created: ${locConfig.name} (${locConfig.code})`);
            } else {
                console.log(`  ⏭️  Location exists: ${locConfig.name}`);
            }
            createdLocations.push(location);
        }

        // ===== STEP 3: Create Departments =====
        console.log('\n🏥 Creating Departments...');
        const createdDepts: Department[] = [];

        for (const deptConfig of DEPARTMENTS_CONFIG) {
            let dept = await deptRepo.findOne({
                where: { name: deptConfig.name, organizationId: orgId }
            });

            if (!dept) {
                dept = deptRepo.create({
                    name: deptConfig.name,
                    description: deptConfig.description,
                    status: deptConfig.status as any,
                    organizationId: orgId
                });
                await deptRepo.save(dept);
            }
            createdDepts.push(dept);
        }
        console.log(`  ✅ Created ${createdDepts.length} departments`);

        // ===== STEP 4: Create Services =====
        console.log('\n💼 Creating Services...');
        let serviceCount = 0;

        for (const dept of createdDepts) {
            for (const svcConfig of SERVICES_CONFIG.slice(0, 5)) { // 5 services per dept
                const existing = await serviceRepo.findOne({
                    where: { name: `${svcConfig.name} - ${dept.name}`, organizationId: orgId }
                });
                if (!existing) {
                    const service = serviceRepo.create({
                        name: `${svcConfig.name}`,
                        description: `${svcConfig.name} in ${dept.name}`,
                        averageDuration: svcConfig.duration,
                        department: dept,
                        departmentId: (dept as any).id,
                        organizationId: orgId,
                        status: 'active'
                    } as any);
                    await serviceRepo.save(service);
                    serviceCount++;
                }
            }
        }
        console.log(`  ✅ Created ${serviceCount} services`);

        // ===== STEP 5: Create Group Admin =====
        console.log('\n👑 Creating Group Admin...');
        const groupAdminEmail = `admin@${ORG_CONFIG.subdomain}.com`;
        let groupAdmin = await userRepo.findOne({ where: { email: groupAdminEmail } });

        if (!groupAdmin) {
            const hashedPassword = await bcrypt.hash(STAFF_CONFIG.groupAdmin.password, 10);
            groupAdmin = userRepo.create({
                email: groupAdminEmail,
                password: hashedPassword,
                firstName: 'Dhilip',
                lastName: 'Admin',
                phone: '+91 98765 00001',
                role: 'admin' as any,
                organizationId: orgId,
                locationId: null, // Group admin has access to all locations
                isActive: true
            });
            await userRepo.save(groupAdmin);
            console.log(`  ✅ Group Admin: ${groupAdminEmail} / ${STAFF_CONFIG.groupAdmin.password}`);
        } else {
            console.log(`  ⏭️  Group Admin exists: ${groupAdminEmail}`);
        }

        // ===== STEP 6: Create Branch Admins =====
        console.log('\n🏥 Creating Branch Admins...');
        for (const location of createdLocations) {
            const branchAdminEmail = `admin.${location.code.toLowerCase()}@${ORG_CONFIG.subdomain}.com`;
            let branchAdmin = await userRepo.findOne({ where: { email: branchAdminEmail, organizationId: orgId } });

            if (!branchAdmin) {
                const hashedPassword = await bcrypt.hash(STAFF_CONFIG.branchAdmin.password, 10);
                branchAdmin = userRepo.create({
                    email: branchAdminEmail,
                    password: hashedPassword,
                    firstName: `${location.city}`,
                    lastName: 'Admin',
                    phone: location.phone,
                    role: 'admin' as any,
                    organizationId: orgId,
                    locationId: location.id,
                    isActive: true
                });
                await userRepo.save(branchAdmin);
                console.log(`  ✅ ${location.city} Admin: ${branchAdminEmail}`);
            }
        }

        // ===== STEP 7: Create Doctors =====
        console.log('\n👨‍⚕️ Creating Doctors...');
        const doctorNames = [
            { first: 'Arun', last: 'Kumar' }, { first: 'Priya', last: 'Sharma' },
            { first: 'Rajesh', last: 'Iyer' }, { first: 'Sunita', last: 'Nair' },
            { first: 'Vikram', last: 'Menon' }, { first: 'Anjali', last: 'Pillai' },
            { first: 'Karthik', last: 'Rao' }, { first: 'Deepa', last: 'Reddy' },
            { first: 'Suresh', last: 'Naidu' }, { first: 'Lakshmi', last: 'Devi' },
            { first: 'Ramesh', last: 'Varma' }, { first: 'Meera', last: 'Krishnan' },
            { first: 'Ganesh', last: 'Subramanian' }, { first: 'Divya', last: 'Rajan' },
            { first: 'Sanjay', last: 'Gupta' }, { first: 'Kavitha', last: 'Murthy' },
            { first: 'Mohan', last: 'Das' }, { first: 'Shanti', last: 'Bai' },
            { first: 'Prakash', last: 'Chand' }, { first: 'Revathi', last: 'Suresh' },
            { first: 'Venkat', last: 'Raman' }, { first: 'Geetha', last: 'Lakshmi' },
            { first: 'Harish', last: 'Kumar' }, { first: 'Padma', last: 'Priya' }
        ];

        const createdDoctors: User[] = [];
        let doctorIdx = 0;

        for (const dept of createdDepts) {
            for (let i = 0; i < STAFF_CONFIG.doctors.countPerDept; i++) {
                const { first, last } = doctorNames[doctorIdx % doctorNames.length];
                const email = `dr.${first.toLowerCase()}.${last.toLowerCase()}@${ORG_CONFIG.subdomain}.com`;
                const location = createdLocations[doctorIdx % createdLocations.length];

                let doctor = await userRepo.findOne({ where: { email, organizationId: orgId } });
                if (!doctor) {
                    const hashedPassword = await bcrypt.hash(STAFF_CONFIG.doctors.password, 10);
                    doctor = userRepo.create({
                        email,
                        password: hashedPassword,
                        firstName: `Dr. ${first}`,
                        lastName: last,
                        phone: `+91 98765 ${String(10000 + doctorIdx).slice(-5)}`,
                        role: 'doctor' as any,
                        organizationId: orgId,
                        departmentId: (dept as any).id,
                        locationId: location.id,
                        isActive: true,
                        preferences: { specialization: dept.name }
                    });
                    await userRepo.save(doctor);
                    createdDoctors.push(doctor);
                }
                doctorIdx++;
            }
        }
        console.log(`  ✅ Created ${createdDoctors.length} doctors`);

        // ===== STEP 8: Create Nurses =====
        console.log('\n👩‍⚕️ Creating Nurses...');
        const nurseNames = ['Radha', 'Geetha', 'Saroja', 'Kamala', 'Vimala', 'Padma', 'Lalitha', 'Uma', 'Vasanthi', 'Jayanthi', 'Selvi', 'Malar', 'Thangam', 'Lakshmi', 'Saraswathi'];

        for (let i = 0; i < STAFF_CONFIG.nurses.count; i++) {
            const firstName = nurseNames[i % nurseNames.length];
            const email = `nurse.${firstName.toLowerCase()}${i + 1}@${ORG_CONFIG.subdomain}.com`;
            const location = createdLocations[i % createdLocations.length];

            const existing = await userRepo.findOne({ where: { email, organizationId: orgId } });
            if (!existing) {
                const hashedPassword = await bcrypt.hash(STAFF_CONFIG.nurses.password, 10);
                await userRepo.save(userRepo.create({
                    email, password: hashedPassword, firstName, lastName: 'Nurse',
                    phone: `+91 87654 ${String(20000 + i).slice(-5)}`, role: 'nurse' as any,
                    organizationId: orgId, locationId: location.id, isActive: true
                }));
            }
        }
        console.log(`  ✅ Created ${STAFF_CONFIG.nurses.count} nurses`);

        // ===== STEP 9: Create Receptionists =====
        console.log('\n📞 Creating Receptionists...');
        for (let i = 0; i < STAFF_CONFIG.receptionists.count; i++) {
            const email = `reception${i + 1}@${ORG_CONFIG.subdomain}.com`;
            const location = createdLocations[i % createdLocations.length];

            const existing = await userRepo.findOne({ where: { email, organizationId: orgId } });
            if (!existing) {
                const hashedPassword = await bcrypt.hash(STAFF_CONFIG.receptionists.password, 10);
                await userRepo.save(userRepo.create({
                    email, password: hashedPassword, firstName: `Reception`, lastName: `${i + 1}`,
                    phone: `+91 76543 ${String(30000 + i).slice(-5)}`, role: 'receptionist' as any,
                    organizationId: orgId, locationId: location.id, isActive: true
                }));
            }
        }
        console.log(`  ✅ Created ${STAFF_CONFIG.receptionists.count} receptionists`);

        // ===== STEP 10: Create Pharmacists =====
        console.log('\n💊 Creating Pharmacists...');
        for (let i = 0; i < STAFF_CONFIG.pharmacists.count; i++) {
            const email = `pharmacist${i + 1}@${ORG_CONFIG.subdomain}.com`;
            const location = createdLocations[i % createdLocations.length];

            const existing = await userRepo.findOne({ where: { email, organizationId: orgId } });
            if (!existing) {
                const hashedPassword = await bcrypt.hash(STAFF_CONFIG.pharmacists.password, 10);
                await userRepo.save(userRepo.create({
                    email, password: hashedPassword, firstName: `Pharmacist`, lastName: `${i + 1}`,
                    phone: `+91 65432 ${String(40000 + i).slice(-5)}`, role: 'pharmacist' as any,
                    organizationId: orgId, locationId: location.id, isActive: true
                }));
            }
        }
        console.log(`  ✅ Created ${STAFF_CONFIG.pharmacists.count} pharmacists`);

        // ===== STEP 11: Create Lab Technicians =====
        console.log('\n🧪 Creating Lab Technicians...');
        for (let i = 0; i < STAFF_CONFIG.labTechnicians.count; i++) {
            const email = `lab${i + 1}@${ORG_CONFIG.subdomain}.com`;
            const location = createdLocations[i % createdLocations.length];

            const existing = await userRepo.findOne({ where: { email, organizationId: orgId } });
            if (!existing) {
                const hashedPassword = await bcrypt.hash(STAFF_CONFIG.labTechnicians.password, 10);
                await userRepo.save(userRepo.create({
                    email, password: hashedPassword, firstName: `Lab Tech`, lastName: `${i + 1}`,
                    phone: `+91 54321 ${String(50000 + i).slice(-5)}`, role: 'lab_technician' as any,
                    organizationId: orgId, locationId: location.id, isActive: true
                }));
            }
        }
        console.log(`  ✅ Created ${STAFF_CONFIG.labTechnicians.count} lab technicians`);

        // ===== STEP 12: Create Patients =====
        console.log('\n🧑 Creating Sample Patients...');
        const patientNames = [
            { first: 'Ravi', last: 'Kumar' }, { first: 'Sita', last: 'Devi' },
            { first: 'Krishna', last: 'Murthy' }, { first: 'Radha', last: 'Krishnan' },
            { first: 'Arjun', last: 'Singh' }, { first: 'Priya', last: 'Lakshmi' },
            { first: 'Venkat', last: 'Rao' }, { first: 'Lakshmi', last: 'Narayanan' },
            { first: 'Surya', last: 'Prakash' }, { first: 'Kavitha', last: 'Sundaram' },
            { first: 'Anil', last: 'Kumar' }, { first: 'Sunitha', last: 'Reddy' },
            { first: 'Mahesh', last: 'Babu' }, { first: 'Geetha', last: 'Ramani' },
            { first: 'Ram', last: 'Prasad' }, { first: 'Anu', last: 'Priya' },
            { first: 'Kiran', last: 'Kumar' }, { first: 'Padma', last: 'Sri' },
            { first: 'Vijay', last: 'Kumar' }, { first: 'Uma', last: 'Maheswari' },
            { first: 'Srinivas', last: 'Rao' }, { first: 'Jaya', last: 'Lakshmi' },
            { first: 'Naresh', last: 'Kumar' }, { first: 'Saranya', last: 'Devi' },
            { first: 'Dinesh', last: 'Babu' }, { first: 'Bhavani', last: 'Shankar' },
            { first: 'Suresh', last: 'Babu' }, { first: 'Meenakshi', last: 'Sundar' },
            { first: 'Ramesh', last: 'Babu' }, { first: 'Vasantha', last: 'Kumari' }
        ];
        const createdPatients: User[] = [];
        const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

        for (let i = 0; i < 30; i++) {
            const { first, last } = patientNames[i % patientNames.length];
            const email = `patient.${first.toLowerCase()}${i + 1}@gmail.com`;
            const location = createdLocations[i % createdLocations.length];

            const existingPatient = await userRepo.findOne({ where: { email, organizationId: orgId } });
            if (!existingPatient) {
                const hashedPassword = await bcrypt.hash('Patient@2025', 10);
                const newPatient = userRepo.create({
                    email,
                    password: hashedPassword,
                    firstName: first,
                    lastName: last,
                    phone: `+91 9${String(876543210 + i).slice(0, 9)}`,
                    role: 'patient' as any,
                    organizationId: orgId,
                    locationId: location.id,
                    isActive: true,
                    dateOfBirth: new Date(1970 + (i % 50), i % 12, (i % 28) + 1),
                    gender: i % 2 === 0 ? 'male' : 'female',
                    address: `${100 + i}, ${location.city} Main Road`,
                    city: location.city,
                    state: location.state,
                    bloodGroup: bloodGroups[i % 8]
                } as any) as unknown as User;
                await userRepo.save(newPatient);
                createdPatients.push(newPatient);
            }
        }
        console.log(`  ✅ Created ${createdPatients.length} patients`);

        // ===== STEP 13: Create Appointments =====
        console.log('\n📅 Creating Sample Appointments...');
        const allServices = await serviceRepo.find({ where: { organizationId: orgId } });
        let appointmentCount = 0;

        if (createdPatients.length > 0 && createdDoctors.length > 0 && allServices.length > 0) {
            for (let i = 0; i < 50; i++) {
                const patient = createdPatients[i % createdPatients.length];
                const doctor = createdDoctors[i % createdDoctors.length];
                const service = allServices[i % allServices.length];

                const startDate = new Date();
                startDate.setDate(startDate.getDate() + (i % 21) - 10); // Past 10 days to next 10 days
                startDate.setHours(9 + (i % 9), (i % 2) * 30, 0, 0);

                const endDate = new Date(startDate);
                endDate.setMinutes(endDate.getMinutes() + 30);

                const statuses = [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING, AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED];
                const status = i < 15 ? AppointmentStatus.COMPLETED : statuses[i % 4];

                const appointment = appointmentRepo.create({
                    patient,
                    doctor,
                    service,
                    startTime: startDate,
                    endTime: endDate,
                    status,
                    reason: `${service.name} consultation`,
                    notes: `Appointment for ${(patient as any).firstName} ${(patient as any).lastName}`,
                    organizationId: orgId
                } as any);
                await appointmentRepo.save(appointment);
                appointmentCount++;
            }
        }
        console.log(`  ✅ Created ${appointmentCount} appointments`);

        // ===== STEP 14: Create Medicines =====
        console.log('\n💊 Creating Pharmacy Inventory...');
        let medicineCount = 0;
        for (const medConfig of MEDICINES_CONFIG) {
            try {
                const existing = await medicineRepo.findOne({
                    where: { name: medConfig.name, organizationId: orgId }
                });
                if (!existing) {
                    const medicine = medicineRepo.create({
                        name: medConfig.name,
                        brandName: medConfig.name,
                        genericName: medConfig.genericName,
                        category: medConfig.category,
                        dosageForm: 'Tablet',
                        strength: '500mg',
                        unitPrice: medConfig.unitPrice,
                        sellingPrice: medConfig.unitPrice * 1.25,
                        currentStock: medConfig.stock,
                        reorderLevel: medConfig.reorderLevel,
                        manufacturer: 'Dhilip Pharma',
                        batchNumber: `BATCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                        manufactureDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
                        expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)),
                        organizationId: orgId,
                        isActive: true
                    } as any);
                    await medicineRepo.save(medicine);
                    medicineCount++;
                }
            } catch (err) {
                console.log(`  ⚠️  Skipped medicine ${medConfig.name}: ${(err as any).message?.substring(0, 50)}`);
            }
        }
        console.log(`  ✅ Created ${medicineCount} medicines`);

        // ===== STEP 15: Create Lab Tests =====
        console.log('\n🧪 Creating Lab Test Catalog...');
        let labTestCount = 0;
        for (const testConfig of LAB_TESTS_CONFIG) {
            try {
                const existing = await labTestRepo.findOne({
                    where: { code: testConfig.code, organizationId: orgId }
                });
                if (!existing) {
                    const labTest = labTestRepo.create({
                        name: testConfig.name,
                        code: testConfig.code,
                        description: testConfig.name,
                        category: testConfig.category,
                        cost: testConfig.price,
                        turnaroundTimeMinutes: testConfig.turnaroundTime,
                        organizationId: orgId,
                        isActive: true
                    } as any);
                    await labTestRepo.save(labTest);
                    labTestCount++;
                }
            } catch (err) {
                console.log(`  ⚠️  Skipped lab test ${testConfig.name}: ${(err as any).message?.substring(0, 50)}`);
            }
        }
        console.log(`  ✅ Created ${labTestCount} lab tests`);

        // ===== SUMMARY =====
        console.log('\n');
        console.log('═══════════════════════════════════════════════════════════════════════');
        console.log('                        🎉 SEED COMPLETE 🎉                            ');
        console.log('═══════════════════════════════════════════════════════════════════════');
        console.log(`\n📌 Organization: ${ORG_CONFIG.name}`);
        console.log(`   Subdomain: ${ORG_CONFIG.subdomain}`);
        console.log(`\n📍 Locations (${LOCATIONS_CONFIG.length}):`);
        LOCATIONS_CONFIG.forEach(loc => console.log(`   • ${loc.name} (${loc.code}) - ${loc.city}`));
        console.log(`\n🏥 Departments: ${DEPARTMENTS_CONFIG.length}`);
        console.log(`📋 Services: ${serviceCount}`);
        console.log(`👨‍⚕️ Doctors: ${createdDoctors.length}`);
        console.log(`👩‍⚕️ Nurses: ${STAFF_CONFIG.nurses.count}`);
        console.log(`📞 Receptionists: ${STAFF_CONFIG.receptionists.count}`);
        console.log(`💊 Pharmacists: ${STAFF_CONFIG.pharmacists.count}`);
        console.log(`🧪 Lab Technicians: ${STAFF_CONFIG.labTechnicians.count}`);
        console.log(`🧑 Patients: ${createdPatients.length}`);
        console.log(`📅 Appointments: ${appointmentCount}`);
        console.log(`💊 Medicines: ${medicineCount}`);
        console.log(`🧪 Lab Tests: ${labTestCount}`);

        console.log('\n');
        console.log('═══════════════════════════════════════════════════════════════════════');
        console.log('                         🔑 LOGIN CREDENTIALS                          ');
        console.log('═══════════════════════════════════════════════════════════════════════');
        console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
        console.log('│ 👑 GROUP ADMIN (All Locations Access)                               │');
        console.log('├─────────────────────────────────────────────────────────────────────┤');
        console.log(`│ Email:    ${groupAdminEmail.padEnd(54)}│`);
        console.log(`│ Password: ${STAFF_CONFIG.groupAdmin.password.padEnd(54)}│`);
        console.log('└─────────────────────────────────────────────────────────────────────┘');

        console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
        console.log('│ 🏥 BRANCH ADMINS                                                    │');
        console.log('├─────────────────────────────────────────────────────────────────────┤');
        for (const location of createdLocations) {
            const email = `admin.${location.code.toLowerCase()}@${ORG_CONFIG.subdomain}.com`;
            console.log(`│ ${(location.city || 'N/A').padEnd(12)} │ ${email.padEnd(38)} │`);
        }
        console.log(`│ Password: ${STAFF_CONFIG.branchAdmin.password.padEnd(54)}│`);
        console.log('└─────────────────────────────────────────────────────────────────────┘');

        console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
        console.log('│ 👨‍⚕️ STAFF LOGINS                                                    │');
        console.log('├─────────────────────────────────────────────────────────────────────┤');
        console.log(`│ Doctor:      dr.[first].[last]@dhilip.com    / ${STAFF_CONFIG.doctors.password.padEnd(15)}│`);
        console.log(`│ Nurse:       nurse.[name]N@dhilip.com        / ${STAFF_CONFIG.nurses.password.padEnd(15)}│`);
        console.log(`│ Receptionist: receptionN@dhilip.com          / ${STAFF_CONFIG.receptionists.password.padEnd(15)}│`);
        console.log(`│ Pharmacist:  pharmacistN@dhilip.com          / ${STAFF_CONFIG.pharmacists.password.padEnd(15)}│`);
        console.log(`│ Lab Tech:    labN@dhilip.com                 / ${STAFF_CONFIG.labTechnicians.password.padEnd(15)}│`);
        console.log('└─────────────────────────────────────────────────────────────────────┘');

        console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
        console.log('│ 🧑 SAMPLE PATIENT                                                   │');
        console.log('├─────────────────────────────────────────────────────────────────────┤');
        console.log(`│ Email:    patient.ravi1@gmail.com                                   │`);
        console.log(`│ Password: Patient@2025                                              │`);
        console.log('└─────────────────────────────────────────────────────────────────────┘');
        console.log('\n═══════════════════════════════════════════════════════════════════════\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
}

seedDhilipHealthcare();
