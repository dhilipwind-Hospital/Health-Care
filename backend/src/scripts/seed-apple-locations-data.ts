import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import { Location } from '../models/Location';
import { Department } from '../models/Department';
import { UserRole } from '../types/roles';
import * as bcrypt from 'bcryptjs';

async function seedAppleLocationsData() {
    try {
        await AppDataSource.initialize();
        console.log('Database connected');

        const orgRepo = AppDataSource.getRepository(Organization);
        const userRepo = AppDataSource.getRepository(User);
        const locRepo = AppDataSource.getRepository(Location);
        const deptRepo = AppDataSource.getRepository(Department);

        // Find Apple org
        const org = await orgRepo.findOne({ where: { subdomain: 'apple' } });
        if (!org) {
            console.error('❌ Apple organization not found. Run create-apple-org.ts first.');
            return;
        }

        // Find locations
        const cupertino = await locRepo.findOne({ where: { organizationId: org.id, code: 'CUP' } });
        const austin = await locRepo.findOne({ where: { organizationId: org.id, code: 'AUS' } });

        if (!cupertino || !austin) {
            console.error('❌ Locations not found. Run create-apple-org.ts first.');
            return;
        }

        console.log('Found locations:', cupertino.name, austin.name);

        // Create Departments for each location
        const departments = [
            { name: 'Cardiology', description: 'Heart and cardiovascular care' },
            { name: 'Orthopedics', description: 'Bone and joint care' },
            { name: 'General Medicine', description: 'Primary healthcare' }
        ];

        for (const deptData of departments) {
            // Cupertino Department
            let deptCup = await deptRepo.findOne({
                where: { name: `${deptData.name} - Cupertino`, organizationId: org.id }
            });
            if (!deptCup) {
                const newDept = new Department() as any;
                newDept.name = `${deptData.name} - Cupertino`;
                newDept.description = `${deptData.description} at Cupertino`;
                newDept.organizationId = org.id;
                newDept.status = 'active';
                deptCup = await deptRepo.save(newDept);
                console.log(`✅ Created: ${(deptCup as any).name}`);
            }

            // Austin Department
            let deptAus = await deptRepo.findOne({
                where: { name: `${deptData.name} - Austin`, organizationId: org.id }
            });
            if (!deptAus) {
                const newDept = new Department() as any;
                newDept.name = `${deptData.name} - Austin`;
                newDept.description = `${deptData.description} at Austin`;
                newDept.organizationId = org.id;
                newDept.status = 'active';
                deptAus = await deptRepo.save(newDept);
                console.log(`✅ Created: ${(deptAus as any).name}`);
            }
        }

        // Create Doctors for each location
        const hashedPassword = await bcrypt.hash('Doctor@123', 10);

        // Cupertino Doctors
        const cupertinoDocDept = await deptRepo.findOne({
            where: { name: 'Cardiology - Cupertino', organizationId: org.id }
        });

        let drSmith = await userRepo.findOne({ where: { email: 'dr.smith@apple.com' } });
        if (!drSmith) {
            drSmith = userRepo.create({
                firstName: 'John',
                lastName: 'Smith',
                email: 'dr.smith@apple.com',
                phone: '4085551001',
                role: UserRole.DOCTOR,
                organizationId: org.id,
                locationId: cupertino.id,
                departmentId: cupertinoDocDept?.id,
                specialization: 'Cardiology',
                qualification: 'MD, FACC',
                experience: 15,
                isActive: true,
                password: hashedPassword
            });
            await userRepo.save(drSmith);
            console.log('✅ Created: Dr. John Smith (Cupertino Cardiology)');
        }

        let drJohnson = await userRepo.findOne({ where: { email: 'dr.johnson@apple.com' } });
        if (!drJohnson) {
            drJohnson = userRepo.create({
                firstName: 'Emily',
                lastName: 'Johnson',
                email: 'dr.johnson@apple.com',
                phone: '4085551002',
                role: UserRole.DOCTOR,
                organizationId: org.id,
                locationId: cupertino.id,
                specialization: 'General Medicine',
                qualification: 'MD',
                experience: 10,
                isActive: true,
                password: hashedPassword
            });
            await userRepo.save(drJohnson);
            console.log('✅ Created: Dr. Emily Johnson (Cupertino General)');
        }

        // Austin Doctors
        const austinDocDept = await deptRepo.findOne({
            where: { name: 'Orthopedics - Austin', organizationId: org.id }
        });

        let drWilliams = await userRepo.findOne({ where: { email: 'dr.williams@apple.com' } });
        if (!drWilliams) {
            drWilliams = userRepo.create({
                firstName: 'Michael',
                lastName: 'Williams',
                email: 'dr.williams@apple.com',
                phone: '5125551001',
                role: UserRole.DOCTOR,
                organizationId: org.id,
                locationId: austin.id,
                departmentId: austinDocDept?.id,
                specialization: 'Orthopedics',
                qualification: 'MD, FAAOS',
                experience: 12,
                isActive: true,
                password: hashedPassword
            });
            await userRepo.save(drWilliams);
            console.log('✅ Created: Dr. Michael Williams (Austin Orthopedics)');
        }

        let drBrown = await userRepo.findOne({ where: { email: 'dr.brown@apple.com' } });
        if (!drBrown) {
            drBrown = userRepo.create({
                firstName: 'Sarah',
                lastName: 'Brown',
                email: 'dr.brown@apple.com',
                phone: '5125551002',
                role: UserRole.DOCTOR,
                organizationId: org.id,
                locationId: austin.id,
                specialization: 'Cardiology',
                qualification: 'MD, FACC',
                experience: 8,
                isActive: true,
                password: hashedPassword
            });
            await userRepo.save(drBrown);
            console.log('✅ Created: Dr. Sarah Brown (Austin Cardiology)');
        }

        // Create Patients for each location
        const patientPassword = await bcrypt.hash('Patient@123', 10);

        // Cupertino Patients
        const cupertinoPatients = [
            { first: 'Alice', last: 'Cooper', email: 'alice.cooper@example.com', phone: '4085552001' },
            { first: 'Bob', last: 'Dylan', email: 'bob.dylan@example.com', phone: '4085552002' },
            { first: 'Charlie', last: 'Parker', email: 'charlie.parker@example.com', phone: '4085552003' }
        ];

        for (const p of cupertinoPatients) {
            let patient = await userRepo.findOne({ where: { email: p.email } });
            if (!patient) {
                patient = userRepo.create({
                    firstName: p.first,
                    lastName: p.last,
                    email: p.email,
                    phone: p.phone,
                    role: UserRole.PATIENT,
                    organizationId: org.id,
                    locationId: cupertino.id,
                    isActive: true,
                    password: patientPassword
                });
                await userRepo.save(patient);
                console.log(`✅ Created Patient: ${p.first} ${p.last} (Cupertino)`);
            }
        }

        // Austin Patients
        const austinPatients = [
            { first: 'David', last: 'Bowie', email: 'david.bowie@example.com', phone: '5125552001' },
            { first: 'Emma', last: 'Stone', email: 'emma.stone@example.com', phone: '5125552002' },
            { first: 'Frank', last: 'Sinatra', email: 'frank.sinatra@example.com', phone: '5125552003' }
        ];

        for (const p of austinPatients) {
            let patient = await userRepo.findOne({ where: { email: p.email } });
            if (!patient) {
                patient = userRepo.create({
                    firstName: p.first,
                    lastName: p.last,
                    email: p.email,
                    phone: p.phone,
                    role: UserRole.PATIENT,
                    organizationId: org.id,
                    locationId: austin.id,
                    isActive: true,
                    password: patientPassword
                });
                await userRepo.save(patient);
                console.log(`✅ Created Patient: ${p.first} ${p.last} (Austin)`);
            }
        }

        console.log('\n=== SEED COMPLETE ===');
        console.log('\n📍 CUPERTINO LOCATION:');
        console.log('  Doctors: Dr. John Smith, Dr. Emily Johnson');
        console.log('  Patients: Alice Cooper, Bob Dylan, Charlie Parker');
        console.log('\n📍 AUSTIN LOCATION:');
        console.log('  Doctors: Dr. Michael Williams, Dr. Sarah Brown');
        console.log('  Patients: David Bowie, Emma Stone, Frank Sinatra');
        console.log('\n🔑 CREDENTIALS:');
        console.log('  Doctors: Password = Doctor@123');
        console.log('  Patients: Password = Patient@123');

    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        if (AppDataSource.isInitialized) await AppDataSource.destroy();
    }
}

seedAppleLocationsData();
