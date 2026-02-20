import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';

async function createOrg() {
    try {
        await AppDataSource.initialize();
        const repo = AppDataSource.getRepository(Organization);

        // Check if exists
        const existing = await repo.findOne({ where: { subdomain: 'dhilip' } });
        if (existing) {
            console.log("Organization 'Dhilip One' (dhilip) already exists.");
            return;
        }

        const org = repo.create({
            name: "Dhilip One",
            subdomain: "dhilip",
            description: "Primary Hospital Organization created by User Request",
            isActive: true,
            settings: {
                branding: {
                    primaryColor: '#e91e63'
                },
                subscription: {
                    plan: 'enterprise',
                    status: 'active',
                    startDate: new Date()
                },
                features: {
                    pharmacy: true,
                    laboratory: true,
                    inpatient: true,
                    radiology: true
                }
            } as any
        });

        await repo.save(org);
        console.log("✅ Created Organization: Dhilip One (Subdomain: dhilip)");

    } catch (error) {
        console.error("Error creating org:", error);
    } finally {
        if (AppDataSource.isInitialized) await AppDataSource.destroy();
    }
}

createOrg();
