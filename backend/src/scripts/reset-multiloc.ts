
import { AppDataSource } from '../config/database';

async function reset() {
    try {
        await AppDataSource.initialize();
        console.log('🧹 Cleaning up Demo Data...');

        // Delete Appointments linked to Demo Users
        await AppDataSource.query(`
            DELETE FROM appointments 
            WHERE patient_id IN (SELECT id FROM users WHERE email LIKE '%@demo.com' OR email LIKE '%@apollo.demo')
            OR doctor_id IN (SELECT id FROM users WHERE email LIKE '%@demo.com' OR email LIKE '%@apollo.demo')
        `);

        // Delete Services linked to Demo Orgs
        await AppDataSource.query(`
            DELETE FROM services 
            WHERE organization_id IN (SELECT id FROM organizations WHERE name = 'Apollo Hospital' OR address = 'Chennai' OR address = 'Delhi')
        `);

        // Delete Departments linked to Demo Orgs
        await AppDataSource.query(`
            DELETE FROM departments 
            WHERE organization_id IN (SELECT id FROM organizations WHERE name = 'Apollo Hospital' OR address = 'Chennai' OR address = 'Delhi')
        `);

        // Delete Users (All linked to target Orgs)
        await AppDataSource.query(`
            DELETE FROM users 
            WHERE organization_id IN (SELECT id FROM organizations WHERE name = 'Apollo Hospital' OR address = 'Chennai' OR address = 'Delhi')
            OR email LIKE '%@demo.com' OR email LIKE '%@apollo.demo'
        `);

        // Delete Demo Organizations (by name or city/address)
        await AppDataSource.query(`
            DELETE FROM organizations 
            WHERE name = 'Apollo Hospital' 
            OR address = 'Chennai' 
            OR address = 'Delhi'
        `);

        console.log('✅ Cleanup Complete.');
        process.exit(0);
    } catch (e) {
        console.error('❌ Cleanup Failed', e);
        process.exit(1);
    }
}

reset();
