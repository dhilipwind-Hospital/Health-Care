
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { UserRole } from '../types/roles';
import { Organization } from '../models/Organization';
import * as bcrypt from 'bcryptjs';

const seedPatientCategories = async () => {
    try {
        await AppDataSource.initialize();
        console.log('Database connected');

        // Find or create organization
        let organization = await AppDataSource.getRepository(Organization).findOne({ where: { name: 'Dhilip Healthcare' } });
        if (!organization) {
            organization = new Organization();
            organization.name = 'Dhilip Healthcare';
            organization.subdomain = 'dhilip-healthcare'; // Adding required subdomain
            organization.address = '123 Health St';
            await AppDataSource.getRepository(Organization).save(organization);

        }

        const patientRepo = AppDataSource.getRepository(User);
        const password = await bcrypt.hash('password123', 10);

        // Define categorized patients
        const categorizedPatients = [
            // INPATIENTS
            {
                firstName: 'Rajesh',
                lastName: 'Kumar',
                email: 'rajesh.k@example.com',
                phone: '+91 9876500001',
                role: UserRole.PATIENT,
                patientType: 'inpatient',
                organization
            },
            {
                firstName: 'Deepa',
                lastName: 'Lakshmi',
                email: 'deepa.l@example.com',
                phone: '+91 9876500002',
                role: UserRole.PATIENT,
                patientType: 'inpatient',
                organization
            },

            // OUTPATIENTS
            {
                firstName: 'Senthil',
                lastName: 'Vel',
                email: 'senthil.v@example.com',
                phone: '+91 9876500003',
                role: UserRole.PATIENT,
                patientType: 'outpatient',
                organization
            },
            {
                firstName: 'Anita',
                lastName: 'Rajan',
                email: 'anita.r@example.com',
                phone: '+91 9876500004',
                role: UserRole.PATIENT,
                patientType: 'outpatient',
                organization
            },

            // EMERGENCY
            {
                firstName: 'Vikram',
                lastName: 'Singh',
                email: 'vikram.s@example.com',
                phone: '+91 9876500005',
                role: UserRole.PATIENT,
                patientType: 'emergency',
                organization
            },

            // DISCHARGED
            {
                firstName: 'Kamal',
                lastName: 'Hassan',
                email: 'kamal.h@example.com',
                phone: '+91 9876500006',
                role: UserRole.PATIENT,
                patientType: 'discharged',
                organization
            },
        ];

        for (const p of categorizedPatients) {
            // Check if exists
            const existing = await patientRepo.findOne({ where: { email: p.email } });
            if (!existing) {
                const newPatient = patientRepo.create({
                    ...p,
                    password,
                    dateOfBirth: '1980-01-01', // Default DOB
                    gender: 'male',
                    address: 'Chennai, India'
                });
                await patientRepo.save(newPatient);
                console.log(`Created ${p.patientType} patient: ${p.firstName}`);
            } else {
                // Update type if exists
                existing.patientType = p.patientType;
                await patientRepo.save(existing);
                console.log(`Updated ${p.firstName} to ${p.patientType}`);
            }
        }

        console.log('Seeding complete!');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedPatientCategories();
