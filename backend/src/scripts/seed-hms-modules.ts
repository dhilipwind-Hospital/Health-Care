/**
 * Seed: Healthcare Modules (Blood Bank, Dialysis, OT/Surgery, Physiotherapy, Diet)
 * Idempotent — skips if data already exists for the org.
 * Run AFTER seed-lunaris-hms.ts
 * Usage: npx ts-node src/scripts/seed-hms-modules.ts
 */
import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';
import { User } from '../models/User';

// Blood Bank
import { BloodDonor, BloodGroup } from '../models/bloodbank/BloodDonor';
import { BloodInventory, BloodComponent, BloodBagStatus } from '../models/bloodbank/BloodInventory';
import { CrossMatchRequest, CrossMatchStatus, CrossMatchPriority } from '../models/bloodbank/CrossMatchRequest';

// Dialysis
import { DialysisMachine, MachineStatus } from '../models/dialysis/DialysisMachine';
import { DialysisSession, DialysisSessionStatus, DialysisSessionType, AccessType } from '../models/dialysis/DialysisSession';
import { DialysisPatientProfile } from '../models/dialysis/DialysisPatientProfile';

// OT/Surgery
import { OtRoom, OtRoomType, OtRoomStatus } from '../models/ot/OtRoom';
import { Surgery, SurgeryType, SurgeryPriority, SurgeryStatus, AnesthesiaType } from '../models/ot/Surgery';

// Physiotherapy
import { PhysiotherapyOrder, PhysiotherapyStatus } from '../models/PhysiotherapyOrder';
import { PhysiotherapySession, SessionStatus } from '../models/PhysiotherapyOrder';

// Diet
import { DietOrder, DietType, MealType, DietOrderStatus } from '../models/DietOrder';

// Helpers
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
const daysFromNow = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };
const dateStr = (d: Date) => d.toISOString().split('T')[0];

async function main() {
  await AppDataSource.initialize();
  console.log('🔌 Database connected');

  // Find org
  const orgRepo = AppDataSource.getRepository(Organization);
  const org = await orgRepo.findOne({ where: { isActive: true }, order: { createdAt: 'ASC' } });
  if (!org) { console.error('❌ No active organization found'); process.exit(1); }
  const orgId = org.id;
  console.log(`🏥 Organization: ${org.name} (${orgId})`);

  // Find users
  const userRepo = AppDataSource.getRepository(User);
  const doctors = await userRepo.find({ where: { organizationId: orgId, role: 'doctor' as any, isActive: true }, take: 5 });
  const patients = await userRepo.find({ where: { organizationId: orgId, role: 'patient' as any, isActive: true }, take: 5 });
  const nurses = await userRepo.find({ where: { organizationId: orgId, role: 'nurse' as any, isActive: true }, take: 3 });
  const labTechs = await userRepo.find({ where: { organizationId: orgId, role: 'lab_technician' as any, isActive: true }, take: 1 });

  if (doctors.length === 0 || patients.length === 0) {
    console.error('❌ Need at least 1 doctor and 1 patient. Run seed-lunaris-hms.ts first.');
    process.exit(1);
  }
  console.log(`👥 Found ${doctors.length} doctors, ${patients.length} patients, ${nurses.length} nurses`);

  // ================================================================
  // 1. BLOOD BANK
  // ================================================================
  const donorRepo = AppDataSource.getRepository(BloodDonor);
  const existingDonors = await donorRepo.count({ where: { organizationId: orgId } });
  if (existingDonors === 0) {
    const donorConfigs = [
      { donorNumber: 'BD-2026-0001', firstName: 'Suresh', lastName: 'Kumar', dob: '1985-03-15', gender: 'Male', bloodGroup: BloodGroup.O_POSITIVE, phone: '+91 9876543001', weight: 72, hemoglobin: 14.5, totalDonations: 8 },
      { donorNumber: 'BD-2026-0002', firstName: 'Lakshmi', lastName: 'Devi', dob: '1990-07-22', gender: 'Female', bloodGroup: BloodGroup.A_POSITIVE, phone: '+91 9876543002', weight: 58, hemoglobin: 12.8, totalDonations: 3 },
      { donorNumber: 'BD-2026-0003', firstName: 'Rajesh', lastName: 'Menon', dob: '1978-11-10', gender: 'Male', bloodGroup: BloodGroup.B_POSITIVE, phone: '+91 9876543003', weight: 80, hemoglobin: 15.2, totalDonations: 12 },
      { donorNumber: 'BD-2026-0004', firstName: 'Ananya', lastName: 'Sharma', dob: '1995-01-28', gender: 'Female', bloodGroup: BloodGroup.AB_POSITIVE, phone: '+91 9876543004', weight: 55, hemoglobin: 13.1, totalDonations: 1 },
      { donorNumber: 'BD-2026-0005', firstName: 'Vikram', lastName: 'Singh', dob: '1982-09-05', gender: 'Male', bloodGroup: BloodGroup.O_NEGATIVE, phone: '+91 9876543005', weight: 75, hemoglobin: 14.8, totalDonations: 15 },
    ];
    const savedDonors: BloodDonor[] = [];
    for (const dc of donorConfigs) {
      const donor = donorRepo.create({
        organizationId: orgId,
        donorNumber: dc.donorNumber,
        firstName: dc.firstName, lastName: dc.lastName,
        dateOfBirth: dc.dob as any, gender: dc.gender,
        bloodGroup: dc.bloodGroup as any,
        phone: dc.phone, weight: dc.weight, hemoglobin: dc.hemoglobin,
        totalDonations: dc.totalDonations, isActive: true, consentGiven: true, consentDate: dateStr(daysAgo(30)) as any,
      });
      savedDonors.push(await donorRepo.save(donor));
    }
    console.log(`✅ ${savedDonors.length} blood donors created`);

    // Blood Inventory
    const invRepo = AppDataSource.getRepository(BloodInventory);
    const bagConfigs = [
      { bagNumber: 'BAG-2026-0001', donorIdx: 0, bloodGroup: 'O+', component: BloodComponent.WHOLE_BLOOD, volume: 450, status: BloodBagStatus.AVAILABLE },
      { bagNumber: 'BAG-2026-0002', donorIdx: 0, bloodGroup: 'O+', component: BloodComponent.PRBC, volume: 280, status: BloodBagStatus.AVAILABLE },
      { bagNumber: 'BAG-2026-0003', donorIdx: 1, bloodGroup: 'A+', component: BloodComponent.WHOLE_BLOOD, volume: 450, status: BloodBagStatus.AVAILABLE },
      { bagNumber: 'BAG-2026-0004', donorIdx: 2, bloodGroup: 'B+', component: BloodComponent.FFP, volume: 200, status: BloodBagStatus.AVAILABLE },
      { bagNumber: 'BAG-2026-0005', donorIdx: 3, bloodGroup: 'AB+', component: BloodComponent.PLATELET_CONCENTRATE, volume: 50, status: BloodBagStatus.AVAILABLE },
      { bagNumber: 'BAG-2026-0006', donorIdx: 4, bloodGroup: 'O-', component: BloodComponent.PRBC, volume: 280, status: BloodBagStatus.AVAILABLE },
    ];
    for (const bc of bagConfigs) {
      const bag = invRepo.create({
        organizationId: orgId,
        bagNumber: bc.bagNumber,
        donor: savedDonors[bc.donorIdx],
        bloodGroup: bc.bloodGroup,
        component: bc.component,
        volume: bc.volume,
        collectionDate: dateStr(daysAgo(5)) as any,
        expiryDate: dateStr(daysFromNow(30)) as any,
        status: bc.status,
        testResults: { hiv: 'negative', hbsag: 'negative', hcv: 'negative', vdrl: 'negative', malaria: 'negative', bloodGroupConfirmed: true },
      });
      await invRepo.save(bag);
    }
    console.log(`✅ ${bagConfigs.length} blood bags created`);

    // Cross Match Request
    const cmRepo = AppDataSource.getRepository(CrossMatchRequest);
    const cm = cmRepo.create({
      organizationId: orgId,
      requestNumber: 'CM-2026-0001',
      patientId: patients[0].id,
      requestedBy: doctors[0].id,
      patientBloodGroup: 'B+',
      componentRequired: 'PRBC',
      unitsRequired: 2,
      priority: CrossMatchPriority.ROUTINE,
      indication: 'Elective surgery – preoperative preparation',
      status: CrossMatchStatus.COMPATIBLE,
      testedBy: (labTechs[0] || nurses[0]).id,
      testedAt: daysAgo(1),
      result: 'Compatible',
    });
    await cmRepo.save(cm);
    console.log('✅ 1 cross-match request created');
  } else {
    console.log(`⏭️ Blood Bank: ${existingDonors} donors already exist, skipping`);
  }

  // ================================================================
  // 2. DIALYSIS
  // ================================================================
  const machineRepo = AppDataSource.getRepository(DialysisMachine);
  const existingMachines = await machineRepo.count({ where: { organizationId: orgId } });
  if (existingMachines === 0) {
    const machines: DialysisMachine[] = [];
    for (const mc of [
      { machineNumber: 'HD-01', brand: 'Fresenius', model: '4008S', status: MachineStatus.AVAILABLE },
      { machineNumber: 'HD-02', brand: 'Fresenius', model: '4008S', status: MachineStatus.AVAILABLE },
      { machineNumber: 'HD-03', brand: 'Nipro', model: 'Surdial X', status: MachineStatus.MAINTENANCE },
    ]) {
      const m = machineRepo.create({
        organizationId: orgId,
        machineNumber: mc.machineNumber, brand: mc.brand, model: mc.model, status: mc.status,
        lastMaintenanceDate: dateStr(daysAgo(30)) as any,
        nextMaintenanceDate: dateStr(daysFromNow(60)) as any,
        installationDate: dateStr(daysAgo(365)) as any,
        isActive: true,
      });
      machines.push(await machineRepo.save(m));
    }
    console.log(`✅ ${machines.length} dialysis machines created`);

    // Patient Profile
    const profileRepo = AppDataSource.getRepository(DialysisPatientProfile);
    const profile = profileRepo.create({
      organizationId: orgId,
      patient: patients[0],
      primaryDiagnosis: 'CKD Stage 5 (ESRD)',
      dialysisStartDate: dateStr(daysAgo(180)) as any,
      accessType: 'avf',
      accessSite: 'Left radiocephalic',
      dryWeight: 65.5,
      prescribedFrequency: '3x per week',
      prescribedDuration: 240,
      comorbidities: ['Hypertension', 'Type 2 Diabetes'],
      currentMedications: [{ drug: 'Erythropoietin', dose: '4000 IU', frequency: '3x/week' }, { drug: 'Iron Sucrose', dose: '100mg', frequency: 'weekly' }],
      hepatitisStatus: { hbsag: 'negative', hcv: 'negative', hiv: 'negative' },
      totalSessions: 72,
      isActive: true,
    });
    await profileRepo.save(profile);
    console.log('✅ 1 dialysis patient profile created');

    // Sessions
    const sessionRepo = AppDataSource.getRepository(DialysisSession);
    for (let i = 0; i < 3; i++) {
      const startTime = new Date(daysAgo(i + 1));
      startTime.setHours(8, 0, 0);
      const endTime = new Date(startTime.getTime() + 240 * 60000);
      const session = sessionRepo.create({
        organizationId: orgId,
        sessionNumber: `DS-2026-${String(i + 1).padStart(4, '0')}`,
        patient: patients[0],
        doctor: doctors[0],
        nurse: nurses[0] || undefined,
        machine: machines[0],
        scheduledDate: dateStr(daysAgo(i + 1)) as any,
        scheduledTime: '08:00' as any,
        sessionType: DialysisSessionType.HEMODIALYSIS,
        status: DialysisSessionStatus.COMPLETED,
        actualStartTime: startTime,
        actualEndTime: endTime,
        durationMinutes: 240,
        bloodFlowRate: 300,
        dialysateFlowRate: 500,
        targetUF: 2500,
        actualUF: 2400 - i * 100,
        accessType: AccessType.AVF,
        accessSite: 'Left radiocephalic',
        preWeight: 67.5 - i * 0.2,
        preBP: '150/90',
        preHR: 78 + i * 2,
        preTemp: 36.5,
        postWeight: 65.0 - i * 0.2,
        postBP: '130/80',
        postHR: 72 + i,
        postTemp: 36.4,
        ktv: 1.4 + i * 0.05,
        urr: 68 + i * 2,
      });
      await sessionRepo.save(session);
    }
    console.log('✅ 3 dialysis sessions created');
  } else {
    console.log(`⏭️ Dialysis: ${existingMachines} machines already exist, skipping`);
  }

  // ================================================================
  // 3. OT / SURGERY
  // ================================================================
  const otRoomRepo = AppDataSource.getRepository(OtRoom);
  const existingRooms = await otRoomRepo.count({ where: { organizationId: orgId } });
  if (existingRooms === 0) {
    const otRooms: OtRoom[] = [];
    for (const rc of [
      { name: 'OT-1 (Major)', code: 'OT1', type: OtRoomType.MAJOR, status: OtRoomStatus.AVAILABLE, floor: '3rd Floor' },
      { name: 'OT-2 (Major)', code: 'OT2', type: OtRoomType.MAJOR, status: OtRoomStatus.AVAILABLE, floor: '3rd Floor' },
      { name: 'OT-Emergency', code: 'OTE', type: OtRoomType.EMERGENCY, status: OtRoomStatus.AVAILABLE, floor: '1st Floor' },
    ]) {
      const room = otRoomRepo.create({
        organizationId: orgId,
        name: rc.name, code: rc.code, type: rc.type, status: rc.status, floor: rc.floor,
        equipment: [
          { name: 'Anesthesia Machine', status: 'available' },
          { name: 'Surgical Table', status: 'available' },
          { name: 'Electrocautery Unit', status: 'available' },
          { name: 'Patient Monitor', status: 'available' },
          { name: 'Surgical Lights', status: 'available' },
        ],
        features: { hasLaminarFlow: true, hasCArm: rc.type === OtRoomType.MAJOR, hasLaparoscopy: rc.type === OtRoomType.MAJOR, hasRobotics: false },
        isActive: true,
      });
      otRooms.push(await otRoomRepo.save(room));
    }
    console.log(`✅ ${otRooms.length} OT rooms created`);

    // Surgeries
    const surgRepo = AppDataSource.getRepository(Surgery);
    const surgConfigs = [
      { surgeryNumber: 'SUR-2026-0001', patient: patients[2], surgeon: doctors[2], room: otRooms[0], procedure: 'ACL Reconstruction', type: SurgeryType.ELECTIVE, priority: SurgeryPriority.ELECTIVE, status: SurgeryStatus.SCHEDULED, date: daysFromNow(2), startTime: '09:00:00', endTime: '11:30:00', duration: 150, preOpDiag: 'Right ACL tear (Grade III)' },
      { surgeryNumber: 'SUR-2026-0002', patient: patients[0], surgeon: doctors[0], room: otRooms[1], procedure: 'Laparoscopic Cholecystectomy', type: SurgeryType.ELECTIVE, priority: SurgeryPriority.URGENT, status: SurgeryStatus.IN_PROGRESS, date: new Date(), startTime: '10:00:00', endTime: '11:30:00', duration: 90, preOpDiag: 'Cholelithiasis with recurrent biliary colic' },
      { surgeryNumber: 'SUR-2026-0003', patient: patients[1], surgeon: doctors[1], room: otRooms[0], procedure: 'Coronary Artery Bypass Graft', type: SurgeryType.ELECTIVE, priority: SurgeryPriority.ELECTIVE, status: SurgeryStatus.COMPLETED, date: daysAgo(3), startTime: '08:00:00', endTime: '12:00:00', duration: 240, preOpDiag: 'Triple vessel CAD' },
      { surgeryNumber: 'SUR-2026-0004', patient: patients[3], surgeon: doctors[2], room: otRooms[2], procedure: 'Emergency Appendectomy', type: SurgeryType.EMERGENCY, priority: SurgeryPriority.EMERGENCY, status: SurgeryStatus.SCHEDULED, date: new Date(), startTime: '14:00:00', endTime: '15:30:00', duration: 90, preOpDiag: 'Acute appendicitis with peritonitis' },
    ];
    for (const sc of surgConfigs) {
      const surg = surgRepo.create({
        organizationId: orgId,
        surgeryNumber: sc.surgeryNumber,
        patient: sc.patient,
        primarySurgeon: sc.surgeon,
        otRoom: sc.room,
        procedureName: sc.procedure,
        surgeryType: sc.type,
        priority: sc.priority,
        status: sc.status,
        scheduledDate: dateStr(sc.date) as any,
        scheduledStartTime: sc.startTime as any,
        scheduledEndTime: sc.endTime as any,
        estimatedDuration: sc.duration,
        preOpDiagnosis: sc.preOpDiag,
        anesthesiaType: AnesthesiaType.GENERAL,
        consentObtained: true,
        actualStartTime: sc.status === SurgeryStatus.IN_PROGRESS || sc.status === SurgeryStatus.COMPLETED ? sc.date : undefined,
        actualEndTime: sc.status === SurgeryStatus.COMPLETED ? sc.date : undefined,
        actualDuration: sc.status === SurgeryStatus.COMPLETED ? sc.duration : undefined,
      });
      await surgRepo.save(surg);
    }
    console.log(`✅ ${surgConfigs.length} surgeries created`);
  } else {
    console.log(`⏭️ OT/Surgery: ${existingRooms} OT rooms already exist, skipping`);
  }

  // ================================================================
  // 4. PHYSIOTHERAPY
  // ================================================================
  const ptRepo = AppDataSource.getRepository(PhysiotherapyOrder);
  const existingPT = await ptRepo.count({ where: { organizationId: orgId } });
  if (existingPT === 0) {
    const ptOrders: PhysiotherapyOrder[] = [];
    const orderConfigs = [
      { orderNumber: 'PT-2601-0001', patient: patients[2], doctor: doctors[2], diagnosis: 'Post ACL reconstruction – right knee', treatmentType: 'exercise_therapy', bodyPart: 'Right Knee', totalSessions: 10, frequency: '3x per week', goals: 'Restore full ROM, strengthen quadriceps, return to sport', status: PhysiotherapyStatus.IN_PROGRESS, completedSessions: 3 },
      { orderNumber: 'PT-2601-0002', patient: patients[1], doctor: doctors[1], diagnosis: 'Frozen shoulder (adhesive capsulitis)', treatmentType: 'manual_therapy', bodyPart: 'Left Shoulder', totalSessions: 8, frequency: '2x per week', goals: 'Reduce pain, restore abduction and external rotation', status: PhysiotherapyStatus.SCHEDULED, completedSessions: 0 },
    ];
    for (const oc of orderConfigs) {
      const order = ptRepo.create({
        organizationId: orgId,
        orderNumber: oc.orderNumber,
        patient: oc.patient,
        doctor: oc.doctor,
        diagnosis: oc.diagnosis,
        treatmentType: oc.treatmentType,
        bodyPart: oc.bodyPart,
        totalSessions: oc.totalSessions,
        completedSessions: oc.completedSessions,
        frequency: oc.frequency,
        goals: oc.goals,
        status: oc.status,
        startDate: dateStr(daysAgo(10)) as any,
      });
      ptOrders.push(await ptRepo.save(order));
    }
    console.log(`✅ ${ptOrders.length} physiotherapy orders created`);

    // Sessions
    const ptSessionRepo = AppDataSource.getRepository(PhysiotherapySession);
    // 3 completed for order 1
    for (let i = 0; i < 3; i++) {
      const sess = ptSessionRepo.create({
        organizationId: orgId,
        order: ptOrders[0],
        sessionNumber: i + 1,
        scheduledDate: dateStr(daysAgo(10 - i * 3)) as any,
        status: SessionStatus.COMPLETED,
        actualDate: dateStr(daysAgo(10 - i * 3)) as any,
        painLevelBefore: 6 - i,
        painLevelAfter: 4 - i,
        progress: i === 2 ? 'Good improvement in ROM. Flexion 110°.' : 'Gradual improvement noted.',
        notes: 'Patient tolerating exercises well.',
      });
      await ptSessionRepo.save(sess);
    }
    // 3 scheduled for order 2
    for (let i = 0; i < 3; i++) {
      const sess = ptSessionRepo.create({
        organizationId: orgId,
        order: ptOrders[1],
        sessionNumber: i + 1,
        scheduledDate: dateStr(daysFromNow(i * 3 + 1)) as any,
        status: SessionStatus.SCHEDULED,
      });
      await ptSessionRepo.save(sess);
    }
    console.log('✅ 6 physiotherapy sessions created');
  } else {
    console.log(`⏭️ Physiotherapy: ${existingPT} orders already exist, skipping`);
  }

  // ================================================================
  // 5. DIET
  // ================================================================
  const dietRepo = AppDataSource.getRepository(DietOrder);
  const existingDiet = await dietRepo.count({ where: { organizationId: orgId } });
  if (existingDiet === 0) {
    const dietConfigs = [
      { patient: patients[0], dietType: DietType.DIABETIC, mealType: MealType.ALL, instructions: 'No sugar, limited carbs. Monitor blood glucose before meals.', calorieTarget: 1800, proteinTarget: 60, wardBed: 'General Ward - Bed 103' },
      { patient: patients[1], dietType: DietType.CARDIAC, mealType: MealType.ALL, instructions: 'Low cholesterol, low sodium. Avoid fried foods.', calorieTarget: 1600, proteinTarget: 55, wardBed: 'Cardiology Ward - Bed 201' },
      { patient: patients[2], dietType: DietType.SOFT, mealType: MealType.ALL, instructions: 'Post-surgical soft diet. Progress to regular as tolerated.', calorieTarget: 2000, proteinTarget: 70, wardBed: 'Ortho Ward - Bed 301' },
      { patient: patients[3] || patients[0], dietType: DietType.LOW_SALT, mealType: MealType.ALL, instructions: 'Strict sodium restriction <2g/day. Monitor I/O.', calorieTarget: 1800, proteinTarget: 50, wardBed: 'General Ward - Bed 105' },
    ];
    for (const dc of dietConfigs) {
      const order = dietRepo.create({
        organizationId: orgId,
        patient: dc.patient,
        dietType: dc.dietType,
        mealType: dc.mealType,
        specialInstructions: dc.instructions,
        calorieTarget: dc.calorieTarget,
        proteinTarget: dc.proteinTarget,
        wardBed: dc.wardBed,
        startDate: dateStr(new Date()) as any,
        status: DietOrderStatus.ACTIVE,
        orderedBy: doctors[0] as any,
      });
      await dietRepo.save(order);
    }
    console.log(`✅ ${dietConfigs.length} diet orders created`);
  } else {
    console.log(`⏭️ Diet: ${existingDiet} orders already exist, skipping`);
  }

  // ================================================================
  // SUMMARY
  // ================================================================
  console.log(`
🏥 ═══════════════════════════════════════════════
   HMS MODULES SEED COMPLETED
═══════════════════════════════════════════════

  Blood Bank:     5 donors, 6 bags, 1 cross-match
  Dialysis:       3 machines, 1 profile, 3 sessions
  OT/Surgery:     3 OT rooms, 4 surgeries
  Physiotherapy:  2 orders, 6 sessions
  Diet:           4 diet orders
`);

  await AppDataSource.destroy();
  process.exit(0);
}

main().catch(err => { console.error('❌ Seed error:', err); process.exit(1); });
