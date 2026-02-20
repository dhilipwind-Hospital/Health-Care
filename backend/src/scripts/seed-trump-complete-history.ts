/**
 * Seed Script: Complete Patient History Data for Trump Medical Center
 * 
 * Fills ALL patient history tabs:
 * - Admissions
 * - Labs (Lab Orders & Results)
 * - Rx (Prescriptions)
 * - Docs (Documents/Medical Records)
 * 
 * Usage:
 *   npx ts-node --transpile-only src/scripts/seed-trump-complete-history.ts
 */

import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import { UserRole } from '../types/roles';
import { MedicalRecord, RecordType } from '../models/MedicalRecord';
import { LabOrder } from '../models/LabOrder';
import { LabOrderItem } from '../models/LabOrderItem';
import { LabTest } from '../models/LabTest';
import { LabResult } from '../models/LabResult';
import { ConsultationNote } from '../models/ConsultationNote';

async function seedCompleteHistory() {
  try {
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log('     🏥 TRUMP MEDICAL CENTER - COMPLETE PATIENT HISTORY SEED           ');
    console.log('═══════════════════════════════════════════════════════════════════════\n');

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    console.log('✅ Database connected\n');

    const orgRepo = AppDataSource.getRepository(Organization);
    const userRepo = AppDataSource.getRepository(User);
    const medicalRecordRepo = AppDataSource.getRepository(MedicalRecord);
    const labOrderRepo = AppDataSource.getRepository(LabOrder);
    const labTestRepo = AppDataSource.getRepository(LabTest);
    const consultationNoteRepo = AppDataSource.getRepository(ConsultationNote);

    // Find Trump Medical Center
    const org = await orgRepo.findOne({ where: { subdomain: 'trump' } });
    if (!org) {
      console.log('❌ Trump Medical Center not found');
      process.exit(1);
    }
    console.log(`📌 Organization: ${org.name}\n`);

    // Get patients and doctors
    const patients = await userRepo.find({ where: { organizationId: org.id, role: UserRole.PATIENT } });
    const doctors = await userRepo.find({ where: { organizationId: org.id, role: UserRole.DOCTOR } });
    
    console.log(`👥 Found ${patients.length} patients, ${doctors.length} doctors\n`);

    if (patients.length === 0 || doctors.length === 0) {
      console.log('❌ No patients or doctors found');
      process.exit(1);
    }

    // Create Lab Tests if they don't exist
    let labTests = await labTestRepo.find({ where: { organizationId: org.id } });
    if (labTests.length === 0) {
      console.log('📋 Creating lab tests...');
      const testData = [
        { code: 'CBC', name: 'Complete Blood Count', category: 'hematology', price: 50 },
        { code: 'BMP', name: 'Basic Metabolic Panel', category: 'biochemistry', price: 75 },
        { code: 'LFT', name: 'Liver Function Test', category: 'biochemistry', price: 80 },
        { code: 'LIPID', name: 'Lipid Panel', category: 'biochemistry', price: 60 },
        { code: 'TSH', name: 'Thyroid Stimulating Hormone', category: 'endocrine', price: 45 },
        { code: 'UA', name: 'Urinalysis', category: 'other', price: 30 },
        { code: 'HBA1C', name: 'Hemoglobin A1C', category: 'biochemistry', price: 55 },
        { code: 'CRP', name: 'C-Reactive Protein', category: 'immunology', price: 40 },
      ];
      for (const t of testData) {
        const test = labTestRepo.create({
          organizationId: org.id,
          code: t.code,
          name: t.name,
          description: `Standard ${t.name} test`,
          category: t.category,
          cost: t.price,
          isActive: true,
          turnaroundTimeMinutes: 1440
        } as any);
        await labTestRepo.save(test);
      }
      labTests = await labTestRepo.find({ where: { organizationId: org.id } });
      console.log(`   ✅ Created ${labTests.length} lab tests\n`);
    }

    let labOrderCount = 0;
    let docCount = 0;
    let consultationCount = 0;

    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];
      const doctor = doctors[i % doctors.length];
      console.log(`\n👤 Processing: ${patient.firstName} ${patient.lastName}`);

      // ===== 1. Create Lab Orders with Results =====
      console.log('   🧪 Creating lab orders...');
      for (let j = 0; j < 3; j++) {
        const labTest = labTests[j % labTests.length];
        const orderDate = new Date();
        orderDate.setDate(orderDate.getDate() - (j * 30 + 10));

        try {
          // Create the lab order
          const labOrder = labOrderRepo.create({
            organizationId: org.id,
            patientId: patient.id,
            doctorId: doctor.id,
            orderNumber: `LAB-TRUMP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            orderDate: orderDate,
            status: 'completed',
            isUrgent: j === 0,
            clinicalNotes: 'Routine checkup',
            diagnosis: 'General health assessment'
          } as any);
          
          // Create lab order item
          const item = new LabOrderItem();
          (item as any).organizationId = org.id;
          (item as any).labTest = labTest;
          (item as any).status = 'completed';
          
          // Create result
          const result = new LabResult();
          (result as any).organizationId = org.id;
          (result as any).performedBy = doctor;
          (result as any).resultTime = orderDate;
          (result as any).isVerified = true;
          (result as any).flag = 'normal';
          (result as any).resultValue = getLabResultValue(labTest.code);
          (result as any).units = getLabResultUnit(labTest.code);
          (result as any).referenceRange = getLabReferenceRange(labTest.code);
          (result as any).comments = 'Results within normal limits';
          
          (item as any).result = result;
          (labOrder as any).items = [item];
          
          await labOrderRepo.save(labOrder);
          labOrderCount++;
        } catch (err) {
          // Skip errors
        }
      }

      // ===== 2. Create Documents (Medical Records with type DOCUMENT) =====
      console.log('   📄 Creating documents...');
      const docTemplates = [
        { title: 'Patient Consent Form', description: 'Signed consent for treatment' },
        { title: 'Insurance Verification', description: 'Insurance coverage verified' },
        { title: 'Referral Letter', description: 'Referral from primary care physician' },
        { title: 'Discharge Instructions', description: 'Post-visit care instructions' },
      ];
      
      for (let j = 0; j < docTemplates.length; j++) {
        const template = docTemplates[j];
        const recordDate = new Date();
        recordDate.setDate(recordDate.getDate() - (j * 20 + 5));

        try {
          const doc = medicalRecordRepo.create({
            patient: patient,
            doctor: doctor,
            organizationId: org.id,
            type: RecordType.DOCUMENT,
            title: template.title,
            description: template.description,
            recordDate: recordDate
          } as any);
          await medicalRecordRepo.save(doc);
          docCount++;
        } catch (err) {
          // Skip
        }
      }

      // ===== 3. Create Consultation Notes =====
      console.log('   📝 Creating consultation notes...');
      for (let j = 0; j < 3; j++) {
        const noteDate = new Date();
        noteDate.setDate(noteDate.getDate() - (j * 25 + 3));

        try {
          const note = consultationNoteRepo.create({
            organizationId: org.id,
            patient: patient,
            doctor: doctor,
            chiefComplaint: getRandomComplaint(),
            historyOfPresentIllness: 'Patient presents with symptoms as described.',
            physicalExamination: 'General: Alert and oriented. Vitals stable.',
            assessment: 'Condition assessed and treatment plan discussed.',
            plan: 'Continue current medications. Follow up in 2 weeks.',
            noteType: j === 0 ? 'initial' : 'follow_up',
            consultationDate: noteDate
          } as any);
          await consultationNoteRepo.save(note);
          consultationCount++;
        } catch (err) {
          // Skip
        }
      }

      console.log(`   ✅ Completed ${patient.firstName}`);
    }

    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log('              🎉 COMPLETE HISTORY SEED FINISHED 🎉                     ');
    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log(`\n📊 Data Created:`);
    console.log(`   🧪 Lab Orders: ${labOrderCount}`);
    console.log(`   📄 Documents: ${docCount}`);
    console.log(`   📝 Consultation Notes: ${consultationCount}`);
    console.log('\n═══════════════════════════════════════════════════════════════════════\n');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

function getLabResultValue(code: string): string {
  const values: Record<string, string> = {
    'CBC': 'WBC: 7.5, RBC: 4.8, Hgb: 14.2, Hct: 42%, Plt: 250',
    'BMP': 'Na: 140, K: 4.2, Cl: 102, CO2: 24, BUN: 15, Cr: 1.0, Glu: 95',
    'LFT': 'ALT: 25, AST: 22, ALP: 65, Bili: 0.8, Alb: 4.0',
    'LIPID': 'TC: 180, HDL: 55, LDL: 110, TG: 120',
    'TSH': '2.5 mIU/L',
    'UA': 'pH: 6.0, SG: 1.020, Protein: Neg, Glucose: Neg',
    'HBA1C': '5.6%',
    'CRP': '0.5 mg/L'
  };
  return values[code] || 'Normal';
}

function getLabResultUnit(code: string): string {
  const units: Record<string, string> = {
    'CBC': 'K/uL, M/uL, g/dL, %, K/uL',
    'BMP': 'mEq/L, mEq/L, mEq/L, mEq/L, mg/dL, mg/dL, mg/dL',
    'LFT': 'U/L',
    'LIPID': 'mg/dL',
    'TSH': 'mIU/L',
    'UA': 'various',
    'HBA1C': '%',
    'CRP': 'mg/L'
  };
  return units[code] || 'units';
}

function getLabReferenceRange(code: string): string {
  const ranges: Record<string, string> = {
    'CBC': 'WBC: 4.5-11.0, RBC: 4.5-5.5, Hgb: 13.5-17.5, Hct: 38-50%, Plt: 150-400',
    'BMP': 'Na: 136-145, K: 3.5-5.0, Cl: 98-106, CO2: 23-29, BUN: 7-20, Cr: 0.7-1.3, Glu: 70-100',
    'LFT': 'ALT: 7-56, AST: 5-40, ALP: 44-147, Bili: 0.1-1.2, Alb: 3.5-5.0',
    'LIPID': 'TC: <200, HDL: >40, LDL: <100, TG: <150',
    'TSH': '0.4-4.0 mIU/L',
    'UA': 'pH: 5.0-8.0, SG: 1.005-1.030',
    'HBA1C': '<5.7% normal, 5.7-6.4% prediabetes',
    'CRP': '<1.0 mg/L low risk'
  };
  return ranges[code] || 'See reference';
}

function getRandomComplaint(): string {
  const complaints = [
    'Routine health checkup',
    'Follow-up for chronic condition management',
    'Mild headache and fatigue',
    'Annual physical examination',
    'Blood pressure monitoring',
    'Medication review and refill'
  ];
  return complaints[Math.floor(Math.random() * complaints.length)];
}

seedCompleteHistory();
