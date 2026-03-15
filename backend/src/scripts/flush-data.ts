import 'reflect-metadata';
import { AppDataSource } from '../config/database';

export async function flushData() {
  const needsInit = !AppDataSource.isInitialized;

  if (needsInit) {
    await AppDataSource.initialize();
  }

  console.log('🗑️  Starting FULL data flush...\n');

  const entities = AppDataSource.entityMetadatas;
  const tableNames = entities.map(e => `"${e.tableName}"`).join(', ');

  console.log(`Found ${entities.length} tables to flush:`);
  entities.forEach(e => console.log(`  - ${e.tableName}`));

  console.log('\nTruncating all tables with CASCADE...');
  await AppDataSource.query(`TRUNCATE TABLE ${tableNames} CASCADE`);

  console.log(`\n🎉 Data flush completed! ${entities.length} tables cleared.`);
  console.log('📊 Database schema preserved. Ready for fresh seeding.\n');

  if (needsInit) {
    await AppDataSource.destroy();
  }
}

// Allow running directly via ts-node
if (require.main === module) {
  flushData().catch(err => {
    console.error('❌ Error during data flush:', err);
    process.exit(1);
  });
}
