/**
 * Seed Transactions Demo (Fixed 3)
 * 
 * Populates transactional data ensuring correct model properties.
 */

import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Location } from '../models/Location';
import { Service } from '../models/Service';
import { Appointment, AppointmentStatus, AppointmentMode, AppointmentType } from '../models/Appointment';
import { MedicalRecord, RecordType } from '../models/MedicalRecord';
import { Bill, BillStatus, PaymentMethod } from '../models/Bill';
import { LabOrder } from '../models/LabOrder';
import { LabOrderItem } from '../models/LabOrderItem';
import { LabTest } from '../models/LabTest';
import { UserRole } from '../types/roles';
import { Prescription } from '../models/pharmacy/Prescription';
import { PrescriptionItem } from '../models/pharmacy/PrescriptionItem';
import { Medicine } from '../models/pharmacy/Medicine';
import { LabSample } from '../models/LabSample';
import { Supplier } from '../models/Supplier';
import { PurchaseOrder, PurchaseOrderStatus } from '../models/PurchaseOrder';
import { StockMovement, MovementType } from '../models/pharmacy/StockMovement';

// Helper to get random item from array
const random = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Helper to get random date within range
const randomDate = (start: Date, end: Date) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

async function seedTransactions() {
    try {
        console.log('\n🚀 STARTING TRANSACTION SEEDING (FIXED 3)...');

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const userRepo = AppDataSource.getRepository(User);
        const locRepo = AppDataSource.getRepository(Location);
        const serviceRepo = AppDataSource.getRepository(Service);
        const apptRepo = AppDataSource.getRepository(Appointment);
        const recordRepo = AppDataSource.getRepository(MedicalRecord);
        const billRepo = AppDataSource.getRepository(Bill);
        const labOrderRepo = AppDataSource.getRepository(LabOrder);
        const labOrderItemRepo = AppDataSource.getRepository(LabOrderItem);
        const labTestRepo = AppDataSource.getRepository(LabTest);
        const labSampleRepo = AppDataSource.getRepository(LabSample);
        const supplierRepo = AppDataSource.getRepository(Supplier);
        const poRepo = AppDataSource.getRepository(PurchaseOrder);
        const movementRepo = AppDataSource.getRepository(StockMovement);
        const medicineRepo = AppDataSource.getRepository(Medicine);
        const prescriptionRepo = AppDataSource.getRepository(Prescription);
        const prescriptionItemRepo = AppDataSource.getRepository(PrescriptionItem);

        // 1. Fetch Master Data
        console.log('📦 Fetching Master Data...');
        const chennaiLoc = await locRepo.findOne({ where: { code: 'CHN-MAIN' } });
        const bangaloreLoc = await locRepo.findOne({ where: { code: 'BLR-BRANCH' } });

        if (!chennaiLoc || !bangaloreLoc) {
            console.error('❌ Locations not found! Please run seed-complete-demo.ts first.');
            process.exit(1);
        }

        const doctorsChennai = await userRepo.find({ where: { role: UserRole.DOCTOR, locationId: chennaiLoc.id } });
        const doctorsBangalore = await userRepo.find({ where: { role: UserRole.DOCTOR, locationId: bangaloreLoc.id } });

        const patientsChennai = await userRepo.find({ where: { role: UserRole.PATIENT, locationId: chennaiLoc.id } });
        const patientsBangalore = await userRepo.find({ where: { role: UserRole.PATIENT, locationId: bangaloreLoc.id } });

        const services = await serviceRepo.find({ relations: ['department'] });
        const labTests = await labTestRepo.find();
        const medicines = await medicineRepo.find();

        console.log(`   • Doctors: ${doctorsChennai.length} (CHN), ${doctorsBangalore.length} (BLR)`);
        console.log(`   • Patients: ${patientsChennai.length} (CHN), ${patientsBangalore.length} (BLR)`);

        // ==========================================
        // CREATE COMPLETED APPOINTMENTS (PAST)
        // ==========================================
        console.log('\n🗓️  Creating Past Appointments & Records...');

        const createHistory = async (location: Location, doctors: User[], patients: User[], count: number) => {
            let processed = 0;
            for (let i = 0; i < count; i++) {
                if (doctors.length === 0 || patients.length === 0) continue;

                const doctor = random(doctors);
                const patient = random(patients);
                const docServices = services.filter(s => s.departmentId === doctor.departmentId);
                const service = docServices.length > 0 ? random(docServices) : random(services);

                // Date: Past 30 days
                const date = randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date());
                const endTime = new Date(date.getTime() + 30 * 60000); // 30 mins later

                const apptInput = apptRepo.create({
                    organizationId: location.organizationId,
                    patient: patient,
                    doctor: doctor,
                    service: service,
                    startTime: date,
                    endTime: endTime,
                    status: AppointmentStatus.COMPLETED,
                    mode: AppointmentMode.IN_PERSON,
                    appointmentType: AppointmentType.STANDARD,
                    reason: `Regular checkup for ${service.name}`,
                    notes: 'Patient arrived on time.',
                    completedAt: endTime
                } as any);

                // Use double casting to avoid TS errors
                const appt = (await apptRepo.save(apptInput)) as unknown as Appointment;

                // 2. Create Medical Record
                const recordInput = recordRepo.create({
                    organizationId: location.organizationId,
                    patient: patient,
                    doctor: doctor,
                    type: RecordType.CONSULTATION,
                    title: `Consultation - ${service.name}`,
                    description: `Symptoms: Fatigue, mild pain.\nDiagnosis: Mild ${service.department?.name || 'General'} Issue`,
                    diagnosis: `Mild ${service.department?.name || 'General'} Issue`,
                    treatment: 'Rest and medication',
                    recordDate: date
                } as any);
                await recordRepo.save(recordInput);

                // 3. Create Bill
                const price = 500; // Hardcoded since Service lacks price
                const billInput = billRepo.create({
                    organizationId: location.organizationId,
                    patient: patient,
                    appointment: appt,
                    billNumber: `BILL-${location.code}-${Date.now()}-${i}`,
                    amount: price,
                    paidAmount: price,
                    status: BillStatus.PAID,
                    paymentMethod: PaymentMethod.CASH,
                    itemDetails: [
                        { name: service.name, quantity: 1, unitPrice: price, total: price }
                    ],
                    billDate: date,
                    paidDate: date
                } as any);
                await billRepo.save(billInput);

                // 4. Create Lab Order (30% chance)
                if (Math.random() > 0.7 && labTests.length > 0) {
                    const test = random(labTests);

                    const labOrderInput = labOrderRepo.create({
                        organizationId: location.organizationId,
                        patientId: patient.id,
                        doctorId: doctor.id,
                        orderNumber: `ORD-${Date.now().toString().slice(-6)}-${i}`,
                        status: 'completed',
                        orderDate: date,
                        diagnosis: 'Routine Checkup',
                        isUrgent: false
                    } as any);

                    const savedOrder = (await labOrderRepo.save(labOrderInput)) as unknown as LabOrder;

                    // Create Item linked to savedOrder
                    const labItem = labOrderItemRepo.create({
                        organizationId: location.organizationId,
                        labOrderId: savedOrder.id,
                        labTestId: test.id,
                        status: 'completed',
                        notes: 'Within normal range'
                    } as any);
                    await labOrderItemRepo.save(labItem);
                }

                // 5. Create Prescription (40% chance)
                if (Math.random() > 0.6 && medicines.length > 0) {
                    const prescription = prescriptionRepo.create({
                        organizationId: location.organizationId,
                        patientId: patient.id,
                        doctorId: doctor.id,
                        prescriptionDate: date,
                        status: 'pending',
                        diagnosis: 'Common ailment'
                    } as any);
                    const savedPrescription = (await prescriptionRepo.save(prescription)) as any;

                    // Add 1-3 items
                    const itemCount = Math.floor(Math.random() * 3) + 1;
                    for (let j = 0; j < itemCount; j++) {
                        const medicine = random(medicines);
                        await prescriptionItemRepo.save(prescriptionItemRepo.create({
                            organizationId: location.organizationId,
                            prescriptionId: savedPrescription.id,
                            medicineId: medicine.id,
                            dosage: '1-0-1',
                            duration: '5 days',
                            frequency: 'Twice daily',
                            quantity: 10,
                            instructions: 'Take after meals'
                        } as any));
                    }
                }

                processed++;
            }
            console.log(`   ✅ Created ${processed} past records for ${location.name}`);
        };

        if (doctorsChennai.length > 0 && patientsChennai.length > 0) {
            await createHistory(chennaiLoc, doctorsChennai, patientsChennai, 15);
        }
        if (doctorsBangalore.length > 0 && patientsBangalore.length > 0) {
            await createHistory(bangaloreLoc, doctorsBangalore, patientsBangalore, 10);
        }

        // ==========================================
        // CREATE UPCOMING APPOINTMENTS
        // ==========================================
        console.log('\n📅 Creating Upcoming Appointments...');

        const createUpcoming = async (location: Location, doctors: User[], patients: User[], count: number) => {
            let processed = 0;
            for (let i = 0; i < count; i++) {
                if (doctors.length === 0 || patients.length === 0) continue;

                const doctor = random(doctors);
                const patient = random(patients);
                const docServices = services.filter(s => s.departmentId === doctor.departmentId);
                const service = docServices.length > 0 ? random(docServices) : random(services);

                // Date: Next 7 days
                const date = randomDate(new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
                const endTime = new Date(date.getTime() + 30 * 60000);

                const apptInput = apptRepo.create({
                    organizationId: location.organizationId,
                    patient: patient,
                    doctor: doctor,
                    service: service,
                    startTime: date,
                    endTime: endTime,
                    status: AppointmentStatus.CONFIRMED, // Use confirmed for upcoming
                    mode: AppointmentMode.IN_PERSON,
                    appointmentType: AppointmentType.STANDARD,
                    reason: `Follow-up for ${service.name}`,
                } as any);
                await apptRepo.save(apptInput);
                processed++;
            }
            console.log(`   ✅ Scheduled ${processed} appointments for ${location.name}`);
        };

        if (doctorsChennai.length > 0 && patientsChennai.length > 0) {
            await createUpcoming(chennaiLoc, doctorsChennai, patientsChennai, 8);
        }
        if (doctorsBangalore.length > 0 && patientsBangalore.length > 0) {
            await createUpcoming(bangaloreLoc, doctorsBangalore, patientsBangalore, 5);
        }

        // ==========================================
        // CREATE LIVE LAB WORKFLOWS
        // ==========================================
        console.log('\n🧪 Creating Live Lab Workflows...');

        const createLabWorkflows = async (location: Location, doctors: User[], patients: User[]) => {
            if (doctors.length === 0 || patients.length === 0 || labTests.length === 0) return;

            // 1. Stage 1: Pending Collection (3 Orders)
            for (let i = 0; i < 3; i++) {
                const doctor = random(doctors);
                const patient = random(patients);
                const test = random(labTests);

                const labOrderInput = labOrderRepo.create({
                    organizationId: location.organizationId,
                    patientId: patient.id,
                    doctorId: doctor.id,
                    orderNumber: `LAB-NEW-${location.code.slice(0, 3)}-${Date.now().toString().slice(-4)}${i}`,
                    status: 'ordered',
                    orderDate: new Date(),
                    diagnosis: 'Routine screening',
                    isUrgent: i === 0
                } as any);

                const savedOrder = (await labOrderRepo.save(labOrderInput)) as unknown as LabOrder;

                const labItem = labOrderItemRepo.create({
                    organizationId: location.organizationId,
                    labOrderId: savedOrder.id,
                    labTestId: test.id,
                    status: 'ordered'
                } as any);
                await labOrderItemRepo.save(labItem);
            }

            // 2. Stage 2: Pending Results (3 Orders)
            for (let i = 0; i < 3; i++) {
                const doctor = random(doctors);
                const patient = random(patients);
                const test = random(labTests);

                const labOrderInput = labOrderRepo.create({
                    organizationId: location.organizationId,
                    patientId: patient.id,
                    doctorId: doctor.id,
                    orderNumber: `LAB-SMP-${location.code.slice(0, 3)}-${Date.now().toString().slice(-4)}${i}`,
                    status: 'sample_collected',
                    orderDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                    diagnosis: 'Diagnostic investigation',
                    isUrgent: false
                } as any);

                const savedOrder = (await labOrderRepo.save(labOrderInput)) as unknown as LabOrder;

                // Create separate LabSample record
                const sampleBarcode = `SAM-${location.code.slice(0, 3)}-${Date.now().toString().slice(-4)}${i}`;
                const labSample = await labSampleRepo.save(labSampleRepo.create({
                    organizationId: location.organizationId,
                    sampleId: sampleBarcode,
                    sampleType: test.sampleType || 'Blood',
                    collectionTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
                    status: 'collected',
                    storageLocation: 'Room 101, Fridge A'
                } as any));

                const labItem = labOrderItemRepo.create({
                    organizationId: location.organizationId,
                    labOrderId: savedOrder.id,
                    labTestId: test.id,
                    status: 'sample_collected',
                    sampleId: (labSample as any).id
                } as any);
                await labOrderItemRepo.save(labItem);
            }
            console.log(`   ✅ Created Stage 1 & 2 workflows for ${location.name}`);
        };

        await createLabWorkflows(chennaiLoc, doctorsChennai, patientsChennai);
        await createLabWorkflows(bangaloreLoc, doctorsBangalore, patientsBangalore);

        // ==========================================
        // CREATE PHARMACY INVENTORY DATA
        // ==========================================
        console.log('\n📦 Creating Pharmacy Transactions & POs...');

        const createPharmacyData = async (location: Location, doctors: User[]) => {
            const orgId = location.organizationId;
            const orgSuppliers = await supplierRepo.find({ where: { organizationId: orgId } });
            const orgMedicines = await medicineRepo.find({ where: { organizationId: orgId } });

            if (orgSuppliers.length === 0 || orgMedicines.length === 0 || doctors.length === 0) return;

            const admin = doctors[0]; // Use first doctor as acting creator

            // 1. Create Purchase Orders (10 per organization)
            const statuses = [
                PurchaseOrderStatus.DRAFT,
                PurchaseOrderStatus.PENDING,
                PurchaseOrderStatus.APPROVED,
                PurchaseOrderStatus.ORDERED,
                PurchaseOrderStatus.RECEIVED
            ];

            for (let i = 0; i < 10; i++) {
                const supplier = random(orgSuppliers);
                const status = random(statuses);
                const poItems = [];
                const itemCount = Math.floor(Math.random() * 3) + 1;
                let total = 0;

                for (let j = 0; j < itemCount; j++) {
                    const med = random(orgMedicines);
                    const qty = Math.floor(Math.random() * 100) + 50;
                    poItems.push({
                        medicineId: med.id,
                        medicineName: med.name,
                        quantity: qty,
                        unitPrice: med.unitPrice
                    });
                    total += qty * med.unitPrice;
                }

                const po = poRepo.create({
                    organizationId: orgId,
                    orderNumber: `PO-${location.code.slice(0, 3)}-${Date.now().toString().slice(-4)}${i}`,
                    supplier: supplier,
                    status: status,
                    items: poItems,
                    totalAmount: total,
                    expectedDeliveryDate: randomDate(new Date(), new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
                    createdBy: admin,
                    notes: `Demo ${status} purchase order.`
                });

                if (status === PurchaseOrderStatus.APPROVED || status === PurchaseOrderStatus.ORDERED || status === PurchaseOrderStatus.RECEIVED) {
                    po.approvedBy = admin;
                }

                if (status === PurchaseOrderStatus.RECEIVED) {
                    po.receivedDate = new Date();
                }

                await poRepo.save(po);

                // 2. Create Stock Movements for Received/Ordered POs
                if (status === PurchaseOrderStatus.RECEIVED) {
                    for (const item of poItems) {
                        const med = orgMedicines.find(m => m.id === item.medicineId);
                        if (med) {
                            await movementRepo.save(movementRepo.create({
                                organizationId: orgId,
                                medicine: med,
                                movementType: MovementType.PURCHASE,
                                quantity: item.quantity,
                                previousStock: med.currentStock - item.quantity,
                                newStock: med.currentStock,
                                referenceNumber: po.orderNumber,
                                notes: 'Stock received via PO',
                                performedBy: admin
                            }));
                        }
                    }
                }
            }

            // 3. Create Random Adjustments and Sales History
            for (let i = 0; i < 15; i++) {
                const med = random(orgMedicines);
                const type = random([MovementType.SALE, MovementType.ADJUSTMENT, MovementType.DAMAGED]);
                const qty = Math.floor(Math.random() * 10) + 1;

                await movementRepo.save(movementRepo.create({
                    organizationId: orgId,
                    medicine: med,
                    movementType: type,
                    quantity: qty,
                    previousStock: med.currentStock + qty,
                    newStock: med.currentStock,
                    referenceNumber: `TRX-${Math.random().toString(36).substring(7).toUpperCase()}`,
                    notes: `Demo stock movement: ${type}`,
                    performedBy: admin
                }));
            }
            console.log(`   ✅ Created POs and movements for ${location.name}`);
        };

        await createPharmacyData(chennaiLoc, doctorsChennai);
        await createPharmacyData(bangaloreLoc, doctorsBangalore);

        console.log('\n✨ TRANSACTIONS SEED COMPLETED SUCCESSFULLY! ✨');
        process.exit(0);

    } catch (error) {
        console.error('❌ Transaction Seeding Failed:', error);
        process.exit(1);
    }
}

seedTransactions();
