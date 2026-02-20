/**
 * Seed Script: Sample Locations for an Organization
 * 
 * This script creates sample locations for testing the Location Management feature.
 * 
 * Usage:
 *   npx ts-node src/scripts/seed-locations.ts
 */

import { AppDataSource } from '../config/database';
import { Location } from '../models/Location';
import { Organization } from '../models/Organization';

async function seedLocations() {
    try {
        console.log('🚀 Starting Location Seed...\n');

        // Initialize database
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const orgRepo = AppDataSource.getRepository(Organization);
        const locationRepo = AppDataSource.getRepository(Location);

        // Find the first active organization (or default)
        let organization = await orgRepo.findOne({
            where: { isActive: true },
            order: { createdAt: 'ASC' }
        });

        if (!organization) {
            console.log('❌ No organization found. Please create an organization first.');
            process.exit(1);
        }

        console.log(`📍 Using Organization: ${organization.name} (${organization.id})\n`);

        // Sample locations to create
        const sampleLocations = [
            {
                name: 'Chennai Main Hospital',
                code: 'CHN',
                address: '123 Anna Salai, T. Nagar',
                city: 'Chennai',
                state: 'Tamil Nadu',
                country: 'India',
                phone: '+91 44 2834 5678',
                email: 'chennai@hospital.com',
                isMainBranch: true,
                settings: {
                    capacity: { beds: 200, opds: 50, emergencyBeds: 20 },
                    features: { hasPharmacy: true, hasLaboratory: true, hasEmergency: true, hasRadiology: true }
                }
            },
            {
                name: 'Delhi Branch',
                code: 'DEL',
                address: '45 Connaught Place',
                city: 'New Delhi',
                state: 'Delhi',
                country: 'India',
                phone: '+91 11 2345 6789',
                email: 'delhi@hospital.com',
                isMainBranch: false,
                settings: {
                    capacity: { beds: 150, opds: 40, emergencyBeds: 15 },
                    features: { hasPharmacy: true, hasLaboratory: true, hasEmergency: true, hasRadiology: false }
                }
            },
            {
                name: 'Bangalore Clinic',
                code: 'BLR',
                address: '78 MG Road, Koramangala',
                city: 'Bangalore',
                state: 'Karnataka',
                country: 'India',
                phone: '+91 80 4567 8901',
                email: 'bangalore@hospital.com',
                isMainBranch: false,
                settings: {
                    capacity: { beds: 100, opds: 30, emergencyBeds: 10 },
                    features: { hasPharmacy: true, hasLaboratory: true, hasEmergency: false, hasRadiology: false }
                }
            },
            {
                name: 'Mumbai Center',
                code: 'MUM',
                address: '101 Marine Drive, Churchgate',
                city: 'Mumbai',
                state: 'Maharashtra',
                country: 'India',
                phone: '+91 22 6789 0123',
                email: 'mumbai@hospital.com',
                isMainBranch: false,
                settings: {
                    capacity: { beds: 180, opds: 45, emergencyBeds: 18 },
                    features: { hasPharmacy: true, hasLaboratory: true, hasEmergency: true, hasRadiology: true }
                }
            },
            {
                name: 'Hyderabad Hub',
                code: 'HYD',
                address: '55 Banjara Hills',
                city: 'Hyderabad',
                state: 'Telangana',
                country: 'India',
                phone: '+91 40 8901 2345',
                email: 'hyderabad@hospital.com',
                isMainBranch: false,
                settings: {
                    capacity: { beds: 120, opds: 35, emergencyBeds: 12 },
                    features: { hasPharmacy: true, hasLaboratory: true, hasEmergency: true, hasRadiology: false }
                }
            }
        ];

        console.log('Creating locations...\n');

        for (const locData of sampleLocations) {
            // Check if location already exists
            const existing = await locationRepo.findOne({
                where: { organizationId: organization.id, code: locData.code }
            });

            if (existing) {
                console.log(`  ⏭️  Location "${locData.name}" (${locData.code}) already exists - skipping`);
                continue;
            }

            const location = locationRepo.create({
                organizationId: organization.id,
                name: locData.name,
                code: locData.code,
                address: locData.address,
                city: locData.city,
                state: locData.state,
                country: locData.country,
                phone: locData.phone,
                email: locData.email,
                isMainBranch: locData.isMainBranch,
                isActive: true,
                settings: locData.settings
            });

            await locationRepo.save(location);
            console.log(`  ✅ Created: ${locData.name} (${locData.code}) - ${locData.city}`);
        }

        // Summary
        const totalLocations = await locationRepo.count({ where: { organizationId: organization.id } });
        console.log('\n========================================');
        console.log('📊 SEED COMPLETE');
        console.log('========================================');
        console.log(`Organization: ${organization.name}`);
        console.log(`Total Locations: ${totalLocations}`);
        console.log('\n🔑 To view locations, login as admin and go to:');
        console.log('   Administration → Locations');
        console.log('\n========================================\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
}

seedLocations();
