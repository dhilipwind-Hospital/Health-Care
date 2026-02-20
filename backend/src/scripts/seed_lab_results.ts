import { AppDataSource } from '../config/database';
import { LabOrderItem } from '../models/LabOrderItem';
import { LabResult } from '../models/LabResult';
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import { UserRole } from '../types/roles';

const SEED_ORG_DOMAIN = 'general-hospital';

async function seedLabResults() {
    try {
        console.log('🌱 Seeding Lab Results...');
        if (!AppDataSource.isInitialized) {
            await AppDataSource.setOptions({ synchronize: false });
            await AppDataSource.initialize();
        }

        const org = await AppDataSource.getRepository(Organization).findOne({ where: { subdomain: SEED_ORG_DOMAIN } });
        if (!org) {
            console.error('❌ Organization not found');
            process.exit(1);
        }

        // Get a lab tech/doctor to be the performer
        const performer = await AppDataSource.getRepository(User).findOne({
            where: { organizationId: org.id, role: UserRole.DOCTOR }
        });
        if (!performer) {
            console.error('❌ No doctor found to assign as performer');
            process.exit(1);
        }

        // Get lab order items without results
        const itemRepo = AppDataSource.getRepository(LabOrderItem);
        const resultRepo = AppDataSource.getRepository(LabResult);

        const items = await itemRepo.find({
            where: { organizationId: org.id },
            relations: ['labTest', 'result']
        });

        console.log(`Found ${items.length} Lab Order Items`);

        // Sample result data based on test type
        const sampleResults: Record<string, { value: string; units: string; referenceRange: string; flag: string; interpretation: string }> = {
            'Complete Blood Count (CBC)': {
                value: '12.8',
                units: 'g/dL',
                referenceRange: '12.0-16.0 g/dL',
                flag: 'normal',
                interpretation: 'Hemoglobin within normal limits'
            },
            'Blood Glucose Fasting': {
                value: '105',
                units: 'mg/dL',
                referenceRange: '70-100 mg/dL',
                flag: 'abnormal',
                interpretation: 'Slightly elevated fasting glucose. Consider lifestyle modifications.'
            },
            'Liver Function Test': {
                value: '45',
                units: 'U/L',
                referenceRange: '7-56 U/L',
                flag: 'normal',
                interpretation: 'ALT/SGPT within normal range. Liver function is adequate.'
            }
        };

        for (const item of items) {
            if (item.result) {
                console.log(`   Item ${item.id} already has result, skipping`);
                continue;
            }

            // Find matching sample result based on test name
            const testName = item.labTest?.name || '';
            let resultData = sampleResults[testName];

            // Default result if no match
            if (!resultData) {
                resultData = {
                    value: (Math.random() * 100).toFixed(1),
                    units: 'units',
                    referenceRange: '0-100 units',
                    flag: 'normal',
                    interpretation: 'Result within expected range'
                };
            }

            // Create lab result
            const result = resultRepo.create({
                resultValue: resultData.value,
                units: resultData.units,
                referenceRange: resultData.referenceRange,
                flag: resultData.flag as any,
                interpretation: resultData.interpretation,
                resultTime: new Date(),
                performedBy: performer,
                performedById: performer.id,
                isVerified: true,
                verifiedBy: performer,
                verifiedById: performer.id,
                verificationTime: new Date(),
                organization: org,
                organizationId: org.id,
                comments: `Automated test result for ${testName}`
            });

            const savedResult = await resultRepo.save(result);

            // Link result to item
            item.result = savedResult;
            item.resultId = savedResult.id;
            item.status = 'completed';
            await itemRepo.save(item);

            console.log(`   ✅ Created result for "${testName}": ${resultData.value} ${resultData.units} [${resultData.flag}]`);
        }

        console.log('🎉 Lab Results Seed Complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
}

seedLabResults();
