import 'reflect-metadata';
import { AppDataSource } from '../config/database';

async function flushAllData() {
    try {
        await AppDataSource.initialize();
        console.log('🔥 FLUSHING ALL DATA from Database...');

        const entities = AppDataSource.entityMetadatas;
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();

        try {
            // Disable triggers temporarily if needed, but TRUNCATE CASCADE usually works fine
            for (const entity of entities) {
                const tableName = entity.tableName;
                try {
                    console.log(`Deleting data from ${tableName}...`);
                    await queryRunner.query(`TRUNCATE TABLE "${tableName}" CASCADE`);
                } catch (e) {
                    console.log(`Failed to truncate ${tableName} directly, it might have been cleared by cascade already.`);
                }
            }

            console.log('✅ ALL DATA DELETED.');
        } catch (err) {
            console.error('Error during data wipe:', err);
        } finally {
            await queryRunner.release();
        }

    } catch (error) {
        console.error('❌ Connection failed:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

flushAllData();
