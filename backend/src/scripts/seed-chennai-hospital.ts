/**
 * Seed Script: Chennai Hospital - Complete Organization Data
 * 
 * Creates Chennai Hospital organization with:
 * - Organization details
 * - Multiple departments
 * - All role types: Admin, Doctors, Nurses, Receptionists, Pharmacists, Lab Technicians, Patients
 * - Services mapped to departments
 * - Sample appointments
 * - Pharmacy inventory
 * - Lab tests
 * 
 * Usage:
 *   npx ts-node src/scripts/seed-chennai-hospital.ts
 *   
 * Or via Docker:
 *   docker exec -it hospital-website-backend-1 npx ts-node src/scripts/seed-chennai-hospital.ts
 */

import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import { Department } from '../models/Department';
import { Service } from '../models/Service';
import { Appointment, AppointmentStatus } from '../models/Appointment';
import { Medicine } from '../models/pharmacy/Medicine';
import { LabTest } from '../models/LabTest';
import * as bcrypt from 'bcryptjs';

// ============================================
// CONFIGURATION - Chennai Hospital
// ============================================

const ORG_CONFIG = {
    name: 'Chennai Hospital',
    subdomain: 'chennaihospital',
    description: 'A leading multi-specialty hospital in Chennai providing world-class healthcare services with state-of-the-art facilities and experienced medical professionals.',
    email: 'info@chennaihospital.com',
    phone: '+91 44 2815 6789',
    address: '123 Anna Salai, Nungambakkam, Chennai - 600034, Tamil Nadu, India'
};

// Departments with detailed descriptions
const DEPARTMENTS_CONFIG = [
    { name: 'General Medicine', description: 'Comprehensive primary care and internal medicine services for adults', status: 'active' },
    { name: 'Cardiology', description: 'Advanced heart care including diagnostics, interventions, and cardiac rehabilitation', status: 'active' },
    { name: 'Orthopedics', description: 'Complete bone, joint, and musculoskeletal care with modern surgical techniques', status: 'active' },
    { name: 'Pediatrics', description: 'Specialized healthcare for infants, children, and adolescents', status: 'active' },
    { name: 'Gynecology & Obstetrics', description: "Comprehensive women's health services including maternity care", status: 'active' },
    { name: 'Neurology', description: 'Expert care for brain, spine, and nervous system disorders', status: 'active' },
    { name: 'Dermatology', description: 'Advanced skin care, cosmetic dermatology, and treatment of skin disorders', status: 'active' },
    { name: 'Ophthalmology', description: 'Complete eye care including cataract surgery and vision correction', status: 'active' },
    { name: 'ENT', description: 'Ear, Nose, and Throat specialist services with modern diagnostic equipment', status: 'active' },
    { name: 'Emergency Medicine', description: '24/7 emergency and trauma care with fully equipped ICU', status: 'active' },
    { name: 'Gastroenterology', description: 'Digestive system disorders diagnosis and treatment', status: 'active' },
    { name: 'Pulmonology', description: 'Respiratory and lung disease treatment with advanced diagnostics', status: 'active' }
];

// Services mapped to departments
const SERVICES_BY_DEPT: Record<string, { name: string; duration: number; description: string }[]> = {
    'General Medicine': [
        { name: 'General Consultation', duration: 20, description: 'Comprehensive health consultation' },
        { name: 'Master Health Checkup', duration: 120, description: 'Complete body health assessment' },
        { name: 'Vaccination Services', duration: 15, description: 'All types of vaccinations' },
        { name: 'Diabetes Management', duration: 30, description: 'Chronic diabetes care and monitoring' },
        { name: 'Hypertension Management', duration: 30, description: 'Blood pressure monitoring and treatment' }
    ],
    'Cardiology': [
        { name: 'Cardiac Consultation', duration: 30, description: 'Heart health assessment' },
        { name: 'ECG', duration: 15, description: 'Electrocardiogram recording' },
        { name: '2D Echocardiography', duration: 45, description: 'Heart ultrasound imaging' },
        { name: 'Stress Test (TMT)', duration: 60, description: 'Treadmill stress testing' },
        { name: 'Holter Monitoring', duration: 30, description: '24-hour heart rhythm monitoring setup' }
    ],
    'Orthopedics': [
        { name: 'Orthopedic Consultation', duration: 25, description: 'Bone and joint assessment' },
        { name: 'Joint Injection Therapy', duration: 30, description: 'Therapeutic joint injections' },
        { name: 'Physiotherapy Session', duration: 45, description: 'Physical rehabilitation therapy' },
        { name: 'Fracture Management', duration: 60, description: 'Fracture treatment and casting' },
        { name: 'Sports Injury Treatment', duration: 40, description: 'Athletic injury care' }
    ],
    'Pediatrics': [
        { name: 'Child Consultation', duration: 25, description: 'Pediatric health checkup' },
        { name: 'Immunization', duration: 20, description: 'Child vaccination services' },
        { name: 'Growth Assessment', duration: 30, description: 'Child growth and development evaluation' },
        { name: 'Newborn Care', duration: 40, description: 'Newborn health assessment' },
        { name: 'Pediatric Emergency', duration: 30, description: 'Emergency care for children' }
    ],
    'Gynecology & Obstetrics': [
        { name: 'Gynec Consultation', duration: 25, description: "Women's health consultation" },
        { name: 'Prenatal Checkup', duration: 30, description: 'Pregnancy monitoring' },
        { name: 'Obstetric Ultrasound', duration: 30, description: 'Pregnancy ultrasound scan' },
        { name: 'Fertility Consultation', duration: 45, description: 'Fertility assessment and counseling' },
        { name: 'Postnatal Care', duration: 30, description: 'Post-delivery mother care' }
    ],
    'Neurology': [
        { name: 'Neuro Consultation', duration: 30, description: 'Neurological assessment' },
        { name: 'EEG', duration: 45, description: 'Brain wave recording' },
        { name: 'Migraine Treatment', duration: 25, description: 'Headache and migraine care' },
        { name: 'Stroke Assessment', duration: 60, description: 'Stroke evaluation and care' },
        { name: 'Nerve Conduction Study', duration: 45, description: 'Nerve function testing' }
    ],
    'Dermatology': [
        { name: 'Skin Consultation', duration: 20, description: 'Skin health assessment' },
        { name: 'Acne Treatment', duration: 30, description: 'Acne management and care' },
        { name: 'Laser Therapy', duration: 45, description: 'Laser skin treatment' },
        { name: 'Skin Biopsy', duration: 30, description: 'Skin tissue examination' },
        { name: 'Cosmetic Consultation', duration: 30, description: 'Aesthetic skin care' }
    ],
    'Ophthalmology': [
        { name: 'Eye Examination', duration: 25, description: 'Comprehensive eye checkup' },
        { name: 'Vision Testing', duration: 20, description: 'Visual acuity assessment' },
        { name: 'Glaucoma Screening', duration: 30, description: 'Eye pressure testing' },
        { name: 'Cataract Consultation', duration: 30, description: 'Cataract assessment' },
        { name: 'Retina Examination', duration: 35, description: 'Retinal health check' }
    ],
    'ENT': [
        { name: 'ENT Consultation', duration: 25, description: 'Ear, nose, throat checkup' },
        { name: 'Audiometry', duration: 30, description: 'Hearing test' },
        { name: 'Endoscopy', duration: 45, description: 'Nasal/throat endoscopy' },
        { name: 'Tonsillitis Treatment', duration: 25, description: 'Tonsil infection care' },
        { name: 'Vertigo Treatment', duration: 30, description: 'Balance disorder treatment' }
    ],
    'Emergency Medicine': [
        { name: 'Emergency Consultation', duration: 30, description: 'Urgent medical care' },
        { name: 'Trauma Care', duration: 60, description: 'Injury and trauma treatment' },
        { name: 'Critical Care', duration: 60, description: 'ICU level care' },
        { name: 'Minor Surgery', duration: 45, description: 'Minor surgical procedures' },
        { name: 'Wound Care', duration: 30, description: 'Wound treatment and dressing' }
    ],
    'Gastroenterology': [
        { name: 'GI Consultation', duration: 25, description: 'Digestive health assessment' },
        { name: 'Endoscopy', duration: 45, description: 'Upper GI endoscopy' },
        { name: 'Colonoscopy', duration: 60, description: 'Colon examination' },
        { name: 'Liver Function Assessment', duration: 30, description: 'Liver health evaluation' },
        { name: 'Acid Reflux Treatment', duration: 25, description: 'GERD management' }
    ],
    'Pulmonology': [
        { name: 'Pulmonary Consultation', duration: 25, description: 'Lung health assessment' },
        { name: 'Spirometry', duration: 30, description: 'Lung function test' },
        { name: 'Asthma Management', duration: 30, description: 'Asthma care and monitoring' },
        { name: 'Sleep Study Consultation', duration: 45, description: 'Sleep disorder assessment' },
        { name: 'Bronchoscopy', duration: 60, description: 'Airway examination' }
    ]
};

// Staff configuration with realistic Indian names
const DOCTORS_CONFIG = [
    // General Medicine
    { firstName: 'Rajesh', lastName: 'Krishnamurthy', department: 'General Medicine', specialization: 'Internal Medicine', qualification: 'MD, MRCP', experience: 15, consultationFee: 500 },
    { firstName: 'Priya', lastName: 'Venkataraman', department: 'General Medicine', specialization: 'Family Medicine', qualification: 'MD', experience: 12, consultationFee: 450 },
    // Cardiology
    { firstName: 'Arun', lastName: 'Subramanian', department: 'Cardiology', specialization: 'Interventional Cardiology', qualification: 'DM Cardiology, FACC', experience: 18, consultationFee: 800 },
    { firstName: 'Lakshmi', lastName: 'Narayanan', department: 'Cardiology', specialization: 'Clinical Cardiology', qualification: 'DM Cardiology', experience: 14, consultationFee: 700 },
    // Orthopedics
    { firstName: 'Karthik', lastName: 'Rajan', department: 'Orthopedics', specialization: 'Joint Replacement', qualification: 'MS Ortho, DNB', experience: 16, consultationFee: 600 },
    { firstName: 'Deepa', lastName: 'Sundaram', department: 'Orthopedics', specialization: 'Sports Medicine', qualification: 'MS Ortho', experience: 10, consultationFee: 550 },
    // Pediatrics
    { firstName: 'Meenakshi', lastName: 'Iyer', department: 'Pediatrics', specialization: 'Pediatric Care', qualification: 'MD Pediatrics, DCH', experience: 20, consultationFee: 500 },
    { firstName: 'Suresh', lastName: 'Balaji', department: 'Pediatrics', specialization: 'Neonatology', qualification: 'MD, DM Neonatology', experience: 12, consultationFee: 600 },
    // Gynecology
    { firstName: 'Kavitha', lastName: 'Ramachandran', department: 'Gynecology & Obstetrics', specialization: 'Obstetrics', qualification: 'MS OBG, DNB', experience: 17, consultationFee: 600 },
    { firstName: 'Anitha', lastName: 'Mohan', department: 'Gynecology & Obstetrics', specialization: 'Gynecology', qualification: 'MS OBG', experience: 13, consultationFee: 550 },
    // Neurology
    { firstName: 'Venkatesh', lastName: 'Pillai', department: 'Neurology', specialization: 'Neurology', qualification: 'DM Neurology', experience: 15, consultationFee: 750 },
    { firstName: 'Saranya', lastName: 'Kumar', department: 'Neurology', specialization: 'Stroke Medicine', qualification: 'DM Neurology', experience: 11, consultationFee: 700 },
    // Dermatology
    { firstName: 'Revathi', lastName: 'Shankar', department: 'Dermatology', specialization: 'Clinical Dermatology', qualification: 'MD Dermatology', experience: 14, consultationFee: 500 },
    { firstName: 'Ganesh', lastName: 'Natarajan', department: 'Dermatology', specialization: 'Cosmetic Dermatology', qualification: 'MD, DVD', experience: 9, consultationFee: 550 },
    // Ophthalmology
    { firstName: 'Padmini', lastName: 'Srinivasan', department: 'Ophthalmology', specialization: 'Cataract Surgery', qualification: 'MS Ophthalmology', experience: 18, consultationFee: 500 },
    { firstName: 'Ramesh', lastName: 'Gopal', department: 'Ophthalmology', specialization: 'Retina Specialist', qualification: 'MS, DNB Ophthalmology', experience: 13, consultationFee: 600 },
    // ENT
    { firstName: 'Senthil', lastName: 'Murugan', department: 'ENT', specialization: 'ENT Surgery', qualification: 'MS ENT', experience: 16, consultationFee: 500 },
    { firstName: 'Divya', lastName: 'Raghavan', department: 'ENT', specialization: 'Audiology', qualification: 'MS ENT, DNB', experience: 10, consultationFee: 450 },
    // Emergency
    { firstName: 'Vijay', lastName: 'Anand', department: 'Emergency Medicine', specialization: 'Emergency Medicine', qualification: 'MD Emergency Medicine', experience: 12, consultationFee: 600 },
    { firstName: 'Shanthi', lastName: 'Prasad', department: 'Emergency Medicine', specialization: 'Critical Care', qualification: 'MD, IDCCM', experience: 14, consultationFee: 650 },
    // Gastroenterology
    { firstName: 'Murali', lastName: 'Krishnan', department: 'Gastroenterology', specialization: 'Gastroenterology', qualification: 'DM Gastroenterology', experience: 15, consultationFee: 700 },
    { firstName: 'Geetha', lastName: 'Raman', department: 'Gastroenterology', specialization: 'Hepatology', qualification: 'DM Gastro', experience: 11, consultationFee: 650 },
    // Pulmonology
    { firstName: 'Balasubramanian', lastName: 'Nair', department: 'Pulmonology', specialization: 'Pulmonology', qualification: 'DM Pulmonology', experience: 17, consultationFee: 650 },
    { firstName: 'Jayashree', lastName: 'Menon', department: 'Pulmonology', specialization: 'Sleep Medicine', qualification: 'MD, DM Pulmonology', experience: 10, consultationFee: 600 }
];

const NURSES_CONFIG = [
    { firstName: 'Radha', lastName: 'Krishnan', department: 'General Medicine' },
    { firstName: 'Saroja', lastName: 'Devi', department: 'Cardiology' },
    { firstName: 'Kamala', lastName: 'Sundari', department: 'Orthopedics' },
    { firstName: 'Vimala', lastName: 'Rani', department: 'Pediatrics' },
    { firstName: 'Padma', lastName: 'Lakshmi', department: 'Gynecology & Obstetrics' },
    { firstName: 'Lalitha', lastName: 'Priya', department: 'Neurology' },
    { firstName: 'Uma', lastName: 'Maheswari', department: 'Emergency Medicine' },
    { firstName: 'Vasanthi', lastName: 'Kumari', department: 'Emergency Medicine' },
    { firstName: 'Jayanthi', lastName: 'Selvi', department: 'General Medicine' },
    { firstName: 'Malathi', lastName: 'Devi', department: 'Cardiology' },
    { firstName: 'Sumathi', lastName: 'Rani', department: 'Pediatrics' },
    { firstName: 'Chitra', lastName: 'Lakshmi', department: 'Dermatology' }
];

const RECEPTIONISTS_CONFIG = [
    { firstName: 'Sangeetha', lastName: 'Ravi' },
    { firstName: 'Nirmala', lastName: 'Devi' },
    { firstName: 'Bhavani', lastName: 'Shankar' },
    { firstName: 'Selvi', lastName: 'Kumar' }
];

const PHARMACISTS_CONFIG = [
    { firstName: 'Rajan', lastName: 'Pillai', qualification: 'B.Pharm' },
    { firstName: 'Sudha', lastName: 'Narayanan', qualification: 'M.Pharm' },
    { firstName: 'Mohan', lastName: 'Kumar', qualification: 'B.Pharm' }
];

const LAB_TECHNICIANS_CONFIG = [
    { firstName: 'Sathish', lastName: 'Kumar', specialization: 'Biochemistry' },
    { firstName: 'Preethi', lastName: 'Raman', specialization: 'Hematology' },
    { firstName: 'Karthikeyan', lastName: 'Murugan', specialization: 'Microbiology' }
];

const PATIENTS_CONFIG = [
    { firstName: 'Ravi', lastName: 'Kumar', gender: 'male', dob: '1985-03-15', phone: '9876543201', bloodGroup: 'A+' },
    { firstName: 'Sita', lastName: 'Devi', gender: 'female', dob: '1990-07-22', phone: '9876543202', bloodGroup: 'B+' },
    { firstName: 'Krishna', lastName: 'Murthy', gender: 'male', dob: '1978-11-08', phone: '9876543203', bloodGroup: 'O+' },
    { firstName: 'Radha', lastName: 'Krishnan', gender: 'female', dob: '1982-05-30', phone: '9876543204', bloodGroup: 'AB+' },
    { firstName: 'Arjun', lastName: 'Reddy', gender: 'male', dob: '1995-01-12', phone: '9876543205', bloodGroup: 'A-' },
    { firstName: 'Priya', lastName: 'Sharma', gender: 'female', dob: '1988-09-25', phone: '9876543206', bloodGroup: 'B-' },
    { firstName: 'Venkat', lastName: 'Rao', gender: 'male', dob: '1970-12-03', phone: '9876543207', bloodGroup: 'O-' },
    { firstName: 'Lakshmi', lastName: 'Naidu', gender: 'female', dob: '1992-04-18', phone: '9876543208', bloodGroup: 'AB-' },
    { firstName: 'Surya', lastName: 'Prakash', gender: 'male', dob: '1983-08-07', phone: '9876543209', bloodGroup: 'A+' },
    { firstName: 'Kavitha', lastName: 'Sundaram', gender: 'female', dob: '1975-02-28', phone: '9876543210', bloodGroup: 'B+' },
    { firstName: 'Anil', lastName: 'Kapoor', gender: 'male', dob: '1968-06-14', phone: '9876543211', bloodGroup: 'O+' },
    { firstName: 'Sunitha', lastName: 'Menon', gender: 'female', dob: '1998-10-09', phone: '9876543212', bloodGroup: 'A+' },
    { firstName: 'Mahesh', lastName: 'Babu', gender: 'male', dob: '1980-03-21', phone: '9876543213', bloodGroup: 'B+' },
    { firstName: 'Geetha', lastName: 'Nair', gender: 'female', dob: '1986-07-16', phone: '9876543214', bloodGroup: 'AB+' },
    { firstName: 'Ram', lastName: 'Prasad', gender: 'male', dob: '1972-11-30', phone: '9876543215', bloodGroup: 'O+' },
    { firstName: 'Anu', lastName: 'Priya', gender: 'female', dob: '1994-05-05', phone: '9876543216', bloodGroup: 'A-' },
    { firstName: 'Kiran', lastName: 'Kumar', gender: 'male', dob: '1989-09-12', phone: '9876543217', bloodGroup: 'B-' },
    { firstName: 'Padma', lastName: 'Shri', gender: 'female', dob: '1977-01-25', phone: '9876543218', bloodGroup: 'O-' },
    { firstName: 'Vijay', lastName: 'Kumar', gender: 'male', dob: '1991-04-08', phone: '9876543219', bloodGroup: 'AB-' },
    { firstName: 'Uma', lastName: 'Devi', gender: 'female', dob: '1984-08-19', phone: '9876543220', bloodGroup: 'A+' }
];

// Medicines inventory
const MEDICINES_CONFIG = [
    { name: 'Paracetamol 500mg', genericName: 'Acetaminophen', category: 'Analgesic', unitPrice: 2.5, stock: 1000, reorderLevel: 200 },
    { name: 'Amoxicillin 500mg', genericName: 'Amoxicillin', category: 'Antibiotic', unitPrice: 12.0, stock: 500, reorderLevel: 100 },
    { name: 'Omeprazole 20mg', genericName: 'Omeprazole', category: 'Antacid', unitPrice: 8.0, stock: 600, reorderLevel: 150 },
    { name: 'Metformin 500mg', genericName: 'Metformin', category: 'Antidiabetic', unitPrice: 5.0, stock: 800, reorderLevel: 200 },
    { name: 'Amlodipine 5mg', genericName: 'Amlodipine', category: 'Antihypertensive', unitPrice: 6.0, stock: 700, reorderLevel: 150 },
    { name: 'Atorvastatin 10mg', genericName: 'Atorvastatin', category: 'Lipid Lowering', unitPrice: 10.0, stock: 500, reorderLevel: 100 },
    { name: 'Cetirizine 10mg', genericName: 'Cetirizine', category: 'Antihistamine', unitPrice: 3.0, stock: 800, reorderLevel: 200 },
    { name: 'Azithromycin 500mg', genericName: 'Azithromycin', category: 'Antibiotic', unitPrice: 25.0, stock: 300, reorderLevel: 75 },
    { name: 'Losartan 50mg', genericName: 'Losartan', category: 'Antihypertensive', unitPrice: 8.0, stock: 600, reorderLevel: 150 },
    { name: 'Pantoprazole 40mg', genericName: 'Pantoprazole', category: 'Antacid', unitPrice: 10.0, stock: 500, reorderLevel: 125 },
    { name: 'Ibuprofen 400mg', genericName: 'Ibuprofen', category: 'NSAID', unitPrice: 4.0, stock: 900, reorderLevel: 200 },
    { name: 'Ciprofloxacin 500mg', genericName: 'Ciprofloxacin', category: 'Antibiotic', unitPrice: 15.0, stock: 400, reorderLevel: 100 },
    { name: 'Metoprolol 50mg', genericName: 'Metoprolol', category: 'Beta Blocker', unitPrice: 7.0, stock: 500, reorderLevel: 125 },
    { name: 'Aspirin 75mg', genericName: 'Aspirin', category: 'Antiplatelet', unitPrice: 2.0, stock: 1000, reorderLevel: 250 },
    { name: 'Ranitidine 150mg', genericName: 'Ranitidine', category: 'Antacid', unitPrice: 5.0, stock: 600, reorderLevel: 150 }
];

// Lab tests catalog
const LAB_TESTS_CONFIG = [
    { name: 'Complete Blood Count (CBC)', code: 'CBC001', category: 'hematology', price: 400, turnaroundTime: 4 },
    { name: 'Blood Glucose Fasting', code: 'BIO001', category: 'biochemistry', price: 150, turnaroundTime: 2 },
    { name: 'Blood Glucose PP', code: 'BIO002', category: 'biochemistry', price: 150, turnaroundTime: 2 },
    { name: 'HbA1c', code: 'BIO003', category: 'biochemistry', price: 500, turnaroundTime: 4 },
    { name: 'Lipid Profile', code: 'BIO004', category: 'biochemistry', price: 700, turnaroundTime: 4 },
    { name: 'Liver Function Test (LFT)', code: 'BIO005', category: 'biochemistry', price: 900, turnaroundTime: 6 },
    { name: 'Kidney Function Test (KFT)', code: 'BIO006', category: 'biochemistry', price: 800, turnaroundTime: 6 },
    { name: 'Thyroid Profile (T3, T4, TSH)', code: 'HOR001', category: 'endocrine', price: 1000, turnaroundTime: 8 },
    { name: 'Urine Routine', code: 'URI001', category: 'microbiology', price: 200, turnaroundTime: 2 },
    { name: 'Stool Routine', code: 'MIC001', category: 'microbiology', price: 200, turnaroundTime: 4 },
    { name: 'Chest X-Ray', code: 'RAD001', category: 'radiology', price: 600, turnaroundTime: 1 },
    { name: 'ECG', code: 'CAR001', category: 'cardiology', price: 350, turnaroundTime: 1 },
    { name: 'Echocardiography', code: 'CAR002', category: 'cardiology', price: 2500, turnaroundTime: 2 },
    { name: 'Ultrasound Abdomen', code: 'RAD002', category: 'radiology', price: 1200, turnaroundTime: 1 },
    { name: 'CT Scan Brain', code: 'RAD003', category: 'radiology', price: 4500, turnaroundTime: 2 }
];

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function seedChennaiHospital() {
    try {
        console.log('\n🏥 Starting Chennai Hospital Seed Script...\n');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`   Organization: ${ORG_CONFIG.name}`);
        console.log(`   Subdomain: ${ORG_CONFIG.subdomain}`);
        console.log('═══════════════════════════════════════════════════════════════\n');

        // Initialize database
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
            console.log('✅ Database connected\n');
        }

        const orgRepo = AppDataSource.getRepository(Organization);
        const userRepo = AppDataSource.getRepository(User);
        const deptRepo = AppDataSource.getRepository(Department);
        const serviceRepo = AppDataSource.getRepository(Service);
        const appointmentRepo = AppDataSource.getRepository(Appointment);
        const medicineRepo = AppDataSource.getRepository(Medicine);
        const labTestRepo = AppDataSource.getRepository(LabTest);

        // ===== STEP 1: Create Organization =====
        console.log('📌 Creating Organization...');
        let organization = await orgRepo.findOne({ where: { subdomain: ORG_CONFIG.subdomain } });

        if (organization) {
            console.log(`   ⚠️  Organization "${ORG_CONFIG.name}" already exists. Using existing.\n`);
        } else {
            const newOrg = orgRepo.create({
                name: ORG_CONFIG.name,
                subdomain: ORG_CONFIG.subdomain,
                description: ORG_CONFIG.description,
                email: ORG_CONFIG.email,
                phone: ORG_CONFIG.phone,
                address: ORG_CONFIG.address,
                isActive: true,
                settings: {
                    subscription: { plan: 'enterprise', status: 'active', startDate: new Date() },
                    features: { pharmacy: true, laboratory: true, inpatient: true, radiology: true, telemedicine: true },
                    limits: { maxUsers: 500, maxPatients: 50000, maxStorage: 500 },
                    branding: { primaryColor: '#1890ff', secondaryColor: '#52c41a', logo: null }
                }
            } as any);
            organization = await orgRepo.save(newOrg) as any;
            console.log(`   ✅ Created: ${(organization as any).name}\n`);
        }

        const orgId = (organization as any).id;

        // ===== STEP 2: Create Departments =====
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
                } as any);
                dept = await deptRepo.save(newDept) as any;
                console.log(`   ✅ ${deptConfig.name}`);
            } else {
                console.log(`   ⏭️  ${deptConfig.name} (exists)`);
            }
            createdDepts.set(deptConfig.name, dept as Department);
        }

        // ===== STEP 3: Create Services =====
        console.log('\n📋 Creating Services...');
        let serviceCount = 0;
        
        for (const [deptName, services] of Object.entries(SERVICES_BY_DEPT)) {
            const dept = createdDepts.get(deptName);
            if (!dept) continue;

            for (const svcConfig of services) {
                const existing = await serviceRepo.findOne({
                    where: { name: svcConfig.name, organizationId: orgId }
                });
                
                if (!existing) {
                    const service = serviceRepo.create({
                        name: svcConfig.name,
                        description: svcConfig.description,
                        status: 'active',
                        averageDuration: svcConfig.duration,
                        department: dept,
                        departmentId: (dept as any).id,
                        organizationId: orgId
                    } as any);
                    await serviceRepo.save(service);
                    serviceCount++;
                }
            }
        }
        console.log(`   ✅ Created ${serviceCount} services\n`);

        // ===== STEP 4: Create Admin =====
        console.log('👤 Creating Admin...');
        const adminEmail = `admin@${ORG_CONFIG.subdomain}.com`;
        const adminPassword = 'Admin@Chennai2025';
        
        let admin = await userRepo.findOne({ where: { email: adminEmail, organizationId: orgId } });
        if (!admin) {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            admin = userRepo.create({
                email: adminEmail,
                password: hashedPassword,
                firstName: 'Chennai',
                lastName: 'Admin',
                phone: '+91 44 2815 6700',
                role: 'admin' as any,
                organizationId: orgId,
                isActive: true
            });
            await userRepo.save(admin);
            console.log(`   ✅ Admin: ${adminEmail}`);
        } else {
            console.log(`   ⏭️  Admin exists: ${adminEmail}`);
        }

        // ===== STEP 5: Create Doctors =====
        console.log('\n👨‍⚕️ Creating Doctors...');
        const createdDoctors: User[] = [];
        const doctorPassword = 'Doctor@Chennai2025';
        
        for (const docConfig of DOCTORS_CONFIG) {
            const email = `dr.${docConfig.firstName.toLowerCase()}.${docConfig.lastName.toLowerCase()}@${ORG_CONFIG.subdomain}.com`;
            const dept = createdDepts.get(docConfig.department);
            
            const existingDoctor = await userRepo.findOne({ where: { email, organizationId: orgId } });
            if (!existingDoctor) {
                const hashedPassword = await bcrypt.hash(doctorPassword, 10);
                const newDoctor = userRepo.create({
                    email,
                    password: hashedPassword,
                    firstName: `Dr. ${docConfig.firstName}`,
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
                    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                } as any);
                const savedDoctor = await userRepo.save(newDoctor) as any;
                createdDoctors.push(savedDoctor as User);
            }
        }
        console.log(`   ✅ Created ${createdDoctors.length} doctors`);

        // ===== STEP 6: Create Nurses =====
        console.log('\n👩‍⚕️ Creating Nurses...');
        const nursePassword = 'Nurse@Chennai2025';
        let nurseCount = 0;
        
        for (let i = 0; i < NURSES_CONFIG.length; i++) {
            const nurseConfig = NURSES_CONFIG[i];
            const email = `nurse.${nurseConfig.firstName.toLowerCase()}@${ORG_CONFIG.subdomain}.com`;
            const dept = createdDepts.get(nurseConfig.department);
            
            const existing = await userRepo.findOne({ where: { email, organizationId: orgId } });
            if (!existing) {
                const hashedPassword = await bcrypt.hash(nursePassword, 10);
                await userRepo.save(userRepo.create({
                    email,
                    password: hashedPassword,
                    firstName: nurseConfig.firstName,
                    lastName: nurseConfig.lastName,
                    phone: `+91 87${Math.floor(10000000 + Math.random() * 90000000)}`,
                    role: 'nurse' as any,
                    organizationId: orgId,
                    departmentId: dept ? (dept as any).id : null,
                    isActive: true
                }));
                nurseCount++;
            }
        }
        console.log(`   ✅ Created ${nurseCount} nurses`);

        // ===== STEP 7: Create Receptionists =====
        console.log('\n📞 Creating Receptionists...');
        const receptionPassword = 'Reception@Chennai2025';
        let receptionCount = 0;
        
        for (let i = 0; i < RECEPTIONISTS_CONFIG.length; i++) {
            const recConfig = RECEPTIONISTS_CONFIG[i];
            const email = `reception.${recConfig.firstName.toLowerCase()}@${ORG_CONFIG.subdomain}.com`;
            
            const existing = await userRepo.findOne({ where: { email, organizationId: orgId } });
            if (!existing) {
                const hashedPassword = await bcrypt.hash(receptionPassword, 10);
                await userRepo.save(userRepo.create({
                    email,
                    password: hashedPassword,
                    firstName: recConfig.firstName,
                    lastName: recConfig.lastName,
                    phone: `+91 76${Math.floor(10000000 + Math.random() * 90000000)}`,
                    role: 'receptionist' as any,
                    organizationId: orgId,
                    isActive: true
                }));
                receptionCount++;
            }
        }
        console.log(`   ✅ Created ${receptionCount} receptionists`);

        // ===== STEP 8: Create Pharmacists =====
        console.log('\n💊 Creating Pharmacists...');
        const pharmacistPassword = 'Pharma@Chennai2025';
        let pharmacistCount = 0;
        
        for (let i = 0; i < PHARMACISTS_CONFIG.length; i++) {
            const pharmaConfig = PHARMACISTS_CONFIG[i];
            const email = `pharma.${pharmaConfig.firstName.toLowerCase()}@${ORG_CONFIG.subdomain}.com`;
            
            const existing = await userRepo.findOne({ where: { email, organizationId: orgId } });
            if (!existing) {
                const hashedPassword = await bcrypt.hash(pharmacistPassword, 10);
                await userRepo.save(userRepo.create({
                    email,
                    password: hashedPassword,
                    firstName: pharmaConfig.firstName,
                    lastName: pharmaConfig.lastName,
                    phone: `+91 65${Math.floor(10000000 + Math.random() * 90000000)}`,
                    role: 'pharmacist' as any,
                    organizationId: orgId,
                    isActive: true,
                    qualification: pharmaConfig.qualification
                } as any));
                pharmacistCount++;
            }
        }
        console.log(`   ✅ Created ${pharmacistCount} pharmacists`);

        // ===== STEP 9: Create Lab Technicians =====
        console.log('\n🧪 Creating Lab Technicians...');
        const labTechPassword = 'LabTech@Chennai2025';
        let labTechCount = 0;
        
        for (let i = 0; i < LAB_TECHNICIANS_CONFIG.length; i++) {
            const labConfig = LAB_TECHNICIANS_CONFIG[i];
            const email = `lab.${labConfig.firstName.toLowerCase()}@${ORG_CONFIG.subdomain}.com`;
            
            const existing = await userRepo.findOne({ where: { email, organizationId: orgId } });
            if (!existing) {
                const hashedPassword = await bcrypt.hash(labTechPassword, 10);
                await userRepo.save(userRepo.create({
                    email,
                    password: hashedPassword,
                    firstName: labConfig.firstName,
                    lastName: labConfig.lastName,
                    phone: `+91 54${Math.floor(10000000 + Math.random() * 90000000)}`,
                    role: 'lab_technician' as any,
                    organizationId: orgId,
                    isActive: true,
                    specialization: labConfig.specialization
                } as any));
                labTechCount++;
            }
        }
        console.log(`   ✅ Created ${labTechCount} lab technicians`);

        // ===== STEP 10: Create Patients =====
        console.log('\n🧑 Creating Patients...');
        const patientPassword = 'Patient@Chennai2025';
        const createdPatients: User[] = [];
        
        for (let i = 0; i < PATIENTS_CONFIG.length; i++) {
            const patConfig = PATIENTS_CONFIG[i];
            const email = `patient.${patConfig.firstName.toLowerCase()}.${patConfig.lastName.toLowerCase()}@gmail.com`;
            
            const existing = await userRepo.findOne({ where: { email, organizationId: orgId } });
            if (!existing) {
                const hashedPassword = await bcrypt.hash(patientPassword, 10);
                const newPatient = userRepo.create({
                    email,
                    password: hashedPassword,
                    firstName: patConfig.firstName,
                    lastName: patConfig.lastName,
                    phone: `+91 ${patConfig.phone}`,
                    role: 'patient' as any,
                    organizationId: orgId,
                    isActive: true,
                    dateOfBirth: new Date(patConfig.dob),
                    gender: patConfig.gender,
                    address: `${100 + i}, Anna Nagar, Chennai`,
                    city: 'Chennai',
                    state: 'Tamil Nadu',
                    country: 'India',
                    postalCode: `60000${i % 10}`
                } as any);
                const savedPatient = await userRepo.save(newPatient) as any;
                createdPatients.push(savedPatient as User);
            }
        }
        console.log(`   ✅ Created ${createdPatients.length} patients`);

        // ===== STEP 11: Create Appointments =====
        console.log('\n📅 Creating Sample Appointments...');
        const allServices = await serviceRepo.find({ where: { organizationId: orgId } });
        const allDoctors = await userRepo.find({ where: { organizationId: orgId, role: 'doctor' as any } });
        const allPatients = await userRepo.find({ where: { organizationId: orgId, role: 'patient' as any } });
        let appointmentCount = 0;

        if (allPatients.length > 0 && allDoctors.length > 0 && allServices.length > 0) {
            for (let i = 0; i < 50; i++) {
                const patient = allPatients[i % allPatients.length];
                const doctor = allDoctors[i % allDoctors.length];
                const service = allServices[i % allServices.length];

                const startDate = new Date();
                startDate.setDate(startDate.getDate() + (i % 21) - 10); // Past 10 days to next 10 days
                startDate.setHours(9 + (i % 8), (i % 2) * 30, 0, 0);

                const endDate = new Date(startDate);
                endDate.setMinutes(endDate.getMinutes() + 30);

                const statuses = [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING, AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED];
                let status: AppointmentStatus;
                if (startDate < new Date()) {
                    status = i % 5 === 0 ? AppointmentStatus.CANCELLED : AppointmentStatus.COMPLETED;
                } else {
                    status = statuses[i % 2]; // CONFIRMED or PENDING
                }

                try {
                    const appointment = appointmentRepo.create({
                        patient,
                        doctor,
                        service,
                        startTime: startDate,
                        endTime: endDate,
                        status,
                        reason: `${service.name} - Regular checkup`,
                        notes: `Appointment for ${(patient as any).firstName} ${(patient as any).lastName}`,
                        organizationId: orgId
                    } as any);
                    await appointmentRepo.save(appointment);
                    appointmentCount++;
                } catch (err) {
                    // Skip duplicate appointments
                }
            }
        }
        console.log(`   ✅ Created ${appointmentCount} appointments`);

        // ===== STEP 12: Create Medicines =====
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
                        organizationId: orgId,
                        isActive: true
                    } as any);
                    await medicineRepo.save(medicine);
                    medicineCount++;
                }
            } catch (err) {
                // Skip if medicine creation fails
            }
        }
        console.log(`   ✅ Created ${medicineCount} medicines`);

        // ===== STEP 13: Create Lab Tests =====
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
                // Skip if lab test creation fails
            }
        }
        console.log(`   ✅ Created ${labTestCount} lab tests`);

        // ===== SUMMARY =====
        console.log('\n');
        console.log('═══════════════════════════════════════════════════════════════════════════════');
        console.log('                        🎉 CHENNAI HOSPITAL SEED COMPLETE 🎉');
        console.log('═══════════════════════════════════════════════════════════════════════════════');
        console.log(`\n📌 Organization: ${ORG_CONFIG.name}`);
        console.log(`   Subdomain: ${ORG_CONFIG.subdomain}`);
        console.log(`   Email: ${ORG_CONFIG.email}`);
        console.log(`\n🏥 Departments: ${DEPARTMENTS_CONFIG.length}`);
        console.log(`📋 Services: ${serviceCount}`);
        console.log(`👨‍⚕️ Doctors: ${DOCTORS_CONFIG.length}`);
        console.log(`👩‍⚕️ Nurses: ${NURSES_CONFIG.length}`);
        console.log(`📞 Receptionists: ${RECEPTIONISTS_CONFIG.length}`);
        console.log(`💊 Pharmacists: ${PHARMACISTS_CONFIG.length}`);
        console.log(`🧪 Lab Technicians: ${LAB_TECHNICIANS_CONFIG.length}`);
        console.log(`🧑 Patients: ${PATIENTS_CONFIG.length}`);
        console.log(`📅 Appointments: ${appointmentCount}`);
        console.log(`💊 Medicines: ${medicineCount}`);
        console.log(`🧪 Lab Tests: ${labTestCount}`);

        console.log('\n═══════════════════════════════════════════════════════════════════════════════');
        console.log('                              🔑 LOGIN CREDENTIALS');
        console.log('═══════════════════════════════════════════════════════════════════════════════');
        console.log(`\n👤 Admin:          ${adminEmail}`);
        console.log(`                   Password: ${adminPassword}`);
        console.log(`\n👨‍⚕️ Doctor:         dr.[firstname].[lastname]@${ORG_CONFIG.subdomain}.com`);
        console.log(`                   Password: ${doctorPassword}`);
        console.log(`                   Example: dr.rajesh.krishnamurthy@${ORG_CONFIG.subdomain}.com`);
        console.log(`\n👩‍⚕️ Nurse:          nurse.[firstname]@${ORG_CONFIG.subdomain}.com`);
        console.log(`                   Password: ${nursePassword}`);
        console.log(`                   Example: nurse.radha@${ORG_CONFIG.subdomain}.com`);
        console.log(`\n📞 Receptionist:   reception.[firstname]@${ORG_CONFIG.subdomain}.com`);
        console.log(`                   Password: ${receptionPassword}`);
        console.log(`                   Example: reception.sangeetha@${ORG_CONFIG.subdomain}.com`);
        console.log(`\n💊 Pharmacist:     pharma.[firstname]@${ORG_CONFIG.subdomain}.com`);
        console.log(`                   Password: ${pharmacistPassword}`);
        console.log(`                   Example: pharma.rajan@${ORG_CONFIG.subdomain}.com`);
        console.log(`\n🧪 Lab Technician: lab.[firstname]@${ORG_CONFIG.subdomain}.com`);
        console.log(`                   Password: ${labTechPassword}`);
        console.log(`                   Example: lab.sathish@${ORG_CONFIG.subdomain}.com`);
        console.log(`\n🧑 Patient:        patient.[firstname].[lastname]@gmail.com`);
        console.log(`                   Password: ${patientPassword}`);
        console.log(`                   Example: patient.ravi.kumar@gmail.com`);
        console.log('\n═══════════════════════════════════════════════════════════════════════════════\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Seed failed:', error);
        process.exit(1);
    }
}

// Run the seed
seedChennaiHospital();
