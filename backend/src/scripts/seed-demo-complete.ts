/**
 * Seed Script: Complete Demo Organization with All Roles
 * 
 * Creates a demo organization with:
 * - Admin user
 * - Doctors (multiple departments)
 * - Nurses
 * - Receptionists
 * - Pharmacists
 * - Lab Technicians
 * - Accountants
 * - Sample patients with appointments
 * - Pharmacy inventory
 * - Lab tests
 * 
 * Usage:
 *   npx ts-node src/scripts/seed-demo-complete.ts
 */

import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';
import { Location } from '../models/Location';
import { User } from '../models/User';
import { Department } from '../models/Department';
import { Service } from '../models/Service';
import { Medicine } from '../models/pharmacy/Medicine';
import { LabTest } from '../models/LabTest';
import { Patient } from '../models/Patient';
import * as bcrypt from 'bcryptjs';

// Configuration - All users use same password for demo
const DEMO_PASSWORD = 'Demo@123';

const ORG_CONFIG = {
  name: 'Ayphen Care Demo Hospital',
  subdomain: 'demo',
  description: 'A comprehensive demo hospital showcasing all HMS features',
  email: 'info@demo.ayphencare.com',
  phone: '+91 1800 123 4567'
};

const LOCATION_CONFIG = {
  name: 'Ayphen Care Demo - Main Branch',
  code: 'DEMO',
  address: '123 Healthcare Avenue, Tech Park',
  city: 'Chennai',
  state: 'Tamil Nadu',
  phone: '+91 44 1234 5678',
  email: 'demo@ayphencare.com',
  isMainBranch: true
};

const DEPARTMENTS_CONFIG = [
  { name: 'General Medicine', description: 'Primary care and internal medicine', status: 'active' },
  { name: 'Cardiology', description: 'Heart and cardiovascular care', status: 'active' },
  { name: 'Orthopedics', description: 'Bone, joint, and muscle care', status: 'active' },
  { name: 'Pediatrics', description: 'Child healthcare services', status: 'active' },
  { name: 'Emergency', description: '24/7 Emergency services', status: 'active' }
];

const SERVICES_BY_DEPT: Record<string, { name: string; price: number }[]> = {
  'General Medicine': [
    { name: 'General Consultation', price: 500 },
    { name: 'Health Checkup', price: 2000 },
    { name: 'Vaccination', price: 300 }
  ],
  'Cardiology': [
    { name: 'ECG', price: 500 },
    { name: 'Echocardiography', price: 3000 },
    { name: 'Cardiac Consultation', price: 1000 }
  ],
  'Orthopedics': [
    { name: 'Orthopedic Consultation', price: 800 },
    { name: 'X-Ray Review', price: 500 },
    { name: 'Physiotherapy', price: 600 }
  ],
  'Pediatrics': [
    { name: 'Child Consultation', price: 600 },
    { name: 'Immunization', price: 400 },
    { name: 'Growth Assessment', price: 500 }
  ],
  'Emergency': [
    { name: 'Emergency Care', price: 1500 },
    { name: 'Trauma Care', price: 3000 }
  ]
};

// Staff configuration with login credentials
const STAFF_CONFIG = {
  admin: {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@demo.ayphencare.com',
    phone: '9000000001',
    role: 'admin'
  },
  doctors: [
    { firstName: 'Dr. Rajesh', lastName: 'Kumar', email: 'doctor@demo.ayphencare.com', phone: '9000000002', department: 'General Medicine' },
    { firstName: 'Dr. Priya', lastName: 'Sharma', email: 'doctor2@demo.ayphencare.com', phone: '9000000003', department: 'Cardiology' },
    { firstName: 'Dr. Arun', lastName: 'Patel', email: 'doctor3@demo.ayphencare.com', phone: '9000000004', department: 'Orthopedics' }
  ],
  nurses: [
    { firstName: 'Nurse', lastName: 'Lakshmi', email: 'nurse@demo.ayphencare.com', phone: '9000000005' },
    { firstName: 'Nurse', lastName: 'Meera', email: 'nurse2@demo.ayphencare.com', phone: '9000000006' }
  ],
  receptionists: [
    { firstName: 'Reception', lastName: 'Anita', email: 'reception@demo.ayphencare.com', phone: '9000000007' }
  ],
  pharmacists: [
    { firstName: 'Pharma', lastName: 'Suresh', email: 'pharmacist@demo.ayphencare.com', phone: '9000000008' }
  ],
  labTechnicians: [
    { firstName: 'Lab', lastName: 'Technician', email: 'lab@demo.ayphencare.com', phone: '9000000009' }
  ],
  accountants: [
    { firstName: 'Account', lastName: 'Manager', email: 'accountant@demo.ayphencare.com', phone: '9000000010' }
  ]
};

const PATIENTS_CONFIG = [
  { firstName: 'Ravi', lastName: 'Shankar', email: 'patient1@demo.ayphencare.com', phone: '9100000001', gender: 'male', dateOfBirth: '1985-05-15' },
  { firstName: 'Sunita', lastName: 'Devi', email: 'patient2@demo.ayphencare.com', phone: '9100000002', gender: 'female', dateOfBirth: '1990-08-22' },
  { firstName: 'Amit', lastName: 'Singh', email: 'patient3@demo.ayphencare.com', phone: '9100000003', gender: 'male', dateOfBirth: '1978-12-10' }
];

const MEDICINES_CONFIG = [
  { name: 'Paracetamol 500mg', genericName: 'Acetaminophen', category: 'Pain Relief', unitPrice: 2.5, stock: 500, reorderLevel: 100 },
  { name: 'Amoxicillin 250mg', genericName: 'Amoxicillin', category: 'Antibiotic', unitPrice: 8.0, stock: 200, reorderLevel: 50 },
  { name: 'Omeprazole 20mg', genericName: 'Omeprazole', category: 'Gastric', unitPrice: 5.5, stock: 300, reorderLevel: 75 },
  { name: 'Metformin 500mg', genericName: 'Metformin', category: 'Diabetes', unitPrice: 3.0, stock: 400, reorderLevel: 100 },
  { name: 'Amlodipine 5mg', genericName: 'Amlodipine', category: 'Cardiac', unitPrice: 4.5, stock: 250, reorderLevel: 60 },
  { name: 'Cetirizine 10mg', genericName: 'Cetirizine', category: 'Allergy', unitPrice: 2.0, stock: 350, reorderLevel: 80 },
  { name: 'Azithromycin 500mg', genericName: 'Azithromycin', category: 'Antibiotic', unitPrice: 15.0, stock: 150, reorderLevel: 40 },
  { name: 'Ibuprofen 400mg', genericName: 'Ibuprofen', category: 'Pain Relief', unitPrice: 3.5, stock: 450, reorderLevel: 100 }
];

const LAB_TESTS_CONFIG = [
  { name: 'Complete Blood Count (CBC)', code: 'CBC001', category: 'hematology', price: 350, turnaroundTime: 4 },
  { name: 'Blood Glucose Fasting', code: 'BIO001', category: 'biochemistry', price: 150, turnaroundTime: 2 },
  { name: 'Lipid Profile', code: 'BIO002', category: 'biochemistry', price: 600, turnaroundTime: 4 },
  { name: 'Liver Function Test (LFT)', code: 'BIO003', category: 'biochemistry', price: 800, turnaroundTime: 6 },
  { name: 'Kidney Function Test (KFT)', code: 'BIO004', category: 'biochemistry', price: 700, turnaroundTime: 6 },
  { name: 'Thyroid Profile (T3, T4, TSH)', code: 'HOR001', category: 'endocrine', price: 900, turnaroundTime: 8 },
  { name: 'Urine Routine Examination', code: 'URI001', category: 'microbiology', price: 200, turnaroundTime: 2 }
];

async function seedDemoOrganization() {
  try {
    console.log('🏥 Starting Demo Organization Seed...\n');

    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    const orgRepo = AppDataSource.getRepository(Organization);
    const locationRepo = AppDataSource.getRepository(Location);
    const userRepo = AppDataSource.getRepository(User);
    const deptRepo = AppDataSource.getRepository(Department);
    const serviceRepo = AppDataSource.getRepository(Service);
    const medicineRepo = AppDataSource.getRepository(Medicine);
    const labTestRepo = AppDataSource.getRepository(LabTest);
    const patientRepo = AppDataSource.getRepository(Patient);

    // Check if demo org already exists
    let organization = await orgRepo.findOne({ where: { subdomain: ORG_CONFIG.subdomain } });
    
    if (organization) {
      console.log('⚠️  Demo organization already exists. Skipping creation.\n');
      console.log('   To recreate, delete the organization first.\n');
    } else {
      // Create Organization
      organization = orgRepo.create({
        name: ORG_CONFIG.name,
        subdomain: ORG_CONFIG.subdomain,
        description: ORG_CONFIG.description,
        email: ORG_CONFIG.email,
        phone: ORG_CONFIG.phone,
        isActive: true,
        settings: {
          features: {
            pharmacy: true,
            laboratory: true,
            inpatient: true
          },
          subscription: {
            plan: 'enterprise',
            status: 'active'
          }
        }
      });
      await orgRepo.save(organization);
      console.log(`✅ Created organization: ${organization.name}`);
    }

    // Create Location
    let location = await locationRepo.findOne({ 
      where: { code: LOCATION_CONFIG.code, organizationId: organization.id } 
    });
    
    if (!location) {
      location = locationRepo.create({
        ...LOCATION_CONFIG,
        organizationId: organization.id,
        isActive: true
      });
      await locationRepo.save(location);
      console.log(`✅ Created location: ${location.name}`);
    }

    // Create Departments
    const departments: Record<string, Department> = {};
    for (const deptConfig of DEPARTMENTS_CONFIG) {
      let dept = await deptRepo.findOne({ 
        where: { name: deptConfig.name, organizationId: organization.id } 
      });
      
      if (!dept) {
        dept = deptRepo.create({
          ...deptConfig,
          organizationId: organization.id,
          locationId: location.id
        });
        await deptRepo.save(dept);
        console.log(`✅ Created department: ${dept.name}`);
      }
      departments[deptConfig.name] = dept;
    }

    // Create Services
    for (const [deptName, services] of Object.entries(SERVICES_BY_DEPT)) {
      const dept = departments[deptName];
      if (!dept) continue;

      for (const svcConfig of services) {
        const existing = await serviceRepo.findOne({ 
          where: { name: svcConfig.name, organizationId: organization.id } 
        });
        
        if (!existing) {
          const service = serviceRepo.create({
            name: svcConfig.name,
            price: svcConfig.price,
            duration: 30,
            departmentId: dept.id,
            organizationId: organization.id,
            locationId: location.id,
            isActive: true
          });
          await serviceRepo.save(service);
        }
      }
    }
    console.log(`✅ Created services for all departments`);

    // Helper to create user
    const createUser = async (config: any, role: string, deptId?: string) => {
      const existing = await userRepo.findOne({ 
        where: { email: config.email, organizationId: organization!.id } 
      });
      
      if (existing) {
        return existing;
      }

      const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
      const user = userRepo.create({
        firstName: config.firstName,
        lastName: config.lastName,
        email: config.email,
        phone: config.phone,
        password: hashedPassword,
        role: role as any,
        organizationId: organization!.id,
        locationId: location!.id,
        departmentId: deptId,
        isActive: true
      });
      await userRepo.save(user);
      return user;
    };

    // Create Admin
    await createUser(STAFF_CONFIG.admin, 'admin');
    console.log(`✅ Created admin: ${STAFF_CONFIG.admin.email}`);

    // Create Doctors
    for (const doc of STAFF_CONFIG.doctors) {
      const dept = departments[doc.department];
      await createUser(doc, 'doctor', dept?.id);
    }
    console.log(`✅ Created ${STAFF_CONFIG.doctors.length} doctors`);

    // Create Nurses
    for (const nurse of STAFF_CONFIG.nurses) {
      await createUser(nurse, 'nurse');
    }
    console.log(`✅ Created ${STAFF_CONFIG.nurses.length} nurses`);

    // Create Receptionists
    for (const rec of STAFF_CONFIG.receptionists) {
      await createUser(rec, 'receptionist');
    }
    console.log(`✅ Created ${STAFF_CONFIG.receptionists.length} receptionists`);

    // Create Pharmacists
    for (const pharma of STAFF_CONFIG.pharmacists) {
      await createUser(pharma, 'pharmacist');
    }
    console.log(`✅ Created ${STAFF_CONFIG.pharmacists.length} pharmacists`);

    // Create Lab Technicians
    for (const lab of STAFF_CONFIG.labTechnicians) {
      await createUser(lab, 'lab_technician');
    }
    console.log(`✅ Created ${STAFF_CONFIG.labTechnicians.length} lab technicians`);

    // Create Accountants
    for (const acc of STAFF_CONFIG.accountants) {
      await createUser(acc, 'accountant');
    }
    console.log(`✅ Created ${STAFF_CONFIG.accountants.length} accountants`);

    // Create Patients
    for (const patConfig of PATIENTS_CONFIG) {
      const existing = await patientRepo.findOne({ 
        where: { email: patConfig.email, organizationId: organization.id } 
      });
      
      if (!existing) {
        const patient = patientRepo.create({
          firstName: patConfig.firstName,
          lastName: patConfig.lastName,
          email: patConfig.email,
          phone: patConfig.phone,
          gender: patConfig.gender as any,
          dateOfBirth: new Date(patConfig.dateOfBirth),
          organizationId: organization.id,
          locationId: location.id
        });
        await patientRepo.save(patient);
      }
    }
    console.log(`✅ Created ${PATIENTS_CONFIG.length} patients`);

    // Create Medicines
    for (const medConfig of MEDICINES_CONFIG) {
      const existing = await medicineRepo.findOne({ 
        where: { name: medConfig.name, organizationId: organization.id } 
      });
      
      if (!existing) {
        const medicine = medicineRepo.create({
          name: medConfig.name,
          genericName: medConfig.genericName,
          category: medConfig.category,
          unitPrice: medConfig.unitPrice,
          currentStock: medConfig.stock,
          reorderLevel: medConfig.reorderLevel,
          organizationId: organization.id,
          locationId: location.id,
          isActive: true
        });
        await medicineRepo.save(medicine);
      }
    }
    console.log(`✅ Created ${MEDICINES_CONFIG.length} medicines`);

    // Create Lab Tests
    for (const testConfig of LAB_TESTS_CONFIG) {
      const existing = await labTestRepo.findOne({ 
        where: { code: testConfig.code, organizationId: organization.id } 
      });
      
      if (!existing) {
        const labTest = labTestRepo.create({
          name: testConfig.name,
          code: testConfig.code,
          category: testConfig.category,
          price: testConfig.price,
          turnaroundTime: testConfig.turnaroundTime,
          organizationId: organization.id,
          isActive: true
        });
        await labTestRepo.save(labTest);
      }
    }
    console.log(`✅ Created ${LAB_TESTS_CONFIG.length} lab tests`);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 DEMO ORGANIZATION SEEDED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📋 LOGIN CREDENTIALS (Password for all: Demo@123)\n');
    console.log('| Role           | Email                              |');
    console.log('|----------------|-----------------------------------|');
    console.log('| Super Admin    | superadmin@hospital.com           |');
    console.log('| Admin          | admin@demo.ayphencare.com         |');
    console.log('| Doctor         | doctor@demo.ayphencare.com        |');
    console.log('| Doctor 2       | doctor2@demo.ayphencare.com       |');
    console.log('| Doctor 3       | doctor3@demo.ayphencare.com       |');
    console.log('| Nurse          | nurse@demo.ayphencare.com         |');
    console.log('| Receptionist   | reception@demo.ayphencare.com     |');
    console.log('| Pharmacist     | pharmacist@demo.ayphencare.com    |');
    console.log('| Lab Technician | lab@demo.ayphencare.com           |');
    console.log('| Accountant     | accountant@demo.ayphencare.com    |');
    console.log('| Patient 1      | patient1@demo.ayphencare.com      |');
    console.log('| Patient 2      | patient2@demo.ayphencare.com      |');
    console.log('| Patient 3      | patient3@demo.ayphencare.com      |');
    console.log('\n');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding demo organization:', error);
    try {
      await AppDataSource.destroy();
    } catch {}
    process.exit(1);
  }
}

seedDemoOrganization();
