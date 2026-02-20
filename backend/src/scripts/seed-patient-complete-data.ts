/**
 * Seed Script: Complete Patient Data Enhancement
 * 
 * Adds comprehensive patient data for Dhilip Healthcare including:
 * - Allergies
 * - Diagnoses
 * - Vital Signs
 * - Medical Records
 * 
 * Usage:
 *   npx ts-node src/scripts/seed-patient-complete-data.ts
 */

import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import { Allergy, AllergenType, ReactionSeverity } from '../models/Allergy';
import { Diagnosis, DiagnosisSeverity, DiagnosisStatus, DiagnosisType } from '../models/Diagnosis';
import { VitalSigns, TemperatureUnit, WeightUnit, HeightUnit } from '../models/VitalSigns';
import { MedicalRecord, RecordType } from '../models/MedicalRecord';
import { LabOrder } from '../models/LabOrder';
import { LabOrderItem } from '../models/LabOrderItem';
import { LabResult } from '../models/LabResult';
import { LabTest } from '../models/LabTest';
import { Prescription, PrescriptionStatus } from '../models/pharmacy/Prescription';
import { PrescriptionItem, PrescriptionItemStatus } from '../models/pharmacy/PrescriptionItem';
import { Medicine } from '../models/pharmacy/Medicine';

// ===================== SAMPLE DATA =====================

const ALLERGIES_DATA = [
    { allergenType: AllergenType.DRUG, name: 'Penicillin', reactionSeverity: ReactionSeverity.SEVERE, reaction: 'Anaphylaxis, difficulty breathing' },
    { allergenType: AllergenType.DRUG, name: 'Aspirin', reactionSeverity: ReactionSeverity.MODERATE, reaction: 'Skin rash, hives' },
    { allergenType: AllergenType.FOOD, name: 'Peanuts', reactionSeverity: ReactionSeverity.SEVERE, reaction: 'Swelling, anaphylaxis' },
    { allergenType: AllergenType.FOOD, name: 'Shellfish', reactionSeverity: ReactionSeverity.MODERATE, reaction: 'Hives, nausea' },
    { allergenType: AllergenType.ENVIRONMENTAL, name: 'Dust Mites', reactionSeverity: ReactionSeverity.MILD, reaction: 'Sneezing, runny nose' },
    { allergenType: AllergenType.ENVIRONMENTAL, name: 'Pollen', reactionSeverity: ReactionSeverity.MILD, reaction: 'Hay fever symptoms' },
    { allergenType: AllergenType.DRUG, name: 'Sulfa Drugs', reactionSeverity: ReactionSeverity.MODERATE, reaction: 'Skin rash' },
    { allergenType: AllergenType.FOOD, name: 'Dairy', reactionSeverity: ReactionSeverity.MILD, reaction: 'Digestive discomfort' }
];

const DIAGNOSES_DATA = [
    { code: 'E11.9', name: 'Type 2 Diabetes Mellitus', diagnosisType: DiagnosisType.PRIMARY, severity: DiagnosisSeverity.MODERATE, status: DiagnosisStatus.CONFIRMED, isChronic: true },
    { code: 'I10', name: 'Essential Hypertension', diagnosisType: DiagnosisType.PRIMARY, severity: DiagnosisSeverity.MODERATE, status: DiagnosisStatus.CONFIRMED, isChronic: true },
    { code: 'J06.9', name: 'Acute Upper Respiratory Infection', diagnosisType: DiagnosisType.PRIMARY, severity: DiagnosisSeverity.MILD, status: DiagnosisStatus.RULED_OUT, isChronic: false },
    { code: 'K21.0', name: 'Gastroesophageal Reflux Disease', diagnosisType: DiagnosisType.SECONDARY, severity: DiagnosisSeverity.MILD, status: DiagnosisStatus.CONFIRMED, isChronic: true },
    { code: 'M54.5', name: 'Low Back Pain', diagnosisType: DiagnosisType.PRIMARY, severity: DiagnosisSeverity.MODERATE, status: DiagnosisStatus.PROVISIONAL, isChronic: false },
    { code: 'J45.909', name: 'Asthma, Unspecified', diagnosisType: DiagnosisType.PRIMARY, severity: DiagnosisSeverity.MODERATE, status: DiagnosisStatus.CONFIRMED, isChronic: true },
    { code: 'F41.1', name: 'Generalized Anxiety Disorder', diagnosisType: DiagnosisType.SECONDARY, severity: DiagnosisSeverity.MILD, status: DiagnosisStatus.CONFIRMED, isChronic: true },
    { code: 'E78.5', name: 'Hyperlipidemia', diagnosisType: DiagnosisType.SECONDARY, severity: DiagnosisSeverity.MILD, status: DiagnosisStatus.CONFIRMED, isChronic: true },
    { code: 'N39.0', name: 'Urinary Tract Infection', diagnosisType: DiagnosisType.PRIMARY, severity: DiagnosisSeverity.MILD, status: DiagnosisStatus.RULED_OUT, isChronic: false },
    { code: 'R51', name: 'Headache', diagnosisType: DiagnosisType.PRIMARY, severity: DiagnosisSeverity.MILD, status: DiagnosisStatus.PROVISIONAL, isChronic: false }
];

const VITAL_SIGNS_DATA = [
    { temperature: 37.0, heartRate: 72, respiratoryRate: 16, oxygenSaturation: 98, systolicBp: 120, diastolicBp: 80, weight: 70, height: 170 },
    { temperature: 37.3, heartRate: 78, respiratoryRate: 18, oxygenSaturation: 97, systolicBp: 128, diastolicBp: 84, weight: 70.5, height: 170 },
    { temperature: 36.9, heartRate: 68, respiratoryRate: 15, oxygenSaturation: 99, systolicBp: 118, diastolicBp: 76, weight: 69.8, height: 170 },
    { temperature: 37.9, heartRate: 88, respiratoryRate: 20, oxygenSaturation: 96, systolicBp: 135, diastolicBp: 88, weight: 71, height: 170 },
    { temperature: 37.1, heartRate: 74, respiratoryRate: 17, oxygenSaturation: 98, systolicBp: 122, diastolicBp: 82, weight: 70.2, height: 170 }
];

const MEDICAL_RECORD_TEMPLATES = [
    { type: RecordType.CONSULTATION, title: 'General Health Checkup', description: 'Patient presents for routine health checkup. No acute complaints. Vitals stable. Advised lifestyle modifications and regular exercise.', diagnosis: 'Routine checkup - no significant findings', treatment: 'Continue healthy lifestyle' },
    { type: RecordType.CONSULTATION, title: 'Follow-up Visit - Diabetes', description: 'Follow-up for diabetes management. Blood sugar levels slightly elevated. Medication adjusted.', diagnosis: 'Type 2 Diabetes Mellitus - controlled', treatment: 'Metformin 500mg twice daily' },
    { type: RecordType.PROCEDURE, title: 'ECG Recording', description: 'ECG performed. Normal sinus rhythm. No ST-T changes. Heart rate 72 bpm.', diagnosis: 'Normal ECG', treatment: 'No treatment required' },
    { type: RecordType.LAB_REPORT, title: 'Complete Blood Count Results', description: 'CBC results within normal limits. Hemoglobin 14.2 g/dL, WBC 7500/μL, Platelets 250000/μL.', diagnosis: 'Normal hematology profile', treatment: 'No action required' },
    { type: RecordType.CONSULTATION, title: 'Respiratory Infection Treatment', description: 'Patient with symptoms of upper respiratory tract infection. Prescribed antibiotics and symptomatic treatment.', diagnosis: 'Acute Upper Respiratory Infection', treatment: 'Azithromycin 500mg OD x 5 days' },
    { type: RecordType.IMAGING, title: 'Chest X-Ray Report', description: 'Chest X-ray performed. No significant abnormalities. Lung fields clear. Cardiac silhouette normal.', diagnosis: 'Normal chest X-ray', treatment: 'No treatment required' },
    { type: RecordType.CONSULTATION, title: 'Nutritional Counseling', description: 'Dietary assessment completed. BMI within normal range. Recommended balanced diet with focus on whole grains and vegetables.', diagnosis: 'Nutrition counseling', treatment: 'Diet modification' },
    { type: RecordType.PRESCRIPTION, title: 'Medication Review', description: 'Review of current medications. All medications well tolerated. No side effects reported.', diagnosis: 'Chronic disease management', treatment: 'Continue current medications' }
];

const LAB_RESULTS_DATA = [
    {
        testCode: 'HEM001', // CBC
        results: [
            { component: 'Hemoglobin', value: '14.2 g/dL', unit: 'g/dL', range: '13.5-17.5', flag: 'normal' },
            { component: 'WBC', value: '7500 /µL', unit: '/µL', range: '4500-11000', flag: 'normal' },
            { component: 'Platelets', value: '250000 /µL', unit: '/µL', range: '150000-450000', flag: 'normal' }
        ],
        notes: 'Normal blood count.'
    },
    {
        testCode: 'BIO001', // Fasting Blood Glucose
        results: [
            { component: 'Examples', value: '95 mg/dL', unit: 'mg/dL', range: '70-100', flag: 'normal' }
        ],
        notes: 'Fasting glucose within normal limits.'
    },
    {
        testCode: 'BIO004', // Lipid Profile
        results: [
            { component: 'Total Cholesterol', value: '180 mg/dL', unit: 'mg/dL', range: '<200', flag: 'normal' },
            { component: 'HDL', value: '45 mg/dL', unit: 'mg/dL', range: '>40', flag: 'normal' },
            { component: 'LDL', value: '110 mg/dL', unit: 'mg/dL', range: '<100', flag: 'abnormal' }, // Slightly high
            { component: 'Triglycerides', value: '140 mg/dL', unit: 'mg/dL', range: '<150', flag: 'normal' }
        ],
        notes: 'Mild elevation in LDL cholesterol. Diet modification advised.'
    },
    {
        testCode: 'BIO005', // LFT
        results: [
            { component: 'ALT', value: '25 U/L', unit: 'U/L', range: '7-56', flag: 'normal' },
            { component: 'AST', value: '22 U/L', unit: 'U/L', range: '5-40', flag: 'normal' },
            { component: 'Alkaline Phosphatase', value: '65 U/L', unit: 'U/L', range: '44-147', flag: 'normal' }
        ],
        notes: 'Liver function tests normal.'
    }
];

// ===================== SEED FUNCTION =====================

async function seedPatientCompleteData() {
    try {
        console.log('\n');
        console.log('═══════════════════════════════════════════════════════════════════════');
        console.log('              🏥 PATIENT COMPLETE DATA SEED SCRIPT                     ');
        console.log('═══════════════════════════════════════════════════════════════════════\n');

        // Initialize database
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
        console.log('✅ Database connected\n');

        const orgRepo = AppDataSource.getRepository(Organization);
        const userRepo = AppDataSource.getRepository(User);
        const allergyRepo = AppDataSource.getRepository(Allergy);
        const diagnosisRepo = AppDataSource.getRepository(Diagnosis);
        const vitalSignsRepo = AppDataSource.getRepository(VitalSigns);
        const medicalRecordRepo = AppDataSource.getRepository(MedicalRecord);
        const labOrderRepo = AppDataSource.getRepository(LabOrder);
        const labTestRepo = AppDataSource.getRepository(LabTest);
        const prescriptionRepo = AppDataSource.getRepository(Prescription);
        const medicineRepo = AppDataSource.getRepository(Medicine);

        // Find Dhilip Healthcare organization
        const organization = await orgRepo.findOne({ where: { subdomain: 'dhilip' } });
        if (!organization) {
            console.log('❌ Dhilip Healthcare organization not found. Please run seed-dhilip-healthcare.ts first.');
            process.exit(1);
        }
        const orgId = organization.id;
        console.log(`📌 Organization: ${organization.name}\n`);

        // Get all patients
        const patients = await userRepo.find({
            where: { organizationId: orgId, role: 'patient' as any }
        });
        console.log(`🧑 Found ${patients.length} patients\n`);

        // Get all doctors
        const doctors = await userRepo.find({
            where: { organizationId: orgId, role: 'doctor' as any }
        });

        // Get all Lab Tests
        // Get all Lab Tests
        const labTests = await labTestRepo.find({ where: { organizationId: orgId } });
        const labTestsMap = new Map(labTests.map(t => [t.code, t]));

        // Get all Medicines
        const medicines = await medicineRepo.find({ where: { organizationId: orgId } });

        let allergyCount = 0;
        let diagnosisCount = 0;
        let vitalSignsCount = 0;
        let medicalRecordCount = 0;
        let labOrderCount = 0;
        let prescriptionCount = 0;

        for (let i = 0; i < patients.length; i++) {
            const patient = patients[i];
            console.log(`\n👤 Processing Patient: ${(patient as any).firstName} ${(patient as any).lastName}`);

            // ===== 1. Add Allergies =====
            const numAllergies = Math.floor(Math.random() * 3) + 1; // 1-3 allergies per patient
            for (let j = 0; j < numAllergies; j++) {
                const allergyData = ALLERGIES_DATA[(i + j) % ALLERGIES_DATA.length];
                try {
                    const allergy = allergyRepo.create({
                        patient: patient,
                        organization: organization,
                        organizationId: orgId,
                        allergenType: allergyData.allergenType,
                        allergenName: allergyData.name,
                        reactionSeverity: allergyData.reactionSeverity,
                        reactionDescription: allergyData.reaction,
                        dateIdentified: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000 * 3),
                        isActive: true
                    });
                    await allergyRepo.save(allergy);
                    allergyCount++;
                } catch (err) {
                    // Skip if error
                }
            }

            // ===== 2. Add Diagnoses =====
            const numDiagnoses = Math.floor(Math.random() * 3) + 2; // 2-4 diagnoses per patient
            for (let j = 0; j < numDiagnoses; j++) {
                const diagData = DIAGNOSES_DATA[(i + j) % DIAGNOSES_DATA.length];
                const doctor = doctors[j % doctors.length];
                try {
                    const onsetDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000 * 2);
                    const diagnosis = diagnosisRepo.create({
                        patient: patient,
                        diagnosedBy: doctor,
                        organization: organization,
                        organizationId: orgId,
                        icd10Code: diagData.code,
                        diagnosisName: diagData.name,
                        diagnosisType: diagData.diagnosisType,
                        severity: diagData.severity,
                        status: diagData.status,
                        onsetDate: onsetDate,
                        isChronic: diagData.isChronic,
                        notes: `Diagnosed with ${diagData.name}. Treatment plan initiated.`
                    });
                    await diagnosisRepo.save(diagnosis);
                    diagnosisCount++;
                } catch (err) {
                    // Skip
                }
            }

            // ===== 3. Add Vital Signs (multiple over time) =====
            for (let j = 0; j < 5; j++) {
                const vitalData = VITAL_SIGNS_DATA[j % VITAL_SIGNS_DATA.length];
                const recordedAt = new Date();
                recordedAt.setDate(recordedAt.getDate() - (j * 7)); // Weekly records
                const doctor = doctors[j % doctors.length];

                try {
                    const vitalSigns = vitalSignsRepo.create({
                        patient: patient,
                        organization: organization,
                        organizationId: orgId,
                        recordedBy: doctor,
                        temperature: vitalData.temperature,
                        temperatureUnit: TemperatureUnit.CELSIUS,
                        heartRate: vitalData.heartRate,
                        respiratoryRate: vitalData.respiratoryRate,
                        oxygenSaturation: vitalData.oxygenSaturation,
                        systolicBp: vitalData.systolicBp,
                        diastolicBp: vitalData.diastolicBp,
                        weight: vitalData.weight + (Math.random() * 2 - 1),
                        weightUnit: WeightUnit.KG,
                        height: vitalData.height,
                        heightUnit: HeightUnit.CM,
                        recordedAt
                    });
                    await vitalSignsRepo.save(vitalSigns);
                    vitalSignsCount++;
                } catch (err) {
                    // Skip
                }
            }

            // ===== 4. Add Medical Records =====
            for (let j = 0; j < 4; j++) {
                const recordTemplate = MEDICAL_RECORD_TEMPLATES[(i + j) % MEDICAL_RECORD_TEMPLATES.length];
                const doctor = doctors[j % doctors.length];
                const recordDate = new Date();
                recordDate.setDate(recordDate.getDate() - (j * 21));

                try {
                    const medRecord = medicalRecordRepo.create({
                        patient: patient,
                        doctor: doctor,
                        organization: organization,
                        organizationId: orgId,
                        type: recordTemplate.type,
                        title: recordTemplate.title,
                        description: recordTemplate.description,
                        diagnosis: recordTemplate.diagnosis,
                        treatment: recordTemplate.treatment,
                        recordDate: recordDate
                    });
                    await medicalRecordRepo.save(medRecord);
                    medicalRecordCount++;
                } catch (err) {
                    // Skip
                }
            }

            // ===== 5. Add Lab Orders =====
            for (let j = 0; j < 2; j++) { // 2 lab orders per patient
                const resultTemplate = LAB_RESULTS_DATA[(i + j) % LAB_RESULTS_DATA.length];
                const labTest = labTestsMap.get(resultTemplate.testCode);

                if (!labTest) continue;

                const doctor = doctors[j % doctors.length];
                const orderDate = new Date();
                orderDate.setDate(orderDate.getDate() - (j * 15));

                try {
                    // Create Order
                    const labOrder = new LabOrder();
                    labOrder.organization = organization;
                    labOrder.organizationId = orgId;
                    labOrder.patient = patient;
                    labOrder.doctor = doctor;
                    labOrder.orderDate = orderDate;
                    labOrder.status = 'completed';
                    labOrder.orderNumber = `LAB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
                    labOrder.items = [];
                    labOrder.isUrgent = false;

                    // Create Item
                    const item = new LabOrderItem();
                    item.organization = organization;
                    item.organizationId = orgId;
                    item.labTest = labTest;
                    item.status = 'completed';

                    // Create Result
                    const result = new LabResult();
                    result.organization = organization;
                    result.organizationId = orgId;
                    result.performedBy = doctor;
                    result.resultTime = orderDate;
                    result.isVerified = true;
                    result.flag = resultTemplate.results.some(r => r.flag !== 'normal') ? 'abnormal' : 'normal';
                    result.comments = resultTemplate.notes;

                    // Format result value nicely
                    result.resultValue = resultTemplate.results.map(r => `${r.component}: ${r.value}`).join(', ');
                    result.units = resultTemplate.results[0].unit;

                    item.result = result;
                    labOrder.items.push(item);

                    await labOrderRepo.save(labOrder);
                    labOrderCount++;

                } catch (err) {
                    console.error('Error creating lab order:', err);
                }
            }

            // ===== 6. Add Prescriptions =====
            for (let j = 0; j < 2; j++) { // 2 prescriptions per patient
                if (medicines.length === 0) continue;

                const doctor = doctors[j % doctors.length];
                const date = new Date();
                date.setDate(date.getDate() - (j * 10));

                try {
                    const prescription = new Prescription();
                    prescription.organization = organization;
                    prescription.organizationId = orgId;
                    prescription.patient = patient;
                    prescription.doctor = doctor;
                    prescription.prescriptionDate = date;
                    prescription.diagnosis = 'Routine checkup';
                    prescription.status = PrescriptionStatus.DISPENSED;
                    prescription.items = [];

                    // Add 1-3 items
                    const numItems = Math.floor(Math.random() * 3) + 1;
                    for (let k = 0; k < numItems; k++) {
                        const medicine = medicines[(i + j + k) % medicines.length];
                        const item = new PrescriptionItem();
                        item.organization = organization;
                        item.organizationId = orgId;
                        item.medicine = medicine;
                        item.dosage = '1 tablet';
                        item.frequency = 'Twice daily';
                        item.duration = '5 days';
                        item.quantity = 10;
                        item.status = PrescriptionItemStatus.DISPENSED;
                        item.instructions = 'Take after food';

                        prescription.items.push(item);
                    }

                    await prescriptionRepo.save(prescription);
                    prescriptionCount++;
                } catch (err) {
                    console.error('Error creating prescription:', err);
                }
            }

            console.log(`  ✅ Added data for ${(patient as any).firstName}`);
        }

        // ===== SUMMARY =====
        console.log('\n');
        console.log('═══════════════════════════════════════════════════════════════════════');
        console.log('                     🎉 PATIENT DATA SEED COMPLETE 🎉                  ');
        console.log('═══════════════════════════════════════════════════════════════════════');
        console.log(`\n📊 Data Created:`);
        console.log(`   💉 Allergies: ${allergyCount}`);
        console.log(`   🏥 Diagnoses: ${diagnosisCount}`);
        console.log(`   📊 Vital Signs: ${vitalSignsCount}`);
        console.log(`   📋 Medical Records: ${medicalRecordCount}`);
        console.log(`   📋 Medical Records: ${medicalRecordCount}`);
        console.log(`   🧪 Lab Orders: ${labOrderCount}`);
        console.log(`   💊 Prescriptions: ${prescriptionCount}`);
        console.log('\n═══════════════════════════════════════════════════════════════════════\n');

        console.log('📝 To view patient data, login as:');
        console.log('   Email: patient.ravi1@gmail.com');
        console.log('   Password: Patient@2025');
        console.log('\n═══════════════════════════════════════════════════════════════════════\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
}

seedPatientCompleteData();
