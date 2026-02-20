import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { UserRole } from '../types/roles';

(async () => {
    try {
        console.log('Initializing...');
        const ds = await AppDataSource.initialize();
        const userRepo = ds.getRepository(User);
        const orgId = '00000000-0000-0000-0000-000000000001';

        // Create Admin
        let admin = await userRepo.findOne({ where: { email: 'admin@hospital.com' } });
        if (!admin) {
            admin = userRepo.create({
                firstName: 'Hospital', lastName: 'Admin',
                email: 'admin@hospital.com', phone: '9999999990',
                password: 'Admin@2025', role: UserRole.ADMIN,
                isActive: true, organizationId: orgId
            });
            await admin.hashPassword();
            await userRepo.save(admin);
            console.log('✅ Created admin@hospital.com');
        } else {
            admin.organizationId = orgId;
            admin.password = 'Admin@2025';
            admin.role = UserRole.ADMIN;
            await admin.hashPassword();
            await userRepo.save(admin);
            console.log('✅ Updated admin@hospital.com');
        }

        // Create Patient
        let patient = await userRepo.findOne({ where: { email: 'raja.patient@example.com' } });
        if (!patient) {
            patient = userRepo.create({
                firstName: 'Raja', lastName: 'Patient',
                email: 'raja.patient@example.com', phone: '9876543001',
                password: 'Patient@123', role: UserRole.PATIENT,
                isActive: true, organizationId: orgId, gender: 'Male'
            });
            await patient.hashPassword();
            await userRepo.save(patient);
            console.log('✅ Created raja.patient@example.com');
        } else {
            patient.organizationId = orgId;
            patient.password = 'Patient@123';
            await patient.hashPassword();
            await userRepo.save(patient);
            console.log('✅ Updated raja.patient@example.com');
        }

        await ds.destroy();
        console.log('Done!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
})();
