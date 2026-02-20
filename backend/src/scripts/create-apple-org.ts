
import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import { Location } from '../models/Location';
import { UserRole } from '../types/roles';
import * as bcrypt from 'bcryptjs';

async function createAppleOrg() {
    try {
        await AppDataSource.initialize();
        console.log('Database connected');

        const orgRepo = AppDataSource.getRepository(Organization);
        const userRepo = AppDataSource.getRepository(User);
        const locRepo = AppDataSource.getRepository(Location);

        // 1. Create Organization
        console.log('Creating Organization: Apple Health...');
        let org = await orgRepo.findOne({ where: { subdomain: 'apple' } });
        if (!org) {
            org = orgRepo.create({
                name: 'Apple Health',
                subdomain: 'apple',
                description: 'Technology-driven healthcare',
                isActive: true,
                settings: {
                    subscription: {
                        plan: 'enterprise',
                        status: 'active',
                        startDate: new Date(),
                        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                    },
                    features: {
                        pharmacy: true,
                        laboratory: true,
                        inpatient: true,
                        radiology: true
                    }
                }
            });
            await orgRepo.save(org);
            console.log('✅ Organization created');
        } else {
            console.log('ℹ️ Organization already exists');
        }

        // 2. Create Org Admin
        console.log('Creating Org Admin...');
        let admin = await userRepo.findOne({ where: { email: 'admin@apple.com' } });
        if (!admin) {
            admin = userRepo.create({
                firstName: 'Apple',
                lastName: 'Admin',
                email: 'admin@apple.com',
                phone: '1234567890',
                role: UserRole.ADMIN,
                organizationId: org.id,
                isActive: true,
                password: await bcrypt.hash('Admin@123', 10)
            });
            await userRepo.save(admin);
            console.log('✅ Org Admin created: admin@apple.com');
        } else {
            console.log('ℹ️ Org Admin already exists');
        }

        // 3. Create Locations
        console.log('Creating Locations...');

        // Location 1: Cupertino
        let loc1 = await locRepo.findOne({ where: { organizationId: org.id, code: 'CUP' } });
        if (!loc1) {
            loc1 = locRepo.create({
                name: 'Apple Cupertino',
                code: 'CUP',
                organizationId: org.id,
                isMainBranch: true,
                isActive: true,
                address: '1 Infinite Loop',
                city: 'Cupertino',
                state: 'CA',
                country: 'USA'
            });
            await locRepo.save(loc1);
            console.log('✅ Location 1 created: Cupertino');
        }

        // Location 2: Austin
        let loc2 = await locRepo.findOne({ where: { organizationId: org.id, code: 'AUS' } });
        if (!loc2) {
            loc2 = locRepo.create({
                name: 'Apple Austin',
                code: 'AUS',
                organizationId: org.id,
                isMainBranch: false,
                isActive: true,
                address: '123 Tech Blvd',
                city: 'Austin',
                state: 'TX',
                country: 'USA'
            });
            await locRepo.save(loc2);
            console.log('✅ Location 2 created: Austin');
        }

        // 4. Create Location Users
        console.log('Creating Location Managers...');

        // Manager Cupertino
        let mgr1 = await userRepo.findOne({ where: { email: 'manager.cupertino@apple.com' } });
        if (!mgr1) {
            mgr1 = userRepo.create({
                firstName: 'Cupertino',
                lastName: 'Manager',
                email: 'manager.cupertino@apple.com',
                phone: '1111111111',
                role: UserRole.ADMIN, // Location Admin
                organizationId: org.id,
                locationId: loc1!.id,
                isActive: true,
                password: await bcrypt.hash('Admin@123', 10)
            });
            await userRepo.save(mgr1);
            console.log('✅ Cupertino Manager created: manager.cupertino@apple.com');
        }

        // Manager Austin
        let mgr2 = await userRepo.findOne({ where: { email: 'manager.austin@apple.com' } });
        if (!mgr2) {
            mgr2 = userRepo.create({
                firstName: 'Austin',
                lastName: 'Manager',
                email: 'manager.austin@apple.com',
                phone: '2222222222',
                role: UserRole.ADMIN, // Location Admin
                organizationId: org.id,
                locationId: loc2!.id,
                isActive: true,
                password: await bcrypt.hash('Admin@123', 10)
            });
            await userRepo.save(mgr2);
            console.log('✅ Austin Manager created: manager.austin@apple.com');
        }

    } catch (error) {
        console.error('Error creating Apple org:', error);
    } finally {
        if (AppDataSource.isInitialized) await AppDataSource.destroy();
    }
}

createAppleOrg();
