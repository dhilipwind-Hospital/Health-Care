
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Organization } from '../models/Organization';
import { UserRole } from '../types/roles';
import * as bcrypt from 'bcryptjs';

async function seed() {
    try {
        await AppDataSource.initialize();
        console.log('🚀 Seeding Separate Role Accounts...');

        const userRepo = AppDataSource.getRepository(User);
        const orgRepo = AppDataSource.getRepository(Organization);

        const password = await bcrypt.hash('Password@123', 10);

        // 1. Get the organizations
        const chennai = await orgRepo.findOne({ where: { address: 'Chennai' } });
        const delhi = await orgRepo.findOne({ where: { address: 'Delhi' } });

        if (!chennai || !delhi) {
            console.error('❌ Chennai or Delhi Organizations not found. Please run seed-multiloc-demo first.');
            process.exit(1);
        }

        // 2. Create Chennai Admin
        console.log('Creating Chennai Admin...');
        const chnAdmin = userRepo.create({
            firstName: 'Chennai',
            lastName: 'Admin',
            email: 'admin.chn@apollo.demo',
            password: password,
            role: UserRole.ADMIN,
            organizationId: chennai.id,
            isActive: true
        });
        await userRepo.save(chnAdmin);

        // 3. Create Delhi Admin
        console.log('Creating Delhi Admin...');
        const delAdmin = userRepo.create({
            firstName: 'Delhi',
            lastName: 'Admin',
            email: 'admin.del@apollo.demo',
            password: password,
            role: UserRole.ADMIN,
            organizationId: delhi.id,
            isActive: true
        });
        await userRepo.save(delAdmin);

        // 4. Create Super Admin in BOTH (to allow switching)
        console.log('Creating Super Admin accounts...');
        const superEmails = ['superadmin@ayphen.com'];
        for (const email of superEmails) {
            // Account for Chennai
            const saChn = userRepo.create({
                firstName: 'Global',
                lastName: 'SuperAdmin',
                email: email,
                password: password,
                role: UserRole.SUPER_ADMIN,
                organizationId: chennai.id,
                isActive: true
            });
            await userRepo.save(saChn);

            // Account for Delhi
            const saDel = userRepo.create({
                firstName: 'Global',
                lastName: 'SuperAdmin',
                email: email,
                password: password,
                role: UserRole.SUPER_ADMIN,
                organizationId: delhi.id,
                isActive: true
            });
            await userRepo.save(saDel);
        }

        console.log('✨ Seed Complete!');
        console.log('------------------------------------------------');
        console.log('🏥 CHENNAI ONLY ADMIN: admin.chn@apollo.demo');
        console.log('🏥 DELHI ONLY ADMIN:   admin.del@apollo.demo');
        console.log('🌍 GLOBAL SUPER ADMIN: superadmin@ayphen.com');
        console.log('🔑 Password (All):     Password@123');
        console.log('------------------------------------------------');

        process.exit(0);
    } catch (e) {
        console.error('❌ Seeding Failed', e);
        process.exit(1);
    }
}

seed();
