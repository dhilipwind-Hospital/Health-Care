
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './models/User';
import { Organization } from './models/Organization';

// Minimal entities setup for checking
import { Role } from './models/Role';
import { SystemRoleCustomization } from './models/SystemRoleCustomization';
import { Notification } from './models/Notification';
// ... (I need the entities to initialize datasource, or I can use raw query without entities if I don't use repositories)
// Let's use raw queries to avoid entity dependency hell if schema mismatch
// But TypeORM DataSource needs entities usually. 
// Actually I can just use a simple pg client to check.
// But sticking to TypeORM is easier given the environment setup.

// I will just use the same AppDataSource config but override port.
import { AppDataSource } from './config/database';

async function checkData5432() {
    try {
        const options = { ...AppDataSource.options, port: 5432, host: 'localhost' } as any;
        const ds = new DataSource(options);

        await ds.initialize();
        console.log('Database connected on port 5432.');

        const userCount = await ds.query('SELECT COUNT(*) FROM users');
        const orgCount = await ds.query('SELECT COUNT(*) FROM organizations');

        console.log(`Users count (5432):`, userCount);
        console.log(`Organizations count (5432):`, orgCount);

        const orgs = await ds.query('SELECT name, subdomain FROM organizations');
        console.log('Organizations found (5432):', orgs);

        await ds.destroy();
    } catch (error) {
        console.error('Error checking data on 5432:', error);
    }
}

checkData5432();
