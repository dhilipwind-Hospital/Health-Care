
import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import { Appointment } from '../models/Appointment';
import { Department } from '../models/Department';
import { Service } from '../models/Service';
import { UserRole } from '../types/roles';

// Helper to create random data
const randomPhone = () => `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`;

async function seedData() {
    try {
        if (!AppDataSource.isInitialized) await AppDataSource.initialize();
        console.log('Database connected');

        const orgRepo = AppDataSource.getRepository(Organization);

        // 1. Find Chennai Org
        const chennai = await orgRepo.createQueryBuilder('o').where('o.address = :city', { city: 'Chennai' }).getOne();
        // 2. Find Delhi Org
        const delhi = await orgRepo.createQueryBuilder('o').where('o.address = :city', { city: 'Delhi' }).getOne();

        if (!chennai || !delhi) {
            console.error('Organizations not found. Please run seed-multiloc-demo.ts first.');
            process.exit(1);
        }

        console.log(`seeding data for Chennai (${chennai.name})...`);
        // Seed Chennai: 8 Patients, 3 Appointments
        await seedLocation(chennai, 8, 3, 'CHN');

        console.log(`seeding data for Delhi (${delhi.name})...`);
        // Seed Delhi: 3 Patients, 8 Appointments
        await seedLocation(delhi, 3, 8, 'DEL');

        console.log('Seeding Complete! You should see different stats.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

async function seedLocation(org: Organization, patientCount: number, apptCount: number, suffix: string) {
    const userRepo = AppDataSource.getRepository(User);
    const apptRepo = AppDataSource.getRepository(Appointment);
    const deptRepo = AppDataSource.getRepository(Department);
    const serviceRepo = AppDataSource.getRepository(Service);

    // Ensure a department exists
    let dept = await deptRepo.findOne({ where: { organizationId: org.id } });
    if (!dept) {
        dept = deptRepo.create({
            name: 'General Medicine',
            description: 'General',
            organizationId: org.id
        });
        await deptRepo.save(dept);
    }

    // Ensure a Service exists
    let service = await serviceRepo.findOne({ where: { organizationId: org.id } });
    if (!service) {
        service = serviceRepo.create({
            name: 'General Consultation',
            description: 'Standard checkup',
            organizationId: org.id,
            departmentId: dept.id,
            averageDuration: 30
        });
        await serviceRepo.save(service);
    }

    // Ensure a doctor exists
    let doctor = await userRepo.findOne({ where: { organizationId: org.id, role: UserRole.DOCTOR } });
    if (!doctor) {
        doctor = userRepo.create({
            firstName: `Dr. ${suffix}`,
            lastName: 'Strange',
            email: `doctor.${suffix.toLowerCase()}@apollo.demo`,
            password: 'Password@123',
            role: UserRole.DOCTOR,
            organizationId: org.id,
            departmentId: dept.id,
            phone: randomPhone(),
            specialization: 'General'
        });
        await userRepo.save(doctor);
    }

    // Create Patients
    const patients: User[] = [];
    for (let i = 0; i < patientCount; i++) {
        const p = userRepo.create({
            firstName: `Patient ${suffix}${i}`,
            lastName: 'Demo',
            email: `p${i}.${suffix.toLowerCase()}@demo.com`,
            password: 'Password@123',
            role: UserRole.PATIENT,
            organizationId: org.id,
            phone: randomPhone(),
            gender: i % 2 === 0 ? 'male' : 'female',
            dateOfBirth: new Date('1990-01-01')
        });
        await userRepo.save(p);
        patients.push(p);
    }

    // Create Appointments (Today)
    for (let i = 0; i < apptCount; i++) {
        const p = patients[i % patients.length];
        const status = i % 2 === 0 ? 'confirmed' : 'completed';
        const start = new Date();
        start.setHours(9 + i, 0, 0); // 9am, 10am...
        const end = new Date(start);
        end.setMinutes(30);

        const appt = apptRepo.create({
            patient: p,
            doctor: doctor,
            organizationId: org.id,
            service: service,
            startTime: start,
            endTime: end,
            status: status as any,
            mode: 'in-person' as any,
            appointmentType: 'standard' as any
        } as any); // Cast to any to avoid partial strictness issues if any
        await apptRepo.save(appt);
    }
}

seedData();
