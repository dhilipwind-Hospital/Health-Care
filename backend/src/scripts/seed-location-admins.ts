
import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Organization } from '../models/Organization';
import { Location } from '../models/Location';
import { UserRole } from '../types/roles';

async function setupLocationAdmins() {
    try {
        await AppDataSource.initialize();
        console.log('Database connected.');

        const orgRepo = AppDataSource.getRepository(Organization);
        const locRepo = AppDataSource.getRepository(Location);
        const userRepo = AppDataSource.getRepository(User);

        const org = await orgRepo.findOne({ where: { subdomain: 'ayphen' } });
        if (!org) {
            console.error('Organization "ayphen" not found!');
            await AppDataSource.destroy();
            return;
        }

        const chennaiLoc = await locRepo.findOne({ where: { code: 'CHN-MAIN', organizationId: org.id } });
        const bangaloreLoc = await locRepo.findOne({ where: { code: 'BLR-BRANCH', organizationId: org.id } });

        if (!chennaiLoc || !bangaloreLoc) {
            console.error('Locations not found!');
            await AppDataSource.destroy();
            return;
        }

        // 1. Chennai Admin
        const chennaiAdminEmail = 'admin.chennai@ayphen.com';
        const existingChennai = await userRepo.findOne({ where: { email: chennaiAdminEmail } });

        if (!existingChennai) {
            const chennaiAdmin = userRepo.create({
                firstName: 'Chennai',
                lastName: 'Manager',
                email: chennaiAdminEmail,
                password: 'Admin@123',
                role: UserRole.ADMIN,
                organizationId: org.id,
                locationId: chennaiLoc.id,
                phone: '9876500091',
                isActive: true
            } as any);
            await (chennaiAdmin as any).hashPassword();
            await userRepo.save(chennaiAdmin);
            console.log(`✅ Created Chennai Admin: ${chennaiAdminEmail}`);
        } else {
            console.log(`ℹ️ Chennai Admin already exists: ${chennaiAdminEmail}`);
        }

        // 2. Bangalore Admin
        const bangaloreAdminEmail = 'admin.bangalore@ayphen.com';
        const existingBangalore = await userRepo.findOne({ where: { email: bangaloreAdminEmail } });

        if (!existingBangalore) {
            const bangaloreAdmin = userRepo.create({
                firstName: 'Bangalore',
                lastName: 'Manager',
                email: bangaloreAdminEmail,
                password: 'Admin@123',
                role: UserRole.ADMIN,
                organizationId: org.id,
                locationId: bangaloreLoc.id,
                phone: '9876500092',
                isActive: true
            } as any);
            await (bangaloreAdmin as any).hashPassword();
            await userRepo.save(bangaloreAdmin);
            console.log(`✅ Created Bangalore Admin: ${bangaloreAdminEmail}`);
        } else {
            console.log(`ℹ️ Bangalore Admin already exists: ${bangaloreAdminEmail}`);
        }

        await AppDataSource.destroy();
        console.log('✨ Location Admin seeding completed.');
    } catch (error) {
        console.error('❌ Error setting up location admins:', error);
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    }
}

setupLocationAdmins();
