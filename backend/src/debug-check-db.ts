
import 'reflect-metadata';
import { AppDataSource } from './config/database';
import { User } from './models/User';
import { Organization } from './models/Organization';

async function checkData() {
    try {
        await AppDataSource.initialize();
        console.log('Database connected.');

        const userCount = await AppDataSource.getRepository(User).count();
        const orgCount = await AppDataSource.getRepository(Organization).count();

        console.log(`Users count: ${userCount}`);
        console.log(`Organizations count: ${orgCount}`);

        const users = await AppDataSource.getRepository(User).find({ select: ['email', 'role'] });
        console.log('Users found:', users);

        const orgs = await AppDataSource.getRepository(Organization).find({ select: ['name', 'subdomain'] });
        console.log('Organizations found:', orgs);

        const dbs = await AppDataSource.query('SELECT datname FROM pg_database');
        console.log('Databases:', dbs.map((d: any) => d.datname));

        await AppDataSource.destroy();
    } catch (error) {
        console.error('Error checking data:', error);
    }
}

checkData();
