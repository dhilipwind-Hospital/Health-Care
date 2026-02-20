/**
 * Seed Script: Complete Organization with Locations and All Data
 * 
 * Creates a new organization with:
 * - Multiple locations/branches
 * - Admin, Doctors, Nurses, Receptionists, Pharmacists, Lab Technicians
 * - Departments and Services
 * - Sample patients with appointments
 * - Pharmacy inventory
 * - Lab tests
 * 
 * Usage:
 *   npx ts-node src/scripts/seed-organization-complete.ts
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

// Configuration
const ORG_CONFIG = {
    name: 'Care Health Network',
    subdomain: 'carehealth',
    description: 'A premier multi-location healthcare network providing comprehensive medical services across India',
    email: 'info@carehealth.com',
    phone: '+91 1800 123 4567'
};

const LOCATIONS_CONFIG = [
    {
        name: 'Care Health Chennai - Main Hospital',
        code: 'CHN',
        address: '45 Anna Salai, T. Nagar',
        city: 'Chennai',
        state: 'Tamil Nadu',
        phone: '+91 44 2834 5678',
        email: 'chennai@carehealth.com',
        isMainBranch: true,
        capacity: { beds: 250, opds: 60, emergencyBeds: 25 }
    },
    {
        name: 'Care Health Delhi',
        code: 'DEL',
        address: '12 Rajpath, Central Delhi',
        city: 'New Delhi',
        state: 'Delhi',
        phone: '+91 11 2345 6789',
        email: 'delhi@carehealth.com',
        isMainBranch: false,
        capacity: { beds: 180, opds: 45, emergencyBeds: 18 }
    },
    {
        name: 'Care Health Mumbai',
        code: 'MUM',
        address: '78 Worli Sea Face',
        city: 'Mumbai',
        state: 'Maharashtra',
        phone: '+91 22 6789 0123',
        email: 'mumbai@carehealth.com',
        isMainBranch: false,
        capacity: { beds: 200, opds: 50, emergencyBeds: 20 }
    },
    {
        name: 'Care Health Bangalore',
        code: 'BLR',
        address: '33 MG Road, Indiranagar',
        city: 'Bangalore',
        state: 'Karnataka',
        phone: '+91 80 4567 8901',
        email: 'bangalore@carehealth.com',
        isMainBranch: false,
        capacity: { beds: 150, opds: 40, emergencyBeds: 15 }
    },
    {
        name: 'Care Health Hyderabad',
        code: 'HYD',
        address: '99 Banjara Hills Road',
        city: 'Hyderabad',
        state: 'Telangana',
        phone: '+91 40 8901 2345',
        email: 'hyderabad@carehealth.com',
        isMainBranch: false,
        capacity: { beds: 120, opds: 35, emergencyBeds: 12 }
    }
];

const DEPARTMENTS_CONFIG = [
    { name: 'General Medicine', description: 'Primary care and internal medicine', status: 'active' },
    { name: 'Cardiology', description: 'Heart and cardiovascular care', status: 'active' },
    { name: 'Orthopedics', description: 'Bone, joint, and muscle care', status: 'active' },
    { name: 'Pediatrics', description: 'Child healthcare services', status: 'active' },
    { name: 'Gynecology', description: "Women's health services", status: 'active' },
    { name: 'Neurology', description: 'Brain and nervous system care', status: 'active' },
    { name: 'Dermatology', description: 'Skin care and treatment', status: 'active' },
    { name: 'Ophthalmology', description: 'Eye care and vision services', status: 'active' },
    { name: 'ENT', description: 'Ear, Nose, and Throat care', status: 'active' },
    { name: 'Emergency', description: '24/7 Emergency services', status: 'active' }
];

const SERVICES_BY_DEPT: Record<string, string[]> = {
    'General Medicine': ['General Consultation', 'Health Checkup', 'Vaccination', 'Chronic Disease Management'],
    'Cardiology': ['ECG', 'Echocardiography', 'Cardiac Consultation', 'Stress Test'],
    'Orthopedics': ['Orthopedic Consultation', 'X-Ray Review', 'Physiotherapy', 'Joint Injection'],
    'Pediatrics': ['Child Consultation', 'Immunization', 'Growth Assessment', 'Newborn Care'],
    'Gynecology': ['Gynec Consultation', 'Prenatal Care', 'Ultrasound', 'Fertility Counseling'],
    'Neurology': ['Neuro Consultation', 'EEG', 'Migraine Treatment', 'Stroke Care'],
    'Dermatology': ['Skin Consultation', 'Acne Treatment', 'Laser Therapy', 'Skin Biopsy'],
    'Ophthalmology': ['Eye Exam', 'Cataract Surgery', 'Glaucoma Test', 'Vision Correction'],
    'ENT': ['ENT Consultation', 'Hearing Test', 'Sinus Treatment', 'Tonsillectomy'],
    'Emergency': ['Emergency Care', 'Trauma Care', 'Critical Care', 'Ambulance Service']
};

const STAFF_CONFIG = {
    admin: { count: 1, password: 'Admin@123' },
    doctors: { countPerDept: 2, password: 'Doctor@123' },
    nurses: { count: 10, password: 'Nurse@123' },
    receptionists: { count: 3, password: 'Reception@123' },
    pharmacists: { count: 2, password: 'Pharma@123' },
    labTechnicians: { count: 2, password: 'Lab@123' }
};

const MEDICINES_CONFIG = [
    { name: 'Paracetamol 500mg', genericName: 'Acetaminophen', category: 'Pain Relief', unitPrice: 2.5, stock: 500, reorderLevel: 100 },
    { name: 'Amoxicillin 250mg', genericName: 'Amoxicillin', category: 'Antibiotic', unitPrice: 8.0, stock: 200, reorderLevel: 50 },
    { name: 'Omeprazole 20mg', genericName: 'Omeprazole', category: 'Gastric', unitPrice: 5.5, stock: 300, reorderLevel: 75 },
    { name: 'Metformin 500mg', genericName: 'Metformin', category: 'Diabetes', unitPrice: 3.0, stock: 400, reorderLevel: 100 },
    { name: 'Amlodipine 5mg', genericName: 'Amlodipine', category: 'Cardiac', unitPrice: 4.5, stock: 250, reorderLevel: 60 },
    { name: 'Cetirizine 10mg', genericName: 'Cetirizine', category: 'Allergy', unitPrice: 2.0, stock: 350, reorderLevel: 80 },
    { name: 'Azithromycin 500mg', genericName: 'Azithromycin', category: 'Antibiotic', unitPrice: 15.0, stock: 150, reorderLevel: 40 },
    { name: 'Losartan 50mg', genericName: 'Losartan', category: 'Cardiac', unitPrice: 6.0, stock: 200, reorderLevel: 50 },
    { name: 'Pantoprazole 40mg', genericName: 'Pantoprazole', category: 'Gastric', unitPrice: 7.0, stock: 280, reorderLevel: 70 },
    { name: 'Ibuprofen 400mg', genericName: 'Ibuprofen', category: 'Pain Relief', unitPrice: 3.5, stock: 450, reorderLevel: 100 }
];

const LAB_TESTS_CONFIG = [
    { name: 'Complete Blood Count (CBC)', code: 'CBC001', category: 'hematology', price: 350, turnaroundTime: 4 },
    { name: 'Blood Glucose Fasting', code: 'BIO001', category: 'biochemistry', price: 150, turnaroundTime: 2 },
    { name: 'Lipid Profile', code: 'BIO002', category: 'biochemistry', price: 600, turnaroundTime: 4 },
    { name: 'Liver Function Test (LFT)', code: 'BIO003', category: 'biochemistry', price: 800, turnaroundTime: 6 },
    { name: 'Kidney Function Test (KFT)', code: 'BIO004', category: 'biochemistry', price: 700, turnaroundTime: 6 },
    { name: 'Thyroid Profile (T3, T4, TSH)', code: 'HOR001', category: 'endocrine', price: 900, turnaroundTime: 8 },
    { name: 'Urine Routine Examination', code: 'URI001', category: 'microbiology', price: 200, turnaroundTime: 2 },
    { name: 'Chest X-Ray', code: 'RAD001', category: 'radiology', price: 500, turnaroundTime: 1 },
    { name: 'ECG', code: 'CAR001', category: 'cardiology', price: 300, turnaroundTime: 1 },
    { name: 'HbA1c', code: 'BIO005', category: 'biochemistry', price: 450, turnaroundTime: 4 }
];

async function seedCompleteOrganization() {
    try {
        console.log('🚀 Starting Complete Organization Seed...\n');
        console.log('========================================');
        console.log(`Organization: ${ORG_CONFIG.name}`);
        console.log(`Subdomain: ${ORG_CONFIG.subdomain}`);
        console.log('========================================\n');

        // Initialize database
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const orgRepo = AppDataSource.getRepository(Organization);
        const locationRepo = AppDataSource.getRepository(Location);
        const userRepo = AppDataSource.getRepository(User);
        const deptRepo = AppDataSource.getRepository(Department);
        const serviceRepo = AppDataSource.getRepository(Service);
        const appointmentRepo = AppDataSource.getRepository(Appointment);
        const medicineRepo = AppDataSource.getRepository(Medicine);
        const labTestRepo = AppDataSource.getRepository(LabTest);

        // Check if organization already exists
        let organization = await orgRepo.findOne({ where: { subdomain: ORG_CONFIG.subdomain } });

        if (organization) {
            console.log(`⚠️  Organization "${ORG_CONFIG.name}" already exists. Using existing org.\n`);
        } else {
            // Create new organization
            organization = orgRepo.create({
                name: ORG_CONFIG.name,
                subdomain: ORG_CONFIG.subdomain,
                description: ORG_CONFIG.description,
                email: ORG_CONFIG.email,
                phone: ORG_CONFIG.phone,
                isActive: true,
                settings: {
                    subscription: { plan: 'enterprise', status: 'active', startDate: new Date() },
                    features: { pharmacy: true, laboratory: true, inpatient: true, radiology: true },
                    limits: { maxUsers: 500, maxPatients: 10000, maxStorage: 100 },
                    branding: { primaryColor: '#e91e63', secondaryColor: '#3f51b5' }
                }
            });
            await orgRepo.save(organization);
            console.log(`✅ Created Organization: ${organization.name}\n`);
        }

        const orgId = organization.id;

        // ===== STEP 1: Create Locations =====
        console.log('📍 Creating Locations...');
        const createdLocations: Location[] = [];
        for (const locConfig of LOCATIONS_CONFIG) {
            let location = await locationRepo.findOne({
                where: { organizationId: orgId, code: locConfig.code }
            });

            if (!location) {
                location = locationRepo.create({
                    organizationId: orgId,
                    name: locConfig.name,
                    code: locConfig.code,
                    address: locConfig.address,
                    city: locConfig.city,
                    state: locConfig.state,
                    country: 'India',
                    phone: locConfig.phone,
                    email: locConfig.email,
                    isMainBranch: locConfig.isMainBranch,
                    isActive: true,
                    settings: {
                        capacity: locConfig.capacity,
                        features: { hasPharmacy: true, hasLaboratory: true, hasEmergency: true, hasRadiology: true }
                    }
                });
                await locationRepo.save(location);
                console.log(`  ✅ ${locConfig.name} (${locConfig.code})`);
            } else {
                console.log(`  ⏭️  ${locConfig.name} already exists`);
            }
            createdLocations.push(location);
        }

        // ===== STEP 2: Create Departments =====
        console.log('\n🏥 Creating Departments...');
        const createdDepts: Department[] = [];
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
                } as any) as unknown as Department;
                await deptRepo.save(newDept);
                createdDepts.push(newDept);
                console.log(`  ✅ ${deptConfig.name}`);
            } else {
                console.log(`  ⏭️  ${deptConfig.name} already exists`);
                createdDepts.push(dept);
            }
        }

        // ===== STEP 3: Create Services =====
        console.log('\n📋 Creating Services...');
        let serviceCount = 0;
        for (const dept of createdDepts) {
            const services = SERVICES_BY_DEPT[dept.name] || [];
            for (const svcName of services) {
                const existing = await serviceRepo.findOne({
                    where: { name: svcName, organizationId: orgId }
                });
                if (!existing) {
                    const service = serviceRepo.create({
                        name: svcName,
                        description: `${svcName} service`,
                        status: 'active',
                        averageDuration: 30,
                        department: dept,
                        departmentId: (dept as any).id,
                        organizationId: orgId
                    } as any);
                    await serviceRepo.save(service);
                    serviceCount++;
                }
            }
        }
        console.log(`  ✅ Created ${serviceCount} services`);

        // ===== STEP 4: Create Admin =====
        console.log('\n👤 Creating Admin User...');
        const adminEmail = `admin@${ORG_CONFIG.subdomain}.com`;
        let admin = await userRepo.findOne({ where: { email: adminEmail, organizationId: orgId } });
        if (!admin) {
            const hashedPassword = await bcrypt.hash(STAFF_CONFIG.admin.password, 10);
            admin = userRepo.create({
                email: adminEmail,
                password: hashedPassword,
                firstName: 'Admin',
                lastName: 'User',
                phone: '+91 9876543210',
                role: 'admin' as any,
                organizationId: orgId,
                isActive: true
            });
            await userRepo.save(admin);
            console.log(`  ✅ Admin: ${adminEmail} / ${STAFF_CONFIG.admin.password}`);
        } else {
            console.log(`  ⏭️  Admin already exists: ${adminEmail}`);
        }

        // ===== STEP 5: Create Doctors =====
        console.log('\n👨‍⚕️ Creating Doctors...');
        const createdDoctors: User[] = [];
        const firstNames = ['Arun', 'Priya', 'Rajesh', 'Sunita', 'Vikram', 'Anjali', 'Karthik', 'Deepa', 'Suresh', 'Lakshmi',
            'Ramesh', 'Meera', 'Ganesh', 'Divya', 'Sanjay', 'Kavitha', 'Mohan', 'Shanti', 'Prakash', 'Revathi'];
        const lastNames = ['Kumar', 'Sharma', 'Patel', 'Reddy', 'Iyer', 'Menon', 'Nair', 'Pillai', 'Rao', 'Naidu'];

        let doctorIdx = 0;
        for (const dept of createdDepts) {
            for (let i = 0; i < STAFF_CONFIG.doctors.countPerDept; i++) {
                const firstName = firstNames[doctorIdx % firstNames.length];
                const lastName = lastNames[doctorIdx % lastNames.length];
                const email = `dr.${firstName.toLowerCase()}.${lastName.toLowerCase()}@${ORG_CONFIG.subdomain}.com`;

                let doctor = await userRepo.findOne({ where: { email, organizationId: orgId } });
                if (!doctor) {
                    const hashedPassword = await bcrypt.hash(STAFF_CONFIG.doctors.password, 10);
                    doctor = userRepo.create({
                        email,
                        password: hashedPassword,
                        firstName: `Dr. ${firstName}`,
                        lastName,
                        phone: `+91 98765${String(43210 + doctorIdx).padStart(5, '0')}`,
                        role: 'doctor' as any,
                        organizationId: orgId,
                        departmentId: (dept as any).id,
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

        // ===== STEP 6: Create Nurses =====
        console.log('\n👩‍⚕️ Creating Nurses...');
        const nurseFirstNames = ['Radha', 'Geetha', 'Saroja', 'Kamala', 'Vimala', 'Padma', 'Lalitha', 'Uma', 'Vasanthi', 'Jayanthi'];
        for (let i = 0; i < STAFF_CONFIG.nurses.count; i++) {
            const firstName = nurseFirstNames[i % nurseFirstNames.length];
            const email = `nurse.${firstName.toLowerCase()}${i + 1}@${ORG_CONFIG.subdomain}.com`;

            const existing = await userRepo.findOne({ where: { email, organizationId: orgId } });
            if (!existing) {
                const hashedPassword = await bcrypt.hash(STAFF_CONFIG.nurses.password, 10);
                const nurse = userRepo.create({
                    email,
                    password: hashedPassword,
                    firstName,
                    lastName: 'Nurse',
                    phone: `+91 87654${String(32100 + i).padStart(5, '0')}`,
                    role: 'nurse' as any,
                    organizationId: orgId,
                    isActive: true
                });
                await userRepo.save(nurse);
            }
        }
        console.log(`  ✅ Created ${STAFF_CONFIG.nurses.count} nurses`);

        // ===== STEP 7: Create Other Staff =====
        console.log('\n👥 Creating Other Staff...');

        // Receptionists
        for (let i = 0; i < STAFF_CONFIG.receptionists.count; i++) {
            const email = `reception${i + 1}@${ORG_CONFIG.subdomain}.com`;
            const existing = await userRepo.findOne({ where: { email, organizationId: orgId } });
            if (!existing) {
                const hashedPassword = await bcrypt.hash(STAFF_CONFIG.receptionists.password, 10);
                await userRepo.save(userRepo.create({
                    email, password: hashedPassword, firstName: `Reception`, lastName: `Staff ${i + 1}`,
                    phone: `+91 76543${String(21000 + i).padStart(5, '0')}`, role: 'receptionist' as any, organizationId: orgId, isActive: true
                }));
            }
        }
        console.log(`  ✅ Created ${STAFF_CONFIG.receptionists.count} receptionists`);

        // Pharmacists
        for (let i = 0; i < STAFF_CONFIG.pharmacists.count; i++) {
            const email = `pharmacist${i + 1}@${ORG_CONFIG.subdomain}.com`;
            const existing = await userRepo.findOne({ where: { email, organizationId: orgId } });
            if (!existing) {
                const hashedPassword = await bcrypt.hash(STAFF_CONFIG.pharmacists.password, 10);
                await userRepo.save(userRepo.create({
                    email, password: hashedPassword, firstName: `Pharma`, lastName: `Staff ${i + 1}`,
                    phone: `+91 65432${String(10900 + i).padStart(5, '0')}`, role: 'pharmacist' as any, organizationId: orgId, isActive: true
                }));
            }
        }
        console.log(`  ✅ Created ${STAFF_CONFIG.pharmacists.count} pharmacists`);

        // Lab Technicians
        for (let i = 0; i < STAFF_CONFIG.labTechnicians.count; i++) {
            const email = `lab${i + 1}@${ORG_CONFIG.subdomain}.com`;
            const existing = await userRepo.findOne({ where: { email, organizationId: orgId } });
            if (!existing) {
                const hashedPassword = await bcrypt.hash(STAFF_CONFIG.labTechnicians.password, 10);
                await userRepo.save(userRepo.create({
                    email, password: hashedPassword, firstName: `Lab`, lastName: `Technician ${i + 1}`,
                    phone: `+91 54321${String(9800 + i).padStart(5, '0')}`, role: 'lab_technician' as any, organizationId: orgId, isActive: true
                }));
            }
        }
        console.log(`  ✅ Created ${STAFF_CONFIG.labTechnicians.count} lab technicians`);

        // ===== STEP 8: Create Patients =====
        console.log('\n🧑 Creating Sample Patients...');
        const patientFirstNames = ['Ravi', 'Sita', 'Krishna', 'Radha', 'Arjun', 'Priya', 'Venkat', 'Lakshmi', 'Surya', 'Kavitha',
            'Anil', 'Sunitha', 'Mahesh', 'Geetha', 'Ram', 'Anu', 'Kiran', 'Padma', 'Vijay', 'Uma'];
        const createdPatients: User[] = [];

        for (let i = 0; i < 20; i++) {
            const firstName = patientFirstNames[i];
            const email = `patient.${firstName.toLowerCase()}${i + 1}@gmail.com`;

            const existingPatient = await userRepo.findOne({ where: { email, organizationId: orgId } });
            if (!existingPatient) {
                const hashedPassword = await bcrypt.hash('Patient@123', 10);
                const newPatient = userRepo.create({
                    email,
                    password: hashedPassword,
                    firstName,
                    lastName: lastNames[i % lastNames.length],
                    phone: `+91 9${String(876543210 + i).slice(0, 9)}`,
                    role: 'patient' as any,
                    organizationId: orgId,
                    isActive: true,
                    dateOfBirth: new Date(1980 + (i % 40), i % 12, (i % 28) + 1),
                    gender: i % 2 === 0 ? 'male' : 'female',
                    address: `${100 + i}, Main Street, City`,
                    bloodGroup: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'][i % 8]
                } as any) as unknown as User;
                await userRepo.save(newPatient);
                createdPatients.push(newPatient);
            }
        }
        console.log(`  ✅ Created ${createdPatients.length} patients`);

        // ===== STEP 9: Create Appointments =====
        console.log('\n📅 Creating Sample Appointments...');
        const allServices = await serviceRepo.find({ where: { organizationId: orgId } });
        let appointmentCount = 0;

        if (createdPatients.length > 0 && createdDoctors.length > 0 && allServices.length > 0) {
            for (let i = 0; i < 30; i++) {
                const patient = createdPatients[i % createdPatients.length];
                const doctor = createdDoctors[i % createdDoctors.length];
                const service = allServices[i % allServices.length];

                const startDate = new Date();
                startDate.setDate(startDate.getDate() + (i % 14) - 7); // Past 7 days to next 7 days
                startDate.setHours(9 + (i % 8), (i % 2) * 30, 0, 0);

                const endDate = new Date(startDate);
                endDate.setMinutes(endDate.getMinutes() + 30);

                const statuses = [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING, AppointmentStatus.COMPLETED];
                const status = i < 10 ? AppointmentStatus.COMPLETED : statuses[i % 3];

                const appointment = appointmentRepo.create({
                    patient,
                    doctor,
                    service,
                    startTime: startDate,
                    endTime: endDate,
                    status,
                    reason: `${service.name} consultation`,
                    notes: `Appointment for ${(patient as any).firstName}`,
                    organizationId: orgId
                } as any);
                await appointmentRepo.save(appointment);
                appointmentCount++;
            }
        }
        console.log(`  ✅ Created ${appointmentCount} appointments`);

        // ===== STEP 10: Create Medicines =====
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
                        brandName: medConfig.name, // Required field
                        genericName: medConfig.genericName,
                        category: medConfig.category,
                        dosageForm: 'Tablet', // Required field
                        strength: '500mg', // Required field
                        unitPrice: medConfig.unitPrice,
                        sellingPrice: medConfig.unitPrice * 1.2,
                        currentStock: medConfig.stock,
                        reorderLevel: medConfig.reorderLevel,
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

        // ===== STEP 11: Create Lab Tests =====
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
                        category: testConfig.category,
                        price: testConfig.price,
                        turnaroundTime: testConfig.turnaroundTime,
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
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('                   🎉 SEED COMPLETE 🎉');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`\n📌 Organization: ${ORG_CONFIG.name}`);
        console.log(`   Subdomain: ${ORG_CONFIG.subdomain}`);
        console.log(`\n📍 Locations: ${LOCATIONS_CONFIG.length}`);
        LOCATIONS_CONFIG.forEach(loc => console.log(`   • ${loc.name} (${loc.code}) - ${loc.city}`));
        console.log(`\n🏥 Departments: ${DEPARTMENTS_CONFIG.length}`);
        console.log(`📋 Services: ${serviceCount}`);
        console.log(`👨‍⚕️ Doctors: ${createdDoctors.length}`);
        console.log(`👩‍⚕️ Nurses: ${STAFF_CONFIG.nurses.count}`);
        console.log(`🧑 Patients: ${createdPatients.length}`);
        console.log(`📅 Appointments: ${appointmentCount}`);
        console.log(`💊 Medicines: ${medicineCount}`);
        console.log(`🧪 Lab Tests: ${labTestCount}`);

        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('                      🔑 LOGIN CREDENTIALS');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`\n👤 Admin:        ${adminEmail} / ${STAFF_CONFIG.admin.password}`);
        console.log(`👨‍⚕️ Doctor:       dr.[firstname].[lastname]@${ORG_CONFIG.subdomain}.com / ${STAFF_CONFIG.doctors.password}`);
        console.log(`👩‍⚕️ Nurse:        nurse.[name]N@${ORG_CONFIG.subdomain}.com / ${STAFF_CONFIG.nurses.password}`);
        console.log(`📞 Receptionist: receptionN@${ORG_CONFIG.subdomain}.com / ${STAFF_CONFIG.receptionists.password}`);
        console.log(`💊 Pharmacist:   pharmacistN@${ORG_CONFIG.subdomain}.com / ${STAFF_CONFIG.pharmacists.password}`);
        console.log(`🧪 Lab Tech:     labN@${ORG_CONFIG.subdomain}.com / ${STAFF_CONFIG.labTechnicians.password}`);
        console.log(`🧑 Patient:      patient.[name]N@gmail.com / Patient@123`);
        console.log('\n═══════════════════════════════════════════════════════════════\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
}

seedCompleteOrganization();
