
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Organization } from '../models/Organization';
import { Department } from '../models/Department';
import { UserRole } from '../types/roles'; // Ensure correct import for roles
import bcrypt from 'bcryptjs';

async function seedDemoOrganization() {
    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
        console.log('Database connected');

        const orgRepo = AppDataSource.getRepository(Organization);
        const userRepo = AppDataSource.getRepository(User);
        const deptRepo = AppDataSource.getRepository(Department);

        // 1. Create Organization (The Hospital)
        // This represents the Client's Hospital
        console.log('Creating Demo Organization...');
        let demoOrg = await orgRepo.findOne({ where: { name: 'Ayphen Demo Hospital' } });

        if (!demoOrg) {
            demoOrg = new Organization();
            demoOrg.name = 'Ayphen Demo Hospital';
            demoOrg.subdomain = 'ayphendemo'; // Required field
            demoOrg.email = 'contact@ayphendemo.com';
            demoOrg.isActive = true;
            demoOrg.settings = {
                branding: {
                    primaryColor: '#1890ff',
                    secondaryColor: '#f5222d'
                },
                subscription: {
                    plan: 'enterprise',
                    status: 'active'
                },
                features: {
                    pharmacy: true,
                    laboratory: true,
                    inpatient: true
                }
            };

            await orgRepo.save(demoOrg);
            console.log('✅ Organization Created: Ayphen Demo Hospital');
        } else {
            console.log('ℹ️ Organization already exists: Ayphen Demo Hospital');
        }

        // 2. Create Departments for this Hospital
        // These are needed before we can assign staff to them
        const departments = ['Cardiology', 'General Medicine', 'Pharmacy', 'Administration', 'Nursing', 'Laboratory'];
        const deptMap: Record<string, Department> = {};

        for (const deptName of departments) {
            let dept = await deptRepo.findOne({ where: { name: deptName, organization: { id: demoOrg.id } } });
            if (!dept) {
                dept = new Department();
                dept.name = deptName;
                // dept.code = deptName.substring(0, 3).toUpperCase(); // Removed: Not in entity
                dept.organization = demoOrg;
                dept.description = `${deptName} Department`;
                dept.status = 'active';
                await deptRepo.save(dept);
                console.log(`   ✅ Department Created: ${deptName}`);
            }
            deptMap[deptName] = dept;
        }

        // Common Password for Demo Simplicity
        const hashedPassword = await bcrypt.hash('Demo@123', 10);

        // 3. Create Users (One for each key role in the demo)
        const demoUsers = [
            {
                // The Client / Hospital Director
                email: 'admin@ayphendemo.com',
                firstName: 'Hospital',
                lastName: 'Director',
                role: UserRole.ADMIN,
                department: deptMap['Administration']
            },
            {
                // The Doctor
                email: 'doctor@ayphendemo.com',
                firstName: 'Dr. Sarah',
                lastName: 'Connor',
                role: UserRole.DOCTOR,
                department: deptMap['General Medicine'],
                designation: 'Senior Consultant',
                specialization: 'General Medicine'
            },
            {
                // The Receptionist
                email: 'reception@ayphendemo.com',
                firstName: 'Receptionist',
                lastName: 'Jenny',
                role: UserRole.RECEPTIONIST,
                department: deptMap['Administration']
            },
            {
                // The Nurse
                email: 'nurse@ayphendemo.com',
                firstName: 'Nurse',
                lastName: 'Ratched',
                role: UserRole.NURSE,
                department: deptMap['Nursing']
            },
            {
                // The Pharmacist
                email: 'pharma@ayphendemo.com',
                firstName: 'Pharmacist',
                lastName: 'Mike',
                role: UserRole.PHARMACIST,
                department: deptMap['Pharmacy']
            },
            {
                // The Patient (Usually self-registered, but seeded for demo speed)
                email: 'patient@ayphendemo.com',
                firstName: 'John',
                lastName: 'Doe',
                role: UserRole.PATIENT,
                department: null
            }
        ];

        for (const u of demoUsers) {
            let user = await userRepo.findOne({ where: { email: u.email } });

            if (!user) {
                user = new User();
                user.email = u.email;
                user.password = hashedPassword;
                user.firstName = u.firstName;
                user.lastName = u.lastName;
                user.role = u.role;
                user.organization = demoOrg;
                user.department = u.department || null;
                // user.designation = u.designation; // Removed: Not in User entity
                if (u.specialization) user.specialization = u.specialization;
                user.phone = '9988776655'; // Correct field is phone
                user.isActive = true;      // Correct field is isActive boolean
                // user.isEmailVerified = true; // Removed: Not in User entity

                await userRepo.save(user);
                console.log(`   ✅ User Created: ${u.role} -> ${u.email}`);
            } else {
                // Update existing user
                user.organization = demoOrg;
                user.password = hashedPassword;
                if (u.department) user.department = u.department;
                user.isActive = true;

                await userRepo.save(user);
                console.log(`   ℹ️ User Updated: ${u.role} -> ${u.email}`);
            }
        }

        console.log('\n🎉 Demo Environment Setup Complete!');
        console.log('Login credentials for all users: Demo@123');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding demo data:', error);
        process.exit(1);
    }
}

seedDemoOrganization();
