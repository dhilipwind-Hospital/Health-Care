/**
 * Complete Demo Seed Script
 * 
 * Creates ONE organization with:
 * - 2 Locations (Main Hospital + Branch)
 * - ALL roles with COMPLETE user information
 * - Departments, Services, Medicines, Lab Tests
 * 
 * Usage:
 *   npx ts-node src/scripts/seed-complete-demo.ts
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
import { Supplier } from '../models/Supplier';
import { UserRole } from '../types/roles';
import * as bcrypt from 'bcryptjs';

// ============================================
// ORGANIZATION CONFIGURATION
// ============================================
const ORG_CONFIG = {
    name: 'Ayphen Healthcare Network',
    subdomain: 'ayphen',
    description: 'A premier multi-location healthcare network providing comprehensive medical services',
    email: 'contact@ayphen.com',
    phone: '+91 1800 555 1234',
    website: 'https://ayphen.com'
};

// ============================================
// LOCATIONS CONFIGURATION (2 Locations)
// ============================================
const LOCATIONS_CONFIG = [
    {
        name: 'Ayphen Main Hospital - Chennai',
        code: 'CHN-MAIN',
        address: '123 Anna Salai, T. Nagar',
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        postalCode: '600017',
        phone: '+91 44 2834 5678',
        email: 'chennai.main@ayphen.com',
        isMainBranch: true,
        capacity: { beds: 300, opds: 80, emergencyBeds: 30 }
    },
    {
        name: 'Ayphen Clinic - Bangalore',
        code: 'BLR-BRANCH',
        address: '456 MG Road, Indiranagar',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        postalCode: '560038',
        phone: '+91 80 4567 8901',
        email: 'bangalore@ayphen.com',
        isMainBranch: false,
        capacity: { beds: 100, opds: 40, emergencyBeds: 10 }
    }
];

// ============================================
// DEPARTMENTS
// ============================================
const DEPARTMENTS_CONFIG = [
    { name: 'General Medicine', description: 'Primary care, internal medicine and general consultations', status: 'active' },
    { name: 'Cardiology', description: 'Heart and cardiovascular care specialists', status: 'active' },
    { name: 'Orthopedics', description: 'Bone, joint, and musculoskeletal care', status: 'active' },
    { name: 'Pediatrics', description: 'Child healthcare from infancy to adolescence', status: 'active' },
    { name: 'Gynecology', description: "Women's health and reproductive care services", status: 'active' },
    { name: 'Neurology', description: 'Brain, spine and nervous system disorders', status: 'active' },
    { name: 'Dermatology', description: 'Skin, hair and nail care treatments', status: 'active' },
    { name: 'Emergency', description: '24/7 Emergency and trauma care services', status: 'active' },
    { name: 'Pharmacy', description: 'In-house pharmacy and medication dispensing', status: 'active' },
    { name: 'Laboratory', description: 'Diagnostic testing and pathology services', status: 'active' }
];

// ============================================
// SERVICES BY DEPARTMENT
// ============================================
const SERVICES_BY_DEPT: Record<string, { name: string; duration: number; price: number }[]> = {
    'General Medicine': [
        { name: 'General Consultation', duration: 30, price: 500 },
        { name: 'Full Body Checkup', duration: 120, price: 3500 },
        { name: 'Vaccination', duration: 15, price: 300 },
        { name: 'Chronic Disease Management', duration: 45, price: 800 }
    ],
    'Cardiology': [
        { name: 'Cardiac Consultation', duration: 45, price: 1200 },
        { name: 'ECG', duration: 20, price: 500 },
        { name: 'Echocardiography', duration: 60, price: 2500 },
        { name: 'Stress Test', duration: 90, price: 3000 }
    ],
    'Orthopedics': [
        { name: 'Orthopedic Consultation', duration: 30, price: 800 },
        { name: 'X-Ray Review', duration: 15, price: 400 },
        { name: 'Physiotherapy Session', duration: 60, price: 600 },
        { name: 'Joint Injection', duration: 30, price: 1500 }
    ],
    'Pediatrics': [
        { name: 'Child Consultation', duration: 30, price: 600 },
        { name: 'Immunization', duration: 20, price: 350 },
        { name: 'Growth Assessment', duration: 45, price: 800 },
        { name: 'Newborn Care', duration: 60, price: 1000 }
    ],
    'Gynecology': [
        { name: 'Gynec Consultation', duration: 30, price: 700 },
        { name: 'Prenatal Checkup', duration: 60, price: 1200 },
        { name: 'Ultrasound', duration: 30, price: 1500 },
        { name: 'Fertility Counseling', duration: 60, price: 2000 }
    ],
    'Neurology': [
        { name: 'Neuro Consultation', duration: 45, price: 1500 },
        { name: 'EEG', duration: 60, price: 2000 },
        { name: 'Migraine Treatment', duration: 30, price: 800 }
    ],
    'Dermatology': [
        { name: 'Skin Consultation', duration: 30, price: 600 },
        { name: 'Acne Treatment', duration: 45, price: 1200 },
        { name: 'Laser Therapy', duration: 60, price: 3000 }
    ],
    'Emergency': [
        { name: 'Emergency Care', duration: 30, price: 1500 },
        { name: 'Trauma Care', duration: 60, price: 3000 },
        { name: 'Critical Care', duration: 120, price: 5000 }
    ]
};

// ============================================
// COMPLETE USER PROFILES WITH ALL FIELDS
// ============================================
interface FullUserProfile {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: UserRole;
    dateOfBirth: Date;
    gender: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    emergencyContact?: string;
    // Doctor specific
    qualification?: string;
    experience?: number;
    consultationFee?: number;
    licenseNumber?: string;
    specialization?: string;
    workingDays?: string[];
    availableFrom?: string;
    availableTo?: string;
    joinDate?: Date;
    // Patient specific
    patientType?: string;
    bloodGroup?: string;
    // Location assignment
    locationCode?: string;
    departmentName?: string;
}

const USERS_CONFIG: FullUserProfile[] = [
    // ============ ADMIN (Organization Level) ============
    {
        email: 'admin@ayphen.com',
        password: 'Admin@123',
        firstName: 'Rajesh',
        lastName: 'Kumar',
        phone: '+91 9876500001',
        role: UserRole.ADMIN,
        dateOfBirth: new Date('1975-03-15'),
        gender: 'Male',
        address: '42 Gandhi Nagar, Block A',
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        postalCode: '600020',
        emergencyContact: '+91 9876500100',
        joinDate: new Date('2020-01-01'),
        locationCode: 'CHN-MAIN'
    },

    // ============ DOCTORS (Location 1 - Chennai Main) ============
    {
        email: 'dr.arun.sharma@ayphen.com',
        password: 'Doctor@123',
        firstName: 'Arun',
        lastName: 'Sharma',
        phone: '+91 9876500010',
        role: UserRole.DOCTOR,
        dateOfBirth: new Date('1978-06-20'),
        gender: 'Male',
        address: '15 Anna Nagar East, 3rd Street',
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        postalCode: '600040',
        emergencyContact: '+91 9876500110',
        qualification: 'MBBS, MD (General Medicine)',
        experience: 18,
        consultationFee: 700,
        licenseNumber: 'TN-MED-2006-12345',
        specialization: 'General Medicine',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        availableFrom: '09:00',
        availableTo: '17:00',
        joinDate: new Date('2020-03-15'),
        locationCode: 'CHN-MAIN',
        departmentName: 'General Medicine'
    },
    {
        email: 'dr.priya.venkat@ayphen.com',
        password: 'Doctor@123',
        firstName: 'Priya',
        lastName: 'Venkat',
        phone: '+91 9876500011',
        role: UserRole.DOCTOR,
        dateOfBirth: new Date('1982-11-08'),
        gender: 'Female',
        address: '28 Besant Nagar, 5th Avenue',
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        postalCode: '600090',
        emergencyContact: '+91 9876500111',
        qualification: 'MBBS, DM (Cardiology)',
        experience: 14,
        consultationFee: 1200,
        licenseNumber: 'TN-MED-2010-23456',
        specialization: 'Cardiology',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday'],
        availableFrom: '10:00',
        availableTo: '18:00',
        joinDate: new Date('2021-01-10'),
        locationCode: 'CHN-MAIN',
        departmentName: 'Cardiology'
    },
    {
        email: 'dr.suresh.patel@ayphen.com',
        password: 'Doctor@123',
        firstName: 'Suresh',
        lastName: 'Patel',
        phone: '+91 9876500012',
        role: UserRole.DOCTOR,
        dateOfBirth: new Date('1975-02-14'),
        gender: 'Male',
        address: '55 T. Nagar, Thyagaraja Road',
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        postalCode: '600017',
        emergencyContact: '+91 9876500112',
        qualification: 'MBBS, MS (Orthopedics)',
        experience: 22,
        consultationFee: 900,
        licenseNumber: 'TN-MED-2002-34567',
        specialization: 'Orthopedics',
        workingDays: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
        availableFrom: '08:00',
        availableTo: '14:00',
        joinDate: new Date('2020-06-01'),
        locationCode: 'CHN-MAIN',
        departmentName: 'Orthopedics'
    },
    {
        email: 'dr.anjali.iyer@ayphen.com',
        password: 'Doctor@123',
        firstName: 'Anjali',
        lastName: 'Iyer',
        phone: '+91 9876500013',
        role: UserRole.DOCTOR,
        dateOfBirth: new Date('1985-09-25'),
        gender: 'Female',
        address: '12 Adyar, Gandhi Street',
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        postalCode: '600020',
        emergencyContact: '+91 9876500113',
        qualification: 'MBBS, MD (Pediatrics)',
        experience: 11,
        consultationFee: 800,
        licenseNumber: 'TN-MED-2013-45678',
        specialization: 'Pediatrics',
        workingDays: ['Monday', 'Tuesday', 'Thursday', 'Friday', 'Saturday'],
        availableFrom: '09:30',
        availableTo: '17:30',
        joinDate: new Date('2021-04-15'),
        locationCode: 'CHN-MAIN',
        departmentName: 'Pediatrics'
    },

    // ============ DOCTORS (Location 2 - Bangalore Branch) ============
    {
        email: 'dr.vikram.reddy@ayphen.com',
        password: 'Doctor@123',
        firstName: 'Vikram',
        lastName: 'Reddy',
        phone: '+91 9876500014',
        role: UserRole.DOCTOR,
        dateOfBirth: new Date('1980-04-12'),
        gender: 'Male',
        address: '88 Koramangala, 4th Block',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        postalCode: '560034',
        emergencyContact: '+91 9876500114',
        qualification: 'MBBS, MD (General Medicine)',
        experience: 16,
        consultationFee: 650,
        licenseNumber: 'KA-MED-2008-56789',
        specialization: 'General Medicine',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        availableFrom: '09:00',
        availableTo: '17:00',
        joinDate: new Date('2022-01-15'),
        locationCode: 'BLR-BRANCH',
        departmentName: 'General Medicine'
    },
    {
        email: 'dr.sunita.rao@ayphen.com',
        password: 'Doctor@123',
        firstName: 'Sunita',
        lastName: 'Rao',
        phone: '+91 9876500015',
        role: UserRole.DOCTOR,
        dateOfBirth: new Date('1983-07-30'),
        gender: 'Female',
        address: '33 HSR Layout, Sector 2',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        postalCode: '560102',
        emergencyContact: '+91 9876500115',
        qualification: 'MBBS, DGO (Gynecology)',
        experience: 13,
        consultationFee: 850,
        licenseNumber: 'KA-MED-2011-67890',
        specialization: 'Gynecology',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Friday', 'Saturday'],
        availableFrom: '10:00',
        availableTo: '18:00',
        joinDate: new Date('2022-03-01'),
        locationCode: 'BLR-BRANCH',
        departmentName: 'Gynecology'
    },

    // ============ NURSES (Location 1 - Chennai Main) ============
    {
        email: 'nurse.radha.kumar@ayphen.com',
        password: 'Nurse@123',
        firstName: 'Radha',
        lastName: 'Kumar',
        phone: '+91 9876500020',
        role: UserRole.NURSE,
        dateOfBirth: new Date('1990-05-18'),
        gender: 'Female',
        address: '22 Velachery, Main Road',
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        postalCode: '600042',
        emergencyContact: '+91 9876500120',
        qualification: 'B.Sc Nursing',
        experience: 8,
        licenseNumber: 'TN-NRS-2016-11111',
        joinDate: new Date('2021-02-01'),
        locationCode: 'CHN-MAIN',
        departmentName: 'General Medicine'
    },
    {
        email: 'nurse.geetha.rajan@ayphen.com',
        password: 'Nurse@123',
        firstName: 'Geetha',
        lastName: 'Rajan',
        phone: '+91 9876500021',
        role: UserRole.NURSE,
        dateOfBirth: new Date('1988-12-03'),
        gender: 'Female',
        address: '45 Guindy, Industrial Estate Road',
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        postalCode: '600032',
        emergencyContact: '+91 9876500121',
        qualification: 'GNM, B.Sc Nursing',
        experience: 10,
        licenseNumber: 'TN-NRS-2014-22222',
        joinDate: new Date('2020-08-15'),
        locationCode: 'CHN-MAIN',
        departmentName: 'Emergency'
    },
    {
        email: 'nurse.saroja.devi@ayphen.com',
        password: 'Nurse@123',
        firstName: 'Saroja',
        lastName: 'Devi',
        phone: '+91 9876500022',
        role: UserRole.NURSE,
        dateOfBirth: new Date('1992-08-22'),
        gender: 'Female',
        address: '67 Ashok Nagar, 6th Avenue',
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        postalCode: '600083',
        emergencyContact: '+91 9876500122',
        qualification: 'B.Sc Nursing',
        experience: 6,
        licenseNumber: 'TN-NRS-2018-33333',
        joinDate: new Date('2022-01-10'),
        locationCode: 'CHN-MAIN',
        departmentName: 'Pediatrics'
    },

    // ============ NURSES (Location 2 - Bangalore Branch) ============
    {
        email: 'nurse.kavitha.naidu@ayphen.com',
        password: 'Nurse@123',
        firstName: 'Kavitha',
        lastName: 'Naidu',
        phone: '+91 9876500023',
        role: UserRole.NURSE,
        dateOfBirth: new Date('1991-03-10'),
        gender: 'Female',
        address: '99 Jayanagar, 4th Block',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        postalCode: '560041',
        emergencyContact: '+91 9876500123',
        qualification: 'B.Sc Nursing, M.Sc',
        experience: 7,
        licenseNumber: 'KA-NRS-2017-44444',
        joinDate: new Date('2022-04-01'),
        locationCode: 'BLR-BRANCH',
        departmentName: 'General Medicine'
    },

    // ============ RECEPTIONISTS ============
    {
        email: 'reception.meera.pillai@ayphen.com',
        password: 'Reception@123',
        firstName: 'Meera',
        lastName: 'Pillai',
        phone: '+91 9876500030',
        role: UserRole.RECEPTIONIST,
        dateOfBirth: new Date('1994-07-14'),
        gender: 'Female',
        address: '18 Mylapore, Tank Street',
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        postalCode: '600004',
        emergencyContact: '+91 9876500130',
        joinDate: new Date('2021-06-01'),
        locationCode: 'CHN-MAIN'
    },
    {
        email: 'reception.karthik.menon@ayphen.com',
        password: 'Reception@123',
        firstName: 'Karthik',
        lastName: 'Menon',
        phone: '+91 9876500031',
        role: UserRole.RECEPTIONIST,
        dateOfBirth: new Date('1996-11-28'),
        gender: 'Male',
        address: '72 Whitefield, Main Road',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        postalCode: '560066',
        emergencyContact: '+91 9876500131',
        joinDate: new Date('2022-05-15'),
        locationCode: 'BLR-BRANCH'
    },

    // ============ PHARMACISTS ============
    {
        email: 'pharma.mohan.krishna@ayphen.com',
        password: 'Pharma@123',
        firstName: 'Mohan',
        lastName: 'Krishna',
        phone: '+91 9876500040',
        role: UserRole.PHARMACIST,
        dateOfBirth: new Date('1987-01-25'),
        gender: 'Male',
        address: '38 Porur, Lake View Road',
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        postalCode: '600116',
        emergencyContact: '+91 9876500140',
        qualification: 'B.Pharm, M.Pharm',
        experience: 12,
        licenseNumber: 'TN-PHM-2012-55555',
        joinDate: new Date('2020-04-01'),
        locationCode: 'CHN-MAIN',
        departmentName: 'Pharmacy'
    },
    {
        email: 'pharma.divya.nair@ayphen.com',
        password: 'Pharma@123',
        firstName: 'Divya',
        lastName: 'Nair',
        phone: '+91 9876500041',
        role: UserRole.PHARMACIST,
        dateOfBirth: new Date('1993-09-05'),
        gender: 'Female',
        address: '51 Marathahalli, Outer Ring Road',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        postalCode: '560037',
        emergencyContact: '+91 9876500141',
        qualification: 'B.Pharm',
        experience: 5,
        licenseNumber: 'KA-PHM-2019-66666',
        joinDate: new Date('2022-06-01'),
        locationCode: 'BLR-BRANCH',
        departmentName: 'Pharmacy'
    },

    // ============ LAB TECHNICIANS ============
    {
        email: 'lab.ganesh.babu@ayphen.com',
        password: 'Lab@123',
        firstName: 'Ganesh',
        lastName: 'Babu',
        phone: '+91 9876500050',
        role: UserRole.LAB_TECHNICIAN,
        dateOfBirth: new Date('1989-04-17'),
        gender: 'Male',
        address: '64 Chromepet, GST Road',
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        postalCode: '600044',
        emergencyContact: '+91 9876500150',
        qualification: 'DMLT, B.Sc MLT',
        experience: 9,
        licenseNumber: 'TN-LAB-2015-77777',
        joinDate: new Date('2020-07-01'),
        locationCode: 'CHN-MAIN',
        departmentName: 'Laboratory'
    },
    {
        email: 'lab.lakshmi.sundaram@ayphen.com',
        password: 'Lab@123',
        firstName: 'Lakshmi',
        lastName: 'Sundaram',
        phone: '+91 9876500051',
        role: UserRole.LAB_TECHNICIAN,
        dateOfBirth: new Date('1995-06-28'),
        gender: 'Female',
        address: '27 Electronic City, Phase 1',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        postalCode: '560100',
        emergencyContact: '+91 9876500151',
        qualification: 'B.Sc MLT',
        experience: 4,
        licenseNumber: 'KA-LAB-2020-88888',
        joinDate: new Date('2022-08-01'),
        locationCode: 'BLR-BRANCH',
        departmentName: 'Laboratory'
    },

    // ============ ACCOUNTANT ============
    {
        email: 'accounts.sanjay.gupta@ayphen.com',
        password: 'Accounts@123',
        firstName: 'Sanjay',
        lastName: 'Gupta',
        phone: '+91 9876500060',
        role: UserRole.ACCOUNTANT,
        dateOfBirth: new Date('1984-10-12'),
        gender: 'Male',
        address: '83 Alwarpet, TTK Road',
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        postalCode: '600018',
        emergencyContact: '+91 9876500160',
        qualification: 'B.Com, CA',
        experience: 15,
        joinDate: new Date('2020-02-01'),
        locationCode: 'CHN-MAIN'
    },

    // ============ PATIENTS (Multi-location) ============
    {
        email: 'patient.ravi.kumar@gmail.com',
        password: 'Patient@123',
        firstName: 'Ravi',
        lastName: 'Kumar',
        phone: '+91 9876500070',
        role: UserRole.PATIENT,
        dateOfBirth: new Date('1985-03-22'),
        gender: 'Male',
        address: '110 Nungambakkam High Road',
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        postalCode: '600034',
        emergencyContact: '+91 9876500170',
        patientType: 'Regular',
        bloodGroup: 'O+',
        locationCode: 'CHN-MAIN'
    },
    {
        email: 'patient.sita.devi@gmail.com',
        password: 'Patient@123',
        firstName: 'Sita',
        lastName: 'Devi',
        phone: '+91 9876500071',
        role: UserRole.PATIENT,
        dateOfBirth: new Date('1990-08-15'),
        gender: 'Female',
        address: '25 Kodambakkam, Film City Road',
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        postalCode: '600024',
        emergencyContact: '+91 9876500171',
        patientType: 'Regular',
        bloodGroup: 'A+',
        locationCode: 'CHN-MAIN'
    },
    {
        email: 'patient.arjun.nair@gmail.com',
        password: 'Patient@123',
        firstName: 'Arjun',
        lastName: 'Nair',
        phone: '+91 9876500072',
        role: UserRole.PATIENT,
        dateOfBirth: new Date('1978-12-05'),
        gender: 'Male',
        address: '58 Tambaram, Main Road',
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        postalCode: '600045',
        emergencyContact: '+91 9876500172',
        patientType: 'VIP',
        bloodGroup: 'B+',
        locationCode: 'CHN-MAIN'
    },
    {
        email: 'patient.radha.menon@gmail.com',
        password: 'Patient@123',
        firstName: 'Radha',
        lastName: 'Menon',
        phone: '+91 9876500073',
        role: UserRole.PATIENT,
        dateOfBirth: new Date('1995-05-30'),
        gender: 'Female',
        address: '92 BTM Layout, 2nd Stage',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        postalCode: '560076',
        emergencyContact: '+91 9876500173',
        patientType: 'Regular',
        bloodGroup: 'AB+',
        locationCode: 'BLR-BRANCH'
    },
    {
        email: 'patient.venkat.iyengar@gmail.com',
        password: 'Patient@123',
        firstName: 'Venkat',
        lastName: 'Iyengar',
        phone: '+91 9876500074',
        role: UserRole.PATIENT,
        dateOfBirth: new Date('1970-01-18'),
        gender: 'Male',
        address: '41 Indiranagar, 100 Feet Road',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        postalCode: '560038',
        emergencyContact: '+91 9876500174',
        patientType: 'VIP',
        bloodGroup: 'O-',
        locationCode: 'BLR-BRANCH'
    }
];

// ============================================
// MEDICINES
// ============================================
const MEDICINES_CONFIG = [
    { name: 'Paracetamol 500mg', genericName: 'Acetaminophen', brandName: 'Crocin', category: 'Pain Relief', dosageForm: 'Tablet', strength: '500mg', unitPrice: 2.5, sellingPrice: 3.0, stock: 500, reorderLevel: 100, manufacturer: 'GSK Pharma', batchNumber: 'BAT-001' },
    { name: 'Amoxicillin 250mg', genericName: 'Amoxicillin', brandName: 'Mox', category: 'Antibiotic', dosageForm: 'Capsule', strength: '250mg', unitPrice: 8.0, sellingPrice: 10.0, stock: 200, reorderLevel: 50, manufacturer: 'Cipla Ltd', batchNumber: 'BAT-002' },
    { name: 'Omeprazole 20mg', genericName: 'Omeprazole', brandName: 'Omez', category: 'Gastric', dosageForm: 'Capsule', strength: '20mg', unitPrice: 5.5, sellingPrice: 7.0, stock: 300, reorderLevel: 75, manufacturer: 'Dr. Reddys', batchNumber: 'BAT-003' },
    { name: 'Metformin 500mg', genericName: 'Metformin', brandName: 'Glycomet', category: 'Diabetes', dosageForm: 'Tablet', strength: '500mg', unitPrice: 3.0, sellingPrice: 4.0, stock: 400, reorderLevel: 100, manufacturer: 'USV Pvt Ltd', batchNumber: 'BAT-004' },
    { name: 'Amlodipine 5mg', genericName: 'Amlodipine', brandName: 'Amlokind', category: 'Cardiac', dosageForm: 'Tablet', strength: '5mg', unitPrice: 4.5, sellingPrice: 6.0, stock: 250, reorderLevel: 60, manufacturer: 'Mankind Pharma', batchNumber: 'BAT-005' }
];

// ============================================
// LAB TESTS
// ============================================
const LAB_TESTS_CONFIG = [
    { name: 'Complete Blood Count (CBC)', code: 'CBC001', category: 'hematology', cost: 350, turnaroundTimeMinutes: 240, description: 'Complete blood cell count with differential' },
    { name: 'Blood Glucose Fasting', code: 'BIO001', category: 'biochemistry', cost: 150, turnaroundTimeMinutes: 120, description: 'Fasting blood sugar level' },
    { name: 'Lipid Profile', code: 'BIO002', category: 'biochemistry', cost: 600, turnaroundTimeMinutes: 240, description: 'Total cholesterol, HDL, LDL, Triglycerides' },
    { name: 'Liver Function Test (LFT)', code: 'BIO003', category: 'biochemistry', cost: 800, turnaroundTimeMinutes: 360, description: 'Comprehensive liver enzyme panel' },
    { name: 'Chest X-Ray', code: 'RAD001', category: 'radiology', cost: 500, turnaroundTimeMinutes: 60, description: 'PA view chest X-ray' }
];

// ============================================
// MAIN SEED FUNCTION
// ============================================
async function seedCompleteDemo() {
    try {
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('         🚀 COMPLETE DEMO SEED - STARTING');
        console.log('═══════════════════════════════════════════════════════════════\n');
        console.log(`Organization: ${ORG_CONFIG.name}`);
        console.log(`Subdomain: ${ORG_CONFIG.subdomain}`);
        console.log(`Locations: ${LOCATIONS_CONFIG.length}`);
        console.log('───────────────────────────────────────────────────────────────\n');

        // Initialize database
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const orgRepo = AppDataSource.getRepository(Organization);
        const locationRepo = AppDataSource.getRepository(Location);
        const userRepo = AppDataSource.getRepository(User);
        const deptRepo = AppDataSource.getRepository(Department);
        const serviceRepo = AppDataSource.getRepository(Service);
        const medicineRepo = AppDataSource.getRepository(Medicine);
        const labTestRepo = AppDataSource.getRepository(LabTest);
        const supplierRepo = AppDataSource.getRepository(Supplier);

        // ===== STEP 1: Create Organization =====
        console.log('📦 Creating Organization...');
        let organization: any = await orgRepo.findOne({ where: { subdomain: ORG_CONFIG.subdomain } });

        if (organization) {
            console.log(`  ⚠️  Organization "${ORG_CONFIG.name}" already exists. Using existing.\n`);
        } else {
            const newOrg = orgRepo.create({
                name: ORG_CONFIG.name,
                subdomain: ORG_CONFIG.subdomain,
                description: ORG_CONFIG.description,
                email: ORG_CONFIG.email,
                phone: ORG_CONFIG.phone,
                isActive: true,
                settings: {
                    subscription: { plan: 'enterprise', status: 'active', startDate: new Date() },
                    features: { pharmacy: true, laboratory: true, inpatient: true, radiology: true },
                    limits: { maxUsers: 500, maxPatients: 50000, maxStorage: 500 },
                    branding: { primaryColor: '#e91e63', secondaryColor: '#9c27b0' }
                }
            } as any);
            organization = await orgRepo.save(newOrg);
            console.log(`  ✅ Created: ${organization.name}\n`);
        }
        const orgId = organization.id;

        // ===== STEP 2: Create Locations =====
        console.log('📍 Creating Locations...');
        const locationMap: Record<string, any> = {};
        for (const locConfig of LOCATIONS_CONFIG) {
            let location: any = await locationRepo.findOne({ where: { organizationId: orgId, code: locConfig.code } });
            if (!location) {
                const newLoc = locationRepo.create({
                    organizationId: orgId,
                    name: locConfig.name,
                    code: locConfig.code,
                    address: locConfig.address,
                    city: locConfig.city,
                    state: locConfig.state,
                    country: locConfig.country,
                    phone: locConfig.phone,
                    email: locConfig.email,
                    isMainBranch: locConfig.isMainBranch,
                    isActive: true,
                    settings: {
                        capacity: locConfig.capacity,
                        features: { hasPharmacy: true, hasLaboratory: true, hasEmergency: true }
                    }
                } as any);
                location = await locationRepo.save(newLoc);
                console.log(`  ✅ ${locConfig.name} (${locConfig.code})`);
            } else {
                console.log(`  ⏭️  ${locConfig.name} exists`);
            }
            locationMap[locConfig.code] = location;
        }

        // ===== STEP 3: Create Departments =====
        console.log('\n🏥 Creating Departments...');
        const deptMap: Record<string, any> = {};
        for (const dc of DEPARTMENTS_CONFIG) {
            let dept: any = await deptRepo.findOne({ where: { name: dc.name, organizationId: orgId } });
            if (!dept) {
                const newDept = deptRepo.create({ name: dc.name, description: dc.description, status: dc.status, organizationId: orgId } as any);
                dept = await deptRepo.save(newDept);
                console.log(`  ✅ ${dc.name}`);
            } else {
                console.log(`  ⏭️  ${dc.name} exists`);
            }
            deptMap[dc.name] = dept;
        }

        // ===== STEP 4: Create Services =====
        console.log('\n📋 Creating Services...');
        let serviceCount = 0;
        for (const deptName in SERVICES_BY_DEPT) {
            const dept = deptMap[deptName];
            if (!dept) continue;
            for (const svc of SERVICES_BY_DEPT[deptName]) {
                const exists = await serviceRepo.findOne({ where: { name: svc.name, organizationId: orgId } });
                if (!exists) {
                    await serviceRepo.save(serviceRepo.create({
                        name: svc.name,
                        description: `${svc.name} service`,
                        status: 'active',
                        averageDuration: svc.duration,
                        price: svc.price,
                        department: dept,
                        departmentId: (dept as any).id,
                        organizationId: orgId
                    } as any));
                    serviceCount++;
                }
            }
        }
        console.log(`  ✅ Created ${serviceCount} services`);

        // ===== STEP 5: Create ALL Users =====
        console.log('\n👥 Creating Users (All Roles)...');
        const createdUsers: { email: string; password: string; role: string; location: string; name: string }[] = [];

        for (const userConfig of USERS_CONFIG) {
            const existingUser = await userRepo.findOne({ where: { email: userConfig.email, organizationId: orgId } });
            if (existingUser) {
                console.log(`  ⏭️  ${userConfig.email} exists`);
                createdUsers.push({
                    email: userConfig.email,
                    password: userConfig.password,
                    role: userConfig.role,
                    location: userConfig.locationCode || 'N/A',
                    name: `${userConfig.firstName} ${userConfig.lastName}`
                });
                continue;
            }

            const hashedPassword = await bcrypt.hash(userConfig.password, 10);
            const location = userConfig.locationCode ? locationMap[userConfig.locationCode] : undefined;
            const department = userConfig.departmentName ? deptMap[userConfig.departmentName] : undefined;

            const newUser = userRepo.create({
                email: userConfig.email,
                password: hashedPassword,
                firstName: userConfig.firstName,
                lastName: userConfig.lastName,
                phone: userConfig.phone,
                role: userConfig.role,
                organizationId: orgId,
                locationId: location?.id || null,
                departmentId: department ? (department as any).id : null,
                isActive: true,
                dateOfBirth: userConfig.dateOfBirth,
                gender: userConfig.gender,
                address: userConfig.address,
                city: userConfig.city,
                state: userConfig.state,
                country: userConfig.country,
                postalCode: userConfig.postalCode,
                emergencyContact: userConfig.emergencyContact,
                qualification: userConfig.qualification,
                experience: userConfig.experience,
                consultationFee: userConfig.consultationFee,
                licenseNumber: userConfig.licenseNumber,
                specialization: userConfig.specialization,
                workingDays: userConfig.workingDays,
                availableFrom: userConfig.availableFrom,
                availableTo: userConfig.availableTo,
                joinDate: userConfig.joinDate,
                patientType: userConfig.patientType
            } as any);

            // Add blood group for patients via preferences if model doesn't have direct field
            if (userConfig.bloodGroup) {
                (newUser as any).preferences = { bloodGroup: userConfig.bloodGroup };
            }

            await userRepo.save(newUser);
            console.log(`  ✅ ${userConfig.role.toUpperCase()}: ${userConfig.firstName} ${userConfig.lastName} (${userConfig.email})`);

            createdUsers.push({
                email: userConfig.email,
                password: userConfig.password,
                role: userConfig.role,
                location: userConfig.locationCode || 'N/A',
                name: `${userConfig.firstName} ${userConfig.lastName}`
            });
        }

        // ===== STEP 5.5: Create Suppliers =====
        console.log('\n🚚 Creating Suppliers...');
        const suppliersList = [
            { name: 'Global Medical Supplies', contact: 'John Smith', phone: '555-0101', email: 'sales@globalmed.com' },
            { name: 'Zenith Pharmaceuticals', contact: 'Sarah Lee', phone: '555-0102', email: 'orders@zenithpharma.com' },
            { name: 'Apex Lab Care', contact: 'Mike Ross', phone: '555-0103', email: 'Mike@apexlab.com' },
            { name: 'Biotech Distributing', contact: 'Rachel Zane', phone: '555-0104', email: 'distribution@biotech.com' },
            { name: 'MediQuick Solutions', contact: 'Harvey Specter', phone: '555-0105', email: 'contracts@mediquick.com' }
        ];

        let supplierCount = 0;
        for (const sData of suppliersList) {
            const existingSupplier = await supplierRepo.findOne({ where: { name: sData.name, organizationId: orgId } });
            if (!existingSupplier) {
                const supplier = supplierRepo.create({
                    organizationId: orgId,
                    name: sData.name,
                    contactPerson: sData.contact,
                    phone: sData.phone,
                    email: sData.email,
                    address: `123 Distribution Hub, ${organization.name} City`,
                    isActive: true
                });
                await supplierRepo.save(supplier);
                supplierCount++;
            }
        }
        console.log(`  ✅ Created ${supplierCount} suppliers.`);

        // ===== STEP 6: Create Medicines =====
        console.log('\n💊 Creating Pharmacy Inventory...');
        let medCount = 0;
        const medicines = [
            // Normal Stock
            { name: 'Amoxicillin 500mg', generic: 'Amoxicillin', brand: 'Amoxil', cat: 'Antibiotic', dosage: 'Capsule', str: '500mg', stock: 1000, reorder: 200, unitPrice: 5, sellingPrice: 12, expiryDays: 365 },
            { name: 'Lisinopril 10mg', generic: 'Lisinopril', brand: 'Prinivil', cat: 'Hypertension', dosage: 'Tablet', str: '10mg', stock: 500, reorder: 100, unitPrice: 8, sellingPrice: 25, expiryDays: 730 },

            // Low Stock (Reorder Alert)
            { name: 'Paracetamol 500mg', generic: 'Acetaminophen', brand: 'Panadol', cat: 'Analgesic', dosage: 'Tablet', str: '500mg', stock: 15, reorder: 100, unitPrice: 2, sellingPrice: 5, expiryDays: 500 },
            { name: 'Metformin 850mg', generic: 'Metformin', brand: 'Glucophage', cat: 'Antidiabetic', dosage: 'Tablet', str: '850mg', stock: 8, reorder: 50, unitPrice: 12, sellingPrice: 35, expiryDays: 400 },

            // Expiring Soon (30 day alert)
            { name: 'Azithromycin 250mg', generic: 'Azithromycin', brand: 'Zithromax', cat: 'Antibiotic', dosage: 'Tablet', str: '250mg', stock: 200, reorder: 50, unitPrice: 30, sellingPrice: 75, expiryDays: 15 },

            // Already Expired (Negative alert)
            { name: 'Ibuprofen 400mg', generic: 'Ibuprofen', brand: 'Advil', cat: 'Analgesic', dosage: 'Tablet', str: '400mg', stock: 50, reorder: 20, unitPrice: 4, sellingPrice: 10, expiryDays: -60 }
        ];

        for (const med of medicines) {
            const exists = await medicineRepo.findOne({ where: { name: med.name, organizationId: orgId } });
            if (!exists) {
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + med.expiryDays);

                const manufactureDate = new Date();
                manufactureDate.setFullYear(manufactureDate.getFullYear() - 1);

                await medicineRepo.save(medicineRepo.create({
                    organizationId: orgId,
                    name: med.name,
                    genericName: med.generic,
                    brandName: med.brand,
                    manufacturer: 'PharmaCorp Industries',
                    category: med.cat,
                    dosageForm: med.dosage,
                    strength: med.str,
                    unitPrice: med.unitPrice,
                    sellingPrice: med.sellingPrice,
                    batchNumber: `BAT-${Math.random().toString(36).substring(7).toUpperCase()}`,
                    manufactureDate: manufactureDate,
                    expiryDate: expiryDate,
                    currentStock: med.stock,
                    reorderLevel: med.reorder,
                    isActive: true,
                    description: `Standard ${med.name} for treatment purposes.`,
                } as any));
                medCount++;
            }
        }
        console.log(`  ✅ Created ${medCount} medicine varieties.`);

        // ===== STEP 7: Create Lab Tests =====
        console.log('\n🧪 Creating Lab Tests...');
        let labCount = 0;
        for (const test of LAB_TESTS_CONFIG) {
            const exists = await labTestRepo.findOne({ where: { name: test.name, organizationId: orgId } });
            if (!exists) {
                await labTestRepo.save(labTestRepo.create({
                    name: test.name,
                    code: test.code,
                    category: test.category,
                    cost: test.cost,
                    turnaroundTimeMinutes: test.turnaroundTimeMinutes,
                    description: test.description,
                    organizationId: orgId,
                    isActive: true
                } as any));
                labCount++;
            }
        }
        console.log(`  ✅ Created ${labCount} lab tests`);

        // ===== FINAL SUMMARY =====
        console.log('\n');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('                    🎉 SEED COMPLETED SUCCESSFULLY 🎉');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`\n📦 Organization: ${ORG_CONFIG.name}`);
        console.log(`   Subdomain: ${ORG_CONFIG.subdomain}`);
        console.log('');
        console.log(`📍 Locations (${LOCATIONS_CONFIG.length}):`);
        LOCATIONS_CONFIG.forEach(l => console.log(`   • ${l.name} (${l.code}) - ${l.city}`));
        console.log('');
        console.log(`🏥 Departments: ${DEPARTMENTS_CONFIG.length}`);
        console.log(`📋 Services: ${serviceCount}`);
        console.log(`💊 Medicines: ${medCount}`);
        console.log(`🧪 Lab Tests: ${labCount}`);

        // Print ALL User Credentials
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('               🔑 ALL USER LOGIN CREDENTIALS');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const roleOrder = ['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'lab_technician', 'accountant', 'patient'];
        for (const roleKey of roleOrder) {
            const usersOfRole = createdUsers.filter(u => u.role === roleKey);
            if (usersOfRole.length === 0) continue;

            console.log(`┌─────────────────────────────────────────────────────────────┐`);
            console.log(`│ ${roleKey.toUpperCase().replace('_', ' ').padEnd(59)}│`);
            console.log(`├─────────────────────────────────────────────────────────────┤`);
            for (const u of usersOfRole) {
                console.log(`│ Name: ${u.name.padEnd(52)}│`);
                console.log(`│ Email: ${u.email.padEnd(51)}│`);
                console.log(`│ Password: ${u.password.padEnd(48)}│`);
                console.log(`│ Location: ${u.location.padEnd(48)}│`);
                console.log(`├─────────────────────────────────────────────────────────────┤`);
            }
            console.log(`└─────────────────────────────────────────────────────────────┘\n`);
        }

        console.log('═══════════════════════════════════════════════════════════════');
        console.log('                    ✅ ALL DATA CREATED SUCCESSFULLY');
        console.log('═══════════════════════════════════════════════════════════════\n');

        await AppDataSource.destroy();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ SEED FAILED:', error);
        try { await AppDataSource.destroy(); } catch { }
        process.exit(1);
    }
}

seedCompleteDemo();
