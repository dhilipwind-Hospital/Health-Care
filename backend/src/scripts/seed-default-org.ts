import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';

(async () => {
    try {
        const ds = await AppDataSource.initialize();
        const orgRepo = ds.getRepository(Organization);

        const existing = await orgRepo.findOne({ where: { subdomain: 'default' } });
        if (!existing) {
            const defaultOrg = orgRepo.create({
                name: 'Default Hospital',
                subdomain: 'default',
                description: 'Default organization for the system',
                isActive: true,
            });
            await orgRepo.save(defaultOrg);
            console.log('✅ Created default organization');
        } else {
            console.log('ℹ️ Default organization already exists');
        }

        await ds.destroy();
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to seed default organization:', error);
        process.exit(1);
    }
})();
