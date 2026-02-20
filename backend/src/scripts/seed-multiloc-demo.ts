
import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import * as bcrypt from 'bcryptjs';

async function seedMultiLocationDemo() {
    try {
        console.log('🌱 Initializing Seeder...');
        await AppDataSource.initialize();

        const orgRepo = AppDataSource.getRepository(Organization);
        const userRepo = AppDataSource.getRepository(User);

        const email = 'admin@apollo.demo';
        const password = 'Password@123';
        const hashedPassword = await bcrypt.hash(password, 10);
        const timestamp = Date.now();

        console.log(`\n🏥 Creating "Apollo Hospital" in Chennai...`);
        const orgChennai = orgRepo.create({
            name: 'Apollo Hospital',
            subdomain: `apollo-chn-${timestamp}`,
            address: 'Chennai',
            isActive: true, // IMPORTANT
            settings: { subscription: { plan: 'professional' } as any }
        });
        await orgRepo.save(orgChennai);

        const userChennai = userRepo.create({
            email: email,
            password: hashedPassword,
            firstName: 'Apollo',
            lastName: 'Admin',
            organizationId: orgChennai.id,
            role: 'admin' as any,
            isActive: true
        });
        await userRepo.save(userChennai);
        console.log(`✅ Created Admin for Chennai.`);

        console.log(`\n🏥 Creating "Apollo Hospital" in Delhi...`);
        const orgDelhi = orgRepo.create({
            name: 'Apollo Hospital',
            subdomain: `apollo-del-${timestamp}`,
            address: 'Delhi',
            isActive: true,
            settings: { subscription: { plan: 'professional' } as any }
        });
        await orgRepo.save(orgDelhi);

        const userDelhi = userRepo.create({
            email: email, // SAME EMAIL
            password: hashedPassword,
            firstName: 'Apollo',
            lastName: 'Admin',
            organizationId: orgDelhi.id,
            role: 'admin' as any,
            isActive: true
        });
        await userRepo.save(userDelhi);
        console.log(`✅ Created Admin for Delhi.`);

        console.log('\n✨ SEED COMPLETE ✨');
        console.log('------------------------------------------------');
        console.log(`📧 Email:    ${email}`);
        console.log(`🔑 Password: ${password}`);
        console.log('------------------------------------------------');
        console.log('Please login with these credentials to test the Location Switcher.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error Seeding:', error);
        process.exit(1);
    }
}

seedMultiLocationDemo();
