import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { UserRole } from '../types/roles';
import { Organization } from '../models/Organization';

async function cleanupSamplePatients() {
    try {
        console.log('🧹 Cleaning up sample patients for Trump Medical Center...\n');

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const orgRepo = AppDataSource.getRepository(Organization);
        const userRepo = AppDataSource.getRepository(User);

        const trumpOrg = await orgRepo.findOne({ where: { subdomain: 'trump' } });
        if (!trumpOrg) {
            console.log('⚠️ Trump organization not found. Nothing to cleanup.');
            return;
        }

        // List of sample patient emails from seed-trump-org.ts
        const sampleEmails = [
            'john.smith@email.com',
            'emma.johnson@email.com',
            'michael.w@email.com',
            'sophia.brown@email.com',
            'william.jones@email.com',
            'olivia.garcia@email.com',
            'james.martinez@email.com',
            'isabella.davis@email.com',
            'benjamin.r@email.com',
            'mia.wilson@email.com'
        ];

        const result = await userRepo.createQueryBuilder()
            .delete()
            .from(User)
            .where('organization_id = :orgId', { orgId: trumpOrg.id })
            .andWhere('role = :role', { role: UserRole.PATIENT })
            .andWhere('email IN (:...emails)', { emails: sampleEmails })
            .execute();

        console.log(`✅ Deleted ${result.affected || 0} sample patients.`);

        await AppDataSource.destroy();
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        process.exit(1);
    }
}

cleanupSamplePatients();
