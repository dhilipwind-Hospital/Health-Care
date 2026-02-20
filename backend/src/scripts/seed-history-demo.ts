/**
 * Seed History Demo (Fixed & Improved)
 * 
 * Populates Vitals, Prescriptions, Lab Orders (with Results), and additional Appointments for Ravi Kumar.
 * Ensures "Patient History" tab in Frontend is fully populated.
 */

import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Appointment, AppointmentStatus } from '../models/Appointment';
import { Organization } from '../models/Organization';
import { Service } from '../models/Service';
import { LabTest } from '../models/LabTest';
import { LabOrder } from '../models/LabOrder';
import { LabOrderItem } from '../models/LabOrderItem';
import { LabResult } from '../models/LabResult';
import { VitalSigns, TemperatureUnit, WeightUnit, HeightUnit } from '../models/VitalSigns';
import { Medicine } from '../models/pharmacy/Medicine';
import { Prescription, PrescriptionStatus } from '../models/pharmacy/Prescription';
import { PrescriptionItem, PrescriptionItemStatus } from '../models/pharmacy/PrescriptionItem';

// Helper for dates
const subDays = (d: Date, days: number) => {
    const res = new Date(d);
    res.setDate(res.getDate() - days);
    return res;
};

async function seedHistory() {
    try {
        console.log('Connecting to database...');
        await AppDataSource.initialize();
        console.log('Connected.');

        const userRepo = AppDataSource.getRepository(User);
        const apptRepo = AppDataSource.getRepository(Appointment);
        const orgRepo = AppDataSource.getRepository(Organization);
        const serviceRepo = AppDataSource.getRepository(Service);
        const labTestRepo = AppDataSource.getRepository(LabTest);
        const labOrderRepo = AppDataSource.getRepository(LabOrder);
        const labOrderItemRepo = AppDataSource.getRepository(LabOrderItem);
        const labResultRepo = AppDataSource.getRepository(LabResult);
        const vitalRepo = AppDataSource.getRepository(VitalSigns);
        const medicineRepo = AppDataSource.getRepository(Medicine);
        const prescriptionRepo = AppDataSource.getRepository(Prescription);

        // 1. Find Ravi
        const email = 'patient.ravi.kumar@gmail.com';
        const patient = await userRepo.findOne({ where: { email }, relations: ['organization'] });

        if (!patient) {
            console.error(`User ${email} not found! Run seed-complete-demo.ts first.`);
            return;
        }
        console.log(`Seeding history for: ${patient.firstName} ${patient.lastName}`);

        const org = await orgRepo.findOne({ where: { id: patient.organizationId } });
        if (!org) { console.error('Organization not found'); return; }

        // Find Doctors in same Org
        const doctors = await userRepo.find({
            where: { role: 'doctor', organizationId: org.id } as any
        });
        if (doctors.length === 0) { console.error('No doctors found'); return; }

        // Find Services
        const services = await serviceRepo.find({ where: { organizationId: org.id } });

        // Helper to get random doctor
        const getDoc = () => doctors[Math.floor(Math.random() * doctors.length)];

        // ======================================================
        // 2. Add Vitals (3 records: 1 month ago, 2 weeks ago, today)
        // ======================================================
        console.log('Creating Vitals...');
        const vitalsDates = [subDays(new Date(), 30), subDays(new Date(), 14), new Date()];

        for (const date of vitalsDates) {
            const vital = new VitalSigns();
            vital.patient = patient;
            vital.recordedBy = getDoc();
            vital.organization = org;
            vital.organizationId = org.id;
            vital.systolicBp = 110 + Math.floor(Math.random() * 20); // 110-130
            vital.diastolicBp = 70 + Math.floor(Math.random() * 15); // 70-85
            vital.heartRate = 65 + Math.floor(Math.random() * 20); // 65-85
            vital.temperature = Number((36.5 + Math.random()).toFixed(1)); // 36.5-37.5
            vital.temperatureUnit = TemperatureUnit.CELSIUS;
            vital.weight = Number((70 + Math.random() * 2).toFixed(1));
            vital.weightUnit = WeightUnit.KG;
            vital.height = 175;
            vital.heightUnit = HeightUnit.CM;
            vital.oxygenSaturation = 98;
            vital.recordedAt = date;

            await vitalRepo.save(vital);
        }
        console.log('Created 3 Vitals records.');

        // ======================================================
        // 3. Create Medicines
        // ======================================================
        console.log('Ensuring Medicines exist...');
        let med1 = await medicineRepo.findOne({ where: { name: 'Paracetamol 500mg', organizationId: org.id } });
        if (!med1) {
            med1 = medicineRepo.create({
                organizationId: org.id,
                name: 'Paracetamol 500mg',
                genericName: 'Paracetamol',
                brandName: 'Dolo 650',
                manufacturer: 'Micro Labs',
                category: 'Analgesic',
                dosageForm: 'Tablet',
                strength: '500mg',
                unitPrice: 2.0,
                sellingPrice: 3.0,
                batchNumber: 'B123',
                manufactureDate: new Date('2025-01-01'),
                expiryDate: new Date('2027-01-01'),
                currentStock: 1000,
                reorderLevel: 100
            });
            await medicineRepo.save(med1);
        }

        let med2 = await medicineRepo.findOne({ where: { name: 'Amoxicillin 500mg', organizationId: org.id } });
        if (!med2) {
            med2 = medicineRepo.create({
                organizationId: org.id,
                name: 'Amoxicillin 500mg',
                genericName: 'Amoxicillin',
                brandName: 'Mox 500',
                manufacturer: 'Sun Pharma',
                category: 'Antibiotic',
                dosageForm: 'Capsule',
                strength: '500mg',
                unitPrice: 5.0,
                sellingPrice: 8.0,
                batchNumber: 'B124',
                manufactureDate: new Date('2025-01-01'),
                expiryDate: new Date('2027-01-01'),
                currentStock: 500,
                reorderLevel: 50
            });
            await medicineRepo.save(med2);
        }

        // ======================================================
        // 4. Create Prescriptions (2 records)
        // ======================================================
        console.log('Creating Prescriptions...');
        const rxDates = [subDays(new Date(), 14), new Date()];

        for (const date of rxDates) {
            const rx = new Prescription();
            rx.organizationId = org.id;
            rx.patient = patient;
            rx.patientId = patient.id;
            rx.doctor = getDoc();
            rx.doctorId = rx.doctor.id;
            rx.diagnosis = 'Viral Fever';
            rx.prescriptionDate = date;
            rx.status = PrescriptionStatus.DISPENSED;
            rx.notes = 'Take rest and drink plenty of water.';

            // Items
            const item1 = new PrescriptionItem();
            item1.medicine = med1!;
            item1.organizationId = org.id;
            item1.dosage = '1 tablet';
            item1.frequency = 'Twice a day';
            item1.duration = '5 days';
            item1.quantity = 10;
            item1.status = PrescriptionItemStatus.DISPENSED;

            const item2 = new PrescriptionItem();
            item2.medicine = med2!;
            item2.organizationId = org.id;
            item2.dosage = '1 capsule';
            item2.frequency = 'Thrice a day';
            item2.duration = '5 days';
            item2.quantity = 15;
            item2.status = PrescriptionItemStatus.DISPENSED;

            rx.items = [item1, item2];

            await prescriptionRepo.save(rx);
        }
        console.log('Created 2 Prescriptions.');

        // ======================================================
        // 5. Create Lab Orders (2 records)
        // ======================================================
        console.log('Creating Lab Orders...');
        let labTests = await labTestRepo.find({ where: { organizationId: org.id } });

        if (labTests.length === 0) {
            console.log('Creating Lab Tests...');
            const t1 = labTestRepo.create({
                organizationId: org.id,
                name: 'Complete Blood Count (CBC)',
                code: 'CBC',
                category: 'hematology',
                cost: 500,
                description: 'Complete blood count analysis',
                turnaroundTimeMinutes: 1440, // 24 hours
                sampleType: 'Blood'
            });
            const t2 = labTestRepo.create({
                organizationId: org.id,
                name: 'Lipid Profile',
                code: 'LIPID',
                category: 'biochemistry',
                cost: 800,
                description: 'Cholesterol and triglycerides check',
                turnaroundTimeMinutes: 1440,
                sampleType: 'Blood'
            });
            await labTestRepo.save([t1, t2]);
            labTests = [t1, t2];
        }

        if (labTests.length > 0) {
            const orderDates = [subDays(new Date(), 30), subDays(new Date(), 2)];

            for (const date of orderDates) {
                const doc = getDoc();
                const order = new LabOrder();
                order.organizationId = org.id;
                order.patient = patient;
                order.patientId = patient.id;
                order.doctor = doc;
                order.doctorId = doc.id;
                order.orderDate = date;
                order.status = 'completed'; // String literal per model
                order.orderNumber = `LAB-${Math.floor(Math.random() * 10000)}`;

                const savedOrder = await labOrderRepo.save(order);

                const test = labTests[Math.floor(Math.random() * labTests.length)];

                // Create Result
                const result = new LabResult();
                result.organizationId = org.id;
                result.resultValue = (Math.random() * 10).toFixed(1);
                result.units = 'mmol/L';
                result.referenceRange = '4.0 - 6.0';
                result.flag = 'normal';
                result.resultTime = date;
                result.performedBy = doc;
                result.performedById = doc.id;
                result.isVerified = true;

                const savedResult = await labResultRepo.save(result);

                const item = new LabOrderItem();
                item.labOrder = savedOrder;
                item.labOrderId = savedOrder.id;
                item.labTest = test;
                item.status = 'completed'; // String literal
                item.result = savedResult;
                item.resultId = savedResult.id;
                item.organizationId = org.id;

                await labOrderItemRepo.save(item);
            }
            console.log('Created 2 Lab Orders with Results.');
        } else {
            console.log('No Lab Tests found (still?), skipping Lab Orders.');
        }

        // ======================================================
        // 6. Create Extra Appointments (2 records)
        // ======================================================
        console.log('Creating Extra Appointments...');
        const apptDates = [subDays(new Date(), 45), subDays(new Date(), 5)];

        for (const date of apptDates) {
            const appt = new Appointment();
            appt.organizationId = org.id;
            appt.patient = patient;
            appt.doctor = getDoc();

            if (services.length > 0) {
                appt.service = services[Math.floor(Math.random() * services.length)];
            } else {
                console.warn('No services found. Skipping appointment creation.');
                continue;
            }

            appt.startTime = date;
            appt.endTime = new Date(date.getTime() + 30 * 60000);
            appt.status = AppointmentStatus.COMPLETED;
            appt.mode = 'in_person' as any;
            appt.appointmentType = 'standard' as any;

            await apptRepo.save(appt);
        }
        console.log('Created 2 extra Appointments.');

        console.log('Seed History Demo Completed Successfully!');

    } catch (e) {
        console.error('Error seeding history:', e);
    } finally {
        await AppDataSource.destroy();
    }
}

seedHistory();
