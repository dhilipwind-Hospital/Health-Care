import { AppDataSource } from '../config/database';
import { LabOrder } from '../models/LabOrder';
import { LabOrderItem } from '../models/LabOrderItem';
import { LabTest } from '../models/LabTest';
import { Organization } from '../models/Organization';

const SEED_ORG_DOMAIN = 'general-hospital';

async function seedLabOrderItems() {
    try {
        console.log('🌱 Seeding Lab Order Items...');
        if (!AppDataSource.isInitialized) {
            await AppDataSource.setOptions({ synchronize: false });
            await AppDataSource.initialize();
        }

        const org = await AppDataSource.getRepository(Organization).findOne({ where: { subdomain: SEED_ORG_DOMAIN } });
        if (!org) {
            console.error('❌ Organization not found');
            process.exit(1);
        }

        // Check if LabTest exists, if not create sample ones
        const testRepo = AppDataSource.getRepository(LabTest);
        let labTests = await testRepo.find({ where: { organization: { id: org.id } } });

        if (labTests.length === 0) {
            console.log('Creating sample lab tests...');
            const testData = [
                { name: 'Complete Blood Count (CBC)', code: 'CBC-001', category: 'hematology', cost: 250, turnaroundTimeMinutes: 1440 },
                { name: 'Blood Glucose Fasting', code: 'BGF-001', category: 'biochemistry', cost: 150, turnaroundTimeMinutes: 720 },
                { name: 'Liver Function Test', code: 'LFT-001', category: 'biochemistry', cost: 500, turnaroundTimeMinutes: 1440 },
            ];

            for (const td of testData) {
                const test = testRepo.create({
                    name: td.name,
                    code: td.code,
                    category: td.category as any,
                    cost: td.cost,
                    turnaroundTimeMinutes: td.turnaroundTimeMinutes,
                    description: `Standard ${td.name} test`,
                    organization: org,
                    organizationId: org.id,
                    isActive: true
                });
                await testRepo.save(test);
            }
            labTests = await testRepo.find({ where: { organization: { id: org.id } } });
            console.log(`   Created ${labTests.length} lab tests`);
        }

        // Get existing lab orders
        const labOrders = await AppDataSource.getRepository(LabOrder).find({
            where: { organization: { id: org.id } },
            relations: ['items']
        });

        console.log(`Found ${labOrders.length} Lab Orders`);

        const itemRepo = AppDataSource.getRepository(LabOrderItem);

        for (let i = 0; i < labOrders.length; i++) {
            const order = labOrders[i];
            if (order.items && order.items.length > 0) {
                console.log(`   Order ${order.orderNumber} already has ${order.items.length} items, skipping`);
                continue;
            }

            // Assign different test to each order
            const testIndex = i % labTests.length;
            const selectedTest = labTests[testIndex];

            const item = itemRepo.create({
                labOrder: order,
                labOrderId: order.id,
                labTest: selectedTest,
                labTestId: selectedTest.id,
                status: 'completed',
                organization: org,
                organizationId: org.id
            });

            await itemRepo.save(item);
            console.log(`   ✅ Added "${selectedTest.name}" to order ${order.orderNumber}`);
        }

        console.log('🎉 Lab Order Items Seed Complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
}

seedLabOrderItems();
