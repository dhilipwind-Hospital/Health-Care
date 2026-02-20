
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Prescription } from '../models/pharmacy/Prescription';
import { PrescriptionItem, PrescriptionItemStatus } from '../models/pharmacy/PrescriptionItem';
import { Medicine } from '../models/pharmacy/Medicine';
import { MedicalRecord, RecordType } from '../models/MedicalRecord';
import { Organization } from '../models/Organization';

const PATIENT_EMAIL = 'patient@example.com';
const DOCTOR_EMAIL = 'doctor@hospital.com';

async function seedHistoryFix() {
    try {
        console.log('🌱 Starting History Fix Seed...');
        if (!AppDataSource.isInitialized) {
            await AppDataSource.setOptions({ synchronize: false });
            await AppDataSource.initialize();
        }

        const patient = await AppDataSource.getRepository(User).findOne({ where: { email: PATIENT_EMAIL } });
        const doctor = await AppDataSource.getRepository(User).findOne({ where: { email: DOCTOR_EMAIL } });

        if (!patient || !doctor) {
            console.error('❌ Patient or Doctor not found. Run base seed first.');
            return;
        }

        const orgId = patient.organizationId;
        const organization = await AppDataSource.getRepository(Organization).findOne({ where: { id: orgId } });

        if (!organization) {
            console.error('❌ Organization not found.');
            return;
        }

        console.log(`Working with Patient: ${patient.email} (${patient.id}) Org: ${orgId}`);

        // 1. ADD ITEMS TO PRESCRIPTIONS
        const prescriptions = await AppDataSource.getRepository(Prescription).find({
            where: { patient: { id: patient.id } },
            relations: ['items']
        });

        const medicineRepo = AppDataSource.getRepository(Medicine);
        // Ensure at least one medicine exists (or create one dummy)
        let medicine = await medicineRepo.findOne({ where: { organization: { id: orgId } } });
        if (!medicine) {
            medicine = medicineRepo.create({
                name: 'Paracetamol 500mg',
                genericName: 'Paracetamol',
                brandName: 'Calpol',
                manufacturer: 'PharmaInc',
                category: 'Analgesic',
                dosageForm: 'Tablet',
                strength: '500mg',
                description: 'Pain reliever',
                batchNumber: 'BATCH-001',
                manufactureDate: new Date('2025-01-01'),
                expiryDate: new Date('2028-01-01'),
                unitPrice: 5,
                sellingPrice: 10,
                currentStock: 1000,
                reorderLevel: 100,
                organization: organization,
                organizationId: orgId
            });
            await medicineRepo.save(medicine);
            console.log('✅ Created dummy medicine');
        }

        const pItemRepo = AppDataSource.getRepository(PrescriptionItem);

        for (const p of prescriptions) {
            if (p.items && p.items.length > 0) continue; // Already has items

            console.log(`Adding items to Prescription ${p.id}...`);
            const item = pItemRepo.create({
                prescription: p,
                medicine: medicine,
                dosage: '500mg',
                frequency: '1-0-1',
                duration: '5 days',
                instructions: 'After food',
                quantity: 10,
                status: PrescriptionItemStatus.PENDING,
                organization: organization,
                organizationId: orgId,
                prescriptionId: p.id,
                medicineId: medicine.id
            });
            await pItemRepo.save(item);
        }
        console.log('✅ Fixed Prescription Items');

        // 2. CREATE MEDICAL RECORDS (Procedures, Docs, Notes)
        const recordRepo = AppDataSource.getRepository(MedicalRecord);

        // A. Procedure
        const procExists = await recordRepo.count({ where: { patient: { id: patient.id }, type: RecordType.PROCEDURE } });
        if (procExists === 0) {
            const proc = recordRepo.create({
                patient: patient,
                doctor: doctor,
                organization: organization,
                organizationId: orgId,
                type: RecordType.PROCEDURE,
                title: 'Appendectomy',
                description: 'Laparoscopic removal of appendix',
                diagnosis: 'Acute Appendicitis',
                recordDate: new Date('2025-06-15'),
                treatment: 'Surgery performed successfully'
            });
            await recordRepo.save(proc);
            console.log('✅ Added Procedure Record');
        }

        // B. Document
        const docExists = await recordRepo.count({ where: { patient: { id: patient.id }, type: RecordType.DOCUMENT } });
        if (docExists === 0) {
            const doc = recordRepo.create({
                patient: patient,
                doctor: doctor,
                organization: organization,
                organizationId: orgId,
                type: RecordType.DOCUMENT,
                title: 'Discharge Summary',
                description: 'Summary of hospital stay for Appendectomy',
                fileUrl: 'https://example.com/discharge_summary.pdf',
                recordDate: new Date('2025-06-20')
            });
            await recordRepo.save(doc);
            console.log('✅ Added Document Record');
        }

        // C. Note (Consultation)
        const noteExists = await recordRepo.count({ where: { patient: { id: patient.id }, type: RecordType.CONSULTATION } });
        if (noteExists === 0) {
            const note = recordRepo.create({
                patient: patient,
                doctor: doctor,
                organization: organization,
                organizationId: orgId,
                type: RecordType.CONSULTATION, // Using CONSULTATION as Note
                title: 'Follow-up Consultation Note',
                description: 'Patient recovering well. Sutures removed.',
                recordDate: new Date('2025-07-01')
            });
            await recordRepo.save(note);
            console.log('✅ Added Consultation Note');
        }

        console.log('🎉 History Fix Seed Complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
}

seedHistoryFix();
