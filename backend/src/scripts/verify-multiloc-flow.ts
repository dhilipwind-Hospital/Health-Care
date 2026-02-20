
import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import * as bcrypt from 'bcryptjs';

async function verifyMultiLocationFlow() {
    try {
        console.log('🔄 Initializing Database Connection...');
        await AppDataSource.initialize();
        console.log('✅ Database Connected.');

        const orgRepo = AppDataSource.getRepository(Organization);
        const userRepo = AppDataSource.getRepository(User);
        const testEmail = `admin.multi.${Date.now()}@test.com`;

        console.log(`\n🧪 TEST SCENARIO: Creating Multi-Location Access for: ${testEmail}`);

        // --- STEP 1: Create First Location ---
        console.log('\n📍 Step 1: Creating Location A (Chennai)...');
        const orgA = orgRepo.create({
            name: 'Apollo Integration Test',
            subdomain: `apollo-chn-${Date.now()}`,
            address: 'Chennai',
            isActive: true,
            settings: { subscription: { plan: 'basic' } as any }
        });
        await orgRepo.save(orgA);

        // Create Admin for A
        const userA = userRepo.create({
            email: testEmail,
            password: await bcrypt.hash('password123', 10),
            firstName: 'Dr. Arun',
            lastName: 'Chennai',
            organizationId: orgA.id,
            role: 'admin' as any // Casting to avoid complex enum imports in script
        });
        await userRepo.save(userA);
        console.log(`✅ User A created in Org A (ID: ${orgA.id})`);


        // --- STEP 2: Create Second Location (SAME EMAIL) ---
        console.log('\n📍 Step 2: Creating Location B (Delhi) with SAME EMAIL...');
        const orgB = orgRepo.create({
            name: 'Apollo Integration Test', // Same Name
            subdomain: `apollo-del-${Date.now()}`,
            address: 'Delhi',
            isActive: true,
            settings: { subscription: { plan: 'basic' } as any }
        });
        await orgRepo.save(orgB);

        // Create Admin for B (Try to save SAME Email)
        const userB = userRepo.create({
            email: testEmail, // SAME EMAIL
            password: await bcrypt.hash('password123', 10),
            firstName: 'Dr. Arun',
            lastName: 'Delhi',
            organizationId: orgB.id,
            role: 'admin' as any
        });

        try {
            await userRepo.save(userB);
            console.log(`✅ User B created in Org B (ID: ${orgB.id})`);
            console.log('🎉 SUCCESS: Database allowed same email in different organization!');
        } catch (e: any) {
            console.error('❌ FAILED: Database constraint blocked User B creation.');
            console.error(e.message);
            process.exit(1);
        }


        // --- STEP 3: Verify Login Retrieval ---
        console.log('\n🔍 Step 3: Verifying Login "Available Locations"...');
        const linkedAccounts = await userRepo.find({
            where: { email: testEmail },
            relations: ['organization']
        });

        console.log(`Found ${linkedAccounts.length} linked accounts for ${testEmail}:`);
        linkedAccounts.forEach(u => {
            console.log(` - [${u.organization?.subdomain}] ${u.organization?.name} (City: ${u.organization?.address})`);
        });

        if (linkedAccounts.length === 2) {
            console.log('✅ PASS: Retrieval logic found both locations.');
        } else {
            console.error('❌ FAIL: Expected 2 linked accounts.');
            process.exit(1);
        }

        process.exit(0);

    } catch (error) {
        console.error('Unexpected Error:', error);
        process.exit(1);
    }
}

verifyMultiLocationFlow();
