import 'reflect-metadata';
import { AppDataSource } from '../config/database';

async function flushData() {
  try {
    console.log('🗑️  Starting FULL data flush...\n');

    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    const entities = AppDataSource.entityMetadatas;
    const tableNames = entities.map(e => `"${e.tableName}"`).join(', ');

    console.log(`Found ${entities.length} tables to flush:`);
    entities.forEach(e => console.log(`  - ${e.tableName}`));

    console.log('\nTruncating all tables with CASCADE...');
    await AppDataSource.query(`TRUNCATE TABLE ${tableNames} CASCADE`);

    console.log(`\n🎉 Data flush completed! ${entities.length} tables cleared.`);
    console.log('📊 Database schema preserved. Ready for fresh seeding.\n');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error during data flush:', error);
    process.exit(1);
  }
}

flushData();
