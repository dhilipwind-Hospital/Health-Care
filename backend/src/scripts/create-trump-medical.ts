import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import { Department } from '../models/Department';
import { Service } from '../models/Service';
import { UserRole } from '../types/roles';
import * as bcrypt from 'bcryptjs';

async function createTrumpMedicalCenter() {
  try {
    console.log('🏥 Creating Trump Medical Center...\n');

    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    const orgRepo = AppDataSource.getRepository(Organization);
    const userRepo = AppDataSource.getRepository(User);
    const deptRepo = AppDataSource.getRepository(Department);
    const serviceRepo = AppDataSource.getRepository(Service);

    // 1. Create Organization
    console.log('📋 Creating organization...');
    const organization = orgRepo.create({
      name: 'Trump Medical Center',
      subdomain: 'trump',
      description: 'Premier healthcare facility providing world-class medical services',
      address: '725 Fifth Avenue, New York, NY 10022',
      phone: '+1-212-555-TRUMP',
      email: 'info@trumpmedical.com',
      isActive: true
    });
    await orgRepo.save(organization);
    console.log('✅ Organization created:', organization.name);

    // 2. Create Departments
    console.log('\n🏢 Creating departments...');
    const departments = [
      { name: 'Cardiology', description: 'Heart and cardiovascular care' },
      { name: 'Neurology', description: 'Brain and nervous system care' },
      { name: 'Emergency', description: 'Emergency and trauma care' },
      { name: 'General Medicine', description: 'General medical care' }
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

    // 3. Create Admin User
    console.log('\n👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('Trump@2026', 10);
    const admin = userRepo.create({
      organizationId: organization.id,
      firstName: 'Donald',
      lastName: 'Trump',
      email: 'admin@trumpmedical.com',
      phone: '+1-212-555-1000',
      password: hashedPassword,
      role: UserRole.ADMIN,
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
    console.log('✅ Admin created: admin@trumpmedical.com');

    // 4. Create Doctors
    console.log('\n👨‍⚕️ Creating doctors...');
    const doctors = [
      { dept: 'Cardiology', firstName: 'Michael', lastName: 'Anderson', email: 'dr.anderson@trumpmedical.com' },
      { dept: 'Neurology', firstName: 'Sarah', lastName: 'Williams', email: 'dr.williams@trumpmedical.com' },
      { dept: 'Emergency', firstName: 'Robert', lastName: 'Johnson', email: 'dr.johnson@trumpmedical.com' }
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
        role: UserRole.DOCTOR,
        isActive: true,
        gender: ['Michael', 'Robert'].includes(doc.firstName) ? 'male' : 'female'
      });
      await userRepo.save(doctor);
      console.log(`   ✓ Dr. ${doc.firstName} ${doc.lastName}`);
    }

    // 5. Create Staff
    console.log('\n👥 Creating support staff...');
    const staff = [
      { role: UserRole.NURSE, firstName: 'Mary', lastName: 'Johnson', email: 'nurse.johnson@trumpmedical.com' },
      { role: UserRole.RECEPTIONIST, firstName: 'Susan', lastName: 'Anderson', email: 'reception@trumpmedical.com' },
      { role: UserRole.PHARMACIST, firstName: 'Richard', lastName: 'Lewis', email: 'pharmacy@trumpmedical.com' }
    ];

    for (const member of staff) {
      const user = userRepo.create({
        organizationId: organization.id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: `+1-212-555-${Math.floor(Math.random() * 9000) + 1000}`,
        password: hashedPassword,
        role: member.role,
        isActive: true,
        gender: ['Richard'].includes(member.firstName) ? 'male' : 'female'
      });
      await userRepo.save(user);
      console.log(`   ✓ ${member.firstName} ${member.lastName} (${member.role})`);
    }

    // 6. Create Patients (THE CORRECT ONES!)
    console.log('\n🤒 Creating Trump Medical Center patients...');
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
        role: UserRole.PATIENT,
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
      console.log(`   ✓ ${pat.firstName} ${pat.lastName} (${pat.email})`);
    }

    // 7. Create Services
    console.log('\n💊 Creating services...');
    const services = [
      { dept: 'Cardiology', name: 'Cardiac Consultation', price: 500 },
      { dept: 'Neurology', name: 'Neurological Consultation', price: 600 },
      { dept: 'Emergency', name: 'Emergency Consultation', price: 400 },
      { dept: 'General Medicine', name: 'General Consultation', price: 300 }
    ];

    for (const svc of services) {
      const service = serviceRepo.create({
        organizationId: organization.id,
        departmentId: createdDepts[svc.dept].id,
        name: svc.name,
        price: svc.price,
        isActive: true
      });
      await serviceRepo.save(service);
      console.log(`   ✓ ${svc.name} (${svc.dept})`);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🎉 TRUMP MEDICAL CENTER SETUP COMPLETE!');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('📍 Access Information:');
    console.log('   URL: http://localhost:3000');
    console.log('   Subdomain: trump\n');
    console.log('🔐 Admin Credentials:');
    console.log('   Email: admin@trumpmedical.com');
    console.log('   Password: Trump@2026\n');
    console.log('👥 Patients Created:');
    patients.forEach(p => console.log(`   - ${p.firstName} ${p.lastName} (${p.email})`));
    console.log('\n✅ You can now login at: http://trump.localhost:3000/login');
    console.log('═══════════════════════════════════════════════════════\n');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error setting up Trump organization:', error);
    process.exit(1);
  }
}

createTrumpMedicalCenter();
