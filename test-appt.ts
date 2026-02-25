import 'reflect-metadata';
import { AppDataSource } from './backend/src/config/database';
import { Appointment } from './backend/src/models/Appointment';

AppDataSource.initialize().then(async () => {
  const repo = AppDataSource.getRepository(Appointment);
  const appts = await repo.find({ relations: ['patient', 'doctor'] });
  console.log("Total Appointments:", appts.length);
  appts.forEach(a => {
    console.log(`ID: ${a.id} | Patient: ${(a as any).patient?.firstName} | Doctor: ${(a as any).doctor?.firstName} | Org: ${(a as any).organizationId} | Status: ${a.status} | Start: ${a.startTime}`);
  });
  process.exit();
}).catch(e => { console.error(e); process.exit(1); });
