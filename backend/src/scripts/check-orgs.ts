import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';

async function checkOrgs() {
    try {
        await AppDataSource.initialize();
        const repo = AppDataSource.getRepository(Organization);
        const all = await repo.find();
        console.log(`Total Orgs: ${all.length}`);
        all.forEach(o => {
            console.log(`- ${o.name} (Active: ${o.isActive})`);
        });
    } catch (error) {
        console.error(error);
    } finally {
        if (AppDataSource.isInitialized) await AppDataSource.destroy();
    }
}
checkOrgs();
