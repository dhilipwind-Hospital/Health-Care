import 'reflect-metadata';
import { AppDataSource } from '../config/database';

async function flushData() {
  try {
    console.log('🗑️  Starting data flush with raw SQL...\n');

    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    // Tables in order of deletion (children first)
    const tables = [
      'admissions',
      'appointments', 
      'beds',
      'rooms',
      'wards',
      'services',
      'departments',
      'users',
      'organizations'
    ];

    for (const tableName of tables) {
      try {
        const result = await AppDataSource.query(`DELETE FROM "${tableName}"`);
        console.log(`✅ Cleared ${tableName}: ${result.affectedRows || 0} records`);
      } catch (error) {
        console.log(`⚠️  Could not clear ${tableName}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Reset sequences
    const sequences = [
      'users_id_seq',
      'organizations_id_seq',
      'departments_id_seq',
      'services_id_seq',
      'wards_id_seq',
      'rooms_id_seq',
      'beds_id_seq',
      'appointments_id_seq',
      'admissions_id_seq'
    ];

    for (const seqName of sequences) {
      try {
        await AppDataSource.query(`ALTER SEQUENCE "${seqName}" RESTART WITH 1`);
        console.log(`✅ Reset sequence: ${seqName}`);
      } catch (error) {
        console.log(`⏭️  Could not reset sequence ${seqName}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    console.log('\n🎉 Data flush completed!');
    console.log('📊 Database is now empty and ready for fresh seeding.\n');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error during data flush:', error);
    process.exit(1);
  }
}

flushData();
