import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();
import { AppDataSource } from './config/database';
import { Appointment } from './models/Appointment';
import { User } from './models/User';
import { Service } from './models/Service';
import { AppointmentController } from './controllers/appointment.controller';

AppDataSource.initialize().then(async () => {
  const patient = await AppDataSource.getRepository(User).findOne({ where: { role: 'patient' as any } });
  const doctor = await AppDataSource.getRepository(User).findOne({ where: { role: 'doctor' as any } });
  const service = await AppDataSource.getRepository(Service).findOne({});
  console.log("Found:", { patient: patient?.email, doctor: doctor?.email, service: service?.name });
  
  if (patient && doctor && service) {
    const payload = {
      body: {
        serviceId: service.id,
        doctorId: doctor.id,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 30*60*1000).toISOString(),
        reason: 'Test from script',
        preferences: { urgency: 'routine' }
      },
      user: { id: patient.id, organizationId: patient.organizationId },
      tenant: { id: patient.organizationId }
    };
    
    const req = { body: payload.body, user: payload.user, tenant: payload.tenant } as any;
    const res = {
      status: (code: number) => ({
        json: (data: any) => {
          console.log(`STATUS: ${code}`, JSON.stringify(data, null, 2));
          process.exit(0);
        }
      }),
      json: (data: any) => { 
        console.log(`STATUS 200`, JSON.stringify(data, null, 2)); 
        process.exit(0);
      }
    } as any;

    try {
      await AppointmentController.bookAppointment(req, res);
    } catch(e) {
      console.log("CAUGHT", e);
    }
  } else {
    process.exit(0);
  }
}).catch(console.error);

