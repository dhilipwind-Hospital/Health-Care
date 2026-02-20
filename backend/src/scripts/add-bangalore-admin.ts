/**
 * Add Bangalore Admin Script
 * Creates a second admin for the Bangalore location
 */

import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Location } from '../models/Location';
import { UserRole } from '../types/roles';
import * as bcrypt from 'bcryptjs';

async function createBangaloreAdmin() {
    try {
        console.log('🚀 Creating Bangalore Admin...\n');

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const userRepo = AppDataSource.getRepository(User);
        const locRepo = AppDataSource.getRepository(Location);

        // Get the organization ID from existing admin
        const existingAdmin = await userRepo.findOne({ where: { email: 'admin@ayphen.com' } });
        if (!existingAdmin) {
            console.log('❌ Could not find existing admin to get org ID');
            process.exit(1);
        }

        const orgId = existingAdmin.organizationId;
        console.log('Organization ID:', orgId);

        // Get Bangalore location ID
        const blrLocation = await locRepo.findOne({ where: { organizationId: orgId, code: 'BLR-BRANCH' } });

        if (!blrLocation) {
            console.log('❌ Could not find Bangalore location');
            process.exit(1);
        }

        console.log('Bangalore Location ID:', blrLocation.id);

        // Check if admin already exists
        const existingBlrAdmin = await userRepo.findOne({
            where: { email: 'admin.bangalore@ayphen.com', organizationId: orgId }
        });

        if (existingBlrAdmin) {
            console.log('⏭️ Bangalore admin already exists, skipping creation');
            await AppDataSource.destroy();
            process.exit(0);
        }

        // Create Bangalore admin
        const hashedPassword = await bcrypt.hash('Admin@123', 10);
        const newAdmin = userRepo.create({
            email: 'admin.bangalore@ayphen.com',
            password: hashedPassword,
            firstName: 'Pradeep',
            lastName: 'Rao',
            phone: '+91 9876500002',
            role: UserRole.ADMIN,
            organizationId: orgId,
            locationId: blrLocation.id,
            isActive: true,
            dateOfBirth: new Date('1980-08-20'),
            gender: 'Male',
            address: '55 Koramangala, 5th Block',
            city: 'Bangalore',
            state: 'Karnataka',
            country: 'India',
            postalCode: '560095',
            emergencyContact: '+91 9876500102',
            joinDate: new Date('2022-01-15')
        } as any);

        await userRepo.save(newAdmin);

        console.log('\n✅ Successfully created Bangalore Admin!');
        console.log('───────────────────────────────────────');
        console.log('Name: Pradeep Rao');
        console.log('Email: admin.bangalore@ayphen.com');
        console.log('Password: Admin@123');
        console.log('Location: BLR-BRANCH (Bangalore)');
        console.log('───────────────────────────────────────\n');

        await AppDataSource.destroy();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        try { await AppDataSource.destroy(); } catch { }
        process.exit(1);
    }
}

createBangaloreAdmin();
