import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import { Department } from '../models/Department';
import { Service } from '../models/Service';
import { Ward } from '../models/inpatient/Ward';
import { Room } from '../models/inpatient/Room';
import { Bed } from '../models/inpatient/Bed';
import * as bcrypt from 'bcryptjs';

async function seedTrumpOrganization() {
  try {
    console.log('🏥 Starting Trump Medical Center setup...\n');

    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    const orgRepo = AppDataSource.getRepository(Organization);
    const userRepo = AppDataSource.getRepository(User);
    const deptRepo = AppDataSource.getRepository(Department);
    const serviceRepo = AppDataSource.getRepository(Service);
    const wardRepo = AppDataSource.getRepository(Ward);
    const roomRepo = AppDataSource.getRepository(Room);
    const bedRepo = AppDataSource.getRepository(Bed);

    // Check if organization already exists
    const existing = await orgRepo.findOne({ where: { subdomain: 'trump' } });
    if (existing) {
      console.log('⚠️  Trump organization already exists!');
      console.log('Organization ID:', existing.id);
      console.log('Subdomain: trump');
      console.log('URL: http://trump.localhost:3000\n');
      await AppDataSource.destroy();
      return;
    }

    // 1. CREATE ORGANIZATION
    console.log('📋 Creating organization...');
    const organization = orgRepo.create({
      name: 'Trump Medical Center',
      subdomain: 'trump',
      description: 'Premier healthcare facility providing world-class medical services',
      address: '725 Fifth Avenue, New York, NY 10022',
      phone: '+1-212-555-TRUMP',
      email: 'info@trumpmedical.com',
      isActive: true,
      settings: {
        branding: {
          logo: '/logos/trump-medical.png',
          primaryColor: '#D4AF37',
          secondaryColor: '#000000'
        },
        features: {
          telemedicine: true,
          pharmacy: true,
          laboratory: true,
          inpatient: true,
          emergency: true
        }
      }
    });
    await orgRepo.save(organization);
    console.log('✅ Organization created:', organization.name);
    console.log('   ID:', organization.id);
    console.log('   Subdomain: trump\n');

    // 2. CREATE DEPARTMENTS
    console.log('🏢 Creating departments...');
    const departments = [
      { name: 'Cardiology', description: 'Heart and cardiovascular care', floor: '3rd Floor', phone: '+1-212-555-0301', email: 'cardio@trumpmedical.com' },
      { name: 'Neurology', description: 'Brain and nervous system care', floor: '4th Floor', phone: '+1-212-555-0401', email: 'neuro@trumpmedical.com' },
      { name: 'Orthopedics', description: 'Bone and joint care', floor: '5th Floor', phone: '+1-212-555-0501', email: 'ortho@trumpmedical.com' },
      { name: 'Pediatrics', description: 'Children healthcare', floor: '2nd Floor', phone: '+1-212-555-0201', email: 'peds@trumpmedical.com' },
      { name: 'Emergency', description: 'Emergency and trauma care', floor: 'Ground Floor', phone: '+1-212-555-0911', email: 'emergency@trumpmedical.com' },
      { name: 'Oncology', description: 'Cancer treatment and care', floor: '6th Floor', phone: '+1-212-555-0601', email: 'onco@trumpmedical.com' },
      { name: 'Radiology', description: 'Medical imaging services', floor: 'Basement Level 1', phone: '+1-212-555-0101', email: 'radiology@trumpmedical.com' },
      { name: 'Laboratory', description: 'Diagnostic testing services', floor: 'Basement Level 2', phone: '+1-212-555-0102', email: 'lab@trumpmedical.com' }
    ];

    const createdDepts: { [key: string]: Department } = {};
    for (const dept of departments) {
      const department = deptRepo.create({
        ...dept,
        organizationId: organization.id,
        isActive: true
      });
      await deptRepo.save(department);
      createdDepts[dept.name] = department;
      console.log(`   ✓ ${dept.name}`);
    }
    console.log('✅ 8 departments created\n');

    // 3. CREATE ADMIN USER
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('Trump@2026', 10);
    const admin = userRepo.create({
      organizationId: organization.id,
      firstName: 'Donald',
      lastName: 'Trump',
      email: 'admin@trumpmedical.com',
      phone: '+1-212-555-1000',
      password: hashedPassword,
      role: 'hospital_admin',
      isActive: true,
      gender: 'male',
      dateOfBirth: new Date('1946-06-14'),
      address: '725 Fifth Avenue',
      city: 'New York',
      state: 'NY',
      zipCode: '10022',
      country: 'USA'
    });
    await userRepo.save(admin);
    console.log('✅ Admin created: admin@trumpmedical.com\n');

    // 4. CREATE DOCTORS
    console.log('👨‍⚕️ Creating doctors...');
    const doctors = [
      { dept: 'Cardiology', firstName: 'Michael', lastName: 'Anderson', email: 'dr.anderson@trumpmedical.com', specialization: 'Interventional Cardiology', qualification: 'MD, FACC', experience: 15, fee: 500 },
      { dept: 'Cardiology', firstName: 'Sarah', lastName: 'Williams', email: 'dr.williams@trumpmedical.com', specialization: 'Cardiac Electrophysiology', qualification: 'MD, PhD', experience: 12, fee: 450 },
      { dept: 'Neurology', firstName: 'Robert', lastName: 'Johnson', email: 'dr.johnson@trumpmedical.com', specialization: 'Neurosurgery', qualification: 'MD, FAANS', experience: 18, fee: 600 },
      { dept: 'Neurology', firstName: 'Emily', lastName: 'Davis', email: 'dr.davis@trumpmedical.com', specialization: 'Stroke Neurology', qualification: 'MD, FAHA', experience: 10, fee: 400 },
      { dept: 'Orthopedics', firstName: 'James', lastName: 'Miller', email: 'dr.miller@trumpmedical.com', specialization: 'Sports Medicine', qualification: 'MD, FAAOS', experience: 14, fee: 450 },
      { dept: 'Orthopedics', firstName: 'Lisa', lastName: 'Brown', email: 'dr.brown@trumpmedical.com', specialization: 'Joint Replacement', qualification: 'MD, FRCS', experience: 16, fee: 500 },
      { dept: 'Pediatrics', firstName: 'Jennifer', lastName: 'Wilson', email: 'dr.wilson@trumpmedical.com', specialization: 'Pediatric Cardiology', qualification: 'MD, FAAP', experience: 11, fee: 350 },
      { dept: 'Pediatrics', firstName: 'David', lastName: 'Martinez', email: 'dr.martinez@trumpmedical.com', specialization: 'General Pediatrics', qualification: 'MD, FAAP', experience: 9, fee: 300 },
      { dept: 'Emergency', firstName: 'Christopher', lastName: 'Garcia', email: 'dr.garcia@trumpmedical.com', specialization: 'Emergency Medicine', qualification: 'MD, FACEP', experience: 13, fee: 400 },
      { dept: 'Emergency', firstName: 'Amanda', lastName: 'Rodriguez', email: 'dr.rodriguez@trumpmedical.com', specialization: 'Trauma Surgery', qualification: 'MD, FACS', experience: 15, fee: 500 },
      { dept: 'Oncology', firstName: 'Thomas', lastName: 'Lee', email: 'dr.lee@trumpmedical.com', specialization: 'Medical Oncology', qualification: 'MD, FACP', experience: 17, fee: 550 },
      { dept: 'Oncology', firstName: 'Patricia', lastName: 'Taylor', email: 'dr.taylor@trumpmedical.com', specialization: 'Radiation Oncology', qualification: 'MD, FASTRO', experience: 12, fee: 500 }
    ];

    for (const doc of doctors) {
      const doctor = userRepo.create({
        organizationId: organization.id,
        departmentId: createdDepts[doc.dept].id,
        firstName: doc.firstName,
        lastName: doc.lastName,
        email: doc.email,
        phone: `+1-212-555-${Math.floor(Math.random() * 9000) + 1000}`,
        password: hashedPassword,
        role: 'doctor',
        isActive: true,
        gender: ['Michael', 'Robert', 'James', 'David', 'Christopher', 'Thomas'].includes(doc.firstName) ? 'male' : 'female',
        specialization: doc.specialization,
        qualification: doc.qualification,
        experience: doc.experience,
        consultationFee: doc.fee
      });
      await userRepo.save(doctor);
      console.log(`   ✓ Dr. ${doc.firstName} ${doc.lastName} (${doc.dept})`);
    }
    console.log('✅ 12 doctors created\n');

    // 5. CREATE STAFF
    console.log('👥 Creating support staff...');
    const staff = [
      { role: 'nurse', firstName: 'Mary', lastName: 'Johnson', email: 'nurse.johnson@trumpmedical.com' },
      { role: 'nurse', firstName: 'Patricia', lastName: 'Smith', email: 'nurse.smith@trumpmedical.com' },
      { role: 'nurse', firstName: 'Linda', lastName: 'Davis', email: 'nurse.davis@trumpmedical.com' },
      { role: 'receptionist', firstName: 'Susan', lastName: 'Anderson', email: 'reception@trumpmedical.com' },
      { role: 'receptionist', firstName: 'Karen', lastName: 'Thomas', email: 'reception2@trumpmedical.com' },
      { role: 'lab_technician', firstName: 'John', lastName: 'Harris', email: 'lab.harris@trumpmedical.com' },
      { role: 'lab_technician', firstName: 'Michelle', lastName: 'Clark', email: 'lab.clark@trumpmedical.com' },
      { role: 'pharmacist', firstName: 'Richard', lastName: 'Lewis', email: 'pharmacy@trumpmedical.com' },
      { role: 'pharmacist', firstName: 'Nancy', lastName: 'Walker', email: 'pharmacy2@trumpmedical.com' }
    ];

    for (const member of staff) {
      const user = userRepo.create({
        organizationId: organization.id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: `+1-212-555-${Math.floor(Math.random() * 9000) + 1000}`,
        password: hashedPassword,
        role: member.role as any,
        isActive: true,
        gender: ['John', 'Richard'].includes(member.firstName) ? 'male' : 'female'
      });
      await userRepo.save(user);
      console.log(`   ✓ ${member.firstName} ${member.lastName} (${member.role})`);
    }
    console.log('✅ 9 staff members created\n');

    // 6. CREATE PATIENTS
    console.log('🤒 Creating sample patients...');
    const patients = [
      { firstName: 'John', lastName: 'Smith', email: 'john.smith@email.com', dob: '1985-03-15', blood: 'O+', gender: 'male' },
      { firstName: 'Emma', lastName: 'Johnson', email: 'emma.johnson@email.com', dob: '1990-07-22', blood: 'A+', gender: 'female' },
      { firstName: 'Michael', lastName: 'Williams', email: 'michael.w@email.com', dob: '1978-11-30', blood: 'B+', gender: 'male' },
      { firstName: 'Sophia', lastName: 'Brown', email: 'sophia.brown@email.com', dob: '1995-05-18', blood: 'AB+', gender: 'female' },
      { firstName: 'William', lastName: 'Jones', email: 'william.jones@email.com', dob: '1982-09-25', blood: 'O-', gender: 'male' },
      { firstName: 'Olivia', lastName: 'Garcia', email: 'olivia.garcia@email.com', dob: '1988-12-10', blood: 'A-', gender: 'female' },
      { firstName: 'James', lastName: 'Martinez', email: 'james.martinez@email.com', dob: '1975-04-08', blood: 'B-', gender: 'male' },
      { firstName: 'Isabella', lastName: 'Davis', email: 'isabella.davis@email.com', dob: '1992-08-14', blood: 'AB-', gender: 'female' },
      { firstName: 'Benjamin', lastName: 'Rodriguez', email: 'benjamin.r@email.com', dob: '1980-01-20', blood: 'O+', gender: 'male' },
      { firstName: 'Mia', lastName: 'Wilson', email: 'mia.wilson@email.com', dob: '1998-06-05', blood: 'A+', gender: 'female' }
    ];

    for (const pat of patients) {
      const patient = userRepo.create({
        organizationId: organization.id,
        firstName: pat.firstName,
        lastName: pat.lastName,
        email: pat.email,
        phone: `+1-212-555-${Math.floor(Math.random() * 9000) + 1000}`,
        password: hashedPassword,
        role: 'patient',
        isActive: true,
        gender: pat.gender,
        dateOfBirth: new Date(pat.dob),
        bloodGroup: pat.blood,
        address: `${Math.floor(Math.random() * 900) + 100} Park Avenue`,
        city: 'New York',
        state: 'NY',
        zipCode: '10016',
        country: 'USA'
      });
      await userRepo.save(patient);
      console.log(`   ✓ ${pat.firstName} ${pat.lastName}`);
    }
    console.log('✅ 10 patients created\n');

    // 7. CREATE SERVICES
    console.log('💊 Creating services...');
    const services = [
      { dept: 'Cardiology', name: 'Cardiac Consultation', description: 'Initial cardiac evaluation', duration: 30, price: 500 },
      { dept: 'Cardiology', name: 'ECG', description: 'Electrocardiogram test', duration: 15, price: 150 },
      { dept: 'Cardiology', name: 'Echocardiogram', description: '2D Echo heart scan', duration: 45, price: 800 },
      { dept: 'Neurology', name: 'Neurological Consultation', description: 'Comprehensive neurological exam', duration: 45, price: 600 },
      { dept: 'Neurology', name: 'EEG', description: 'Brain activity test', duration: 60, price: 700 },
      { dept: 'Orthopedics', name: 'Orthopedic Consultation', description: 'Bone and joint evaluation', duration: 30, price: 450 },
      { dept: 'Orthopedics', name: 'X-Ray', description: 'Digital X-ray imaging', duration: 20, price: 200 },
      { dept: 'Pediatrics', name: 'Pediatric Consultation', description: 'Child health checkup', duration: 30, price: 300 },
      { dept: 'Pediatrics', name: 'Vaccination', description: 'Childhood immunization', duration: 15, price: 100 },
      { dept: 'Emergency', name: 'Emergency Consultation', description: 'Urgent medical evaluation', duration: 15, price: 400 },
      { dept: 'Oncology', name: 'Oncology Consultation', description: 'Cancer care consultation', duration: 60, price: 550 }
    ];

    for (const svc of services) {
      const service = serviceRepo.create({
        organizationId: organization.id,
        departmentId: createdDepts[svc.dept].id,
        name: svc.name,
        description: svc.description,
        duration: svc.duration,
        price: svc.price,
        isActive: true
      });
      await serviceRepo.save(service);
      console.log(`   ✓ ${svc.name} (${svc.dept})`);
    }
    console.log('✅ 11 services created\n');

    // 8. CREATE WARDS AND BEDS
    console.log('🛏️  Creating wards and beds...');
    const wards = [
      { name: 'General Ward A', description: 'General medical ward', floor: '2nd Floor', capacity: 30 },
      { name: 'ICU', description: 'Intensive Care Unit', floor: '3rd Floor', capacity: 20 }
    ];

    for (const wardData of wards) {
      const ward = wardRepo.create({
        organizationId: organization.id,
        name: wardData.name,
        description: wardData.description,
        floor: wardData.floor,
        capacity: wardData.capacity,
        isActive: true
      });
      await wardRepo.save(ward);
      console.log(`   ✓ ${wardData.name} (${wardData.capacity} beds)`);

      // Create rooms and beds
      const roomsCount = wardData.name === 'ICU' ? 20 : 15;
      const bedsPerRoom = wardData.name === 'ICU' ? 1 : 2;

      for (let i = 1; i <= roomsCount; i++) {
        const roomNumber = wardData.name === 'ICU' ? `ICU-${String(i).padStart(2, '0')}` : `GA-${String(i).padStart(3, '0')}`;
        const room = roomRepo.create({
          organizationId: organization.id,
          wardId: ward.id,
          roomNumber,
          roomType: wardData.name === 'ICU' ? 'icu' : 'general',
          capacity: bedsPerRoom,
          isActive: true
        });
        await roomRepo.save(room);

        for (let j = 0; j < bedsPerRoom; j++) {
          const bedNumber = bedsPerRoom === 1 ? roomNumber : `${roomNumber}-${String.fromCharCode(65 + j)}`;
          const bed = bedRepo.create({
            organizationId: organization.id,
            roomId: room.id,
            bedNumber,
            status: 'available',
            isActive: true
          });
          await bedRepo.save(bed);
        }
      }
    }
    console.log('✅ 2 wards with 50 beds created\n');

    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 TRUMP MEDICAL CENTER SETUP COMPLETE!');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('📍 Access Information:');
    console.log('   URL: http://trump.localhost:3000');
    console.log('   Subdomain: trump\n');
    console.log('🔐 Admin Credentials:');
    console.log('   Email: admin@trumpmedical.com');
    console.log('   Password: Trump@2026\n');
    console.log('📊 Summary:');
    console.log('   • Organization: 1');
    console.log('   • Departments: 8');
    console.log('   • Doctors: 12');
    console.log('   • Staff: 9');
    console.log('   • Patients: 10');
    console.log('   • Services: 11');
    console.log('   • Wards: 2');
    console.log('   • Beds: 50\n');
    console.log('✅ You can now login at: http://trump.localhost:3000/login');
    console.log('═══════════════════════════════════════════════════════\n');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error setting up Trump organization:', error);
    process.exit(1);
  }
}

seedTrumpOrganization();
