
import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import { UserRole } from '../types/roles'; // Ensure this path is correct or import from where UserRole is defined
import * as bcrypt from 'bcryptjs';

async function seedMultiLocationOrgs() {
    try {
        console.log('Initializing database connection...');
        await AppDataSource.initialize();
        console.log('Database connected.');

        const orgRepo = AppDataSource.getRepository(Organization);

        console.log('Creating Organization 1: Apollo Hospital (Chennai)...');

        // Org 1
        const org1 = new Organization();
        org1.name = "Apollo Hospital"; // Shared Name
        org1.subdomain = "apollo-chennai"; // Unique Subdomain
        org1.address = "Greams Road, Chennai, India";
        org1.isActive = true;
        org1.settings = {
            branding: { primaryColor: '#e91e63' },
            features: { inpatient: true, laboratory: true, pharmacy: true }
        };

        // Save Org 1
        try {
            await orgRepo.save(org1);
            console.log('✅ Created Org 1: Apollo Hospital (apollo-chennai)');
        } catch (e: any) {
            console.log('Error creating Org 1 (might already exist):', e.message);
        }

        // Org 2
        console.log('Creating Organization 2: Apollo Hospital (Delhi)...');
        const org2 = new Organization();
        org2.name = "Apollo Hospital"; // EXACT SAME NAME
        org2.subdomain = "apollo-delhi"; // Unique Subdomain
        org2.address = "Mathura Road, Delhi, India";
        org2.isActive = true;
        org2.settings = {
            branding: { primaryColor: '#1976d2' }, // Different branding potentially
            features: { inpatient: true, laboratory: true, pharmacy: true }
        };

        // Save Org 2
        try {
            await orgRepo.save(org2);
            console.log('✅ Created Org 2: Apollo Hospital (apollo-delhi)');
            console.log('🎉 SUCCESS: Multiple organizations with the same name "Apollo Hospital" coexist!');
        } catch (error: any) {
            console.error('❌ FAILED to create Org 2. Constraint might still be active.');
            console.error('Error:', error.message);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error during seeding:', error);
        process.exit(1);
    }
}

seedMultiLocationOrgs();
