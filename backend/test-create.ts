import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();
import { AppDataSource } from './src/config/database';
import { Appointment } from './src/models/Appointment';
import { User } from './src/models/User';
import { Service } from './src/models/Service';

AppDataSource.initialize().then(async () => {
  const user = await AppDataSource.getRepository(User).findOne({ where: { role: 'patient' as any } });
  const doctor = await AppDataSource.getRepository(User).findOne({ where: { role: 'doctor' as any } });
  const service = await AppDataSource.getRepository(Service).findOne({});
  console.log("Found:", { user: user?.email, doctor: doctor?.email, service: service?.name });
  
  if (user && doctor && service) {
    const payload = {
      body: {
        serviceId: service.id,
        doctorId: doctor.id,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 30*60*1000).toISOString(),
        reason: 'Test from script',
        preferences: { urgency: 'routine' }
      },
      user: { id: user.id, organizationId: user.organizationId },
    };
    
    // simulate controller 
    const { AppointmentController } = require('./src/controllers/appointment.controller');
    const req = { body: payload.body, user: payload.user, tenant: { id: user.organizationId } };
    const res = {
      status: (code: number) => ({
        json: (data: any) => {
          console.log(`STATUS: ${code}`, data);
        }
      }),
      json: (data: any) => { console.log(`STATUS 200`, data); }
    };
    await AppointmentController.bookAppointment(req, res);
  }
  process.exit(0);
}).catch(console.error);

