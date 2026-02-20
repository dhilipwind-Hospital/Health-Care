/**
 * Inpatient Demo Seed Script
 * 
 * Populates:
 * - Wards, Rooms, Beds
 * - Active Admissions
 * - Clinical History (Vitals, Nursing Notes, Doctor Notes)
 */

import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';
import { Location } from '../models/Location';
import { Department } from '../models/Department';
import { User } from '../models/User';
import { Ward } from '../models/inpatient/Ward';
import { Room, RoomType } from '../models/inpatient/Room';
import { Bed, BedStatus } from '../models/inpatient/Bed';
import { Admission, AdmissionStatus } from '../models/inpatient/Admission';
import { VitalSign } from '../models/inpatient/VitalSign';
import { NursingNote, NursingNoteType } from '../models/inpatient/NursingNote';
import { DoctorNote, DoctorNoteType } from '../models/inpatient/DoctorNote';
import { UserRole } from '../types/roles';

async function seedInpatientDemo() {
    try {
        console.log('\n🚀 STARTING INPATIENT DEMO SEEDING...');

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const orgRepo = AppDataSource.getRepository(Organization);
        const locRepo = AppDataSource.getRepository(Location);
        const deptRepo = AppDataSource.getRepository(Department);
        const userRepo = AppDataSource.getRepository(User);
        const wardRepo = AppDataSource.getRepository(Ward);
        const roomRepo = AppDataSource.getRepository(Room);
        const bedRepo = AppDataSource.getRepository(Bed);
        const admissionRepo = AppDataSource.getRepository(Admission);
        const vitalRepo = AppDataSource.getRepository(VitalSign);
        const nursingNoteRepo = AppDataSource.getRepository(NursingNote);
        const doctorNoteRepo = AppDataSource.getRepository(DoctorNote);

        // 1. Fetch Organization
        const org = await orgRepo.findOne({ where: { subdomain: 'ayphen' } });
        if (!org) {
            console.error('❌ Organization not found! Run seed-complete-demo.ts first.');
            process.exit(1);
        }

        // 2. Fetch Locations
        const locations = await locRepo.find({ where: { organizationId: org.id } });
        const depts = await deptRepo.find({ where: { organizationId: org.id } });

        const genMedDept = depts.find(d => d.name === 'General Medicine');
        const emergencyDept = depts.find(d => d.name === 'Emergency');
        const cardiologyDept = depts.find(d => d.name === 'Cardiology');

        if (!genMedDept || !emergencyDept) {
            console.error('❌ Required departments not found!');
            process.exit(1);
        }

        // 3. Create Wards, Rooms, and Beds
        console.log('🛌 Creating Wards, Rooms, and Beds...');

        for (const loc of locations) {
            // Create a few wards per location
            const wardConfigs = [
                { name: 'General Ward', prefix: 'GW', dept: genMedDept, capacity: 20 },
                { name: 'Intensive Care Unit', prefix: 'ICU', dept: cardiologyDept || genMedDept, capacity: 10 },
                { name: 'Private Wing', prefix: 'PW', dept: genMedDept, capacity: 10 }
            ];

            for (const wc of wardConfigs) {
                // Check if already exists to avoid unique constraint error on wardNumber
                let ward = await wardRepo.findOne({ where: { organizationId: org.id, name: wc.name, location: loc.name } });

                if (!ward) {
                    ward = await wardRepo.save(wardRepo.create({
                        organizationId: org.id,
                        name: wc.name,
                        wardNumber: `${wc.prefix}-${loc.code}-${Math.floor(Math.random() * 10000)}`,
                        departmentId: wc.dept.id,
                        capacity: wc.capacity,
                        location: loc.name,
                        isActive: true
                    }));
                }

                // Create 2-4 rooms per ward
                const roomCount = wc.prefix === 'ICU' ? 2 : 4;
                for (let r = 1; r <= roomCount; r++) {
                    const roomType = wc.prefix === 'ICU' ? RoomType.ICU :
                        wc.prefix === 'PW' ? RoomType.PRIVATE : RoomType.GENERAL;

                    let room = await roomRepo.findOne({ where: { wardId: ward.id, roomNumber: `${wc.prefix}-R${r}-${loc.code}` } });

                    if (!room) {
                        room = await roomRepo.save(roomRepo.create({
                            organizationId: org.id,
                            wardId: ward.id,
                            roomNumber: `${wc.prefix}-R${r}-${loc.code}`,
                            roomType: roomType,
                            capacity: roomType === RoomType.PRIVATE ? 1 : 4,
                            dailyRate: roomType === RoomType.ICU ? 5000 :
                                roomType === RoomType.PRIVATE ? 3000 : 1000,
                            isActive: true
                        }));
                    }

                    // Create beds per room
                    const bedsInRoom = room.capacity;
                    for (let b = 1; b <= bedsInRoom; b++) {
                        const bedNumber = `${room.roomNumber}-B${b}`;
                        const existingBed = await bedRepo.findOne({ where: { roomId: room.id, bedNumber } });
                        if (!existingBed) {
                            await bedRepo.save(bedRepo.create({
                                organizationId: org.id,
                                roomId: room.id,
                                bedNumber: bedNumber,
                                status: BedStatus.AVAILABLE
                            }));
                        }
                    }
                }
            }
        }

        // 4. Create Admissions
        console.log('🏥 Creating Admissions and Clinical History...');

        const patients = await userRepo.find({ where: { role: UserRole.PATIENT } });
        const doctors = await userRepo.find({ where: { role: UserRole.DOCTOR } });
        const nurses = await userRepo.find({ where: { role: UserRole.NURSE } });

        if (patients.length === 0 || doctors.length === 0 || nurses.length === 0) {
            console.error('❌ Patients, Doctors or Nurses not found!');
            process.exit(1);
        }

        // Let's admit 5 patients per location
        for (const loc of locations) {
            const availableBeds = await bedRepo.find({
                where: { organizationId: org.id, status: BedStatus.AVAILABLE },
                relations: ['room', 'room.ward']
            });

            const locBeds = availableBeds.filter(b => b.room.ward.location === loc.name);

            for (let i = 0; i < 5; i++) {
                if (locBeds.length <= i) break;

                const patient = patients[Math.floor(Math.random() * patients.length)];
                const doctor = doctors[Math.floor(Math.random() * doctors.length)];
                const nurse = nurses[Math.floor(Math.random() * nurses.length)];
                const bed = locBeds[i];

                const admission = await admissionRepo.save(admissionRepo.create({
                    organizationId: org.id,
                    admissionNumber: `ADM-${Date.now().toString().slice(-4)}-${loc.code.slice(0, 3)}-${i}`,
                    patientId: patient.id,
                    admittingDoctorId: doctor.id,
                    bedId: bed.id,
                    admissionDateTime: new Date(Date.now() - (Math.random() * 5 * 24 * 60 * 60 * 1000)),
                    admissionReason: i % 2 === 0 ? 'Severe abdominal pain' : 'Post-operative recovery',
                    admissionDiagnosis: i % 2 === 0 ? 'Acute Appendicitis' : 'Post-Op Knee Replacement',
                    status: AdmissionStatus.ADMITTED,
                    isEmergency: i === 0
                }));

                // Update bed status
                bed.status = BedStatus.OCCUPIED;
                await bedRepo.save(bed);

                // Add 3-5 Vital Signs
                for (let j = 0; j < 4; j++) {
                    await vitalRepo.save(vitalRepo.create({
                        organizationId: org.id,
                        admissionId: admission.id,
                        recordedById: nurse.id,
                        recordedAt: new Date(admission.admissionDateTime.getTime() + (j * 6 * 60 * 60 * 1000)),
                        temperature: 36.5 + Math.random() * 2,
                        systolicBP: 110 + Math.floor(Math.random() * 20),
                        diastolicBP: 70 + Math.floor(Math.random() * 15),
                        heartRate: 70 + Math.floor(Math.random() * 30),
                        respiratoryRate: 16 + Math.floor(Math.random() * 6),
                        oxygenSaturation: 94 + Math.floor(Math.random() * 6)
                    }));
                }

                // Add 2 Nursing Notes
                const nursingMessages = [
                    "Patient is stable, monitoring vitals every 4 hours.",
                    "IV fluids administered as per doctor's instruction.",
                    "Patient complained of mild pain at the surgical site.",
                    "Patient is resting comfortably."
                ];
                for (let k = 0; k < 2; k++) {
                    await nursingNoteRepo.save(nursingNoteRepo.create({
                        organizationId: org.id,
                        admissionId: admission.id,
                        nurseId: nurse.id,
                        noteDateTime: new Date(admission.admissionDateTime.getTime() + (k + 1) * 12 * 60 * 60 * 1000),
                        notes: nursingMessages[Math.floor(Math.random() * nursingMessages.length)],
                        noteType: NursingNoteType.ROUTINE
                    }));
                }

                // Add 1 Doctor Note
                await doctorNoteRepo.save(doctorNoteRepo.create({
                    organizationId: org.id,
                    admissionId: admission.id,
                    doctorId: doctor.id,
                    noteDateTime: new Date(admission.admissionDateTime.getTime() + 18 * 60 * 60 * 1000),
                    subjective: i % 2 === 0 ? "Pain is decreasing." : "Patient feeling much better today.",
                    objective: "Patient is responding well to treatment. Surgical site healing properly.",
                    assessment: i % 2 === 0 ? "Improving appendicitis." : "Stable post-op recovery.",
                    plan: "Continue antibiotics for another 48 hours. Start mild physical therapy.",
                    noteType: DoctorNoteType.PROGRESS
                }));
            }
        }

        console.log('\n✨ INPATIENT DEMO SEED COMPLETED SUCCESSFULLY! ✨');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Inpatient Seeding Failed:', error);
        process.exit(1);
    }
}

seedInpatientDemo();
