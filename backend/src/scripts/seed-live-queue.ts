/**
 * Seed Live Queue Flow
 * 
 * Simulates active patients in the queue at different stages:
 * - Reception (Waiting for registration/triage)
 * - Triage (Waiting for or undergoing triage)
 * - Doctor (Waiting for or undergoing consultation)
 */

import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Location } from '../models/Location';
import { Visit } from '../models/Visit';
import { QueueItem } from '../models/QueueItem';
import { UserRole } from '../types/roles';

async function seedLiveQueue() {
    try {
        console.log('\n🚀 STARTING LIVE QUEUE SEEDING...');

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const userRepo = AppDataSource.getRepository(User);
        const locRepo = AppDataSource.getRepository(Location);
        const visitRepo = AppDataSource.getRepository(Visit);
        const queueRepo = AppDataSource.getRepository(QueueItem);

        // 1. Fetch Locations
        const chennaiLoc = await locRepo.findOne({ where: { code: 'CHN-MAIN' } });
        const bangaloreLoc = await locRepo.findOne({ where: { code: 'BLR-BRANCH' } });

        if (!chennaiLoc || !bangaloreLoc) {
            console.error('❌ Locations not found!');
            return;
        }

        const orgId = chennaiLoc.organizationId;

        // 2. Fetch Patients & Doctors
        const patients = await userRepo.find({ where: { role: UserRole.PATIENT }, take: 10 });
        const doctors = await userRepo.find({ where: { role: UserRole.DOCTOR } });

        if (patients.length < 5 || doctors.length < 2) {
            console.error('❌ Not enough patients or doctors. Run seed-complete-demo.ts first.');
            return;
        }

        // Cleanup existing LIVE queue items (optional, but good for demo reset)
        // await queueRepo.delete({});
        // await visitRepo.delete({});

        const stages: ('reception' | 'triage' | 'doctor')[] = ['reception', 'triage', 'doctor'];
        const statuses: ('waiting' | 'called' | 'served')[] = ['waiting', 'called', 'served'];

        console.log('🚶 Creating active visits...');

        const createLiveVisit = async (patient: User, doctor: User, stage: any, status: any, token: string) => {
            // Create Visit
            const visit = visitRepo.create({
                organizationId: orgId,
                patientId: patient.id,
                visitNumber: `VISIT-${Date.now().toString().slice(-6)}-${token}`,
                status: stage === 'doctor' ? 'with_doctor' : (stage === 'triage' ? 'triage' : 'created')
            } as any);
            const savedVisit = await visitRepo.save(visit);

            // Create Queue Item
            const queueItem = queueRepo.create({
                organizationId: orgId,
                visitId: (savedVisit as any).id,
                stage: stage,
                status: status,
                priority: 'standard',
                tokenNumber: token,
                assignedDoctorId: doctor.id
            } as any);
            await queueRepo.save(queueItem);

            console.log(` ✅ [${token}] Patient ${patient.firstName} is in ${stage} (${status})`);
        };

        // --- Chennai Queue ---
        console.log('\n🏥 Chennai Main Queue:');
        await createLiveVisit(patients[0], doctors[0], 'reception', 'waiting', 'CHN-001');
        await createLiveVisit(patients[1], doctors[1], 'triage', 'waiting', 'CHN-002');
        await createLiveVisit(patients[2], doctors[2], 'doctor', 'called', 'CHN-003');

        // --- Bangalore Queue ---
        console.log('\n🏥 Bangalore Branch Queue:');
        await createLiveVisit(patients[3], doctors[4] || doctors[0], 'triage', 'waiting', 'BLR-001');
        await createLiveVisit(patients[4], doctors[5] || doctors[1], 'doctor', 'called', 'BLR-002');

        console.log('\n✨ LIVE QUEUE SEED COMPLETED!');
        await AppDataSource.destroy();
        process.exit(0);

    } catch (error) {
        console.error('❌ Queue Seeding Failed:', error);
        process.exit(1);
    }
}

seedLiveQueue();
