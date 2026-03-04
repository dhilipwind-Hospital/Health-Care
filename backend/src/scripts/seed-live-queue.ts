/**
 * Seed Live Queue Flow
 *
 * Creates active visits and queue items at different stages:
 * - Reception (waiting for registration/triage)
 * - Triage (waiting for vitals assessment)
 * - Doctor (waiting for consultation)
 *
 * Idempotent — skips if queue items already exist.
 * Usage: npx ts-node src/scripts/seed-live-queue.ts
 *   or via POST /api/seed-live-queue
 */

import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import { Visit } from '../models/Visit';
import { QueueItem } from '../models/QueueItem';
import { Triage } from '../models/Triage';

export async function seedLiveQueue() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log('🔌 Database connected');
  }

  const orgRepo = AppDataSource.getRepository(Organization);
  const org = await orgRepo.findOne({ where: { isActive: true }, order: { createdAt: 'ASC' } });
  if (!org) throw new Error('No active organization found');
  const orgId = org.id;
  console.log(`🏥 Organization: ${org.name}`);

  // Check if queue items already exist
  const queueRepo = AppDataSource.getRepository(QueueItem);
  const existing = await queueRepo.count({ where: { organizationId: orgId } });
  if (existing > 0) {
    console.log(`⏭️ Queue: ${existing} items already exist, skipping`);
    return { success: true, skipped: true, existing };
  }

  const userRepo = AppDataSource.getRepository(User);
  const patients = await userRepo.find({ where: { organizationId: orgId, role: 'patient' as any, isActive: true }, take: 5 });
  const doctors = await userRepo.find({ where: { organizationId: orgId, role: 'doctor' as any, isActive: true }, take: 5 });

  if (patients.length < 3 || doctors.length < 2) {
    throw new Error(`Need at least 3 patients and 2 doctors. Found ${patients.length} patients, ${doctors.length} doctors.`);
  }
  console.log(`👥 Found ${patients.length} patients, ${doctors.length} doctors`);

  const visitRepo = AppDataSource.getRepository(Visit);
  const triageRepo = AppDataSource.getRepository(Triage);
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  let tokenSeq = 1;

  const createVisit = async (
    patient: User,
    doctor: User,
    stage: 'reception' | 'triage' | 'doctor',
    queueStatus: 'waiting' | 'called',
    priority: 'standard' | 'urgent' | 'emergency',
  ) => {
    const token = `T-${today}-${String(tokenSeq++).padStart(4, '0')}`;
    const visitStatus = stage === 'doctor' ? 'with_doctor' : stage === 'triage' ? 'triage' : 'created';

    const visit = visitRepo.create({
      organizationId: orgId,
      patientId: patient.id,
      visitNumber: `V-${today}-${String(tokenSeq).padStart(4, '0')}`,
      status: visitStatus,
    } as any);
    const savedVisit = await visitRepo.save(visit);

    const qi = queueRepo.create({
      organizationId: orgId,
      visitId: (savedVisit as any).id,
      stage,
      status: queueStatus,
      priority,
      tokenNumber: token,
      assignedDoctorId: doctor.id,
    } as any);
    await queueRepo.save(qi);

    // Add triage vitals for patients in triage or doctor stage
    if (stage === 'triage' || stage === 'doctor') {
      const triage = triageRepo.create({
        organizationId: orgId,
        visitId: (savedVisit as any).id,
        vitals: {
          temperature: 98.4 + Math.random() * 1.2,
          systolic: 110 + Math.floor(Math.random() * 30),
          diastolic: 70 + Math.floor(Math.random() * 15),
          heartRate: 72 + Math.floor(Math.random() * 20),
          spo2: 96 + Math.floor(Math.random() * 3),
          weight: 55 + Math.floor(Math.random() * 25),
        },
        symptoms: stage === 'doctor' ? 'Fever and body aches for 3 days' : 'Headache and mild nausea',
        priority,
      } as any);
      await triageRepo.save(triage);
    }

    console.log(`  ✅ [${token}] ${patient.firstName} ${patient.lastName} → ${stage} (${queueStatus}, ${priority})`);
  };

  console.log('🚶 Creating queue items...');

  // 2 patients waiting at reception
  await createVisit(patients[0], doctors[0], 'reception', 'waiting', 'standard');
  await createVisit(patients[1], doctors[1], 'reception', 'waiting', 'urgent');

  // 1 patient in triage (called)
  await createVisit(patients[2], doctors[0], 'triage', 'called', 'standard');

  // 1 patient waiting for doctor
  if (patients[3]) {
    await createVisit(patients[3], doctors[1], 'doctor', 'waiting', 'standard');
  }

  // 1 emergency patient called for doctor
  if (patients[4]) {
    await createVisit(patients[4], doctors[2] || doctors[0], 'doctor', 'called', 'emergency');
  }

  console.log(`\n✅ Queue seeded: ${tokenSeq - 1} visits created`);
  return { success: true, created: tokenSeq - 1 };
}

// Allow standalone CLI execution
if (require.main === module) {
  seedLiveQueue()
    .then(() => { AppDataSource.destroy(); process.exit(0); })
    .catch(err => { console.error('❌ Seed error:', err); process.exit(1); });
}
