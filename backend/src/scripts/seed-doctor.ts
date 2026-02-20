import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Department } from '../models/Department';
import { DeepPartial } from 'typeorm';
import { UserRole } from '../types/roles';

(async () => {
  const ds = await AppDataSource.initialize();
  const userRepo = ds.getRepository(User);
  const deptRepo = ds.getRepository(Department);
  const orgRepo = ds.getRepository('Organization');

  const email = process.env.SEED_DOCTOR_EMAIL || 'doctor@example.com';
  const password = process.env.SEED_DOCTOR_PASSWORD || 'Doctor@123';

  // Resolve target organization
  let org = await orgRepo.findOne({ where: { subdomain: 'default' } });
  if (!org) {
    // Fallback to first available org if default not found
    const orgs = await orgRepo.find({ take: 1 });
    org = orgs[0];
  }

  if (!org) {
    console.error('No organization found. Cannot seed doctor.');
    process.exit(1);
  }
  const orgId = org.id;

  // Ensure a department exists for this org
  let department = await deptRepo.findOne({ where: { name: 'General Medicine', organizationId: orgId } as any });
  if (!department) {
    const newDept = new Department();
    newDept.name = 'General Medicine';
    newDept.description = 'General medical services';
    // Assign organizationId to Department
    (newDept as any).organizationId = orgId;
    department = await deptRepo.save(newDept);
    console.log('Created General Medicine department');
  }

  const existing = await userRepo.findOne({ where: { email } });
  let doctor: User;
  if (!existing) {
    const payload: DeepPartial<User> = {
      firstName: 'Doctor',
      lastName: 'User',
      email,
      phone: '9999999998',
      password,
      role: UserRole.DOCTOR,
      isActive: true,
      departmentId: department!.id,
      organizationId: orgId, // Assign orgId to User
    };
    doctor = userRepo.create(payload);
    await doctor.hashPassword();
    await userRepo.save(doctor);
    console.log(`Created doctor user: ${email} in org: ${org.name}`);
  } else {
    doctor = existing as User;
    doctor.role = UserRole.DOCTOR;
    doctor.password = password;
    doctor.departmentId = department!.id;
    doctor.isActive = true;
    doctor.organizationId = orgId; // Ensure orgId is set
    await doctor.hashPassword();
    await userRepo.save(doctor);
    console.log(`Updated doctor user: ${email}`);
  }

  await ds.destroy();
})().catch(async (e) => {
  console.error('Doctor seeding failed:', e);
  try { await AppDataSource.destroy(); } catch { }
  process.exit(1);
});
