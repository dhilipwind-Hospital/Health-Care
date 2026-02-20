import 'reflect-metadata';
import { AppDataSource } from '../config/database';

async function completeFlush() {
  try {
    console.log('🗑️  Starting COMPLETE data flush...\n');

    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    // Disable foreign key constraints temporarily
    await AppDataSource.query('SET session_replication_role = replica;');
    console.log('✅ Disabled foreign key constraints\n');

    // Get all table names in public schema
    const tableResult = await AppDataSource.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%'
      AND tablename != 'typeorm_metadata'
      ORDER BY tablename
    `);

    const tables = tableResult.map((row: any) => row.tablename);
    console.log(`Found ${tables.length} tables to clear\n`);

    // Clear all tables
    for (const tableName of tables) {
      try {
        const result = await AppDataSource.query(`DELETE FROM "${tableName}"`);
        console.log(`✅ Cleared ${tableName}: ${result.affectedRows || 0} records`);
      } catch (error) {
        console.log(`⚠️  Could not clear ${tableName}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Re-enable foreign key constraints
    await AppDataSource.query('SET session_replication_role = DEFAULT;');
    console.log('\n✅ Re-enabled foreign key constraints');

    // Reset all sequences
    const sequenceResult = await AppDataSource.query(`
      SELECT sequence_name 
      FROM information_schema.sequences 
      WHERE sequence_schema = 'public'
    `);

    const sequences = sequenceResult.map((row: any) => row.sequence_name);
    
    for (const seqName of sequences) {
      try {
        await AppDataSource.query(`ALTER SEQUENCE "${seqName}" RESTART WITH 1`);
        console.log(`✅ Reset sequence: ${seqName}`);
      } catch (error) {
        console.log(`⏭️  Could not reset sequence ${seqName}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    console.log('\n🎉 COMPLETE data flush finished!');
    console.log('📊 Database is now completely empty and ready for fresh seeding.\n');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error during complete data flush:', error);
    process.exit(1);
  }
}

completeFlush();
