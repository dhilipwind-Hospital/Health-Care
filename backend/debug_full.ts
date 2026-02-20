import { AppDataSource } from './src/config/database';
import { QueueItem } from './src/models/QueueItem';
import { User } from './src/models/User';
import { Visit } from './src/models/Visit';

async function debug() {
    console.log('--- DB DEBUG START ---');
    try {
        await AppDataSource.initialize();

        const userCount = await AppDataSource.getRepository(User).count();
        const visitCount = await AppDataSource.getRepository(Visit).count();
        const queueCount = await AppDataSource.getRepository(QueueItem).count();

        console.log(`Users: ${userCount}`);
        console.log(`Visits: ${visitCount}`);
        console.log(`QueueItems: ${queueCount}`);

        const latestVisits = await AppDataSource.getRepository(Visit).find({
            order: { createdAt: 'DESC' },
            take: 3
        });
        console.log('Latest Visits:', latestVisits);

        await AppDataSource.destroy();
    } catch (err) {
        console.error('DEBUG ERROR:', err);
    }
}

debug();
