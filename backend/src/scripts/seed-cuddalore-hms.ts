/**
 * Seed Script: Cuddalore HMS - Complete Organization
 * 
 * Creates Cuddalore HMS organization with:
 * - Single location in Cuddalore
 * - Admin, Doctors, Nurses, Receptionists, Pharmacists, Lab Technicians, Accountant
 * - Departments and Services
 * - Sample patients with appointments
 * - Pharmacy inventory
 * - Lab tests
 * 
 * Usage:
 *   npx ts-node src/scripts/seed-cuddalore-hms.ts
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

// ============ ORGANIZATION CONFIGURATION ============
const ORG_CONFIG = {
    name: 'Cuddalore HMS',
    subdomain: 'cuddalore-hms',
    description: 'Cuddalore Hospital Management System - Comprehensive healthcare services for Cuddalore district',
    email: 'info@cuddalore-hms.com',
    phone: '+91 4142 234567'
};

// ============ LOCATION CONFIGURATION ============
const LOCATION_CONFIG = {
    name: 'Cuddalore HMS - Main Hospital',
    code: 'CDL',
    address: '123 Gandhi Road, Near Bus Stand',
    city: 'Cuddalore',
    state: 'Tamil Nadu',
    pincode: '607001',
    phone: '+91 4142 234567',
    email: 'main@cuddalore-hms.com',
    isMainBranch: true,
    capacity: { beds: 150, opds: 40, emergencyBeds: 15, icuBeds: 10 }
};

// ============ DEPARTMENTS CONFIGURATION ============
const DEPARTMENTS_CONFIG = [
    { name: 'General Medicine', description: 'Primary care and internal medicine services', status: 'active' },
    { name: 'Cardiology', description: 'Heart and cardiovascular care', status: 'active' },
    { name: 'Orthopedics', description: 'Bone, joint, and muscle care', status: 'active' },
    { name: 'Pediatrics', description: 'Child healthcare services', status: 'active' },
    { name: 'Gynecology & Obstetrics', description: "Women's health and maternity services", status: 'active' },
    { name: 'Neurology', description: 'Brain and nervous system care', status: 'active' },
    { name: 'Dermatology', description: 'Skin care and treatment', status: 'active' },
    { name: 'Ophthalmology', description: 'Eye care and vision services', status: 'active' },
    { name: 'ENT', description: 'Ear, Nose, and Throat care', status: 'active' },
    { name: 'Emergency', description: '24/7 Emergency services', status: 'active' },
    { name: 'Radiology', description: 'Diagnostic imaging services', status: 'active' },
    { name: 'Pathology', description: 'Laboratory diagnostic services', status: 'active' }
];

// ============ SERVICES BY DEPARTMENT ============
const SERVICES_BY_DEPT: Record<string, { name: string; price: number; duration: number }[]> = {
    'General Medicine': [
        { name: 'General Consultation', price: 300, duration: 20 },
        { name: 'Health Checkup - Basic', price: 1500, duration: 60 },
        { name: 'Health Checkup - Comprehensive', price: 3500, duration: 90 },
        { name: 'Vaccination', price: 500, duration: 15 },
        { name: 'Chronic Disease Management', price: 400, duration: 30 }
    ],
    'Cardiology': [
        { name: 'Cardiology Consultation', price: 500, duration: 30 },
        { name: 'ECG', price: 300, duration: 15 },
        { name: 'Echocardiography (2D Echo)', price: 1500, duration: 30 },
        { name: 'Stress Test (TMT)', price: 1200, duration: 45 },
        { name: 'Holter Monitoring', price: 2000, duration: 30 }
    ],
    'Orthopedics': [
        { name: 'Orthopedic Consultation', price: 400, duration: 25 },
        { name: 'X-Ray Review', price: 200, duration: 15 },
        { name: 'Physiotherapy Session', price: 350, duration: 45 },
        { name: 'Joint Injection', price: 800, duration: 20 },
        { name: 'Fracture Management', price: 1500, duration: 60 }
    ],
    'Pediatrics': [
        { name: 'Pediatric Consultation', price: 350, duration: 25 },
        { name: 'Child Immunization', price: 600, duration: 20 },
        { name: 'Growth Assessment', price: 400, duration: 30 },
        { name: 'Newborn Care', price: 500, duration: 30 },
        { name: 'Developmental Screening', price: 450, duration: 40 }
    ],
    'Gynecology & Obstetrics': [
        { name: 'Gynecology Consultation', price: 400, duration: 25 },
        { name: 'Prenatal Care Visit', price: 500, duration: 30 },
        { name: 'Obstetric Ultrasound', price: 1200, duration: 30 },
        { name: 'Fertility Counseling', price: 600, duration: 45 },
        { name: 'Pap Smear Test', price: 800, duration: 20 }
    ],
    'Neurology': [
        { name: 'Neurology Consultation', price: 600, duration: 30 },
        { name: 'EEG', price: 1500, duration: 45 },
        { name: 'Migraine Treatment', price: 500, duration: 25 },
        { name: 'Stroke Assessment', price: 800, duration: 40 },
        { name: 'Nerve Conduction Study', price: 2000, duration: 60 }
    ],
    'Dermatology': [
        { name: 'Dermatology Consultation', price: 400, duration: 20 },
        { name: 'Acne Treatment', price: 500, duration: 25 },
        { name: 'Skin Biopsy', price: 1200, duration: 30 },
        { name: 'Laser Therapy', price: 2500, duration: 45 },
        { name: 'Allergy Testing', price: 1000, duration: 40 }
    ],
    'Ophthalmology': [
        { name: 'Eye Examination', price: 350, duration: 25 },
        { name: 'Vision Correction Consultation', price: 400, duration: 20 },
        { name: 'Glaucoma Screening', price: 600, duration: 30 },
        { name: 'Cataract Evaluation', price: 500, duration: 25 },
        { name: 'Retinal Examination', price: 800, duration: 30 }
    ],
    'ENT': [
        { name: 'ENT Consultation', price: 350, duration: 20 },
        { name: 'Hearing Test (Audiometry)', price: 500, duration: 30 },
        { name: 'Sinus Treatment', price: 600, duration: 25 },
        { name: 'Throat Examination', price: 300, duration: 15 },
        { name: 'Vertigo Assessment', price: 450, duration: 30 }
    ],
    'Emergency': [
        { name: 'Emergency Consultation', price: 800, duration: 30 },
        { name: 'Trauma Care', price: 1500, duration: 60 },
        { name: 'Critical Care', price: 2000, duration: 60 },
        { name: 'Ambulance Service', price: 1000, duration: 30 },
        { name: 'Emergency Stabilization', price: 1200, duration: 45 }
    ],
    'Radiology': [
        { name: 'X-Ray', price: 400, duration: 15 },
        { name: 'Ultrasound', price: 800, duration: 30 },
        { name: 'CT Scan', price: 3500, duration: 45 },
        { name: 'MRI', price: 6000, duration: 60 },
        { name: 'Mammography', price: 1500, duration: 30 }
    ],
    'Pathology': [
        { name: 'Blood Test - Basic', price: 300, duration: 15 },
        { name: 'Blood Test - Comprehensive', price: 1200, duration: 20 },
        { name: 'Urine Analysis', price: 200, duration: 10 },
        { name: 'Biopsy Analysis', price: 2500, duration: 30 },
        { name: 'Culture & Sensitivity', price: 800, duration: 20 }
    ]
};

// ============ STAFF CONFIGURATION ============
const STAFF_CONFIG = {
    admin: { 
        email: 'admin@cuddalore-hms.com',
        firstName: 'Admin',
        lastName: 'Cuddalore',
        phone: '+91 9876500001',
        password: 'Admin@123'
    },
    doctors: [
        // General Medicine
        { firstName: 'Senthil', lastName: 'Kumar', dept: 'General Medicine', specialization: 'Internal Medicine', phone: '+91 9876500101' },
        { firstName: 'Lakshmi', lastName: 'Narayanan', dept: 'General Medicine', specialization: 'Family Medicine', phone: '+91 9876500102' },
        // Cardiology
        { firstName: 'Rajesh', lastName: 'Venkataraman', dept: 'Cardiology', specialization: 'Interventional Cardiology', phone: '+91 9876500103' },
        { firstName: 'Priya', lastName: 'Sundaram', dept: 'Cardiology', specialization: 'Clinical Cardiology', phone: '+91 9876500104' },
        // Orthopedics
        { firstName: 'Karthik', lastName: 'Rajan', dept: 'Orthopedics', specialization: 'Joint Replacement', phone: '+91 9876500105' },
        { firstName: 'Anand', lastName: 'Krishnan', dept: 'Orthopedics', specialization: 'Sports Medicine', phone: '+91 9876500106' },
        // Pediatrics
        { firstName: 'Meera', lastName: 'Balasubramanian', dept: 'Pediatrics', specialization: 'Neonatology', phone: '+91 9876500107' },
        { firstName: 'Divya', lastName: 'Shankar', dept: 'Pediatrics', specialization: 'Pediatric Care', phone: '+91 9876500108' },
        // Gynecology & Obstetrics
        { firstName: 'Saranya', lastName: 'Mohan', dept: 'Gynecology & Obstetrics', specialization: 'Obstetrics', phone: '+91 9876500109' },
        { firstName: 'Kavitha', lastName: 'Ramachandran', dept: 'Gynecology & Obstetrics', specialization: 'Gynecology', phone: '+91 9876500110' },
        // Neurology
        { firstName: 'Suresh', lastName: 'Iyer', dept: 'Neurology', specialization: 'Neurology', phone: '+91 9876500111' },
        // Dermatology
        { firstName: 'Deepa', lastName: 'Natarajan', dept: 'Dermatology', specialization: 'Dermatology', phone: '+91 9876500112' },
        // Ophthalmology
        { firstName: 'Ganesh', lastName: 'Pillai', dept: 'Ophthalmology', specialization: 'Ophthalmology', phone: '+91 9876500113' },
        // ENT
        { firstName: 'Ramya', lastName: 'Gopal', dept: 'ENT', specialization: 'ENT Surgery', phone: '+91 9876500114' },
        // Emergency
        { firstName: 'Vijay', lastName: 'Anand', dept: 'Emergency', specialization: 'Emergency Medicine', phone: '+91 9876500115' },
        { firstName: 'Arun', lastName: 'Prakash', dept: 'Emergency', specialization: 'Trauma Care', phone: '+91 9876500116' },
        // Radiology
        { firstName: 'Sathish', lastName: 'Kumar', dept: 'Radiology', specialization: 'Diagnostic Radiology', phone: '+91 9876500117' },
        // Pathology
        { firstName: 'Revathi', lastName: 'Subramanian', dept: 'Pathology', specialization: 'Clinical Pathology', phone: '+91 9876500118' }
    ],
    nurses: [
        { firstName: 'Radha', lastName: 'Krishnamurthy', phone: '+91 9876500201' },
        { firstName: 'Geetha', lastName: 'Venkat', phone: '+91 9876500202' },
        { firstName: 'Saroja', lastName: 'Raman', phone: '+91 9876500203' },
        { firstName: 'Kamala', lastName: 'Devi', phone: '+91 9876500204' },
        { firstName: 'Vimala', lastName: 'Sundari', phone: '+91 9876500205' },
        { firstName: 'Padma', lastName: 'Priya', phone: '+91 9876500206' },
        { firstName: 'Lalitha', lastName: 'Kumari', phone: '+91 9876500207' },
        { firstName: 'Uma', lastName: 'Maheswari', phone: '+91 9876500208' },
        { firstName: 'Vasanthi', lastName: 'Lakshmi', phone: '+91 9876500209' },
        { firstName: 'Jayanthi', lastName: 'Selvi', phone: '+91 9876500210' }
    ],
    receptionists: [
        { firstName: 'Priyanka', lastName: 'Sharma', phone: '+91 9876500301' },
        { firstName: 'Sneha', lastName: 'Reddy', phone: '+91 9876500302' },
        { firstName: 'Anitha', lastName: 'Kumar', phone: '+91 9876500303' }
    ],
    pharmacists: [
        { firstName: 'Murali', lastName: 'Krishna', phone: '+91 9876500401' },
        { firstName: 'Bala', lastName: 'Murugan', phone: '+91 9876500402' }
    ],
    labTechnicians: [
        { firstName: 'Selvam', lastName: 'Raj', phone: '+91 9876500501' },
        { firstName: 'Mani', lastName: 'Kandan', phone: '+91 9876500502' }
    ],
    accountants: [
        { firstName: 'Ravi', lastName: 'Chandran', phone: '+91 9876500601' }
    ]
};

// Common password for all staff (except admin)
const STAFF_PASSWORD = 'Demo@123';

// ============ MEDICINES CONFIGURATION ============
const MEDICINES_CONFIG = [
    { name: 'Paracetamol 500mg', genericName: 'Acetaminophen', category: 'Pain Relief', unitPrice: 2.5, stock: 1000, reorderLevel: 200 },
    { name: 'Paracetamol 650mg', genericName: 'Acetaminophen', category: 'Pain Relief', unitPrice: 3.0, stock: 800, reorderLevel: 150 },
    { name: 'Amoxicillin 250mg', genericName: 'Amoxicillin', category: 'Antibiotic', unitPrice: 8.0, stock: 500, reorderLevel: 100 },
    { name: 'Amoxicillin 500mg', genericName: 'Amoxicillin', category: 'Antibiotic', unitPrice: 12.0, stock: 400, reorderLevel: 80 },
    { name: 'Azithromycin 500mg', genericName: 'Azithromycin', category: 'Antibiotic', unitPrice: 25.0, stock: 300, reorderLevel: 60 },
    { name: 'Ciprofloxacin 500mg', genericName: 'Ciprofloxacin', category: 'Antibiotic', unitPrice: 15.0, stock: 350, reorderLevel: 70 },
    { name: 'Omeprazole 20mg', genericName: 'Omeprazole', category: 'Gastric', unitPrice: 5.5, stock: 600, reorderLevel: 120 },
    { name: 'Pantoprazole 40mg', genericName: 'Pantoprazole', category: 'Gastric', unitPrice: 7.0, stock: 500, reorderLevel: 100 },
    { name: 'Ranitidine 150mg', genericName: 'Ranitidine', category: 'Gastric', unitPrice: 4.0, stock: 400, reorderLevel: 80 },
    { name: 'Metformin 500mg', genericName: 'Metformin', category: 'Diabetes', unitPrice: 3.0, stock: 800, reorderLevel: 160 },
    { name: 'Metformin 850mg', genericName: 'Metformin', category: 'Diabetes', unitPrice: 4.5, stock: 600, reorderLevel: 120 },
    { name: 'Glimepiride 2mg', genericName: 'Glimepiride', category: 'Diabetes', unitPrice: 6.0, stock: 400, reorderLevel: 80 },
    { name: 'Amlodipine 5mg', genericName: 'Amlodipine', category: 'Cardiac', unitPrice: 4.5, stock: 500, reorderLevel: 100 },
    { name: 'Amlodipine 10mg', genericName: 'Amlodipine', category: 'Cardiac', unitPrice: 6.0, stock: 400, reorderLevel: 80 },
    { name: 'Atenolol 50mg', genericName: 'Atenolol', category: 'Cardiac', unitPrice: 3.5, stock: 450, reorderLevel: 90 },
    { name: 'Losartan 50mg', genericName: 'Losartan', category: 'Cardiac', unitPrice: 6.0, stock: 400, reorderLevel: 80 },
    { name: 'Atorvastatin 10mg', genericName: 'Atorvastatin', category: 'Cardiac', unitPrice: 8.0, stock: 350, reorderLevel: 70 },
    { name: 'Aspirin 75mg', genericName: 'Aspirin', category: 'Cardiac', unitPrice: 2.0, stock: 600, reorderLevel: 120 },
    { name: 'Cetirizine 10mg', genericName: 'Cetirizine', category: 'Allergy', unitPrice: 2.0, stock: 700, reorderLevel: 140 },
    { name: 'Montelukast 10mg', genericName: 'Montelukast', category: 'Allergy', unitPrice: 8.0, stock: 300, reorderLevel: 60 },
    { name: 'Ibuprofen 400mg', genericName: 'Ibuprofen', category: 'Pain Relief', unitPrice: 3.5, stock: 600, reorderLevel: 120 },
    { name: 'Diclofenac 50mg', genericName: 'Diclofenac', category: 'Pain Relief', unitPrice: 4.0, stock: 500, reorderLevel: 100 },
    { name: 'Tramadol 50mg', genericName: 'Tramadol', category: 'Pain Relief', unitPrice: 10.0, stock: 200, reorderLevel: 40 },
    { name: 'Vitamin D3 60000IU', genericName: 'Cholecalciferol', category: 'Vitamins', unitPrice: 30.0, stock: 300, reorderLevel: 60 },
    { name: 'Vitamin B Complex', genericName: 'B-Complex', category: 'Vitamins', unitPrice: 5.0, stock: 400, reorderLevel: 80 },
    { name: 'Calcium + Vitamin D', genericName: 'Calcium Carbonate', category: 'Vitamins', unitPrice: 8.0, stock: 350, reorderLevel: 70 },
    { name: 'Iron + Folic Acid', genericName: 'Ferrous Sulfate', category: 'Vitamins', unitPrice: 4.0, stock: 400, reorderLevel: 80 },
    { name: 'Ondansetron 4mg', genericName: 'Ondansetron', category: 'Antiemetic', unitPrice: 6.0, stock: 300, reorderLevel: 60 },
    { name: 'Domperidone 10mg', genericName: 'Domperidone', category: 'Antiemetic', unitPrice: 3.0, stock: 400, reorderLevel: 80 },
    { name: 'Salbutamol Inhaler', genericName: 'Salbutamol', category: 'Respiratory', unitPrice: 120.0, stock: 100, reorderLevel: 20 }
];

// ============ LAB TESTS CONFIGURATION ============
const LAB_TESTS_CONFIG = [
    // Hematology
    { name: 'Complete Blood Count (CBC)', code: 'HEM001', category: 'hematology', price: 350, turnaroundTime: 4 },
    { name: 'Hemoglobin (Hb)', code: 'HEM002', category: 'hematology', price: 100, turnaroundTime: 2 },
    { name: 'Platelet Count', code: 'HEM003', category: 'hematology', price: 150, turnaroundTime: 2 },
    { name: 'ESR', code: 'HEM004', category: 'hematology', price: 100, turnaroundTime: 2 },
    { name: 'Blood Group & Rh Typing', code: 'HEM005', category: 'hematology', price: 200, turnaroundTime: 1 },
    { name: 'Peripheral Smear', code: 'HEM006', category: 'hematology', price: 250, turnaroundTime: 4 },
    // Biochemistry
    { name: 'Blood Glucose Fasting', code: 'BIO001', category: 'biochemistry', price: 80, turnaroundTime: 2 },
    { name: 'Blood Glucose PP', code: 'BIO002', category: 'biochemistry', price: 80, turnaroundTime: 2 },
    { name: 'Blood Glucose Random', code: 'BIO003', category: 'biochemistry', price: 80, turnaroundTime: 1 },
    { name: 'HbA1c', code: 'BIO004', category: 'biochemistry', price: 450, turnaroundTime: 4 },
    { name: 'Lipid Profile', code: 'BIO005', category: 'biochemistry', price: 600, turnaroundTime: 4 },
    { name: 'Liver Function Test (LFT)', code: 'BIO006', category: 'biochemistry', price: 800, turnaroundTime: 6 },
    { name: 'Kidney Function Test (KFT)', code: 'BIO007', category: 'biochemistry', price: 700, turnaroundTime: 6 },
    { name: 'Serum Creatinine', code: 'BIO008', category: 'biochemistry', price: 150, turnaroundTime: 2 },
    { name: 'Blood Urea', code: 'BIO009', category: 'biochemistry', price: 120, turnaroundTime: 2 },
    { name: 'Serum Uric Acid', code: 'BIO010', category: 'biochemistry', price: 150, turnaroundTime: 2 },
    { name: 'Serum Electrolytes', code: 'BIO011', category: 'biochemistry', price: 400, turnaroundTime: 4 },
    { name: 'Serum Calcium', code: 'BIO012', category: 'biochemistry', price: 150, turnaroundTime: 2 },
    // Endocrine
    { name: 'Thyroid Profile (T3, T4, TSH)', code: 'END001', category: 'endocrine', price: 900, turnaroundTime: 8 },
    { name: 'TSH', code: 'END002', category: 'endocrine', price: 350, turnaroundTime: 4 },
    { name: 'Free T3', code: 'END003', category: 'endocrine', price: 300, turnaroundTime: 4 },
    { name: 'Free T4', code: 'END004', category: 'endocrine', price: 300, turnaroundTime: 4 },
    { name: 'Vitamin D (25-OH)', code: 'END005', category: 'endocrine', price: 1200, turnaroundTime: 8 },
    { name: 'Vitamin B12', code: 'END006', category: 'endocrine', price: 800, turnaroundTime: 6 },
    // Microbiology
    { name: 'Urine Routine Examination', code: 'MIC001', category: 'microbiology', price: 150, turnaroundTime: 2 },
    { name: 'Urine Culture & Sensitivity', code: 'MIC002', category: 'microbiology', price: 600, turnaroundTime: 48 },
    { name: 'Stool Routine', code: 'MIC003', category: 'microbiology', price: 150, turnaroundTime: 2 },
    { name: 'Stool Culture', code: 'MIC004', category: 'microbiology', price: 600, turnaroundTime: 48 },
    { name: 'Blood Culture', code: 'MIC005', category: 'microbiology', price: 800, turnaroundTime: 72 },
    { name: 'Sputum Culture', code: 'MIC006', category: 'microbiology', price: 600, turnaroundTime: 48 },
    // Serology
    { name: 'Widal Test', code: 'SER001', category: 'serology', price: 300, turnaroundTime: 4 },
    { name: 'Dengue NS1 Antigen', code: 'SER002', category: 'serology', price: 600, turnaroundTime: 4 },
    { name: 'Dengue IgG/IgM', code: 'SER003', category: 'serology', price: 800, turnaroundTime: 4 },
    { name: 'Malaria Antigen', code: 'SER004', category: 'serology', price: 400, turnaroundTime: 2 },
    { name: 'HIV 1 & 2', code: 'SER005', category: 'serology', price: 500, turnaroundTime: 4 },
    { name: 'HBsAg', code: 'SER006', category: 'serology', price: 400, turnaroundTime: 4 },
    { name: 'HCV Antibody', code: 'SER007', category: 'serology', price: 600, turnaroundTime: 4 },
    { name: 'CRP (C-Reactive Protein)', code: 'SER008', category: 'serology', price: 400, turnaroundTime: 4 },
    { name: 'RA Factor', code: 'SER009', category: 'serology', price: 350, turnaroundTime: 4 },
    { name: 'ASO Titre', code: 'SER010', category: 'serology', price: 350, turnaroundTime: 4 },
    // Cardiology
    { name: 'ECG', code: 'CAR001', category: 'cardiology', price: 300, turnaroundTime: 1 },
    { name: 'Troponin I', code: 'CAR002', category: 'cardiology', price: 800, turnaroundTime: 2 },
    { name: 'BNP', code: 'CAR003', category: 'cardiology', price: 1500, turnaroundTime: 4 },
    // Radiology
    { name: 'Chest X-Ray', code: 'RAD001', category: 'radiology', price: 400, turnaroundTime: 1 },
    { name: 'X-Ray - Extremities', code: 'RAD002', category: 'radiology', price: 350, turnaroundTime: 1 },
    { name: 'X-Ray - Spine', code: 'RAD003', category: 'radiology', price: 500, turnaroundTime: 1 },
    { name: 'Ultrasound - Abdomen', code: 'RAD004', category: 'radiology', price: 800, turnaroundTime: 1 },
    { name: 'Ultrasound - Pelvis', code: 'RAD005', category: 'radiology', price: 800, turnaroundTime: 1 }
];

// ============ PATIENTS CONFIGURATION ============
const PATIENTS_CONFIG = [
    { firstName: 'Ravi', lastName: 'Kumar', gender: 'male', dob: '1985-03-15', phone: '+91 9876600001', bloodGroup: 'O+' },
    { firstName: 'Sita', lastName: 'Devi', gender: 'female', dob: '1990-07-22', phone: '+91 9876600002', bloodGroup: 'A+' },
    { firstName: 'Krishna', lastName: 'Moorthy', gender: 'male', dob: '1978-11-08', phone: '+91 9876600003', bloodGroup: 'B+' },
    { firstName: 'Radha', lastName: 'Lakshmi', gender: 'female', dob: '1982-05-30', phone: '+91 9876600004', bloodGroup: 'AB+' },
    { firstName: 'Arjun', lastName: 'Reddy', gender: 'male', dob: '1995-01-12', phone: '+91 9876600005', bloodGroup: 'O-' },
    { firstName: 'Priya', lastName: 'Sharma', gender: 'female', dob: '1988-09-25', phone: '+91 9876600006', bloodGroup: 'A-' },
    { firstName: 'Venkat', lastName: 'Rao', gender: 'male', dob: '1972-12-03', phone: '+91 9876600007', bloodGroup: 'B-' },
    { firstName: 'Lakshmi', lastName: 'Naidu', gender: 'female', dob: '1965-04-18', phone: '+91 9876600008', bloodGroup: 'AB-' },
    { firstName: 'Surya', lastName: 'Prakash', gender: 'male', dob: '2000-08-07', phone: '+91 9876600009', bloodGroup: 'O+' },
    { firstName: 'Kavitha', lastName: 'Sundaram', gender: 'female', dob: '1992-02-14', phone: '+91 9876600010', bloodGroup: 'A+' },
    { firstName: 'Anil', lastName: 'Babu', gender: 'male', dob: '1980-06-20', phone: '+91 9876600011', bloodGroup: 'B+' },
    { firstName: 'Sunitha', lastName: 'Rani', gender: 'female', dob: '1975-10-11', phone: '+91 9876600012', bloodGroup: 'O+' },
    { firstName: 'Mahesh', lastName: 'Kumar', gender: 'male', dob: '1998-03-28', phone: '+91 9876600013', bloodGroup: 'A+' },
    { firstName: 'Geetha', lastName: 'Priya', gender: 'female', dob: '1987-07-05', phone: '+91 9876600014', bloodGroup: 'B+' },
    { firstName: 'Ram', lastName: 'Prasad', gender: 'male', dob: '1970-11-30', phone: '+91 9876600015', bloodGroup: 'AB+' },
    { firstName: 'Anu', lastName: 'Lakshmi', gender: 'female', dob: '1993-04-22', phone: '+91 9876600016', bloodGroup: 'O+' },
    { firstName: 'Kiran', lastName: 'Kumar', gender: 'male', dob: '1985-08-15', phone: '+91 9876600017', bloodGroup: 'A+' },
    { firstName: 'Padma', lastName: 'Devi', gender: 'female', dob: '1968-12-08', phone: '+91 9876600018', bloodGroup: 'B+' },
    { firstName: 'Vijay', lastName: 'Shankar', gender: 'male', dob: '1990-02-25', phone: '+91 9876600019', bloodGroup: 'O+' },
    { firstName: 'Uma', lastName: 'Maheswari', gender: 'female', dob: '1983-06-12', phone: '+91 9876600020', bloodGroup: 'A+' }
];

// ============ MAIN SEED FUNCTION ============
async function seedCuddaloreHMS() {
    try {
        console.log('🚀 Starting Cuddalore HMS Seed...\n');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`   Organization: ${ORG_CONFIG.name}`);
        console.log(`   Subdomain: ${ORG_CONFIG.subdomain}`);
        console.log('═══════════════════════════════════════════════════════════════\n');

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

        // ===== STEP 1: Create Organization =====
        console.log('🏢 Creating Organization...');
        let organization = await orgRepo.findOne({ where: { subdomain: ORG_CONFIG.subdomain } });

        if (organization) {
            console.log(`  ⚠️  Organization "${ORG_CONFIG.name}" already exists. Using existing org.\n`);
        } else {
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
                    limits: { maxUsers: 200, maxPatients: 5000, maxStorage: 50 },
                    branding: { primaryColor: '#1a5276', secondaryColor: '#e91e63' }
                }
            });
            await orgRepo.save(organization);
            console.log(`  ✅ Created Organization: ${organization.name}\n`);
        }

        const orgId = organization.id;

        // ===== STEP 2: Create Location =====
        console.log('📍 Creating Location...');
        let location = await locationRepo.findOne({
            where: { organizationId: orgId, code: LOCATION_CONFIG.code }
        });

        if (!location) {
            location = locationRepo.create({
                organizationId: orgId,
                name: LOCATION_CONFIG.name,
                code: LOCATION_CONFIG.code,
                address: LOCATION_CONFIG.address,
                city: LOCATION_CONFIG.city,
                state: LOCATION_CONFIG.state,
                country: 'India',
                phone: LOCATION_CONFIG.phone,
                email: LOCATION_CONFIG.email,
                isMainBranch: LOCATION_CONFIG.isMainBranch,
                isActive: true,
                settings: {
                    capacity: LOCATION_CONFIG.capacity,
                    features: { hasPharmacy: true, hasLaboratory: true, hasEmergency: true, hasRadiology: true }
                }
            });
            await locationRepo.save(location);
            console.log(`  ✅ ${LOCATION_CONFIG.name} (${LOCATION_CONFIG.code}) - ${LOCATION_CONFIG.city}\n`);
        } else {
            console.log(`  ⏭️  Location already exists\n`);
        }

        // ===== STEP 3: Create Departments =====
        console.log('🏥 Creating Departments...');
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
                } as any) as unknown as Department;
                await deptRepo.save(newDept);
                createdDepts.set(deptConfig.name, newDept);
                console.log(`  ✅ ${deptConfig.name}`);
            } else {
                createdDepts.set(deptConfig.name, dept);
                console.log(`  ⏭️  ${deptConfig.name} (exists)`);
            }
        }
        console.log('');

        // ===== STEP 4: Create Services =====
        console.log('📋 Creating Services...');
        let serviceCount = 0;
        for (const [deptName, services] of Object.entries(SERVICES_BY_DEPT)) {
            const dept = createdDepts.get(deptName);
            if (!dept) continue;

            for (const svc of services) {
                const existing = await serviceRepo.findOne({
                    where: { name: svc.name, organizationId: orgId }
                });
                if (!existing) {
                    const service = serviceRepo.create({
                        name: svc.name,
                        description: `${svc.name} service`,
                        status: 'active',
                        averageDuration: svc.duration,
                        price: svc.price,
                        department: dept,
                        departmentId: (dept as any).id,
                        organizationId: orgId
                    } as any);
                    await serviceRepo.save(service);
                    serviceCount++;
                }
            }
        }
        console.log(`  ✅ Created ${serviceCount} services\n`);

        // ===== STEP 5: Create Admin =====
        console.log('👤 Creating Admin User...');
        let admin = await userRepo.findOne({ where: { email: STAFF_CONFIG.admin.email, organizationId: orgId } });
        if (!admin) {
            const hashedPassword = await bcrypt.hash(STAFF_CONFIG.admin.password, 10);
            admin = userRepo.create({
                email: STAFF_CONFIG.admin.email,
                password: hashedPassword,
                firstName: STAFF_CONFIG.admin.firstName,
                lastName: STAFF_CONFIG.admin.lastName,
                phone: STAFF_CONFIG.admin.phone,
                role: 'admin' as any,
                organizationId: orgId,
                isActive: true
            });
            await userRepo.save(admin);
            console.log(`  ✅ Admin: ${STAFF_CONFIG.admin.email}\n`);
        } else {
            console.log(`  ⏭️  Admin already exists\n`);
        }

        // ===== STEP 6: Create Doctors =====
        console.log('👨‍⚕️ Creating Doctors...');
        const createdDoctors: User[] = [];
        for (const doc of STAFF_CONFIG.doctors) {
            const email = `dr.${doc.firstName.toLowerCase()}.${doc.lastName.toLowerCase()}@cuddalore-hms.com`;
            let doctor = await userRepo.findOne({ where: { email, organizationId: orgId } });
            
            if (!doctor) {
                const dept = createdDepts.get(doc.dept);
                const hashedPassword = await bcrypt.hash(STAFF_PASSWORD, 10);
                doctor = userRepo.create({
                    email,
                    password: hashedPassword,
                    firstName: `Dr. ${doc.firstName}`,
                    lastName: doc.lastName,
                    phone: doc.phone,
                    role: 'doctor' as any,
                    organizationId: orgId,
                    departmentId: dept ? (dept as any).id : undefined,
                    isActive: true,
                    preferences: { specialization: doc.specialization }
                });
                await userRepo.save(doctor);
                createdDoctors.push(doctor);
                console.log(`  ✅ Dr. ${doc.firstName} ${doc.lastName} - ${doc.dept}`);
            }
        }
        console.log('');

        // ===== STEP 7: Create Nurses =====
        console.log('👩‍⚕️ Creating Nurses...');
        for (const nurse of STAFF_CONFIG.nurses) {
            const email = `nurse.${nurse.firstName.toLowerCase()}@cuddalore-hms.com`;
            const existing = await userRepo.findOne({ where: { email, organizationId: orgId } });
            if (!existing) {
                const hashedPassword = await bcrypt.hash(STAFF_PASSWORD, 10);
                await userRepo.save(userRepo.create({
                    email,
                    password: hashedPassword,
                    firstName: nurse.firstName,
                    lastName: nurse.lastName,
                    phone: nurse.phone,
                    role: 'nurse' as any,
                    organizationId: orgId,
                    isActive: true
                }));
                console.log(`  ✅ ${nurse.firstName} ${nurse.lastName}`);
            }
        }
        console.log('');

        // ===== STEP 8: Create Receptionists =====
        console.log('📞 Creating Receptionists...');
        for (let i = 0; i < STAFF_CONFIG.receptionists.length; i++) {
            const rec = STAFF_CONFIG.receptionists[i];
            const email = `reception${i + 1}@cuddalore-hms.com`;
            const existing = await userRepo.findOne({ where: { email, organizationId: orgId } });
            if (!existing) {
                const hashedPassword = await bcrypt.hash(STAFF_PASSWORD, 10);
                await userRepo.save(userRepo.create({
                    email,
                    password: hashedPassword,
                    firstName: rec.firstName,
                    lastName: rec.lastName,
                    phone: rec.phone,
                    role: 'receptionist' as any,
                    organizationId: orgId,
                    isActive: true
                }));
                console.log(`  ✅ ${rec.firstName} ${rec.lastName}`);
            }
        }
        console.log('');

        // ===== STEP 9: Create Pharmacists =====
        console.log('💊 Creating Pharmacists...');
        for (let i = 0; i < STAFF_CONFIG.pharmacists.length; i++) {
            const pharma = STAFF_CONFIG.pharmacists[i];
            const email = `pharmacist${i + 1}@cuddalore-hms.com`;
            const existing = await userRepo.findOne({ where: { email, organizationId: orgId } });
            if (!existing) {
                const hashedPassword = await bcrypt.hash(STAFF_PASSWORD, 10);
                await userRepo.save(userRepo.create({
                    email,
                    password: hashedPassword,
                    firstName: pharma.firstName,
                    lastName: pharma.lastName,
                    phone: pharma.phone,
                    role: 'pharmacist' as any,
                    organizationId: orgId,
                    isActive: true
                }));
                console.log(`  ✅ ${pharma.firstName} ${pharma.lastName}`);
            }
        }
        console.log('');

        // ===== STEP 10: Create Lab Technicians =====
        console.log('🧪 Creating Lab Technicians...');
        for (let i = 0; i < STAFF_CONFIG.labTechnicians.length; i++) {
            const lab = STAFF_CONFIG.labTechnicians[i];
            const email = `lab${i + 1}@cuddalore-hms.com`;
            const existing = await userRepo.findOne({ where: { email, organizationId: orgId } });
            if (!existing) {
                const hashedPassword = await bcrypt.hash(STAFF_PASSWORD, 10);
                await userRepo.save(userRepo.create({
                    email,
                    password: hashedPassword,
                    firstName: lab.firstName,
                    lastName: lab.lastName,
                    phone: lab.phone,
                    role: 'lab_technician' as any,
                    organizationId: orgId,
                    isActive: true
                }));
                console.log(`  ✅ ${lab.firstName} ${lab.lastName}`);
            }
        }
        console.log('');

        // ===== STEP 11: Create Accountants =====
        console.log('💰 Creating Accountants...');
        for (let i = 0; i < STAFF_CONFIG.accountants.length; i++) {
            const acc = STAFF_CONFIG.accountants[i];
            const email = `accountant${i + 1}@cuddalore-hms.com`;
            const existing = await userRepo.findOne({ where: { email, organizationId: orgId } });
            if (!existing) {
                const hashedPassword = await bcrypt.hash(STAFF_PASSWORD, 10);
                await userRepo.save(userRepo.create({
                    email,
                    password: hashedPassword,
                    firstName: acc.firstName,
                    lastName: acc.lastName,
                    phone: acc.phone,
                    role: 'accountant' as any,
                    organizationId: orgId,
                    isActive: true
                }));
                console.log(`  ✅ ${acc.firstName} ${acc.lastName}`);
            }
        }
        console.log('');

        // ===== STEP 12: Create Patients =====
        console.log('🧑 Creating Patients...');
        const createdPatients: User[] = [];
        for (let i = 0; i < PATIENTS_CONFIG.length; i++) {
            const pat = PATIENTS_CONFIG[i];
            const email = `patient.${pat.firstName.toLowerCase()}${i + 1}@gmail.com`;
            const existingPatient = await userRepo.findOne({ where: { email, organizationId: orgId } });
            if (!existingPatient) {
                const hashedPassword = await bcrypt.hash('Patient@123', 10);
                const newPatient = userRepo.create({
                    email,
                    password: hashedPassword,
                    firstName: pat.firstName,
                    lastName: pat.lastName,
                    phone: pat.phone,
                    role: 'patient' as any,
                    organizationId: orgId,
                    isActive: true,
                    dateOfBirth: new Date(pat.dob),
                    gender: pat.gender,
                    address: `${100 + i}, Main Street, Cuddalore`,
                    bloodGroup: pat.bloodGroup
                } as any) as unknown as User;
                await userRepo.save(newPatient);
                createdPatients.push(newPatient);
            }
        }
        console.log(`  ✅ Created ${createdPatients.length} patients\n`);

        // ===== STEP 13: Create Appointments =====
        console.log('📅 Creating Sample Appointments...');
        const allServices = await serviceRepo.find({ where: { organizationId: orgId } });
        let appointmentCount = 0;

        if (createdPatients.length > 0 && createdDoctors.length > 0 && allServices.length > 0) {
            for (let i = 0; i < 40; i++) {
                const patient = createdPatients[i % createdPatients.length];
                const doctor = createdDoctors[i % createdDoctors.length];
                const service = allServices[i % allServices.length];

                const startDate = new Date();
                startDate.setDate(startDate.getDate() + (i % 14) - 7);
                startDate.setHours(9 + (i % 8), (i % 2) * 30, 0, 0);

                const endDate = new Date(startDate);
                endDate.setMinutes(endDate.getMinutes() + 30);

                const statuses = [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING, AppointmentStatus.COMPLETED];
                const status = i < 15 ? AppointmentStatus.COMPLETED : statuses[i % 3];

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
        console.log(`  ✅ Created ${appointmentCount} appointments\n`);

        // ===== STEP 14: Create Medicines =====
        console.log('💊 Creating Pharmacy Inventory...');
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
                        strength: medConfig.name.split(' ').pop() || '500mg',
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
                // Skip silently
            }
        }
        console.log(`  ✅ Created ${medicineCount} medicines\n`);

        // ===== STEP 15: Create Lab Tests =====
        console.log('🧪 Creating Lab Test Catalog...');
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
                // Skip silently
            }
        }
        console.log(`  ✅ Created ${labTestCount} lab tests\n`);

        // ===== SUMMARY =====
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('                   🎉 CUDDALORE HMS SEED COMPLETE 🎉');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`\n📌 Organization: ${ORG_CONFIG.name}`);
        console.log(`   Subdomain: ${ORG_CONFIG.subdomain}`);
        console.log(`\n📍 Location: ${LOCATION_CONFIG.name} - ${LOCATION_CONFIG.city}`);
        console.log(`\n🏥 Departments: ${DEPARTMENTS_CONFIG.length}`);
        console.log(`📋 Services: ${serviceCount}`);
        console.log(`👨‍⚕️ Doctors: ${STAFF_CONFIG.doctors.length}`);
        console.log(`👩‍⚕️ Nurses: ${STAFF_CONFIG.nurses.length}`);
        console.log(`📞 Receptionists: ${STAFF_CONFIG.receptionists.length}`);
        console.log(`💊 Pharmacists: ${STAFF_CONFIG.pharmacists.length}`);
        console.log(`🧪 Lab Technicians: ${STAFF_CONFIG.labTechnicians.length}`);
        console.log(`💰 Accountants: ${STAFF_CONFIG.accountants.length}`);
        console.log(`🧑 Patients: ${createdPatients.length}`);
        console.log(`📅 Appointments: ${appointmentCount}`);
        console.log(`💊 Medicines: ${medicineCount}`);
        console.log(`🧪 Lab Tests: ${labTestCount}`);

        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('                      🔑 LOGIN CREDENTIALS');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`\n👤 Admin:         ${STAFF_CONFIG.admin.email} / ${STAFF_CONFIG.admin.password}`);
        console.log(`👨‍⚕️ Doctors:       dr.[firstname].[lastname]@cuddalore-hms.com / ${STAFF_PASSWORD}`);
        console.log(`👩‍⚕️ Nurses:        nurse.[firstname]@cuddalore-hms.com / ${STAFF_PASSWORD}`);
        console.log(`📞 Receptionists: reception[1-3]@cuddalore-hms.com / ${STAFF_PASSWORD}`);
        console.log(`💊 Pharmacists:   pharmacist[1-2]@cuddalore-hms.com / ${STAFF_PASSWORD}`);
        console.log(`🧪 Lab Techs:     lab[1-2]@cuddalore-hms.com / ${STAFF_PASSWORD}`);
        console.log(`💰 Accountants:   accountant1@cuddalore-hms.com / ${STAFF_PASSWORD}`);
        console.log(`🧑 Patients:      patient.[firstname]N@gmail.com / Patient@123`);
        console.log('\n═══════════════════════════════════════════════════════════════\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
}

seedCuddaloreHMS();
