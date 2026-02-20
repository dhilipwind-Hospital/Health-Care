import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Organization } from '../models/Organization';
import { UserRole } from '../types/roles';

async function createDhilipAdmin() {
    try {
        await AppDataSource.initialize();
        const userRepo = AppDataSource.getRepository(User);
        const orgRepo = AppDataSource.getRepository(Organization);

        // 1. Find the Organization
        const org = await orgRepo.findOne({ where: { subdomain: 'dhilip' } });
        if (!org) {
            console.error("❌ Organization 'Dhilip One' not found. Please run the create-org script first.");
            return;
        }

        const email = 'admin@dhilip.com';
        const existingUser = await userRepo.findOne({ where: { email } });

        if (existingUser) {
            console.log(`User ${email} already exists.`);
            return;
        }

        // 2. Create the Admin User
        const adminUser = new User();
        adminUser.firstName = 'Dhilip';
        adminUser.lastName = 'Admin';
        adminUser.email = email;
        adminUser.phone = '9876543210';
        adminUser.password = 'Admin@123'; // Logic will hash this if using standard model methods, checking below
        adminUser.role = UserRole.ADMIN;
        adminUser.organization = org; // Link to Dhilip One
        adminUser.isActive = true;

        // Manually hash if needed, or rely on BeforeInsert?
        // User model usually has hashPassword method.
        await adminUser.hashPassword();

        await userRepo.save(adminUser);

        console.log("✅ Created Admin User for 'Dhilip One'");
        console.log("   Email: admin@dhilip.com");
        console.log("   Password: Admin@123");

    } catch (error) {
        console.error("Error creating admin:", error);
    } finally {
        if (AppDataSource.isInitialized) await AppDataSource.destroy();
    }
}

createDhilipAdmin();
