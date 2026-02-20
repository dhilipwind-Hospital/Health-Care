/**
 * Seed Script: Complete Patient Data for Trump Medical Center
 * 
 * Adds comprehensive patient data including:
 * - Appointments with doctors
 * - Medical Records
 * - Vital Signs
 * - Lab Orders & Results
 * - Prescriptions
 * - Bills
 * - Visits
 * 
 * Usage:
 *   npx ts-node --transpile-only src/scripts/seed-trump-patient-data.ts
 */

import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import { Appointment, AppointmentStatus, AppointmentMode, AppointmentType } from '../models/Appointment';
import { MedicalRecord, RecordType } from '../models/MedicalRecord';
import { VitalSigns, TemperatureUnit, WeightUnit, HeightUnit } from '../models/VitalSigns';
import { Bill, BillStatus, PaymentMethod } from '../models/Bill';
import { Visit } from '../models/Visit';
import { Service } from '../models/Service';
import { UserRole } from '../types/roles';

async function seedTrumpPatientData() {
  try {
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log('        🏥 TRUMP MEDICAL CENTER - COMPLETE PATIENT DATA SEED           ');
    console.log('═══════════════════════════════════════════════════════════════════════\n');

    // Initialize database
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    console.log('✅ Database connected\n');

    const orgRepo = AppDataSource.getRepository(Organization);
    const userRepo = AppDataSource.getRepository(User);
    const appointmentRepo = AppDataSource.getRepository(Appointment);
    const medicalRecordRepo = AppDataSource.getRepository(MedicalRecord);
    const vitalSignsRepo = AppDataSource.getRepository(VitalSigns);
    const billRepo = AppDataSource.getRepository(Bill);
    const visitRepo = AppDataSource.getRepository(Visit);
    const serviceRepo = AppDataSource.getRepository(Service);

    // Find Trump Medical Center organization
    const organization = await orgRepo.findOne({ where: { subdomain: 'trump' } });
    if (!organization) {
      console.log('❌ Trump Medical Center organization not found. Please run create-trump-medical.ts first.');
      process.exit(1);
    }
    const orgId = organization.id;
    console.log(`📌 Organization: ${organization.name} (${orgId})\n`);

    // Get all patients
    const patients = await userRepo.find({
      where: { organizationId: orgId, role: UserRole.PATIENT }
    });
    console.log(`🧑 Found ${patients.length} patients\n`);

    if (patients.length === 0) {
      console.log('❌ No patients found. Please run create-trump-medical.ts first.');
      process.exit(1);
    }

    // Get all doctors
    const doctors = await userRepo.find({
      where: { organizationId: orgId, role: UserRole.DOCTOR }
    });
    console.log(`👨‍⚕️ Found ${doctors.length} doctors\n`);

    if (doctors.length === 0) {
      console.log('❌ No doctors found. Please run create-trump-medical.ts first.');
      process.exit(1);
    }

    // Get services - if none exist, we'll skip service-related fields
    let services = await serviceRepo.find({ where: { organizationId: orgId } });
    console.log(`📋 Found ${services.length} services\n`);

    let appointmentCount = 0;
    let medicalRecordCount = 0;
    let vitalSignsCount = 0;
    let billCount = 0;
    let visitCount = 0;

    // Process each patient
    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];
      console.log(`\n👤 Processing Patient: ${patient.firstName} ${patient.lastName}`);

      // ===== 1. Create Appointments =====
      console.log('   📅 Creating appointments...');
      for (let j = 0; j < 5; j++) {
        const doctor = doctors[j % doctors.length];
        const service = services.length > 0 ? services[j % services.length] : null;
        
        // Create past appointments (completed)
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - (j * 14 + 7)); // Every 2 weeks in the past
        pastDate.setHours(9 + j, 0, 0, 0);
        
        const endDate = new Date(pastDate);
        endDate.setMinutes(endDate.getMinutes() + 30);

        try {
          const appointmentData: any = {
            organizationId: orgId,
            patient: patient,
            doctor: doctor,
            startTime: pastDate,
            endTime: endDate,
            status: j < 3 ? AppointmentStatus.COMPLETED : AppointmentStatus.CONFIRMED,
            mode: AppointmentMode.IN_PERSON,
            appointmentType: AppointmentType.STANDARD,
            reason: j < 3 ? 'Follow-up consultation' : 'Scheduled checkup',
            notes: j < 3 ? 'Patient visited. Consultation completed successfully.' : undefined,
            completedAt: j < 3 ? pastDate : undefined
          };
          if (service) {
            appointmentData.service = service;
            appointmentData.reason = `${j < 3 ? 'Follow-up consultation' : 'Scheduled checkup'} - ${service.name}`;
          }
          const appointment = appointmentRepo.create(appointmentData);
          await appointmentRepo.save(appointment);
          appointmentCount++;

          // Create a bill for completed appointments
          if (j < 3) {
            const billData: any = {
              organizationId: orgId,
              patient: patient,
              appointment: appointment,
              billNumber: `BILL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              amount: 100 + (j * 50),
              paidAmount: j < 2 ? 100 + (j * 50) : 0,
              status: j < 2 ? BillStatus.PAID : BillStatus.PENDING,
              description: 'Consultation fee',
              billDate: pastDate,
              dueDate: new Date(pastDate.getTime() + 30 * 24 * 60 * 60 * 1000),
              itemDetails: [
                { name: 'Consultation', quantity: 1, unitPrice: 100 + (j * 50), total: 100 + (j * 50) }
              ]
            };
            if (j < 2) {
              billData.paymentMethod = PaymentMethod.CARD;
              billData.paidDate = pastDate;
            }
            const bill = billRepo.create(billData);
            await billRepo.save(bill);
            billCount++;
          }
        } catch (err) {
          console.error(`   ⚠️ Error creating appointment: ${err}`);
        }
      }

      // Create upcoming appointments
      for (let j = 0; j < 2; j++) {
        const doctor = doctors[(i + j) % doctors.length];
        const service = services.length > 0 ? services[(i + j) % services.length] : null;
        
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + (j * 7 + 3)); // Next few weeks
        futureDate.setHours(10 + j, 0, 0, 0);
        
        const endDate = new Date(futureDate);
        endDate.setMinutes(endDate.getMinutes() + 30);

        try {
          const appointmentData: any = {
            organizationId: orgId,
            patient: patient,
            doctor: doctor,
            startTime: futureDate,
            endTime: endDate,
            status: AppointmentStatus.CONFIRMED,
            mode: AppointmentMode.IN_PERSON,
            appointmentType: AppointmentType.STANDARD,
            reason: 'Scheduled consultation'
          };
          if (service) {
            appointmentData.service = service;
            appointmentData.reason = `Scheduled ${service.name}`;
          }
          const appointment = appointmentRepo.create(appointmentData);
          await appointmentRepo.save(appointment);
          appointmentCount++;
        } catch (err) {
          console.error(`   ⚠️ Error creating future appointment: ${err}`);
        }
      }

      // ===== 2. Create Medical Records =====
      console.log('   📋 Creating medical records...');
      const recordTemplates = [
        { type: RecordType.CONSULTATION, title: 'General Health Checkup', description: 'Routine health examination. Patient in good health.', diagnosis: 'Healthy', treatment: 'Continue healthy lifestyle' },
        { type: RecordType.CONSULTATION, title: 'Follow-up Visit', description: 'Follow-up for previous consultation. Symptoms improved.', diagnosis: 'Improving condition', treatment: 'Continue current medication' },
        { type: RecordType.LAB_REPORT, title: 'Blood Test Results', description: 'Complete blood count within normal limits.', diagnosis: 'Normal CBC', treatment: 'No treatment required' },
        { type: RecordType.PROCEDURE, title: 'ECG Recording', description: 'ECG performed. Normal sinus rhythm.', diagnosis: 'Normal ECG', treatment: 'No intervention needed' },
        { type: RecordType.IMAGING, title: 'Chest X-Ray', description: 'Chest X-ray clear. No abnormalities detected.', diagnosis: 'Normal chest X-ray', treatment: 'No treatment required' },
        { type: RecordType.PRESCRIPTION, title: 'Medication Prescribed', description: 'Prescribed medication for mild symptoms.', diagnosis: 'Minor ailment', treatment: 'Medication for 5 days' }
      ];

      for (let j = 0; j < recordTemplates.length; j++) {
        const template = recordTemplates[j];
        const doctor = doctors[j % doctors.length];
        const recordDate = new Date();
        recordDate.setDate(recordDate.getDate() - (j * 21 + 7));

        try {
          const record = medicalRecordRepo.create({
            patient: patient,
            doctor: doctor,
            organizationId: orgId,
            type: template.type,
            title: template.title,
            description: template.description,
            diagnosis: template.diagnosis,
            treatment: template.treatment,
            recordDate: recordDate
          });
          await medicalRecordRepo.save(record);
          medicalRecordCount++;
        } catch (err) {
          console.error(`   ⚠️ Error creating medical record: ${err}`);
        }
      }

      // ===== 3. Create Vital Signs =====
      console.log('   💓 Creating vital signs...');
      for (let j = 0; j < 8; j++) {
        const doctor = doctors[j % doctors.length];
        const recordedAt = new Date();
        recordedAt.setDate(recordedAt.getDate() - (j * 7));

        // Vary vitals slightly for realism
        const baseTemp = 36.5 + (Math.random() * 1.5);
        const baseHR = 65 + Math.floor(Math.random() * 25);
        const baseSystolic = 110 + Math.floor(Math.random() * 30);
        const baseDiastolic = 70 + Math.floor(Math.random() * 20);

        try {
          const vitals = vitalSignsRepo.create({
            patient: patient,
            organizationId: orgId,
            recordedBy: doctor,
            temperature: parseFloat(baseTemp.toFixed(1)),
            temperatureUnit: TemperatureUnit.CELSIUS,
            heartRate: baseHR,
            respiratoryRate: 14 + Math.floor(Math.random() * 6),
            oxygenSaturation: 96 + Math.floor(Math.random() * 4),
            systolicBp: baseSystolic,
            diastolicBp: baseDiastolic,
            weight: 60 + Math.floor(Math.random() * 30),
            weightUnit: WeightUnit.KG,
            height: 160 + Math.floor(Math.random() * 30),
            heightUnit: HeightUnit.CM,
            painScale: Math.floor(Math.random() * 3)
          });
          await vitalSignsRepo.save(vitals);
          vitalSignsCount++;
        } catch (err) {
          console.error(`   ⚠️ Error creating vital signs: ${err}`);
        }
      }

      // ===== 4. Create Visits =====
      console.log('   🏥 Creating visits...');
      for (let j = 0; j < 3; j++) {
        const visitDate = new Date();
        visitDate.setDate(visitDate.getDate() - (j * 30 + 5));

        try {
          const visit = visitRepo.create({
            organizationId: orgId,
            patientId: patient.id,
            visitNumber: `VIS-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            status: j === 0 ? 'closed' : 'closed'
          });
          await visitRepo.save(visit);
          visitCount++;
        } catch (err) {
          console.error(`   ⚠️ Error creating visit: ${err}`);
        }
      }

      console.log(`   ✅ Completed data for ${patient.firstName} ${patient.lastName}`);
    }

    // ===== SUMMARY =====
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log('              🎉 TRUMP MEDICAL CENTER DATA SEED COMPLETE 🎉            ');
    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log(`\n📊 Data Created:`);
    console.log(`   📅 Appointments: ${appointmentCount}`);
    console.log(`   📋 Medical Records: ${medicalRecordCount}`);
    console.log(`   💓 Vital Signs: ${vitalSignsCount}`);
    console.log(`   💰 Bills: ${billCount}`);
    console.log(`   🏥 Visits: ${visitCount}`);
    console.log('\n═══════════════════════════════════════════════════════════════════════');
    console.log('\n📝 To view patient data, login as:');
    console.log('   Email: john.smith@email.com');
    console.log('   Password: Trump@2026');
    console.log('\n   Or any other Trump Medical Center patient.');
    console.log('═══════════════════════════════════════════════════════════════════════\n');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seedTrumpPatientData();
