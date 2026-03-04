/**
 * Seed Advanced Modules
 *
 * Creates sample data for: Visitors, Staff Attendance, Housekeeping, Mortuary, Shift Handover
 * Pharmacy Reports + Bed TV use existing data.
 *
 * Idempotent — skips if data already exists.
 * Usage: npx ts-node src/scripts/seed-advanced-modules.ts
 *   or via POST /api/seed-advanced-modules
 */

import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import { InpatientVisitor, VisitorStatus } from '../models/InpatientVisitor';
import { StaffAttendance, AttendanceStatus } from '../models/StaffAttendance';
import { HousekeepingTask, HousekeepingTaskType, HousekeepingPriority, HousekeepingStatus } from '../models/HousekeepingTask';
import { MortuaryRecord, MortuaryStatus, PreservationType } from '../models/MortuaryRecord';
import { ShiftHandover, HandoverStatus } from '../models/ShiftHandover';

export async function seedAdvancedModules() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log('Database connected');
  }

  const orgRepo = AppDataSource.getRepository(Organization);
  const org = await orgRepo.findOne({ where: { isActive: true }, order: { createdAt: 'ASC' } });
  if (!org) throw new Error('No active organization found');
  const orgId = org.id;
  console.log(`Organization: ${org.name}`);

  const userRepo = AppDataSource.getRepository(User);
  const patients = await userRepo.find({ where: { organizationId: orgId, role: 'patient' as any, isActive: true }, take: 5 });
  const doctors = await userRepo.find({ where: { organizationId: orgId, role: 'doctor' as any, isActive: true }, take: 3 });
  const nurses = await userRepo.find({ where: { organizationId: orgId, role: 'nurse' as any, isActive: true }, take: 3 });
  const allStaff = [...doctors, ...nurses];

  if (patients.length < 2 || allStaff.length < 2) {
    throw new Error(`Need at least 2 patients and 2 staff. Found ${patients.length} patients, ${allStaff.length} staff.`);
  }

  const today = new Date().toISOString().split('T')[0];
  const todayCompact = today.replace(/-/g, '');
  const results: Record<string, number> = {};

  // 1. Visitors
  const visitorRepo = AppDataSource.getRepository(InpatientVisitor);
  const existingVisitors = await visitorRepo.count({ where: { organizationId: orgId } });
  if (existingVisitors > 0) {
    console.log(`Visitors: ${existingVisitors} exist, skipping`);
    results.visitors = existingVisitors;
  } else {
    const visitorData = [
      { visitorName: 'Ramesh Kumar', phone: '9876543210', relationship: 'spouse', patientId: patients[0].id, purpose: 'Regular visit', visitDate: today, status: VisitorStatus.CHECKED_IN, checkInTime: new Date(), passNumber: `VP-${todayCompact}-0001`, idType: 'aadhaar', idNumber: '1234-5678-9012' },
      { visitorName: 'Sunita Devi', phone: '9876543211', relationship: 'parent', patientId: patients[0].id, purpose: 'Check on patient', visitDate: today, status: VisitorStatus.CHECKED_IN, checkInTime: new Date(), passNumber: `VP-${todayCompact}-0002` },
      { visitorName: 'Ajay Singh', phone: '9876543212', relationship: 'friend', patientId: patients[1].id, purpose: 'Delivery of clothes', visitDate: today, status: VisitorStatus.SCHEDULED, passNumber: `VP-${todayCompact}-0003` },
      { visitorName: 'Priya Sharma', phone: '9876543213', relationship: 'sibling', patientId: patients[1].id, purpose: 'Family visit', visitDate: today, status: VisitorStatus.CHECKED_OUT, checkInTime: new Date(Date.now() - 7200000), checkOutTime: new Date(Date.now() - 3600000), passNumber: `VP-${todayCompact}-0004` },
    ];
    for (const v of visitorData) {
      await visitorRepo.save(visitorRepo.create({ ...v, organizationId: orgId } as any));
    }
    console.log(`Visitors: ${visitorData.length} created`);
    results.visitors = visitorData.length;
  }

  // 2. Staff Attendance
  const attendanceRepo = AppDataSource.getRepository(StaffAttendance);
  const existingAttendance = await attendanceRepo.count({ where: { organizationId: orgId } });
  if (existingAttendance > 0) {
    console.log(`Attendance: ${existingAttendance} exist, skipping`);
    results.attendance = existingAttendance;
  } else {
    let attCount = 0;
    for (const staff of allStaff) {
      const clockIn = new Date();
      clockIn.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 30), 0);
      const statuses: AttendanceStatus[] = [AttendanceStatus.PRESENT, AttendanceStatus.PRESENT, AttendanceStatus.LATE, AttendanceStatus.PRESENT];
      const status = statuses[attCount % statuses.length];
      await attendanceRepo.save(attendanceRepo.create({
        organizationId: orgId,
        staffId: staff.id,
        date: today,
        clockInTime: clockIn,
        status,
        hoursWorked: status === AttendanceStatus.PRESENT ? 8 : undefined,
      } as any));
      attCount++;
    }
    console.log(`Attendance: ${attCount} created`);
    results.attendance = attCount;
  }

  // 3. Housekeeping Tasks
  const hkRepo = AppDataSource.getRepository(HousekeepingTask);
  const existingHK = await hkRepo.count({ where: { organizationId: orgId } });
  if (existingHK > 0) {
    console.log(`Housekeeping: ${existingHK} exist, skipping`);
    results.housekeeping = existingHK;
  } else {
    const hkData = [
      { taskNumber: `HK-${todayCompact}-0001`, locationName: 'Ward A - Room 101', taskType: HousekeepingTaskType.CLEANING, priority: HousekeepingPriority.ROUTINE, status: HousekeepingStatus.PENDING },
      { taskNumber: `HK-${todayCompact}-0002`, locationName: 'Ward B - Room 205', taskType: HousekeepingTaskType.SANITIZATION, priority: HousekeepingPriority.URGENT, status: HousekeepingStatus.ASSIGNED, assignedToId: nurses[0]?.id },
      { taskNumber: `HK-${todayCompact}-0003`, locationName: 'ICU - Bed 3', taskType: HousekeepingTaskType.DEEP_CLEAN, priority: HousekeepingPriority.EMERGENCY, status: HousekeepingStatus.IN_PROGRESS, assignedToId: nurses[0]?.id, startedAt: new Date(Date.now() - 1800000) },
      { taskNumber: `HK-${todayCompact}-0004`, locationName: 'Ward A - Room 102', taskType: HousekeepingTaskType.LINEN_CHANGE, priority: HousekeepingPriority.ROUTINE, status: HousekeepingStatus.COMPLETED, completedAt: new Date(Date.now() - 3600000), turnaroundMinutes: 25 },
      { taskNumber: `HK-${todayCompact}-0005`, locationName: 'OT Room 1', taskType: HousekeepingTaskType.SANITIZATION, priority: HousekeepingPriority.URGENT, status: HousekeepingStatus.VERIFIED, completedAt: new Date(Date.now() - 7200000), verifiedAt: new Date(Date.now() - 5400000), turnaroundMinutes: 40 },
    ];
    for (const h of hkData) {
      await hkRepo.save(hkRepo.create({ ...h, organizationId: orgId } as any));
    }
    console.log(`Housekeeping: ${hkData.length} created`);
    results.housekeeping = hkData.length;
  }

  // 4. Mortuary Records
  const mortRepo = AppDataSource.getRepository(MortuaryRecord);
  const existingMort = await mortRepo.count({ where: { organizationId: orgId } });
  if (existingMort > 0) {
    console.log(`Mortuary: ${existingMort} exist, skipping`);
    results.mortuary = existingMort;
  } else {
    const mortData = [
      { recordNumber: `MR-${todayCompact}-0001`, deceasedName: 'John Doe (Demo)', dateOfDeath: today, timeOfDeath: '03:45', causeOfDeath: 'Cardiac arrest', chamberNumber: 'C-01', preservationType: PreservationType.REFRIGERATION, status: MortuaryStatus.STORED, storageStartTime: new Date(Date.now() - 86400000), policeNotified: false, postMortemRequired: false, postMortemCompleted: false },
      { recordNumber: `MR-${todayCompact}-0002`, deceasedName: 'Jane Smith (Demo)', dateOfDeath: today, timeOfDeath: '14:20', causeOfDeath: 'Road traffic accident', chamberNumber: 'C-02', preservationType: PreservationType.REFRIGERATION, status: MortuaryStatus.POST_MORTEM, storageStartTime: new Date(Date.now() - 43200000), policeNotified: true, postMortemRequired: true, postMortemCompleted: false },
      { recordNumber: `MR-${todayCompact}-0003`, deceasedName: 'Ravi Patel (Demo)', dateOfDeath: new Date(Date.now() - 172800000).toISOString().split('T')[0], causeOfDeath: 'Natural causes', chamberNumber: 'C-03', preservationType: PreservationType.EMBALMING, status: MortuaryStatus.RELEASED, releasedTo: 'Meera Patel', releasedToRelation: 'spouse', releasedAt: new Date(Date.now() - 86400000), policeNotified: false, postMortemRequired: false, postMortemCompleted: false },
    ];
    for (const m of mortData) {
      await mortRepo.save(mortRepo.create({ ...m, organizationId: orgId } as any));
    }
    console.log(`Mortuary: ${mortData.length} created`);
    results.mortuary = mortData.length;
  }

  // 5. Shift Handovers
  const shRepo = AppDataSource.getRepository(ShiftHandover);
  const existingSH = await shRepo.count({ where: { organizationId: orgId } });
  if (existingSH > 0) {
    console.log(`Shift Handover: ${existingSH} exist, skipping`);
    results.shiftHandover = existingSH;
  } else {
    const shData = [
      {
        fromStaffId: allStaff[0].id,
        toStaffId: allStaff[1]?.id,
        shiftDate: today,
        shiftType: 'morning',
        status: HandoverStatus.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
        patientUpdates: [{ patient: 'Bed 3', note: 'Fever subsided, vitals stable' }, { patient: 'Bed 7', note: 'Post-op recovery, drain output 50ml' }],
        pendingTasks: [{ task: 'Blood draw for Bed 3 at 2 PM' }, { task: 'Dressing change for Bed 7' }],
        criticalAlerts: [{ alert: 'Bed 5 patient allergic to sulfa drugs' }],
        medicationAlerts: 'Bed 3 - IV antibiotics due at 4 PM',
        generalNotes: 'All stable. OT schedule clear for afternoon.',
      },
      {
        fromStaffId: allStaff[1]?.id || allStaff[0].id,
        shiftDate: today,
        shiftType: 'afternoon',
        status: HandoverStatus.SUBMITTED,
        patientUpdates: [{ patient: 'Bed 3', note: 'Blood draw completed, awaiting results' }],
        pendingTasks: [{ task: 'Night vitals check at 10 PM' }, { task: 'Prepare morning medication trolley' }],
        criticalAlerts: [],
        generalNotes: 'New admission expected — Bed 8. Prepare for surgery case.',
      },
    ];
    for (const s of shData) {
      await shRepo.save(shRepo.create({ ...s, organizationId: orgId } as any));
    }
    console.log(`Shift Handover: ${shData.length} created`);
    results.shiftHandover = shData.length;
  }

  console.log('\nAdvanced modules seeded successfully');
  return { success: true, organization: org.name, results };
}

// Allow standalone CLI execution
if (require.main === module) {
  seedAdvancedModules()
    .then(() => { AppDataSource.destroy(); process.exit(0); })
    .catch(err => { console.error('Seed error:', err); process.exit(1); });
}
