import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Organization } from '../models/Organization';
import { Department } from '../models/Department';
import { Service } from '../models/Service';
import { Ward } from '../models/inpatient/Ward';
import { Room } from '../models/inpatient/Room';
import { Bed } from '../models/inpatient/Bed';
import { Admission } from '../models/inpatient/Admission';
import { Appointment } from '../models/Appointment';

async function flushData() {
  try {
    console.log('🗑️  Starting data flush...\n');

    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    // Delete in order of dependencies (children first)
    const tables = [
      { name: 'Admissions', repo: AppDataSource.getRepository(Admission) },
      { name: 'Appointments', repo: AppDataSource.getRepository(Appointment) },
      { name: 'Beds', repo: AppDataSource.getRepository(Bed) },
      { name: 'Rooms', repo: AppDataSource.getRepository(Room) },
      { name: 'Wards', repo: AppDataSource.getRepository(Ward) },
      { name: 'Services', repo: AppDataSource.getRepository(Service) },
      { name: 'Departments', repo: AppDataSource.getRepository(Department) },
      { name: 'Users', repo: AppDataSource.getRepository(User) },
      { name: 'Organizations', repo: AppDataSource.getRepository(Organization) }
    ];

    for (const table of tables) {
      try {
        const count = await table.repo.count();
        if (count > 0) {
          // Use delete instead of clear to avoid foreign key issues
          await table.repo.delete({});
          console.log(`✅ Cleared ${table.name}: ${count} records`);
        } else {
          console.log(`⏭️  ${table.name}: Already empty`);
        }
      } catch (error) {
        console.log(`⚠️  Could not clear ${table.name}: ${error instanceof Error ? error.message : String(error)}`);
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
