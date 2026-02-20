import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { UserRole } from '../types/roles';

dotenv.config();

/**
 * FLUSH ALL DATA - Keep only super_admin user
 * 
 * This script will:
 * 1. Delete all data from all tables EXCEPT the super_admin user
 * 2. Reset sequences/auto-increment counters
 * 
 * WARNING: This is DESTRUCTIVE and IRREVERSIBLE!
 */

(async () => {
  try {
    console.log('🚨 DATA FLUSH SCRIPT - KEEP ONLY SUPER ADMIN');
    console.log('============================================\n');

    const ds = await AppDataSource.initialize();
    const queryRunner = ds.createQueryRunner();

    // Find super_admin user first
    const userRepo = ds.getRepository(User);
    const superAdmin = await userRepo.findOne({
      where: { role: UserRole.SUPER_ADMIN }
    });

    if (!superAdmin) {
      console.log('❌ No super_admin user found! Cannot proceed.');
      console.log('   Please create a super_admin first using seed-super-admin.ts');
      await ds.destroy();
      process.exit(1);
    }

    console.log(`✅ Found super_admin: ${superAdmin.email} (ID: ${superAdmin.id})`);
    console.log('\n📋 Tables to be flushed:\n');

    // Get all table names
    const tables = await queryRunner.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename != 'typeorm_metadata'
      ORDER BY tablename
    `);

    // Tables that reference users (need special handling)
    const userRelatedTables = [
      'appointments',
      'medical_records',
      'bills',
      'prescriptions',
      'lab_orders',
      'notifications',
      'messages',
      'reminders',
      'feedback',
      'vital_signs',
      'diagnoses',
      'allergies',
      'admissions',
      'visits',
      'queue_items',
      'triage',
      'consultation_notes',
      'nursing_notes',
      'doctor_notes',
      'telemedicine_sessions',
      'patient_access_grants',
      'refresh_tokens',
      'password_reset_tokens',
      'appointment_feedback',
      'appointment_history',
      'doctor_availability',
      'availability_slots',
    ];

    // Tables that don't reference users directly
    const independentTables = [
      'lab_results',
      'lab_samples',
      'lab_order_items',
      'lab_tests',
      'prescription_items',
      'medicine_transactions',
      'medicines',
      'purchase_orders',
      'suppliers',
      'beds',
      'rooms',
      'wards',
      'discharge_summaries',
      'medication_administrations',
      'inpatient_vital_signs',
      'health_articles',
      'emergency_requests',
      'callback_requests',
      'claims',
      'policies',
      'plans',
      'referrals',
      'reports',
      'visit_counters',
      'system_role_customizations',
      'roles',
    ];

    // Organization-level tables (keep structure but clear data)
    const orgTables = [
      'services',
      'departments',
      'organizations',
    ];

    console.log('User-related tables:', userRelatedTables.length);
    console.log('Independent tables:', independentTables.length);
    console.log('Organization tables:', orgTables.length);

    // Disable foreign key checks
    await queryRunner.query('SET session_replication_role = replica;');

    let deletedCount = 0;

    // 1. Delete from user-related tables first
    console.log('\n🗑️  Deleting user-related data...');
    for (const table of userRelatedTables) {
      try {
        const result = await queryRunner.query(`DELETE FROM "${table}"`);
        console.log(`   ✓ ${table}: ${result?.[1] || 0} rows deleted`);
        deletedCount++;
      } catch (err: any) {
        // Table might not exist
        if (!err.message.includes('does not exist')) {
          console.log(`   ⚠ ${table}: ${err.message}`);
        }
      }
    }

    // 2. Delete from independent tables
    console.log('\n🗑️  Deleting independent data...');
    for (const table of independentTables) {
      try {
        const result = await queryRunner.query(`DELETE FROM "${table}"`);
        console.log(`   ✓ ${table}: ${result?.[1] || 0} rows deleted`);
        deletedCount++;
      } catch (err: any) {
        if (!err.message.includes('does not exist')) {
          console.log(`   ⚠ ${table}: ${err.message}`);
        }
      }
    }

    // 3. Delete all users EXCEPT super_admin
    console.log('\n🗑️  Deleting all users except super_admin...');
    const userDeleteResult = await queryRunner.query(
      `DELETE FROM "users" WHERE id != $1`,
      [superAdmin.id]
    );
    console.log(`   ✓ users: ${userDeleteResult?.[1] || 0} rows deleted (kept super_admin)`);

    // 4. Delete organization data (services, departments, organizations)
    console.log('\n🗑️  Deleting organization data...');
    for (const table of orgTables) {
      try {
        const result = await queryRunner.query(`DELETE FROM "${table}"`);
        console.log(`   ✓ ${table}: ${result?.[1] || 0} rows deleted`);
        deletedCount++;
      } catch (err: any) {
        if (!err.message.includes('does not exist')) {
          console.log(`   ⚠ ${table}: ${err.message}`);
        }
      }
    }

    // 5. Clear super_admin's organization reference (since org is deleted)
    console.log('\n🔧 Clearing super_admin organization reference...');
    await queryRunner.query(
      `UPDATE "users" SET organization_id = NULL, department_id = NULL, primary_department_id = NULL WHERE id = $1`,
      [superAdmin.id]
    );
    console.log('   ✓ Super admin organization cleared');

    // Re-enable foreign key checks
    await queryRunner.query('SET session_replication_role = DEFAULT;');

    await queryRunner.release();
    await ds.destroy();

    console.log('\n============================================');
    console.log('✅ DATA FLUSH COMPLETED SUCCESSFULLY');
    console.log('============================================');
    console.log(`\n📊 Summary:`);
    console.log(`   - Tables processed: ${deletedCount}`);
    console.log(`   - Super admin preserved: ${superAdmin.email}`);
    console.log(`   - All other data: DELETED`);
    console.log('\n🔐 Super Admin Credentials:');
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Password: (use existing password or reset)`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ DATA FLUSH FAILED:', error);
    try {
      await AppDataSource.destroy();
    } catch {}
    process.exit(1);
  }
})();
