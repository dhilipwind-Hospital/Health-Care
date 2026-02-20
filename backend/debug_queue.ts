import { AppDataSource } from './src/config/database';
import { QueueItem } from './src/models/QueueItem';
import { Organization } from './src/models/Organization';

async function debug() {
    console.log('Starting debug script...');
    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
            console.log('Database initialized.');
        }

        const orgRepo = AppDataSource.getRepository(Organization);
        const qRepo = AppDataSource.getRepository(QueueItem);

        const orgCount = await orgRepo.count();
        console.log(`Total Organizations in DB: ${orgCount}`);

        const qCount = await qRepo.count();
        console.log(`Total QueueItems in DB: ${qCount}`);

        const items = await qRepo.find({
            relations: ['visit', 'visit.patient'],
            order: { createdAt: 'DESC' },
            take: 5
        });

        items.forEach(i => {
            console.log(`Token: ${i.tokenNumber}, Stage: ${i.stage}, Status: ${i.status}, Org: ${i.organizationId}`);
        });

        await AppDataSource.destroy();
    } catch (err) {
        console.error('DEBUG ERROR:', err);
    }
}

debug();
