import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { UserRole } from '../types/roles';

(async () => {
    try {
        console.log('Initializing database connection...');
        const ds = await AppDataSource.initialize();
        console.log('Database connection established.');

        const userRepo = ds.getRepository(User);
        const orgRepo = ds.getRepository('Organization');

        // Resolve organization
        let org = await orgRepo.findOne({ where: { subdomain: 'default' } });
        if (!org) {
            const orgs = await orgRepo.find({ take: 1 });
            org = orgs[0];
        }

        if (!org) {
            console.error('No organization found. Cannot seed lab tech.');
            process.exit(1);
        }
        const orgId = org.id;

        const email = 'labtech@hospital.com';
        const password = 'LabTech@2025';

        let user = await userRepo.findOne({ where: { email } });
        if (!user) {
            console.log('Creating lab technician user...');
            user = userRepo.create({
                firstName: 'Lab',
                lastName: 'Technician',
                email,
                phone: '9999999996',
                password,
                role: UserRole.LAB_TECHNICIAN,
                isActive: true,
                organizationId: orgId
            });
            await user.hashPassword();
            await userRepo.save(user);
            console.log(`Created lab technician: ${email} in org: ${(org as any).name}`);
        } else {
            console.log('Updating existing lab technician...');
            user.role = UserRole.LAB_TECHNICIAN;
            user.password = password;
            user.isActive = true;
            user.organizationId = orgId;
            await user.hashPassword();
            await userRepo.save(user);
            console.log(`Updated lab technician: ${email}`);
        }

        console.log('');
        console.log('✅ Lab Technician credentials:');
        console.log(`   Email:    ${email}`);
        console.log(`   Password: ${password}`);

        await ds.destroy();
        console.log('Database connection closed.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding lab technician:', error);
        try { await AppDataSource.destroy(); } catch { }
        process.exit(1);
    }
})();
