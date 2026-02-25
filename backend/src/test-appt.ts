import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();
import { AppDataSource } from './config/database';
import { Appointment } from './models/Appointment';
import { User } from './models/User';

AppDataSource.initialize().then(async () => {
  const repo = AppDataSource.getRepository(Appointment);
  const appts = await repo.find({ relations: ['patient', 'doctor'] });
  console.log("Total Appointments:", appts.length);
  appts.forEach(a => {
    console.log(`ID: ${a.id} | Patient: ${(a.patient as User)?.firstName} | Doctor: ${(a.doctor as User)?.firstName} | Org: ${(a as any).organizationId} | Status: ${a.status} | Start: ${a.startTime}`);
  });
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
