/**
 * Seed Script: Lunaris Hospital Management System
 * 
 * Creates a fully operational hospital environment with:
 * - 1 Organization + 1 Location (Lunaris Multi-Specialty Hospital, Chennai)
 * - 1 Admin
 * - 5 Departments, each with mapped services
 * - 5 Doctors (1 per department) with full profiles, schedules, availability
 * - All staff roles: 3 Nurses, 2 Receptionists, 1 Pharmacist, 1 Lab Technician, 1 Accountant
 * - 5 Patients with full demographics, allergies, medical history, insurance
 * - Appointments covering every status: pending, confirmed, completed, cancelled, no_show, in_progress, emergency, rescheduled
 * - Consultation notes, diagnoses, prescriptions, lab orders, bills, medical records
 * - Cross-department referrals
 * - Medicines and lab test catalog
 * 
 * Scenario coverage:
 *   - Patient with multiple visits/appointments
 *   - Doctor with overlapping schedule blocks
 *   - Cross-department referrals
 *   - Emergency vs scheduled appointments
 *   - Active and inactive staff/patients
 *   - Patients with allergies, chronic conditions, medication history
 *   - Bills in every status: paid, pending, overdue, partially_paid
 *   - Prescriptions: pending, dispensed, partially_dispensed
 *   - Lab orders: ordered, in_progress, completed
 * 
 * Usage:
 *   npx ts-node src/scripts/seed-lunaris-hms.ts
 *   OR via API: POST /api/seed-lunaris-hms
 */

import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';
import { Location } from '../models/Location';
import { User } from '../models/User';
import { UserRole } from '../types/roles';
import { Department } from '../models/Department';
import { Service } from '../models/Service';
import { Appointment, AppointmentStatus, AppointmentMode, AppointmentType } from '../models/Appointment';
import { DoctorAvailability } from '../models/DoctorAvailability';
import { Allergy, AllergenType, ReactionSeverity } from '../models/Allergy';
import { MedicalRecord, RecordType } from '../models/MedicalRecord';
import { ConsultationNote } from '../models/ConsultationNote';
import { Diagnosis, DiagnosisType, DiagnosisStatus, DiagnosisSeverity } from '../models/Diagnosis';
import { Bill, BillStatus, PaymentMethod } from '../models/Bill';
import { Prescription, PrescriptionStatus } from '../models/pharmacy/Prescription';
import { PrescriptionItem, PrescriptionItemStatus } from '../models/pharmacy/PrescriptionItem';
import { Medicine } from '../models/pharmacy/Medicine';
import { LabTest } from '../models/LabTest';
import { LabOrder } from '../models/LabOrder';
import { LabOrderItem } from '../models/LabOrderItem';
import * as bcrypt from 'bcryptjs';

// ======================== HELPERS ========================
function daysFromNow(n: number): Date {
  const d = new Date(); d.setDate(d.getDate() + n); return d;
}
function daysAgo(n: number): Date {
  const d = new Date(); d.setDate(d.getDate() - n); return d;
}
function dateOnly(d: Date): string {
  return d.toISOString().split('T')[0];
}
function setTime(base: Date, h: number, m: number): Date {
  const d = new Date(base); d.setHours(h, m, 0, 0); return d;
}
async function hashPw(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

// ======================== MAIN SEED ========================
export async function seedLunarisHMS() {
  const orgRepo = AppDataSource.getRepository(Organization);
  const locRepo = AppDataSource.getRepository(Location);
  const userRepo = AppDataSource.getRepository(User);
  const deptRepo = AppDataSource.getRepository(Department);
  const svcRepo = AppDataSource.getRepository(Service);
  const apptRepo = AppDataSource.getRepository(Appointment);
  const availRepo = AppDataSource.getRepository(DoctorAvailability);
  const allergyRepo = AppDataSource.getRepository(Allergy);
  const mrRepo = AppDataSource.getRepository(MedicalRecord);
  const cnRepo = AppDataSource.getRepository(ConsultationNote);
  const diagRepo = AppDataSource.getRepository(Diagnosis);
  const billRepo = AppDataSource.getRepository(Bill);
  const rxRepo = AppDataSource.getRepository(Prescription);
  const rxItemRepo = AppDataSource.getRepository(PrescriptionItem);
  const medRepo = AppDataSource.getRepository(Medicine);
  const labTestRepo = AppDataSource.getRepository(LabTest);
  const labOrderRepo = AppDataSource.getRepository(LabOrder);
  const labOrderItemRepo = AppDataSource.getRepository(LabOrderItem);

  // ── Idempotency check ──
  const existing = await orgRepo.findOne({ where: { subdomain: 'lunaris-hms' } });
  if (existing) {
    return { alreadyExists: true, organizationId: existing.id };
  }

  const hashedStaff = await hashPw('Demo@123');
  const hashedAdmin = await hashPw('Admin@123');
  const hashedPatient = await hashPw('Patient@123');

  // ================================================================
  // 1. ORGANIZATION
  // ================================================================
  const org = orgRepo.create({
    name: 'Lunaris Multi-Specialty Hospital',
    subdomain: 'lunaris-hms',
    description: 'A 200-bed multi-specialty hospital in Chennai offering comprehensive healthcare services including emergency, OPD, IPD, diagnostics, and pharmacy.',
    email: 'info@lunaris-hospital.com',
    phone: '+91 44 2850 0000',
    address: 'No. 42, Rajiv Gandhi Salai (OMR), Perungudi, Chennai – 600096, Tamil Nadu, India',
    isActive: true,
    settings: {
      subscription: { plan: 'enterprise', status: 'active', startDate: new Date() },
      features: { pharmacy: true, laboratory: true, inpatient: true, radiology: true },
      limits: { maxUsers: 300, maxPatients: 10000, maxStorage: 100 },
      branding: { primaryColor: '#1a2332', secondaryColor: '#00d4aa' }
    }
  });
  await orgRepo.save(org);
  const orgId = org.id;
  console.log(`✅ Organization created: ${org.name} [${orgId}]`);

  // ================================================================
  // 2. LOCATION
  // ================================================================
  const loc = locRepo.create({
    organizationId: orgId,
    name: 'Lunaris Hospital – Main Campus',
    code: 'LNR',
    address: 'No. 42, Rajiv Gandhi Salai (OMR), Perungudi',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    phone: '+91 44 2850 0000',
    email: 'main@lunaris-hospital.com',
    isMainBranch: true,
    isActive: true,
    settings: {
      capacity: { beds: 200, opds: 50, emergencyBeds: 20 },
      features: { hasPharmacy: true, hasLaboratory: true, hasEmergency: true, hasRadiology: true },
      operatingHours: {
        monday: { open: '06:00', close: '22:00' },
        tuesday: { open: '06:00', close: '22:00' },
        wednesday: { open: '06:00', close: '22:00' },
        thursday: { open: '06:00', close: '22:00' },
        friday: { open: '06:00', close: '22:00' },
        saturday: { open: '07:00', close: '18:00' },
        sunday: { open: '08:00', close: '14:00' }
      }
    }
  });
  await locRepo.save(loc);
  console.log(`✅ Location created: ${loc.name}`);

  // ================================================================
  // 3. DEPARTMENTS (5)
  // ================================================================
  const deptConfigs = [
    { name: 'General Medicine', description: 'Primary care, internal medicine, chronic disease management', operatingHours: 'Mon-Sat 08:00-20:00', contactInfo: 'Ext 101' },
    { name: 'Cardiology', description: 'Heart & cardiovascular diagnostics and intervention', operatingHours: 'Mon-Sat 09:00-18:00', contactInfo: 'Ext 201' },
    { name: 'Orthopedics', description: 'Bone, joint, spine & sports medicine', operatingHours: 'Mon-Sat 09:00-17:00', contactInfo: 'Ext 301' },
    { name: 'Pediatrics', description: 'Neonatal & child healthcare, immunization', operatingHours: 'Mon-Sat 08:00-20:00', contactInfo: 'Ext 401' },
    { name: 'Gynecology & Obstetrics', description: "Women's health, maternity, fertility services", operatingHours: 'Mon-Sat 09:00-18:00, Emergency 24/7', contactInfo: 'Ext 501' }
  ];
  const deptMap = new Map<string, Department>();
  for (const dc of deptConfigs) {
    const d = deptRepo.create({ ...dc, organizationId: orgId, status: 'active' as any });
    await deptRepo.save(d);
    deptMap.set(dc.name, d);
  }
  console.log(`✅ ${deptConfigs.length} departments created`);

  // ================================================================
  // 4. SERVICES (2-3 per department, mapped)
  // ================================================================
  const svcConfigs: Record<string, { name: string; price: number; duration: number; desc: string }[]> = {
    'General Medicine': [
      { name: 'General Consultation', price: 500, duration: 20, desc: 'OPD consultation with physician' },
      { name: 'Comprehensive Health Checkup', price: 3500, duration: 90, desc: 'Full-body health screening' },
      { name: 'Chronic Disease Management', price: 700, duration: 30, desc: 'Diabetes, hypertension follow-up' }
    ],
    'Cardiology': [
      { name: 'Cardiology Consultation', price: 800, duration: 30, desc: 'Heart specialist consultation' },
      { name: 'ECG', price: 400, duration: 15, desc: '12-lead electrocardiogram' },
      { name: '2D Echocardiography', price: 2000, duration: 30, desc: 'Cardiac ultrasound imaging' }
    ],
    'Orthopedics': [
      { name: 'Orthopedic Consultation', price: 600, duration: 20, desc: 'Bone & joint assessment' },
      { name: 'Physiotherapy Session', price: 500, duration: 45, desc: 'Rehab & physical therapy' }
    ],
    'Pediatrics': [
      { name: 'Pediatric Consultation', price: 500, duration: 20, desc: 'Child health assessment' },
      { name: 'Immunization', price: 800, duration: 15, desc: 'Childhood vaccination program' }
    ],
    'Gynecology & Obstetrics': [
      { name: 'Gynecology Consultation', price: 700, duration: 25, desc: "Women's health check" },
      { name: 'Prenatal Care Package', price: 5000, duration: 60, desc: 'Comprehensive pregnancy care' }
    ]
  };
  const svcMap = new Map<string, Service>();
  for (const [deptName, svcs] of Object.entries(svcConfigs)) {
    const dept = deptMap.get(deptName)!;
    for (const s of svcs) {
      const svc = svcRepo.create({
        name: s.name,
        description: s.desc,
        status: 'active' as any,
        averageDuration: s.duration,
        departmentId: dept.id,
        department: dept,
        organizationId: orgId
      } as any);
      await svcRepo.save(svc);
      svcMap.set(s.name, svc);
    }
  }
  console.log(`✅ ${svcMap.size} services created`);

  // ================================================================
  // 5. ADMIN
  // ================================================================
  const admin = userRepo.create({
    email: 'admin@lunaris-hospital.com',
    firstName: 'Arun',
    lastName: 'Venkatesh',
    phone: '+91 9840000001',
    password: hashedAdmin,
    role: UserRole.ADMIN,
    organizationId: orgId,
    locationId: loc.id,
    isActive: true,
    gender: 'Male',
    dateOfBirth: new Date('1980-06-15'),
    address: '12 Anna Nagar, Chennai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    postalCode: '600040'
  });
  await userRepo.save(admin);
  console.log(`✅ Admin: admin@lunaris-hospital.com / Admin@123`);

  // ================================================================
  // 6. DOCTORS (5 — one per department, full profiles)
  // ================================================================
  const doctorConfigs = [
    {
      firstName: 'Rajesh', lastName: 'Iyer', email: 'dr.rajesh.iyer@lunaris-hospital.com',
      phone: '+91 9840010001', dept: 'General Medicine', specialization: 'Internal Medicine',
      qualification: 'MBBS, MD (Internal Medicine), FICP', experience: 18,
      consultationFee: 500, licenseNumber: 'TN-MCI-2007-10234',
      gender: 'Male', dob: '1975-03-12', bloodGroup: 'B+',
      workingDays: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
      availableFrom: '08:00', availableTo: '16:00',
      joinDate: '2018-04-01'
    },
    {
      firstName: 'Priya', lastName: 'Nair', email: 'dr.priya.nair@lunaris-hospital.com',
      phone: '+91 9840010002', dept: 'Cardiology', specialization: 'Interventional Cardiology',
      qualification: 'MBBS, DM (Cardiology), FACC', experience: 14,
      consultationFee: 800, licenseNumber: 'TN-MCI-2011-20456',
      gender: 'Female', dob: '1981-08-25', bloodGroup: 'A+',
      workingDays: ['Monday','Tuesday','Wednesday','Thursday','Friday'],
      availableFrom: '09:00', availableTo: '17:00',
      joinDate: '2019-07-15'
    },
    {
      firstName: 'Karthik', lastName: 'Subramanian', email: 'dr.karthik.s@lunaris-hospital.com',
      phone: '+91 9840010003', dept: 'Orthopedics', specialization: 'Joint Replacement & Sports Medicine',
      qualification: 'MBBS, MS (Ortho), Fellowship in Arthroplasty', experience: 12,
      consultationFee: 600, licenseNumber: 'TN-MCI-2013-30789',
      gender: 'Male', dob: '1983-11-02', bloodGroup: 'O+',
      workingDays: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
      availableFrom: '09:00', availableTo: '15:00',
      joinDate: '2020-01-10'
    },
    {
      firstName: 'Meenakshi', lastName: 'Sundaram', email: 'dr.meenakshi.s@lunaris-hospital.com',
      phone: '+91 9840010004', dept: 'Pediatrics', specialization: 'Neonatology & Child Development',
      qualification: 'MBBS, DCH, MD (Pediatrics)', experience: 16,
      consultationFee: 500, licenseNumber: 'TN-MCI-2009-40112',
      gender: 'Female', dob: '1978-01-30', bloodGroup: 'AB+',
      workingDays: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
      availableFrom: '08:00', availableTo: '18:00',
      joinDate: '2017-09-01'
    },
    {
      firstName: 'Lakshmi', lastName: 'Ramachandran', email: 'dr.lakshmi.r@lunaris-hospital.com',
      phone: '+91 9840010005', dept: 'Gynecology & Obstetrics', specialization: 'High-Risk Pregnancy & Fertility',
      qualification: 'MBBS, MS (OB-GYN), Fellowship in Reproductive Medicine', experience: 20,
      consultationFee: 700, licenseNumber: 'TN-MCI-2005-50345',
      gender: 'Female', dob: '1973-05-18', bloodGroup: 'O-',
      workingDays: ['Monday','Tuesday','Wednesday','Thursday','Friday'],
      availableFrom: '09:00', availableTo: '17:00',
      joinDate: '2016-03-20'
    }
  ];

  const doctorUsers: User[] = [];
  for (const dc of doctorConfigs) {
    const dept = deptMap.get(dc.dept)!;
    const doc = userRepo.create({
      email: dc.email,
      firstName: `Dr. ${dc.firstName}`,
      lastName: dc.lastName,
      phone: dc.phone,
      password: hashedStaff,
      role: UserRole.DOCTOR,
      organizationId: orgId,
      locationId: loc.id,
      departmentId: dept.id,
      isActive: true,
      specialization: dc.specialization,
      qualification: dc.qualification,
      experience: dc.experience,
      consultationFee: dc.consultationFee,
      licenseNumber: dc.licenseNumber,
      gender: dc.gender,
      dateOfBirth: new Date(dc.dob),
      bloodGroup: dc.bloodGroup,
      workingDays: dc.workingDays,
      availableFrom: dc.availableFrom,
      availableTo: dc.availableTo,
      joinDate: new Date(dc.joinDate),
      address: 'Chennai, Tamil Nadu',
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      nationality: 'Indian'
    });
    await userRepo.save(doc);
    doctorUsers.push(doc);
  }
  console.log(`✅ ${doctorUsers.length} doctors created`);

  // ================================================================
  // 7. DOCTOR AVAILABILITY (next 14 days for each doctor)
  // ================================================================
  for (let i = 0; i < doctorUsers.length; i++) {
    const doc = doctorUsers[i];
    const dc = doctorConfigs[i];
    const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    for (let d = 0; d < 14; d++) {
      const date = daysFromNow(d);
      const dayName = dayNames[date.getDay()];
      if (!dc.workingDays.includes(dayName)) continue;
      const av = availRepo.create({
        organizationId: orgId,
        doctorId: doc.id,
        date: dateOnly(date) as any,
        startTime: dc.availableFrom,
        endTime: dc.availableTo,
        slotDurationMinutes: 30,
        maxPatientsPerDay: 20,
        status: 'available' as any,
        isRecurring: false
      });
      await availRepo.save(av);
    }
    // Scenario: one doctor on leave day 7
    if (i === 2) { // Dr. Karthik on leave day 7
      const leaveDate = daysFromNow(7);
      const av = availRepo.create({
        organizationId: orgId,
        doctorId: doc.id,
        date: dateOnly(leaveDate) as any,
        startTime: '09:00',
        endTime: '15:00',
        slotDurationMinutes: 30,
        status: 'on-leave' as any,
        reason: 'Conference: International Arthroplasty Summit, New Delhi',
        isRecurring: false
      });
      await availRepo.save(av);
    }
  }
  console.log(`✅ Doctor availability created (14-day window)`);

  // ================================================================
  // 8. STAFF ROLES (Nurse ×3, Receptionist ×2, Pharmacist, Lab Tech, Accountant)
  //    + 1 Inactive nurse for edge-case coverage
  // ================================================================
  const staffConfigs = [
    // Nurses (3 active + 1 inactive)
    { role: UserRole.NURSE, email: 'nurse.anitha@lunaris-hospital.com', firstName: 'Anitha', lastName: 'Krishnan', phone: '+91 9840020001', deptName: 'General Medicine', gender: 'Female', active: true },
    { role: UserRole.NURSE, email: 'nurse.divya@lunaris-hospital.com', firstName: 'Divya', lastName: 'Mohan', phone: '+91 9840020002', deptName: 'Pediatrics', gender: 'Female', active: true },
    { role: UserRole.NURSE, email: 'nurse.ravi@lunaris-hospital.com', firstName: 'Ravi', lastName: 'Kumar', phone: '+91 9840020003', deptName: 'Cardiology', gender: 'Male', active: true },
    { role: UserRole.NURSE, email: 'nurse.selvi@lunaris-hospital.com', firstName: 'Selvi', lastName: 'Pandian', phone: '+91 9840020004', deptName: 'Orthopedics', gender: 'Female', active: false }, // INACTIVE
    // Receptionists
    { role: UserRole.RECEPTIONIST, email: 'reception.priya@lunaris-hospital.com', firstName: 'Priya', lastName: 'Sharma', phone: '+91 9840030001', deptName: null, gender: 'Female', active: true },
    { role: UserRole.RECEPTIONIST, email: 'reception.kumar@lunaris-hospital.com', firstName: 'Kumar', lastName: 'Srinivasan', phone: '+91 9840030002', deptName: null, gender: 'Male', active: true },
    // Pharmacist
    { role: UserRole.PHARMACIST, email: 'pharma.ganesh@lunaris-hospital.com', firstName: 'Ganesh', lastName: 'Pillai', phone: '+91 9840040001', deptName: null, gender: 'Male', active: true },
    // Lab Technician
    { role: UserRole.LAB_TECHNICIAN, email: 'lab.sudha@lunaris-hospital.com', firstName: 'Sudha', lastName: 'Rajan', phone: '+91 9840050001', deptName: null, gender: 'Female', active: true },
    // Accountant
    { role: UserRole.ACCOUNTANT, email: 'accounts.vijay@lunaris-hospital.com', firstName: 'Vijay', lastName: 'Narayanan', phone: '+91 9840060001', deptName: null, gender: 'Male', active: true }
  ];
  const staffUsers: User[] = [];
  for (const sc of staffConfigs) {
    const dept = sc.deptName ? deptMap.get(sc.deptName) : undefined;
    const u = userRepo.create({
      email: sc.email,
      firstName: sc.firstName,
      lastName: sc.lastName,
      phone: sc.phone,
      password: hashedStaff,
      role: sc.role,
      organizationId: orgId,
      locationId: loc.id,
      departmentId: dept?.id || undefined,
      isActive: sc.active,
      gender: sc.gender,
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      nationality: 'Indian'
    });
    await userRepo.save(u);
    staffUsers.push(u);
  }
  console.log(`✅ ${staffUsers.length} staff members created (incl. 1 inactive nurse)`);

  // ================================================================
  // 9. PATIENTS (5 – full demographics, varied profiles)
  //    Patient 5 is inactive (discharged/transferred)
  // ================================================================
  const patientConfigs = [
    {
      firstName: 'Ramesh', lastName: 'Babu', email: 'ramesh.babu@gmail.com',
      phone: '+91 9876500001', gender: 'Male', dob: '1965-04-10', bloodGroup: 'B+' as const,
      maritalStatus: 'married' as const, fatherOrSpouseName: 'Lakshmi Babu',
      address: '15, T. Nagar, Chennai', city: 'Chennai', postalCode: '600017',
      emergencyContact: '+91 9876500099', aadhaarNumber: '234567890123', abhaId: 'ABHA-LNR-001',
      active: true, doctorIdx: 0, // mapped to Dr. Rajesh (Gen Med)
      // Scenario: chronic patient (diabetes + hypertension), multiple visits
    },
    {
      firstName: 'Kavitha', lastName: 'Selvam', email: 'kavitha.selvam@gmail.com',
      phone: '+91 9876500002', gender: 'Female', dob: '1988-09-22', bloodGroup: 'A+' as const,
      maritalStatus: 'married' as const, fatherOrSpouseName: 'Selvam R.',
      address: '8/2, Adyar, Chennai', city: 'Chennai', postalCode: '600020',
      emergencyContact: '+91 9876500098', aadhaarNumber: '345678901234', abhaId: 'ABHA-LNR-002',
      active: true, doctorIdx: 1, // mapped to Dr. Priya (Cardiology)
      // Scenario: cardiac patient, referred from Gen Med
    },
    {
      firstName: 'Arjun', lastName: 'Reddy', email: 'arjun.reddy@gmail.com',
      phone: '+91 9876500003', gender: 'Male', dob: '1995-12-05', bloodGroup: 'O+' as const,
      maritalStatus: 'single' as const, fatherOrSpouseName: 'Venkat Reddy',
      address: '22, Velachery, Chennai', city: 'Chennai', postalCode: '600042',
      emergencyContact: '+91 9876500097', aadhaarNumber: '456789012345', abhaId: 'ABHA-LNR-003',
      active: true, doctorIdx: 2, // mapped to Dr. Karthik (Ortho)
      // Scenario: sports injury, emergency admission, drug allergy
    },
    {
      firstName: 'Priya', lastName: 'Murugan', email: 'priya.murugan@gmail.com',
      phone: '+91 9876500004', gender: 'Female', dob: '2019-07-14', bloodGroup: 'AB+' as const,
      maritalStatus: 'single' as const, fatherOrSpouseName: 'Murugan K.',
      address: '5, Porur, Chennai', city: 'Chennai', postalCode: '600116',
      emergencyContact: '+91 9876500096', aadhaarNumber: '567890123456', abhaId: 'ABHA-LNR-004',
      active: true, doctorIdx: 3, // mapped to Dr. Meenakshi (Pediatrics)
      // Scenario: child patient, food allergy, immunization visits
    },
    {
      firstName: 'Shalini', lastName: 'Gopal', email: 'shalini.gopal@gmail.com',
      phone: '+91 9876500005', gender: 'Female', dob: '1990-02-28', bloodGroup: 'O-' as const,
      maritalStatus: 'married' as const, fatherOrSpouseName: 'Gopal V.',
      address: '33, Tambaram, Chennai', city: 'Chennai', postalCode: '600045',
      emergencyContact: '+91 9876500095', aadhaarNumber: '678901234567', abhaId: 'ABHA-LNR-005',
      active: false, doctorIdx: 4, // mapped to Dr. Lakshmi (OB-GYN) — INACTIVE (transferred)
      // Scenario: prenatal care completed, discharged, inactive record
    }
  ];

  const patientUsers: User[] = [];
  for (const pc of patientConfigs) {
    const doc = doctorUsers[pc.doctorIdx];
    const dept = deptMap.get(doctorConfigs[pc.doctorIdx].dept)!;
    const p = userRepo.create({
      email: pc.email,
      firstName: pc.firstName,
      lastName: pc.lastName,
      phone: pc.phone,
      password: hashedPatient,
      role: UserRole.PATIENT,
      organizationId: orgId,
      locationId: loc.id,
      isActive: pc.active,
      gender: pc.gender,
      dateOfBirth: new Date(pc.dob),
      bloodGroup: pc.bloodGroup,
      maritalStatus: pc.maritalStatus,
      fatherOrSpouseName: pc.fatherOrSpouseName,
      address: pc.address,
      city: pc.city,
      state: 'Tamil Nadu',
      country: 'India',
      postalCode: pc.postalCode,
      emergencyContact: pc.emergencyContact,
      aadhaarNumber: pc.aadhaarNumber,
      abhaId: pc.abhaId,
      nationality: 'Indian',
      primaryDepartmentId: dept.id
    });
    await userRepo.save(p);
    patientUsers.push(p);
  }
  console.log(`✅ ${patientUsers.length} patients created (incl. 1 inactive)`);

  // ================================================================
  // 10. ALLERGIES
  // ================================================================
  const allergyConfigs = [
    // Patient 0 (Ramesh) – Penicillin allergy
    { patientIdx: 0, type: AllergenType.DRUG, name: 'Penicillin', severity: ReactionSeverity.SEVERE, desc: 'Anaphylaxis; requires epinephrine', dateId: '2010-03-15' },
    // Patient 2 (Arjun) – Ibuprofen allergy
    { patientIdx: 2, type: AllergenType.DRUG, name: 'Ibuprofen (NSAIDs)', severity: ReactionSeverity.MODERATE, desc: 'Urticaria and bronchospasm', dateId: '2022-01-10' },
    // Patient 3 (Priya child) – Peanut allergy
    { patientIdx: 3, type: AllergenType.FOOD, name: 'Peanuts', severity: ReactionSeverity.LIFE_THREATENING, desc: 'Severe anaphylaxis – carries epinephrine auto-injector', dateId: '2021-05-20' },
    // Patient 3 – Dust mites (environmental)
    { patientIdx: 3, type: AllergenType.ENVIRONMENTAL, name: 'House Dust Mites', severity: ReactionSeverity.MILD, desc: 'Allergic rhinitis, mild wheezing', dateId: '2022-08-01' },
    // Patient 1 (Kavitha) – Latex allergy
    { patientIdx: 1, type: AllergenType.OTHER, name: 'Latex', severity: ReactionSeverity.MODERATE, desc: 'Contact dermatitis with latex gloves', dateId: '2019-11-05' }
  ];
  for (const ac of allergyConfigs) {
    const a = allergyRepo.create({
      organizationId: orgId,
      patient: patientUsers[ac.patientIdx],
      allergenType: ac.type,
      allergenName: ac.name,
      reactionSeverity: ac.severity,
      reactionDescription: ac.desc,
      dateIdentified: new Date(ac.dateId),
      verifiedBy: doctorUsers[patientConfigs[ac.patientIdx].doctorIdx],
      isActive: true
    });
    await allergyRepo.save(a);
  }
  console.log(`✅ ${allergyConfigs.length} allergies created`);

  // ================================================================
  // 11. MEDICINES (pharmacy catalog)
  // ================================================================
  const medConfigs = [
    { name: 'Metformin 500mg', generic: 'Metformin Hydrochloride', brand: 'Glycomet', mfr: 'USV', cat: 'Antidiabetic', form: 'tablet', strength: '500mg', unit: 8, sell: 12, batch: 'LNR-MED-001', stock: 500, reorder: 100, schedule: 'schedule_h' as const, rxReq: true, desc: 'Oral hypoglycemic for type 2 diabetes', sideEffects: 'GI upset, metallic taste', contra: 'Renal impairment, lactic acidosis risk' },
    { name: 'Atorvastatin 10mg', generic: 'Atorvastatin Calcium', brand: 'Lipitor', mfr: 'Pfizer', cat: 'Statin', form: 'tablet', strength: '10mg', unit: 5, sell: 9, batch: 'LNR-MED-002', stock: 300, reorder: 50, schedule: 'schedule_h' as const, rxReq: true, desc: 'Cholesterol-lowering statin', sideEffects: 'Myalgia, liver enzyme elevation', contra: 'Active liver disease, pregnancy' },
    { name: 'Amlodipine 5mg', generic: 'Amlodipine Besylate', brand: 'Amlong', mfr: 'Micro Labs', cat: 'Antihypertensive', form: 'tablet', strength: '5mg', unit: 3, sell: 6, batch: 'LNR-MED-003', stock: 400, reorder: 80, schedule: 'schedule_h' as const, rxReq: true, desc: 'Calcium channel blocker for hypertension', sideEffects: 'Ankle edema, dizziness', contra: 'Severe aortic stenosis' },
    { name: 'Paracetamol 650mg', generic: 'Paracetamol', brand: 'Dolo 650', mfr: 'Micro Labs', cat: 'Analgesic/Antipyretic', form: 'tablet', strength: '650mg', unit: 1.5, sell: 3, batch: 'LNR-MED-004', stock: 1000, reorder: 200, schedule: 'otc' as const, rxReq: false, desc: 'Pain and fever reducer', sideEffects: 'Rare – hepatotoxicity at overdose', contra: 'Severe hepatic impairment' },
    { name: 'Amoxicillin 500mg', generic: 'Amoxicillin Trihydrate', brand: 'Mox 500', mfr: 'Ranbaxy', cat: 'Antibiotic', form: 'capsule', strength: '500mg', unit: 4, sell: 8, batch: 'LNR-MED-005', stock: 250, reorder: 50, schedule: 'schedule_h' as const, rxReq: true, desc: 'Broad-spectrum penicillin antibiotic', sideEffects: 'Diarrhea, rash, nausea', contra: 'Penicillin allergy' },
    { name: 'Clopidogrel 75mg', generic: 'Clopidogrel Bisulfate', brand: 'Plavix', mfr: 'Sanofi', cat: 'Antiplatelet', form: 'tablet', strength: '75mg', unit: 6, sell: 10, batch: 'LNR-MED-006', stock: 200, reorder: 40, schedule: 'schedule_h' as const, rxReq: true, desc: 'Antiplatelet agent for cardiovascular events', sideEffects: 'Bleeding risk, bruising', contra: 'Active bleeding' },
    { name: 'Diclofenac 50mg', generic: 'Diclofenac Sodium', brand: 'Voveran', mfr: 'Novartis', cat: 'NSAID', form: 'tablet', strength: '50mg', unit: 2, sell: 5, batch: 'LNR-MED-007', stock: 350, reorder: 70, schedule: 'schedule_h' as const, rxReq: true, desc: 'Anti-inflammatory pain reliever', sideEffects: 'GI bleeding, renal impairment', contra: 'NSAID allergy, active GI ulcer' },
    { name: 'Cetirizine 10mg', generic: 'Cetirizine Hydrochloride', brand: 'Zyrtec', mfr: 'UCB', cat: 'Antihistamine', form: 'tablet', strength: '10mg', unit: 1, sell: 3, batch: 'LNR-MED-008', stock: 600, reorder: 100, schedule: 'otc' as const, rxReq: false, desc: 'Non-drowsy antihistamine for allergies', sideEffects: 'Mild drowsiness', contra: 'Severe renal impairment' }
  ];
  const medicineEntities: Medicine[] = [];
  for (const mc of medConfigs) {
    const m = medRepo.create({
      organizationId: orgId,
      name: mc.name,
      genericName: mc.generic,
      brandName: mc.brand,
      manufacturer: mc.mfr,
      category: mc.cat,
      dosageForm: mc.form,
      strength: mc.strength,
      unitPrice: mc.unit,
      sellingPrice: mc.sell,
      batchNumber: mc.batch,
      manufactureDate: new Date('2024-06-01'),
      expiryDate: new Date('2026-05-31'),
      currentStock: mc.stock,
      reorderLevel: mc.reorder,
      isActive: true,
      description: mc.desc,
      sideEffects: mc.sideEffects,
      contraindications: mc.contra,
      storageInstructions: 'Store below 30°C in a dry place',
      scheduleType: mc.schedule,
      requiresPrescription: mc.rxReq,
      isNarcotic: false
    });
    await medRepo.save(m);
    medicineEntities.push(m);
  }
  console.log(`✅ ${medicineEntities.length} medicines created`);

  // ================================================================
  // 12. LAB TEST CATALOG
  // ================================================================
  const labConfigs = [
    { name: 'Complete Blood Count', code: 'LNR-CBC', desc: 'Full hemogram including WBC differential', cat: 'hematology', sample: 'Blood (EDTA)', range: 'Hb: 12-16 g/dL; WBC: 4000-11000/μL', units: 'g/dL, cells/μL', cost: 350, tat: 120 },
    { name: 'Fasting Blood Glucose', code: 'LNR-FBG', desc: 'Blood sugar after 8-12h fasting', cat: 'biochemistry', sample: 'Blood (Fluoride)', range: '70-100 mg/dL', units: 'mg/dL', cost: 150, tat: 60 },
    { name: 'Lipid Profile', code: 'LNR-LIPID', desc: 'Total cholesterol, HDL, LDL, triglycerides', cat: 'biochemistry', sample: 'Blood (Serum)', range: 'TC<200, LDL<130, HDL>40, TG<150 mg/dL', units: 'mg/dL', cost: 500, tat: 180 },
    { name: 'HbA1c', code: 'LNR-HBA1C', desc: 'Glycated hemoglobin – 3-month average glucose', cat: 'biochemistry', sample: 'Blood (EDTA)', range: '<5.7% normal; 5.7-6.4% prediabetes; ≥6.5% diabetes', units: '%', cost: 600, tat: 240 },
    { name: 'Thyroid Panel (TSH, T3, T4)', code: 'LNR-THY', desc: 'Thyroid function assessment', cat: 'endocrine', sample: 'Blood (Serum)', range: 'TSH: 0.4-4.0 mIU/L', units: 'mIU/L, ng/dL', cost: 700, tat: 360 },
    { name: 'Urine Routine & Microscopy', code: 'LNR-URM', desc: 'Physical, chemical, and microscopic analysis', cat: 'pathology', sample: 'Urine (Mid-stream)', range: 'pH 4.5-8.0; Specific Gravity 1.005-1.030', units: 'various', cost: 200, tat: 90 },
    { name: 'ECG (12-Lead)', code: 'LNR-ECG', desc: '12-lead electrocardiogram recording', cat: 'other', sample: 'N/A (Non-invasive)', range: 'Normal sinus rhythm 60-100 bpm', units: 'bpm', cost: 400, tat: 30 },
    { name: 'Chest X-Ray', code: 'LNR-CXR', desc: 'PA view chest radiograph', cat: 'radiology', sample: 'N/A (Imaging)', range: 'No consolidation, normal cardiac silhouette', units: 'N/A', cost: 500, tat: 60 }
  ];
  const labTestEntities: LabTest[] = [];
  for (const lc of labConfigs) {
    const lt = labTestRepo.create({
      organizationId: orgId,
      name: lc.name,
      code: lc.code,
      description: lc.desc,
      category: lc.cat as any,
      sampleType: lc.sample,
      normalRange: lc.range,
      units: lc.units,
      cost: lc.cost,
      turnaroundTimeMinutes: lc.tat,
      isActive: true
    });
    await labTestRepo.save(lt);
    labTestEntities.push(lt);
  }
  console.log(`✅ ${labTestEntities.length} lab tests created`);

  // ================================================================
  // 13. APPOINTMENTS (covering every scenario)
  // ================================================================
  const appointments: Appointment[] = [];

  // Helper to create appointment
  async function createAppt(cfg: {
    patient: User; doctor: User; service: Service;
    start: Date; durationMin: number; status: AppointmentStatus;
    mode?: AppointmentMode; type?: AppointmentType;
    notes?: string; reason?: string; consultationNotes?: string;
    cancellationReason?: string; cancelledBy?: User;
  }): Promise<Appointment> {
    const end = new Date(cfg.start.getTime() + cfg.durationMin * 60000);
    const a = apptRepo.create({
      organizationId: orgId,
      patient: cfg.patient,
      doctor: cfg.doctor,
      service: cfg.service,
      startTime: cfg.start,
      endTime: end,
      status: cfg.status,
      mode: cfg.mode || AppointmentMode.IN_PERSON,
      appointmentType: cfg.type || AppointmentType.STANDARD,
      notes: cfg.notes,
      reason: cfg.reason,
      consultationNotes: cfg.consultationNotes,
      cancellationReason: cfg.cancellationReason,
      cancelledBy: cfg.cancelledBy || undefined,
      cancelledAt: cfg.cancellationReason ? new Date() : undefined,
      completedAt: cfg.status === AppointmentStatus.COMPLETED ? cfg.start : undefined
    });
    await apptRepo.save(a);
    appointments.push(a);
    return a;
  }

  // --- Patient 0 (Ramesh): Chronic patient with MULTIPLE visits ---
  // Visit 1: 30 days ago – Completed (diabetes diagnosis)
  const a1 = await createAppt({
    patient: patientUsers[0], doctor: doctorUsers[0],
    service: svcMap.get('General Consultation')!,
    start: setTime(daysAgo(30), 9, 0), durationMin: 20,
    status: AppointmentStatus.COMPLETED,
    reason: 'Routine health checkup – feeling fatigued',
    consultationNotes: 'Fasting glucose 186 mg/dL. Initiated Metformin 500mg BD. Advised diet control.'
  });
  // Visit 2: 15 days ago – Completed (follow-up)
  const a2 = await createAppt({
    patient: patientUsers[0], doctor: doctorUsers[0],
    service: svcMap.get('Chronic Disease Management')!,
    start: setTime(daysAgo(15), 10, 0), durationMin: 30,
    status: AppointmentStatus.COMPLETED,
    reason: 'Diabetes follow-up',
    consultationNotes: 'FBG improved to 142. Added Amlodipine 5mg for BP 150/95. Continue Metformin.'
  });
  // Visit 3: Tomorrow – Confirmed (upcoming follow-up)
  await createAppt({
    patient: patientUsers[0], doctor: doctorUsers[0],
    service: svcMap.get('Chronic Disease Management')!,
    start: setTime(daysFromNow(1), 9, 30), durationMin: 30,
    status: AppointmentStatus.CONFIRMED,
    reason: 'Chronic disease follow-up – BP & sugar review'
  });
  // Visit 4: 5 days from now – Pending (not yet confirmed)
  await createAppt({
    patient: patientUsers[0], doctor: doctorUsers[0],
    service: svcMap.get('Comprehensive Health Checkup')!,
    start: setTime(daysFromNow(5), 8, 0), durationMin: 90,
    status: AppointmentStatus.PENDING,
    reason: 'Annual comprehensive health checkup'
  });

  // --- Patient 1 (Kavitha): Cardiology, telemedicine, referred from Gen Med ---
  // Visit 1: 20 days ago – Completed (initial cardiology consult, referred from Gen Med)
  const a5 = await createAppt({
    patient: patientUsers[1], doctor: doctorUsers[1],
    service: svcMap.get('Cardiology Consultation')!,
    start: setTime(daysAgo(20), 11, 0), durationMin: 30,
    status: AppointmentStatus.COMPLETED,
    reason: 'Referred from General Medicine – palpitations & chest tightness',
    consultationNotes: 'ECG showed mild ST depression. Echo scheduled. Started Atorvastatin 10mg.'
  });
  // Visit 2: 10 days ago – Completed (Echo test)
  await createAppt({
    patient: patientUsers[1], doctor: doctorUsers[1],
    service: svcMap.get('2D Echocardiography')!,
    start: setTime(daysAgo(10), 14, 0), durationMin: 30,
    status: AppointmentStatus.COMPLETED,
    reason: 'Follow-up 2D Echo',
    consultationNotes: 'LVEF 55% (normal). Mild diastolic dysfunction. Continue medications.'
  });
  // Visit 3: 3 days from now – Telemedicine follow-up
  await createAppt({
    patient: patientUsers[1], doctor: doctorUsers[1],
    service: svcMap.get('Cardiology Consultation')!,
    start: setTime(daysFromNow(3), 16, 0), durationMin: 20,
    status: AppointmentStatus.CONFIRMED,
    mode: AppointmentMode.TELEMEDICINE,
    reason: 'Telemedicine follow-up – review lab reports',
    notes: 'Patient requested virtual appointment'
  });

  // --- Patient 2 (Arjun): Emergency, cancelled, rescheduled ---
  // Visit 1: 7 days ago – Emergency, Completed
  const a8 = await createAppt({
    patient: patientUsers[2], doctor: doctorUsers[2],
    service: svcMap.get('Orthopedic Consultation')!,
    start: setTime(daysAgo(7), 22, 30), durationMin: 45,
    status: AppointmentStatus.COMPLETED,
    type: AppointmentType.EMERGENCY,
    reason: 'Acute knee injury during football – suspected ACL tear',
    consultationNotes: 'MRI ordered. Knee immobilizer applied. Prescribed Diclofenac (not Ibuprofen – NSAID allergy). Follow-up in 5 days.'
  });
  // Visit 2: 2 days ago – Cancelled by patient
  await createAppt({
    patient: patientUsers[2], doctor: doctorUsers[2],
    service: svcMap.get('Orthopedic Consultation')!,
    start: setTime(daysAgo(2), 10, 0), durationMin: 20,
    status: AppointmentStatus.CANCELLED,
    reason: 'Follow-up for ACL injury',
    cancellationReason: 'Patient unable to travel – rescheduled',
    cancelledBy: patientUsers[2]
  });
  // Visit 3: 4 days from now – Rescheduled (new appointment after cancellation)
  await createAppt({
    patient: patientUsers[2], doctor: doctorUsers[2],
    service: svcMap.get('Orthopedic Consultation')!,
    start: setTime(daysFromNow(4), 11, 0), durationMin: 30,
    status: AppointmentStatus.CONFIRMED,
    reason: 'Rescheduled: ACL injury follow-up with MRI report',
    notes: 'Rescheduled from cancelled appointment'
  });
  // Visit 4: Physio session – Pending
  await createAppt({
    patient: patientUsers[2], doctor: doctorUsers[2],
    service: svcMap.get('Physiotherapy Session')!,
    start: setTime(daysFromNow(10), 14, 0), durationMin: 45,
    status: AppointmentStatus.PENDING,
    reason: 'Post-injury physiotherapy – knee rehabilitation'
  });

  // --- Patient 3 (Priya – child): Immunization, no-show ---
  // Visit 1: 60 days ago – Completed (routine checkup)
  await createAppt({
    patient: patientUsers[3], doctor: doctorUsers[3],
    service: svcMap.get('Pediatric Consultation')!,
    start: setTime(daysAgo(60), 10, 0), durationMin: 20,
    status: AppointmentStatus.COMPLETED,
    reason: 'Routine pediatric checkup – growth & development',
    consultationNotes: 'Height/weight on 50th percentile. Development normal. Next immunization due.'
  });
  // Visit 2: 30 days ago – No-Show (missed immunization)
  await createAppt({
    patient: patientUsers[3], doctor: doctorUsers[3],
    service: svcMap.get('Immunization')!,
    start: setTime(daysAgo(30), 11, 0), durationMin: 15,
    status: AppointmentStatus.NOSHOW,
    reason: 'DPT booster vaccination',
    notes: 'Patient did not show up – family emergency reported'
  });
  // Visit 3: 2 days from now – Confirmed (rescheduled immunization)
  await createAppt({
    patient: patientUsers[3], doctor: doctorUsers[3],
    service: svcMap.get('Immunization')!,
    start: setTime(daysFromNow(2), 9, 0), durationMin: 15,
    status: AppointmentStatus.CONFIRMED,
    reason: 'Rescheduled: DPT booster vaccination'
  });

  // --- Patient 4 (Shalini – inactive): OB-GYN, completed prenatal ---
  // Visit 1: 90 days ago – Completed
  await createAppt({
    patient: patientUsers[4], doctor: doctorUsers[4],
    service: svcMap.get('Prenatal Care Package')!,
    start: setTime(daysAgo(90), 10, 0), durationMin: 60,
    status: AppointmentStatus.COMPLETED,
    reason: 'First prenatal visit – 12 weeks gestation',
    consultationNotes: 'Dating scan normal. All baseline labs ordered. Folic acid prescribed.'
  });
  // Visit 2: 45 days ago – Completed
  await createAppt({
    patient: patientUsers[4], doctor: doctorUsers[4],
    service: svcMap.get('Gynecology Consultation')!,
    start: setTime(daysAgo(45), 11, 0), durationMin: 25,
    status: AppointmentStatus.COMPLETED,
    reason: 'Second trimester follow-up',
    consultationNotes: 'Anomaly scan normal. BP stable. Patient transferred to higher center for delivery.'
  });

  // --- In-Progress appointment (current time) for overlapping schedule scenario ---
  await createAppt({
    patient: patientUsers[0], doctor: doctorUsers[0],
    service: svcMap.get('General Consultation')!,
    start: setTime(new Date(), new Date().getHours(), 0), durationMin: 20,
    status: AppointmentStatus.IN_PROGRESS,
    reason: 'Walk-in: acute headache & dizziness'
  });

  console.log(`✅ ${appointments.length} appointments created (all scenarios covered)`);

  // ================================================================
  // 14. CONSULTATION NOTES (for completed appointments)
  // ================================================================
  const cnConfigs = [
    {
      appt: a1, patientIdx: 0, doctorIdx: 0,
      chief: 'Persistent fatigue and increased thirst for 3 weeks',
      hpi: 'Gradual onset fatigue, polyuria, polydipsia. No weight loss. Family history: father diabetic.',
      pmh: 'No known chronic illness prior. Hypertension suspected (BP 148/92).',
      meds: 'None',
      exam: 'BMI 28.5, BP 148/92, FBG 186 mg/dL. No retinopathy. Peripheral pulses normal.',
      assessment: 'Type 2 Diabetes Mellitus – newly diagnosed. Stage 1 Hypertension.',
      plan: '1. Metformin 500mg BD  2. Lifestyle modification  3. HbA1c + Lipid profile in 2 weeks  4. Follow-up 15 days',
      followUp: daysAgo(15), followUpInstr: 'Fasting labs before visit. Food diary.',
      signed: true
    },
    {
      appt: a2, patientIdx: 0, doctorIdx: 0,
      chief: 'Diabetes follow-up – 2 weeks post diagnosis',
      hpi: 'Better energy. FBG self-monitored 130-155 range. Some ankle swelling.',
      pmh: 'T2DM (2 weeks). Hypertension.',
      meds: 'Metformin 500mg BD',
      exam: 'BP 150/95 (persistent). Mild pedal edema. FBG 142 mg/dL.',
      assessment: 'T2DM – improving. Hypertension – inadequately controlled.',
      plan: '1. Continue Metformin  2. Add Amlodipine 5mg OD  3. Low-salt diet  4. Lipid profile today  5. Follow-up 2 weeks',
      followUp: daysFromNow(1), followUpInstr: 'Monitor BP at home twice daily. Bring readings.',
      signed: true
    },
    {
      appt: a5, patientIdx: 1, doctorIdx: 1,
      chief: 'Palpitations and chest tightness on exertion',
      hpi: 'Intermittent palpitations × 1 month, worsening on climbing stairs. Referred by Dr. Rajesh (Gen Med).',
      pmh: 'Hypothyroidism (on Eltroxin). Family h/o MI (father at 55).',
      meds: 'Eltroxin 50mcg',
      exam: 'Pulse irregular. BP 130/85. S1/S2 normal. ECG: mild ST depression V4-V6.',
      assessment: 'Suspected coronary artery disease. Needs 2D Echo for LVEF assessment.',
      plan: '1. 2D Echo in 10 days  2. Start Atorvastatin 10mg HS  3. Low-fat diet  4. Stress test if Echo abnormal',
      followUp: daysAgo(10), followUpInstr: 'Fasting for lipid profile. Avoid caffeine 24h before Echo.',
      signed: true
    },
    {
      appt: a8, patientIdx: 2, doctorIdx: 2,
      chief: 'Acute right knee injury – football match',
      hpi: 'Twisted knee during tackle 2 hours ago. Immediate swelling, unable to bear weight. Heard a "pop".',
      pmh: 'No prior orthopedic issues. NSAID allergy (Ibuprofen → urticaria).',
      meds: 'None regular. ALLERGY: Ibuprofen.',
      exam: 'Right knee: effusion +, Lachman +ve, anterior drawer +ve. No fracture on X-ray.',
      assessment: 'Right ACL tear (Grade II-III) – likely surgical candidate.',
      plan: '1. MRI right knee ASAP  2. Knee immobilizer  3. Diclofenac 50mg BD (NOT Ibuprofen)  4. Ice + elevation  5. Review with MRI in 5 days',
      followUp: daysFromNow(4), followUpInstr: 'Bring MRI CD. Keep knee elevated. No weight bearing.',
      signed: true
    }
  ];
  for (const cc of cnConfigs) {
    const cn = cnRepo.create({
      organizationId: orgId,
      appointment: cc.appt,
      patient: patientUsers[cc.patientIdx],
      doctor: doctorUsers[cc.doctorIdx],
      chiefComplaint: cc.chief,
      historyPresentIllness: cc.hpi,
      pastMedicalHistory: cc.pmh,
      currentMedications: cc.meds,
      physicalExamination: cc.exam,
      assessment: cc.assessment,
      plan: cc.plan,
      followUpDate: cc.followUp,
      followUpInstructions: cc.followUpInstr,
      isSigned: cc.signed,
      signedAt: cc.signed ? new Date() : undefined,
      signedBy: cc.signed ? doctorUsers[cc.doctorIdx] : undefined
    });
    await cnRepo.save(cn);
  }
  console.log(`✅ ${cnConfigs.length} consultation notes created`);

  // ================================================================
  // 15. DIAGNOSES (chronic + acute, varied severity)
  // ================================================================
  const diagConfigs = [
    { patientIdx: 0, icd: 'E11.9', name: 'Type 2 Diabetes Mellitus', type: DiagnosisType.PRIMARY, status: DiagnosisStatus.CONFIRMED, severity: DiagnosisSeverity.MODERATE, chronic: true, onset: '2025-01-15', notes: 'FBG 186, HbA1c 8.2%. On Metformin.', doctorIdx: 0 },
    { patientIdx: 0, icd: 'I10', name: 'Essential Hypertension', type: DiagnosisType.SECONDARY, status: DiagnosisStatus.CONFIRMED, severity: DiagnosisSeverity.MILD, chronic: true, onset: '2025-01-30', notes: 'BP 150/95 on 2 readings. Started Amlodipine.', doctorIdx: 0 },
    { patientIdx: 1, icd: 'I25.1', name: 'Atherosclerotic Heart Disease', type: DiagnosisType.PRIMARY, status: DiagnosisStatus.PROVISIONAL, severity: DiagnosisSeverity.MODERATE, chronic: true, onset: '2025-01-20', notes: 'ECG: ST depression. Echo: mild diastolic dysfunction. Awaiting stress test.', doctorIdx: 1 },
    { patientIdx: 2, icd: 'S83.5', name: 'Sprain of ACL of Right Knee', type: DiagnosisType.PRIMARY, status: DiagnosisStatus.CONFIRMED, severity: DiagnosisSeverity.SEVERE, chronic: false, onset: dateOnly(daysAgo(7)), notes: 'Grade II-III ACL tear. MRI pending. Surgical evaluation planned.', doctorIdx: 2 },
    { patientIdx: 3, icd: 'J30.1', name: 'Allergic Rhinitis due to Pollen', type: DiagnosisType.SECONDARY, status: DiagnosisStatus.CONFIRMED, severity: DiagnosisSeverity.MILD, chronic: true, onset: '2023-08-01', notes: 'Seasonal; managed with Cetirizine PRN.', doctorIdx: 3 }
  ];
  for (const dc of diagConfigs) {
    const d = diagRepo.create({
      organizationId: orgId,
      patient: patientUsers[dc.patientIdx],
      diagnosedBy: doctorUsers[dc.doctorIdx],
      icd10Code: dc.icd,
      diagnosisName: dc.name,
      diagnosisType: dc.type,
      status: dc.status,
      severity: dc.severity,
      isChronic: dc.chronic,
      onsetDate: new Date(dc.onset),
      notes: dc.notes
    });
    await diagRepo.save(d);
  }
  console.log(`✅ ${diagConfigs.length} diagnoses created`);

  // ================================================================
  // 16. PRESCRIPTIONS
  // ================================================================
  // Rx 1: Patient 0 (Ramesh) – Metformin + Amlodipine (dispensed)
  const rx1 = rxRepo.create({
    organizationId: orgId,
    patientId: patientUsers[0].id,
    doctorId: doctorUsers[0].id,
    diagnosis: 'Type 2 Diabetes Mellitus; Essential Hypertension',
    notes: 'Continue for 30 days. Review HbA1c before next visit.',
    prescriptionDate: daysAgo(15) as any,
    status: PrescriptionStatus.DISPENSED
  });
  await rxRepo.save(rx1);
  // Rx 1 items
  await rxItemRepo.save(rxItemRepo.create({ organizationId: orgId, prescriptionId: rx1.id, medicineId: medicineEntities[0].id, dosage: '1 tablet', frequency: 'Twice a day (BD)', duration: '30 days', instructions: 'Take with meals', quantity: 60, status: PrescriptionItemStatus.DISPENSED }));
  await rxItemRepo.save(rxItemRepo.create({ organizationId: orgId, prescriptionId: rx1.id, medicineId: medicineEntities[2].id, dosage: '1 tablet', frequency: 'Once a day (OD)', duration: '30 days', instructions: 'Take in the morning', quantity: 30, status: PrescriptionItemStatus.DISPENSED }));

  // Rx 2: Patient 1 (Kavitha) – Atorvastatin (pending)
  const rx2 = rxRepo.create({
    organizationId: orgId,
    patientId: patientUsers[1].id,
    doctorId: doctorUsers[1].id,
    diagnosis: 'Suspected CAD; Dyslipidemia',
    notes: 'Monitor liver function after 6 weeks.',
    prescriptionDate: daysAgo(20) as any,
    status: PrescriptionStatus.PENDING
  });
  await rxRepo.save(rx2);
  await rxItemRepo.save(rxItemRepo.create({ organizationId: orgId, prescriptionId: rx2.id, medicineId: medicineEntities[1].id, dosage: '1 tablet', frequency: 'Once at bedtime (HS)', duration: '30 days', instructions: 'Take at bedtime', quantity: 30, status: PrescriptionItemStatus.PENDING }));
  await rxItemRepo.save(rxItemRepo.create({ organizationId: orgId, prescriptionId: rx2.id, medicineId: medicineEntities[5].id, dosage: '1 tablet', frequency: 'Once a day (OD)', duration: '30 days', instructions: 'Take with breakfast', quantity: 30, status: PrescriptionItemStatus.PENDING }));

  // Rx 3: Patient 2 (Arjun) – Diclofenac + Paracetamol (partially dispensed – Diclofenac given, Paracetamol out of stock)
  const rx3 = rxRepo.create({
    organizationId: orgId,
    patientId: patientUsers[2].id,
    doctorId: doctorUsers[2].id,
    diagnosis: 'ACL Sprain – Right Knee',
    notes: 'AVOID Ibuprofen/NSAIDs (allergy). Diclofenac safe per patient history.',
    prescriptionDate: daysAgo(7) as any,
    status: PrescriptionStatus.PARTIALLY_DISPENSED
  });
  await rxRepo.save(rx3);
  await rxItemRepo.save(rxItemRepo.create({ organizationId: orgId, prescriptionId: rx3.id, medicineId: medicineEntities[6].id, dosage: '1 tablet', frequency: 'Twice a day (BD)', duration: '7 days', instructions: 'Take after meals. Stop if GI symptoms.', quantity: 14, status: PrescriptionItemStatus.DISPENSED }));
  await rxItemRepo.save(rxItemRepo.create({ organizationId: orgId, prescriptionId: rx3.id, medicineId: medicineEntities[3].id, dosage: '1 tablet', frequency: 'Three times a day (TDS) as needed', duration: '7 days', instructions: 'For pain/fever. Max 3 per day.', quantity: 21, status: PrescriptionItemStatus.OUT_OF_STOCK }));

  console.log(`✅ 3 prescriptions created (dispensed, pending, partially_dispensed)`);

  // ================================================================
  // 17. LAB ORDERS
  // ================================================================
  // Lab Order 1: Patient 0 – CBC + FBG + HbA1c + Lipid (completed)
  const lo1 = labOrderRepo.create({
    organizationId: orgId,
    orderNumber: 'LAB-LNR-2025-0001',
    doctorId: doctorUsers[0].id,
    patientId: patientUsers[0].id,
    orderDate: daysAgo(15) as any,
    clinicalNotes: 'Diabetes follow-up. Check HbA1c and lipid profile.',
    diagnosis: 'T2DM, Hypertension',
    status: 'completed',
    isUrgent: false
  });
  await labOrderRepo.save(lo1);
  for (const idx of [0, 1, 3, 2]) { // CBC, FBG, HbA1c, Lipid
    await labOrderItemRepo.save(labOrderItemRepo.create({
      organizationId: orgId,
      labOrderId: lo1.id,
      labTestId: labTestEntities[idx].id,
      status: 'completed'
    }));
  }

  // Lab Order 2: Patient 1 – Lipid + Thyroid (in progress)
  const lo2 = labOrderRepo.create({
    organizationId: orgId,
    orderNumber: 'LAB-LNR-2025-0002',
    doctorId: doctorUsers[1].id,
    patientId: patientUsers[1].id,
    orderDate: daysAgo(5) as any,
    clinicalNotes: 'Cardiac workup. Thyroid panel for palpitations.',
    diagnosis: 'Suspected CAD',
    status: 'in_progress',
    isUrgent: false
  });
  await labOrderRepo.save(lo2);
  await labOrderItemRepo.save(labOrderItemRepo.create({ organizationId: orgId, labOrderId: lo2.id, labTestId: labTestEntities[2].id, status: 'completed' }));
  await labOrderItemRepo.save(labOrderItemRepo.create({ organizationId: orgId, labOrderId: lo2.id, labTestId: labTestEntities[4].id, status: 'in_progress' }));

  // Lab Order 3: Patient 2 – Urgent (emergency knee)
  const lo3 = labOrderRepo.create({
    organizationId: orgId,
    orderNumber: 'LAB-LNR-2025-0003',
    doctorId: doctorUsers[2].id,
    patientId: patientUsers[2].id,
    orderDate: daysAgo(7) as any,
    clinicalNotes: 'Pre-surgical workup for ACL reconstruction.',
    diagnosis: 'ACL tear – right knee',
    status: 'ordered',
    isUrgent: true
  });
  await labOrderRepo.save(lo3);
  await labOrderItemRepo.save(labOrderItemRepo.create({ organizationId: orgId, labOrderId: lo3.id, labTestId: labTestEntities[0].id, status: 'ordered', notes: 'Pre-op CBC' }));
  await labOrderItemRepo.save(labOrderItemRepo.create({ organizationId: orgId, labOrderId: lo3.id, labTestId: labTestEntities[7].id, status: 'ordered', notes: 'Pre-op chest X-ray' }));

  console.log(`✅ 3 lab orders created (completed, in_progress, ordered/urgent)`);

  // ================================================================
  // 18. MEDICAL RECORDS
  // ================================================================
  const mrConfigs = [
    { patientIdx: 0, doctorIdx: 0, type: RecordType.CONSULTATION, title: 'Initial Diabetes Diagnosis', desc: 'Newly diagnosed T2DM. FBG 186 mg/dL.', diag: 'Type 2 Diabetes Mellitus', treatment: 'Metformin 500mg BD, lifestyle modification', meds: 'Metformin 500mg', date: daysAgo(30) },
    { patientIdx: 0, doctorIdx: 0, type: RecordType.LAB_REPORT, title: 'HbA1c & Lipid Profile Report', desc: 'HbA1c: 8.2%, TC: 242, LDL: 168, HDL: 38, TG: 195', diag: 'T2DM with dyslipidemia', treatment: 'Consider statin if lipids not improved in 3 months', meds: 'Metformin 500mg, Amlodipine 5mg', date: daysAgo(14) },
    { patientIdx: 1, doctorIdx: 1, type: RecordType.CONSULTATION, title: 'Cardiology Initial Evaluation', desc: 'ECG: ST depression V4-V6. Referred from Gen Med.', diag: 'Suspected CAD', treatment: 'Atorvastatin 10mg, lifestyle changes, Echo ordered', meds: 'Atorvastatin 10mg', date: daysAgo(20) },
    { patientIdx: 2, doctorIdx: 2, type: RecordType.CONSULTATION, title: 'Emergency – ACL Injury', desc: 'Acute knee injury during sports. Lachman +ve.', diag: 'ACL tear Grade II-III', treatment: 'Knee immobilizer, Diclofenac, MRI ordered', meds: 'Diclofenac 50mg BD, Paracetamol 650mg TDS', date: daysAgo(7) },
    { patientIdx: 3, doctorIdx: 3, type: RecordType.CONSULTATION, title: 'Pediatric Growth Assessment', desc: 'Routine checkup. Height/weight on 50th percentile.', diag: 'Normal development', treatment: 'Continue balanced diet. Next immunization due.', meds: 'None', date: daysAgo(60) },
    { patientIdx: 4, doctorIdx: 4, type: RecordType.CONSULTATION, title: 'Prenatal First Visit', desc: 'Dating scan normal at 12 weeks.', diag: 'Normal intrauterine pregnancy', treatment: 'Folic acid, iron supplementation. Anomaly scan at 20 weeks.', meds: 'Folic Acid 5mg, Ferrous Sulfate', date: daysAgo(90) }
  ];
  for (const mc of mrConfigs) {
    const mr = mrRepo.create({
      organizationId: orgId,
      patient: patientUsers[mc.patientIdx],
      doctor: doctorUsers[mc.doctorIdx],
      type: mc.type,
      title: mc.title,
      description: mc.desc,
      diagnosis: mc.diag,
      treatment: mc.treatment,
      medications: mc.meds,
      recordDate: mc.date as any
    });
    await mrRepo.save(mr);
  }
  console.log(`✅ ${mrConfigs.length} medical records created`);

  // ================================================================
  // 19. BILLS (varied statuses)
  // ================================================================
  const billConfigs = [
    // Bill 1: Paid – Patient 0 (initial visit)
    {
      patientIdx: 0, appt: a1, billNo: 'LNR-BILL-2025-0001', amount: 500, paid: 500,
      status: BillStatus.PAID, method: PaymentMethod.UPI, desc: 'General Consultation',
      items: [{ name: 'General Consultation', quantity: 1, unitPrice: 500, total: 500 }],
      billDate: daysAgo(30), dueDate: daysAgo(30), paidDate: daysAgo(30), billType: 'opd'
    },
    // Bill 2: Paid – Patient 0 (follow-up + labs)
    {
      patientIdx: 0, appt: a2, billNo: 'LNR-BILL-2025-0002', amount: 1950, paid: 1950,
      status: BillStatus.PAID, method: PaymentMethod.CARD, desc: 'Follow-up + Lab Tests',
      items: [
        { name: 'Chronic Disease Management', quantity: 1, unitPrice: 700, total: 700 },
        { name: 'CBC', quantity: 1, unitPrice: 350, total: 350 },
        { name: 'HbA1c', quantity: 1, unitPrice: 600, total: 600 },
        { name: 'Fasting Blood Glucose', quantity: 1, unitPrice: 150, total: 150 },
        { name: 'Lipid Profile', quantity: 1, unitPrice: 500, total: 500 }
      ] as any,
      billDate: daysAgo(15), dueDate: daysAgo(15), paidDate: daysAgo(15), billType: 'opd'
    },
    // Bill 3: Pending – Patient 1 (cardiology + echo)
    {
      patientIdx: 1, appt: a5, billNo: 'LNR-BILL-2025-0003', amount: 2800, paid: 0,
      status: BillStatus.PENDING, method: undefined, desc: 'Cardiology Consultation + 2D Echo',
      items: [
        { name: 'Cardiology Consultation', quantity: 1, unitPrice: 800, total: 800 },
        { name: '2D Echocardiography', quantity: 1, unitPrice: 2000, total: 2000 }
      ],
      billDate: daysAgo(10), dueDate: daysFromNow(5), paidDate: undefined, billType: 'opd'
    },
    // Bill 4: Overdue – Patient 2 (emergency)
    {
      patientIdx: 2, appt: a8, billNo: 'LNR-BILL-2025-0004', amount: 1700, paid: 600,
      status: BillStatus.PARTIALLY_PAID, method: PaymentMethod.CASH, desc: 'Emergency Orthopedic + Meds',
      items: [
        { name: 'Orthopedic Consultation (Emergency)', quantity: 1, unitPrice: 900, total: 900 },
        { name: 'Knee Immobilizer', quantity: 1, unitPrice: 500, total: 500 },
        { name: 'Diclofenac 50mg × 14', quantity: 1, unitPrice: 70, total: 70 },
        { name: 'Chest X-Ray', quantity: 1, unitPrice: 500, total: 500 }
      ] as any,
      billDate: daysAgo(7), dueDate: daysAgo(1), paidDate: daysAgo(7), billType: 'emergency'
    },
    // Bill 5: Paid via insurance – Patient 4 (prenatal)
    {
      patientIdx: 4, appt: appointments.find(a => a.patient?.id === patientUsers[4]?.id) || a1,
      billNo: 'LNR-BILL-2025-0005', amount: 5700, paid: 5700,
      status: BillStatus.PAID, method: PaymentMethod.INSURANCE, desc: 'Prenatal Care Package + Labs',
      items: [
        { name: 'Prenatal Care Package', quantity: 1, unitPrice: 5000, total: 5000 },
        { name: 'Thyroid Panel', quantity: 1, unitPrice: 700, total: 700 }
      ],
      billDate: daysAgo(90), dueDate: daysAgo(75), paidDate: daysAgo(80), billType: 'opd'
    }
  ];
  for (const bc of billConfigs) {
    const b = billRepo.create({
      organizationId: orgId,
      patient: patientUsers[bc.patientIdx],
      appointment: bc.appt,
      billNumber: bc.billNo,
      amount: bc.amount,
      paidAmount: bc.paid,
      status: bc.status,
      paymentMethod: bc.method as any,
      description: bc.desc,
      itemDetails: bc.items as any,
      billDate: bc.billDate as any,
      dueDate: bc.dueDate as any,
      paidDate: bc.paidDate as any,
      billType: bc.billType,
      locationId: loc.id,
      balanceDue: bc.amount - bc.paid,
      subtotal: bc.amount,
      grandTotal: bc.amount,
      insuranceCoverage: bc.method === PaymentMethod.INSURANCE ? bc.amount : undefined,
      patientResponsibility: bc.method === PaymentMethod.INSURANCE ? 0 : bc.amount - bc.paid
    });
    await billRepo.save(b);
  }
  console.log(`✅ ${billConfigs.length} bills created (paid, pending, partially_paid, insurance)`);

  // ================================================================
  // SUMMARY
  // ================================================================
  const summary = {
    organization: { name: org.name, id: orgId, subdomain: 'lunaris-hms' },
    location: { name: loc.name, code: 'LNR' },
    departments: deptConfigs.length,
    services: svcMap.size,
    doctors: doctorUsers.length,
    staff: staffUsers.length,
    patients: patientUsers.length,
    appointments: appointments.length,
    medicines: medicineEntities.length,
    labTests: labTestEntities.length,
    labOrders: 3,
    prescriptions: 3,
    bills: billConfigs.length,
    consultationNotes: cnConfigs.length,
    diagnoses: diagConfigs.length,
    medicalRecords: mrConfigs.length,
    allergies: allergyConfigs.length,
    credentials: {
      admin: 'admin@lunaris-hospital.com / Admin@123',
      doctors: doctorConfigs.map(d => `${d.email} / Demo@123`),
      staff: staffConfigs.map(s => `${s.email} / Demo@123`),
      patients: patientConfigs.map(p => `${p.email} / Patient@123`)
    },
    scenarios: [
      'Chronic patient with multiple visits (Ramesh – diabetes + hypertension)',
      'Cross-department referral (Kavitha – Gen Med → Cardiology)',
      'Emergency appointment (Arjun – ACL knee injury)',
      'Cancelled & rescheduled appointment (Arjun)',
      'No-show appointment (Priya – missed immunization)',
      'Telemedicine appointment (Kavitha – virtual follow-up)',
      'In-progress appointment (Ramesh – walk-in)',
      'Inactive patient (Shalini – transferred)',
      'Inactive staff (Nurse Selvi – resigned)',
      'Drug allergy flagging (Arjun – NSAID allergy, Ramesh – Penicillin)',
      'Food allergy – child (Priya – peanut anaphylaxis)',
      'Doctor on leave (Dr. Karthik – conference day 7)',
      'Prescription: dispensed, pending, partially_dispensed',
      'Lab orders: completed, in_progress, ordered/urgent',
      'Bills: paid (UPI/card/insurance), pending, partially_paid',
      'Child patient with immunization schedule (Priya)',
      'Prenatal care with discharge (Shalini)'
    ]
  };

  console.log('\n🏥 ═══════════════════════════════════════════════');
  console.log('   LUNARIS HMS SEED COMPLETED SUCCESSFULLY');
  console.log('═══════════════════════════════════════════════\n');
  console.log(JSON.stringify(summary, null, 2));

  return summary;
}

// ======================== CLI RUNNER ========================
if (require.main === module) {
  AppDataSource.initialize()
    .then(() => seedLunarisHMS())
    .then((result) => {
      if ((result as any).alreadyExists) {
        console.log('⚠️  Lunaris HMS already exists. Skipping seed.');
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Seed failed:', err);
      process.exit(1);
    });
}
