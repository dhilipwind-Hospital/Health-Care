import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import { Location } from '../models/Location';
import { Department } from '../models/Department';
import { Appointment } from '../models/Appointment';
import { Service } from '../models/Service';
import { LabOrder } from '../models/LabOrder';
import { UserRole } from '../types/roles';
import * as bcrypt from 'bcryptjs';

async function seedAppleFullData() {
    try {
        if (!AppDataSource.isInitialized) await AppDataSource.initialize();
        console.log('Database connected');

        const orgRepo = AppDataSource.getRepository(Organization);
        const userRepo = AppDataSource.getRepository(User);
        const locRepo = AppDataSource.getRepository(Location);
        const apptRepo = AppDataSource.getRepository(Appointment);
        const serviceRepo = AppDataSource.getRepository(Service);
        const labRepo = AppDataSource.getRepository(LabOrder);

        const org = await orgRepo.findOne({ where: { subdomain: 'apple' } });
        if (!org) throw new Error('Apple organization not found');

        const cupertino = await locRepo.findOne({ where: { code: 'CUP', organizationId: org.id } });
        const austin = await locRepo.findOne({ where: { code: 'AUS', organizationId: org.id } });
        if (!cupertino || !austin) throw new Error('Locations not found');

        console.log('📍 Seeding data for:', cupertino.name, austin.name);

        const patientPassword = await bcrypt.hash('Patient@123', 10);

        const deptRepo = AppDataSource.getRepository(Department);
        const generalDept = await deptRepo.findOne({ where: { name: 'General Medicine - Cupertino', organizationId: org.id } });
        // If not found, try finding any department
        const anyDept = generalDept || await deptRepo.findOne({ where: { organizationId: org.id } });

        let checkupService = await serviceRepo.findOne({ where: { name: 'General Checkup', organizationId: org.id } });

        if (!checkupService && anyDept) {
            const newService = serviceRepo.create({
                name: 'General Checkup',
                description: 'Routine health checkup',
                price: 150,
                duration: 30,
                isActive: true,
                organizationId: org.id,
                departmentId: anyDept.id
            } as any) as unknown as Service;
            checkupService = await serviceRepo.save(newService);
        }

        // Helper to get or create patient
        const getOrCreatePatient = async (firstName: string, lastName: string, loc: any) => {
            const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
            let p = await userRepo.findOne({ where: { email } });
            if (!p) {
                p = userRepo.create({
                    firstName, lastName,
                    email,
                    phone: `555${Math.floor(Math.random() * 10000000)}`,
                    role: UserRole.PATIENT,
                    organizationId: org.id,
                    locationId: loc.id,
                    isActive: true,
                    password: patientPassword,
                    gender: Math.random() > 0.5 ? 'Male' : 'Female',
                    dateOfBirth: new Date('1980-01-01')
                });
                await userRepo.save(p);
            }
            return p;
        };

        const today = new Date();

        // --- SEED CUPERTINO DATA ---
        // Patients
        const cupPatients = [
            await getOrCreatePatient('Steve', 'Jobs', cupertino),
            await getOrCreatePatient('Tim', 'Cook', cupertino),
            await getOrCreatePatient('Jony', 'Ive', cupertino),
            await getOrCreatePatient('Lisa', 'Brennan', cupertino),
            await getOrCreatePatient('Woz', 'Steve', cupertino)
        ];

        // Doctors
        const drSmith = await userRepo.findOne({ where: { email: 'dr.smith@apple.com' } });

        // Appointments (Today)
        // Clear existing appointments to fix bad data
        await apptRepo.delete({ organizationId: org.id });

        // Appointments (Today)
        if (drSmith && checkupService) {
            await apptRepo.save(apptRepo.create({
                patient: cupPatients[0],
                doctor: drSmith,
                service: checkupService,
                startTime: new Date(today.setHours(9, 0, 0, 0)),
                endTime: new Date(today.setHours(9, 30, 0, 0)),
                status: 'confirmed',
                appointmentType: 'standard',
                mode: 'in-person',
                notes: 'Regular heart checkup',
                organizationId: org.id
            } as any) as unknown as Appointment);

            await apptRepo.save(apptRepo.create({
                patient: cupPatients[1],
                doctor: drSmith,
                service: checkupService,
                startTime: new Date(today.setHours(10, 0, 0, 0)),
                endTime: new Date(today.setHours(10, 30, 0, 0)),
                status: 'completed',
                appointmentType: 'standard',
                mode: 'in-person',
                organizationId: org.id
            } as any) as unknown as Appointment);
        }

        // Lab Orders
        // Generate random order number
        const orderNum = `LAB-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;

        await labRepo.save(labRepo.create({
            patient: cupPatients[0],
            doctor: drSmith,
            status: 'ordered',
            orderDate: new Date(),
            orderNumber: orderNum,
            organizationId: org.id,
            isUrgent: false
        } as any) as unknown as LabOrder);

        // --- SEED AUSTIN DATA ---
        const ausPatients = [
            await getOrCreatePatient('Elon', 'Musk', austin),
            await getOrCreatePatient('Joe', 'Rogan', austin),
            await getOrCreatePatient('Matthew', 'McConaughey', austin),
            await getOrCreatePatient('Sandra', 'Bullock', austin)
        ];

        const drWilliams = await userRepo.findOne({ where: { email: 'dr.williams@apple.com' } });

        // Appointments
        if (drWilliams && checkupService) {
            await apptRepo.save(apptRepo.create({
                patient: ausPatients[0],
                doctor: drWilliams,
                service: checkupService,
                startTime: new Date(today.setHours(11, 0, 0, 0)),
                endTime: new Date(today.setHours(11, 30, 0, 0)),
                status: 'confirmed',
                appointmentType: 'standard',
                mode: 'in-person',
                organizationId: org.id
            } as any) as unknown as Appointment);
        }

        console.log('✅ Full data seeded successfully!');

    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        if (AppDataSource.isInitialized) await AppDataSource.destroy();
    }
}

seedAppleFullData();
