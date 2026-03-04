/**
 * Supplementary Seed: ALL remaining modules for Lunaris HMS
 *
 * Covers: Inpatient (ward/room/bed/admission/discharge/notes/vitals/meds),
 * Pharmacy Inventory (suppliers, purchase orders, stock movements, stock alerts),
 * Insurance (plans, policies, claims), Telemedicine, Callbacks,
 * Deposits, Appointment History, Radiology
 *
 * Run AFTER seed-lunaris-hms.ts AND seed-lunaris-complete-data.ts
 * Usage: npx ts-node src/scripts/seed-lunaris-all-modules.ts
 */

import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';
import { Location } from '../models/Location';
import { User } from '../models/User';
import { UserRole } from '../types/roles';
import { Appointment, AppointmentStatus } from '../models/Appointment';
import { Department } from '../models/Department';
import { Medicine } from '../models/pharmacy/Medicine';

// Inpatient
import { Ward } from '../models/inpatient/Ward';
import { Room, RoomType } from '../models/inpatient/Room';
import { Bed, BedStatus } from '../models/inpatient/Bed';
import { Admission, AdmissionStatus } from '../models/inpatient/Admission';
import { DischargeSummary } from '../models/inpatient/DischargeSummary';
import { NursingNote, NursingNoteType } from '../models/inpatient/NursingNote';
import { DoctorNote, DoctorNoteType } from '../models/inpatient/DoctorNote';
import { VitalSign } from '../models/inpatient/VitalSign';
import { MedicationAdministration } from '../models/inpatient/MedicationAdministration';

// Pharmacy Inventory
import { Supplier } from '../models/Supplier';
import { PurchaseOrder, PurchaseOrderStatus } from '../models/PurchaseOrder';
import { StockMovement, MovementType } from '../models/pharmacy/StockMovement';
import { StockAlert, AlertType, AlertStatus } from '../models/pharmacy/StockAlert';

// Insurance
import { Plan } from '../models/Plan';
import { Policy } from '../models/Policy';
import { Claim, ClaimStatus } from '../models/Claim';

// Telemedicine
import { TelemedicineConsultation, ConsultationType, ConsultationStatus } from '../models/Telemedicine';

// Others
import { CallbackRequest, CallbackStatus } from '../models/CallbackRequest';
import { Deposit, DepositPurpose, DepositStatus } from '../models/Deposit';
import { AppointmentHistory, AppointmentAction } from '../models/AppointmentHistory';

// Radiology
import { RadiologyOrder, ModalityType, RadiologyPriority, RadiologyOrderStatus, Laterality } from '../models/radiology/RadiologyOrder';
import { RadiologyReport, ReportStatus } from '../models/radiology/RadiologyReport';

// ======================== HELPERS ========================
function daysAgo(n: number): Date {
  const d = new Date(); d.setDate(d.getDate() - n); return d;
}
function daysFromNow(n: number): Date {
  const d = new Date(); d.setDate(d.getDate() + n); return d;
}
function setTime(base: Date, h: number, m: number): Date {
  const d = new Date(base); d.setHours(h, m, 0, 0); return d;
}

// ======================== MAIN ========================
export async function seedLunarisAllModules() {
  const orgRepo = AppDataSource.getRepository(Organization);
  const locRepo = AppDataSource.getRepository(Location);
  const userRepo = AppDataSource.getRepository(User);
  const apptRepo = AppDataSource.getRepository(Appointment);
  const deptRepo = AppDataSource.getRepository(Department);
  const medRepo = AppDataSource.getRepository(Medicine);

  // Find Lunaris org
  const org = await orgRepo.findOne({ where: { subdomain: 'lunaris-hms' } });
  if (!org) { console.log('❌ Lunaris org not found.'); return; }
  const orgId = org.id;

  const loc = await locRepo.findOne({ where: { organizationId: orgId, isMainBranch: true } });
  const patients = await userRepo.find({ where: { organizationId: orgId, role: UserRole.PATIENT }, order: { createdAt: 'ASC' } });
  const doctors = await userRepo.find({ where: { organizationId: orgId, role: UserRole.DOCTOR }, order: { createdAt: 'ASC' } });
  const nurses = await userRepo.find({ where: { organizationId: orgId, role: UserRole.NURSE, isActive: true }, order: { createdAt: 'ASC' } });
  const admin = await userRepo.findOne({ where: { organizationId: orgId, role: UserRole.ADMIN } });
  const pharmacist = await userRepo.findOne({ where: { organizationId: orgId, role: UserRole.PHARMACIST } });
  const accountant = await userRepo.findOne({ where: { organizationId: orgId, role: UserRole.ACCOUNTANT } });
  const receptionist = await userRepo.findOne({ where: { organizationId: orgId, role: UserRole.RECEPTIONIST } });
  const departments = await deptRepo.find({ where: { organizationId: orgId } });
  const medicines = await medRepo.find({ where: { organizationId: orgId } });
  const allAppts = await apptRepo.find({ where: { organizationId: orgId }, relations: ['patient', 'doctor'], order: { startTime: 'ASC' } });

  const deptByName = new Map(departments.map(d => [d.name, d]));
  const genMedDept = deptByName.get('General Medicine')!;
  const cardioDept = deptByName.get('Cardiology')!;
  const orthoDept = deptByName.get('Orthopedics')!;
  const pediDept = deptByName.get('Pediatrics')!;
  const gynDept = deptByName.get('Gynecology & Obstetrics')!;

  console.log(`📊 Found: ${patients.length} patients, ${doctors.length} doctors, ${nurses.length} nurses, ${medicines.length} medicines\n`);

  // ================================================================
  // 1. INPATIENT: WARDS
  // ================================================================
  const wardRepo = AppDataSource.getRepository(Ward);
  const wardConfigs = [
    { name: 'General Ward', wardNumber: 'GW-01', desc: 'General medicine ward – 20 beds', dept: genMedDept, capacity: 20, location: 'Ground Floor, Block A' },
    { name: 'Cardiac Care Unit', wardNumber: 'CCU-01', desc: 'Cardiac monitoring & step-down ICU', dept: cardioDept, capacity: 10, location: '2nd Floor, Block B' },
    { name: 'Orthopedic Ward', wardNumber: 'OW-01', desc: 'Post-surgical orthopedic recovery', dept: orthoDept, capacity: 15, location: '3rd Floor, Block A' },
    { name: 'Pediatric Ward', wardNumber: 'PW-01', desc: 'Children\'s ward with play area', dept: pediDept, capacity: 12, location: '1st Floor, Block C' },
    { name: 'Maternity Ward', wardNumber: 'MW-01', desc: 'Obstetric & postnatal care', dept: gynDept, capacity: 15, location: '2nd Floor, Block C' },
    { name: 'ICU', wardNumber: 'ICU-01', desc: 'Intensive Care Unit – critical patients', dept: genMedDept, capacity: 8, location: '1st Floor, Block B' },
  ];
  const wards: Ward[] = [];
  for (const wc of wardConfigs) {
    const w = wardRepo.create({ organizationId: orgId, name: wc.name, wardNumber: wc.wardNumber, description: wc.desc, departmentId: wc.dept.id, capacity: wc.capacity, isActive: true, location: wc.location });
    await wardRepo.save(w);
    wards.push(w);
  }
  console.log(`✅ ${wards.length} wards created`);

  // ================================================================
  // 2. ROOMS
  // ================================================================
  const roomRepo = AppDataSource.getRepository(Room);
  const roomConfigs = [
    // General Ward rooms
    { roomNumber: 'GW-101', wardIdx: 0, roomType: RoomType.GENERAL, capacity: 6, dailyRate: 500, features: 'AC, shared bathroom' },
    { roomNumber: 'GW-102', wardIdx: 0, roomType: RoomType.GENERAL, capacity: 6, dailyRate: 500, features: 'AC, shared bathroom' },
    { roomNumber: 'GW-103', wardIdx: 0, roomType: RoomType.SEMI_PRIVATE, capacity: 2, dailyRate: 1500, features: 'AC, attached bathroom, TV' },
    { roomNumber: 'GW-104', wardIdx: 0, roomType: RoomType.PRIVATE, capacity: 1, dailyRate: 3000, features: 'AC, attached bathroom, TV, sofa, fridge' },
    // CCU rooms
    { roomNumber: 'CCU-201', wardIdx: 1, roomType: RoomType.ICU, capacity: 4, dailyRate: 5000, features: 'Cardiac monitors, ventilator access' },
    { roomNumber: 'CCU-202', wardIdx: 1, roomType: RoomType.ICU, capacity: 4, dailyRate: 5000, features: 'Cardiac monitors, ventilator access' },
    // Ortho rooms
    { roomNumber: 'OW-301', wardIdx: 2, roomType: RoomType.SEMI_PRIVATE, capacity: 2, dailyRate: 2000, features: 'AC, traction facility' },
    { roomNumber: 'OW-302', wardIdx: 2, roomType: RoomType.PRIVATE, capacity: 1, dailyRate: 4000, features: 'AC, en-suite, physio access' },
    // Pediatric rooms
    { roomNumber: 'PW-101', wardIdx: 3, roomType: RoomType.GENERAL, capacity: 4, dailyRate: 800, features: 'Child-friendly, parent bed' },
    { roomNumber: 'PW-102', wardIdx: 3, roomType: RoomType.PRIVATE, capacity: 1, dailyRate: 2500, features: 'Private, parent bed, play area access' },
    // Maternity rooms
    { roomNumber: 'MW-201', wardIdx: 4, roomType: RoomType.SEMI_PRIVATE, capacity: 2, dailyRate: 2000, features: 'AC, baby crib, nursing station nearby' },
    { roomNumber: 'MW-202', wardIdx: 4, roomType: RoomType.DELUXE, capacity: 1, dailyRate: 5000, features: 'AC, en-suite, baby crib, lounge, TV' },
    // ICU
    { roomNumber: 'ICU-101', wardIdx: 5, roomType: RoomType.ICU, capacity: 4, dailyRate: 8000, features: 'Ventilator, multi-parameter monitor, central O2' },
    { roomNumber: 'ICU-102', wardIdx: 5, roomType: RoomType.ISOLATION, capacity: 1, dailyRate: 10000, features: 'Negative pressure, HEPA filtration' },
  ];
  const rooms: Room[] = [];
  for (const rc of roomConfigs) {
    const r = roomRepo.create({ organizationId: orgId, roomNumber: rc.roomNumber, wardId: wards[rc.wardIdx].id, roomType: rc.roomType, capacity: rc.capacity, dailyRate: rc.dailyRate, isActive: true, features: rc.features });
    await roomRepo.save(r);
    rooms.push(r);
  }
  console.log(`✅ ${rooms.length} rooms created`);

  // ================================================================
  // 3. BEDS
  // ================================================================
  const bedRepo = AppDataSource.getRepository(Bed);
  const beds: Bed[] = [];
  let bedCount = 0;
  for (let ri = 0; ri < rooms.length; ri++) {
    const room = rooms[ri];
    const cap = roomConfigs[ri].capacity;
    for (let b = 1; b <= cap; b++) {
      const bed = bedRepo.create({
        organizationId: orgId,
        bedNumber: `${room.roomNumber}-B${b}`,
        roomId: room.id,
        status: BedStatus.AVAILABLE
      });
      await bedRepo.save(bed);
      beds.push(bed);
      bedCount++;
    }
  }
  console.log(`✅ ${bedCount} beds created`);

  // ================================================================
  // 4. ADMISSIONS (2 active + 1 discharged)
  // ================================================================
  const admissionRepo = AppDataSource.getRepository(Admission);
  const admissions: Admission[] = [];

  // Admission 1: Arjun Reddy (ACL injury) – Currently Admitted
  const bed1 = beds.find(b => b.bedNumber.startsWith('OW-301'))!;
  const adm1 = admissionRepo.create({
    organizationId: orgId,
    admissionNumber: 'LNR-ADM-2025-0001',
    patientId: patients[2].id,
    admittingDoctorId: doctors[2].id,
    bedId: bed1.id,
    admissionDateTime: daysAgo(6),
    admissionReason: 'ACL reconstruction surgery – right knee',
    admissionDiagnosis: 'Right ACL tear (Grade II-III), confirmed by MRI',
    status: AdmissionStatus.ADMITTED,
    allergies: 'Ibuprofen/NSAIDs (urticaria, bronchospasm)',
    specialInstructions: 'Elevate right leg. No weight bearing. Monitor for DVT signs.',
    isEmergency: true
  });
  await admissionRepo.save(adm1);
  bed1.status = BedStatus.OCCUPIED;
  (bed1 as any).currentAdmission = adm1;
  await bedRepo.save(bed1);
  admissions.push(adm1);

  // Admission 2: Ramesh Babu (observation for uncontrolled BP) – Currently Admitted
  const bed2 = beds.find(b => b.bedNumber.startsWith('GW-103'))!;
  const adm2 = admissionRepo.create({
    organizationId: orgId,
    admissionNumber: 'LNR-ADM-2025-0002',
    patientId: patients[0].id,
    admittingDoctorId: doctors[0].id,
    bedId: bed2.id,
    admissionDateTime: daysAgo(2),
    admissionReason: 'Observation for uncontrolled hypertension with ankle edema',
    admissionDiagnosis: 'Essential Hypertension (Stage 2), T2DM, peripheral edema',
    status: AdmissionStatus.ADMITTED,
    allergies: 'Penicillin (severe anaphylaxis)',
    specialInstructions: 'Low salt diet. Strict I/O charting. BP monitoring q4h. Elevate legs.'
  });
  await admissionRepo.save(adm2);
  bed2.status = BedStatus.OCCUPIED;
  (bed2 as any).currentAdmission = adm2;
  await bedRepo.save(bed2);
  admissions.push(adm2);

  // Admission 3: Shalini (prenatal) – Discharged
  const bed3 = beds.find(b => b.bedNumber.startsWith('MW-202'))!;
  const adm3 = admissionRepo.create({
    organizationId: orgId,
    admissionNumber: 'LNR-ADM-2025-0003',
    patientId: patients[4].id,
    admittingDoctorId: doctors[4].id,
    bedId: bed3.id,
    admissionDateTime: daysAgo(50),
    dischargeDateTime: daysAgo(45),
    admissionReason: 'Gestational hypertension monitoring',
    admissionDiagnosis: 'Mild preeclampsia at 28 weeks gestation',
    status: AdmissionStatus.DISCHARGED,
    specialInstructions: 'Bed rest. Fetal monitoring q8h. Low salt diet.'
  });
  await admissionRepo.save(adm3);
  admissions.push(adm3);
  console.log(`✅ 3 admissions created (2 active, 1 discharged)`);

  // ================================================================
  // 5. INPATIENT VITAL SIGNS
  // ================================================================
  const ipVitalRepo = AppDataSource.getRepository(VitalSign);
  const ipVitalConfigs = [
    // Arjun (adm1) – day 1 morning
    { admIdx: 0, nurseIdx: 0, temp: 37.2, hr: 86, rr: 18, sys: 128, dia: 78, spo2: 97, pain: '7/10 – right knee', notes: 'Post-admission. Ice applied.', hoursAgo: 144 },
    // Arjun – day 1 evening
    { admIdx: 0, nurseIdx: 0, temp: 37.5, hr: 90, rr: 20, sys: 132, dia: 82, spo2: 96, pain: '6/10 – improving with Diclofenac', notes: 'Evening vitals. Patient resting.', hoursAgo: 132 },
    // Arjun – day 3
    { admIdx: 0, nurseIdx: 2, temp: 37.0, hr: 78, rr: 16, sys: 124, dia: 76, spo2: 98, pain: '4/10', notes: 'Stable. Knee swelling reducing.', hoursAgo: 72 },
    // Arjun – today
    { admIdx: 0, nurseIdx: 2, temp: 36.8, hr: 74, rr: 16, sys: 120, dia: 74, spo2: 99, pain: '3/10', notes: 'Pre-surgical assessment. Stable for surgery.', hoursAgo: 4 },
    // Ramesh (adm2) – admission
    { admIdx: 1, nurseIdx: 0, temp: 36.9, hr: 88, rr: 18, sys: 168, dia: 102, spo2: 97, pain: '1/10 – headache', notes: 'Admission vitals. BP critically high.', hoursAgo: 48 },
    // Ramesh – 12h later
    { admIdx: 1, nurseIdx: 0, temp: 36.8, hr: 82, rr: 16, sys: 152, dia: 94, spo2: 98, pain: '0/10', notes: 'BP improving with IV Labetalol.', hoursAgo: 36 },
    // Ramesh – today
    { admIdx: 1, nurseIdx: 0, temp: 37.0, hr: 76, rr: 16, sys: 142, dia: 88, spo2: 98, weight: 81, pain: '0/10', notes: 'Stable. Edema reducing. Transition to oral meds.', hoursAgo: 6 },
    // Shalini (adm3) – during admission
    { admIdx: 2, nurseIdx: 0, temp: 36.6, hr: 84, rr: 18, sys: 148, dia: 96, spo2: 98, weight: 64, pain: '0/10', notes: 'Admission. Elevated BP. Fetal HR 146 bpm.', hoursAgo: 1200 },
    // Shalini – before discharge
    { admIdx: 2, nurseIdx: 0, temp: 36.7, hr: 78, rr: 16, sys: 128, dia: 82, spo2: 99, weight: 63, pain: '0/10', notes: 'BP stable on Labetalol. Cleared for discharge.', hoursAgo: 1080 },
  ];
  for (const v of ipVitalConfigs) {
    const vs = ipVitalRepo.create({
      organizationId: orgId,
      admissionId: admissions[v.admIdx].id,
      recordedById: nurses[v.nurseIdx].id,
      recordedAt: new Date(Date.now() - v.hoursAgo * 3600000),
      temperature: v.temp,
      heartRate: v.hr,
      respiratoryRate: v.rr,
      systolicBP: v.sys,
      diastolicBP: v.dia,
      oxygenSaturation: v.spo2,
      weight: v.weight,
      painScore: v.pain,
      notes: v.notes
    });
    await ipVitalRepo.save(vs);
  }
  console.log(`✅ ${ipVitalConfigs.length} inpatient vital signs created`);

  // ================================================================
  // 6. NURSING NOTES
  // ================================================================
  const nursingRepo = AppDataSource.getRepository(NursingNote);
  const nursingConfigs = [
    { admIdx: 0, nurseIdx: 0, noteType: NursingNoteType.ASSESSMENT, notes: 'Patient admitted via ER with right knee ACL injury. Alert, oriented x3. Knee immobilizer in place. Ice pack applied. Pain managed with Diclofenac 50mg. NSAID allergy (Ibuprofen) flagged in chart.', hoursAgo: 144 },
    { admIdx: 0, nurseIdx: 2, noteType: NursingNoteType.MEDICATION, notes: 'Diclofenac 50mg administered post meals. Paracetamol 650mg given for mild fever. Patient reports pain at 4/10.', hoursAgo: 72 },
    { admIdx: 0, nurseIdx: 2, noteType: NursingNoteType.ROUTINE, notes: 'Patient ambulating with crutches. Knee swelling decreased. Wound site (if surgical) clean. Prepped for upcoming ACL reconstruction. NPO after midnight.', hoursAgo: 12 },
    { admIdx: 1, nurseIdx: 0, noteType: NursingNoteType.ASSESSMENT, notes: 'Patient admitted for hypertensive emergency. BP 168/102 on admission. Started on IV Labetalol. Strict I/O charting initiated. Low salt diet. Bilateral ankle edema 2+.', hoursAgo: 48 },
    { admIdx: 1, nurseIdx: 0, noteType: NursingNoteType.MEDICATION, notes: 'IV Labetalol infusion running. Metformin 500mg BD continued. Amlodipine 5mg OD given. BP trending down: 152/94 → 142/88.', hoursAgo: 24 },
    { admIdx: 1, nurseIdx: 0, noteType: NursingNoteType.ROUTINE, notes: 'Edema reducing. Urine output adequate (1800ml/24h). Transitioning from IV to oral antihypertensives. Patient comfortable, eating well.', hoursAgo: 6 },
    { admIdx: 2, nurseIdx: 0, noteType: NursingNoteType.ASSESSMENT, notes: 'Admitted for gestational hypertension monitoring at 28 weeks. Fetal heart tones 146 bpm, reactive. NST reassuring. Bed rest advised.', hoursAgo: 1200 },
    { admIdx: 2, nurseIdx: 0, noteType: NursingNoteType.PROCEDURE, notes: 'NST performed q8h. All tracings reactive. Fetal movements adequate. BP stabilized on Labetalol 100mg TDS.', hoursAgo: 1100 },
  ];
  for (const nc of nursingConfigs) {
    const n = nursingRepo.create({
      organizationId: orgId,
      admissionId: admissions[nc.admIdx].id,
      nurseId: nurses[nc.nurseIdx].id,
      noteDateTime: new Date(Date.now() - nc.hoursAgo * 3600000),
      notes: nc.notes,
      noteType: nc.noteType
    });
    await nursingRepo.save(n);
  }
  console.log(`✅ ${nursingConfigs.length} nursing notes created`);

  // ================================================================
  // 7. DOCTOR NOTES (SOAP format)
  // ================================================================
  const doctorNoteRepo = AppDataSource.getRepository(DoctorNote);
  const doctorNoteConfigs = [
    { admIdx: 0, doctorIdx: 2, noteType: DoctorNoteType.ADMISSION, subjective: 'Young male, 28y, presents with acute right knee injury during football. Heard a "pop." Unable to weight bear. Pain 8/10.', objective: 'Right knee: effusion ++, Lachman test +ve, anterior drawer +ve. X-ray: no fracture. MRI: Grade II-III ACL tear with bone bruise.', assessment: 'Right ACL tear (Grade II-III). Candidate for ACL reconstruction.', plan: '1. Admit to Orthopedic Ward. 2. Knee immobilizer. 3. Diclofenac 50mg BD (NOT Ibuprofen – allergy). 4. Pre-op workup: CBC, CXR. 5. Schedule ACL reconstruction in 5-7 days.', hoursAgo: 144 },
    { admIdx: 0, doctorIdx: 2, noteType: DoctorNoteType.PROGRESS, subjective: 'Pain improving. 4/10. Able to do knee flexion exercises. No fever.', objective: 'Knee swelling reduced. ROM 0-60 degrees. Neurovascular intact distally. Pre-op labs: CBC normal, CXR clear.', assessment: 'ACL tear – stable. Fit for surgery.', plan: '1. Schedule surgery tomorrow AM. 2. NPO after midnight. 3. Anesthesia consult. 4. Continue Diclofenac.', hoursAgo: 24 },
    { admIdx: 1, doctorIdx: 0, noteType: DoctorNoteType.ADMISSION, subjective: 'Known T2DM patient presents with severe headache, visual blurring. Home BP readings 160-170/100-105 past 3 days. Ankle swelling worsened.', objective: 'BP 168/102. HR 88. Bilateral pedal edema 2+. Fundus: no papilledema. FBG 148 mg/dL. ECG: LVH pattern. Serum creatinine 1.1.', assessment: 'Hypertensive urgency in a T2DM patient. Possible Amlodipine-induced edema. Need to optimize BP control.', plan: '1. IV Labetalol infusion. 2. Strict I/O. 3. Switch Amlodipine to Telmisartan if edema persists. 4. Renal panel, 2D Echo. 5. Low salt diet. 6. Monitor BP q4h.', hoursAgo: 48 },
    { admIdx: 1, doctorIdx: 0, noteType: DoctorNoteType.PROGRESS, subjective: 'Headache resolved. No visual complaints. Edema slightly better. FBG today: 132.', objective: 'BP 142/88. Edema 1+. Urine output 1800ml/24h. Renal panel normal.', assessment: 'BP improving. Transition to oral regimen.', plan: '1. Discontinue IV Labetalol. 2. Start Telmisartan 40mg OD. 3. Continue Metformin. 4. Plan discharge tomorrow if BP stable.', hoursAgo: 12 },
    { admIdx: 2, doctorIdx: 4, noteType: DoctorNoteType.ADMISSION, subjective: 'G2P1 at 28 weeks presents with BP 148/96, headache, pedal edema. No visual symptoms, no epigastric pain.', objective: 'BP 148/96. Proteinuria 1+. Fetal HR 146 bpm, reactive NST. AFI normal. No IUGR.', assessment: 'Mild preeclampsia at 28 weeks gestation.', plan: '1. Admit for monitoring. 2. Labetalol 100mg TDS. 3. NST q8h. 4. 24h urine protein. 5. Betamethasone for fetal lung maturity. 6. Monitor for severe features.', hoursAgo: 1200 },
    { admIdx: 2, doctorIdx: 4, noteType: DoctorNoteType.DISCHARGE, subjective: 'BP well controlled on Labetalol. No headache, no visual symptoms. Fetal movements good.', objective: 'BP 128/82. Proteinuria trace. NST reactive. Fetal growth appropriate.', assessment: 'Mild preeclampsia – controlled. Safe for discharge with close follow-up.', plan: '1. Discharge with Labetalol 100mg TDS. 2. Weekly antenatal visits. 3. Transfer to higher center for delivery at 37 weeks. 4. Return immediately if headache, visual changes, or epigastric pain.', hoursAgo: 1080 },
  ];
  for (const dn of doctorNoteConfigs) {
    const n = doctorNoteRepo.create({
      organizationId: orgId,
      admissionId: admissions[dn.admIdx].id,
      doctorId: doctors[dn.doctorIdx].id,
      noteDateTime: new Date(Date.now() - dn.hoursAgo * 3600000),
      subjective: dn.subjective,
      objective: dn.objective,
      assessment: dn.assessment,
      plan: dn.plan,
      noteType: dn.noteType
    });
    await doctorNoteRepo.save(n);
  }
  console.log(`✅ ${doctorNoteConfigs.length} doctor notes (SOAP) created`);

  // ================================================================
  // 8. MEDICATION ADMINISTRATION
  // ================================================================
  const medAdminRepo = AppDataSource.getRepository(MedicationAdministration);
  const medAdminConfigs = [
    { admIdx: 0, nurseIdx: 0, medication: 'Diclofenac 50mg', dosage: '50mg', route: 'Oral', notes: 'Given after lunch. Pain reduced to 5/10.', hoursAgo: 140 },
    { admIdx: 0, nurseIdx: 2, medication: 'Diclofenac 50mg', dosage: '50mg', route: 'Oral', notes: 'Morning dose after breakfast.', hoursAgo: 72 },
    { admIdx: 0, nurseIdx: 2, medication: 'Paracetamol 650mg', dosage: '650mg', route: 'Oral', notes: 'PRN for mild fever (37.5°C). Fever resolved.', hoursAgo: 68 },
    { admIdx: 0, nurseIdx: 2, medication: 'Enoxaparin 40mg', dosage: '40mg', route: 'SC (Subcutaneous)', notes: 'DVT prophylaxis. Injection site: abdomen. No bruising.', hoursAgo: 24 },
    { admIdx: 1, nurseIdx: 0, medication: 'Labetalol IV', dosage: '200mg in 200ml NS', route: 'IV Infusion', notes: 'Started at 20mg/hr. BP monitoring q15min.', hoursAgo: 48 },
    { admIdx: 1, nurseIdx: 0, medication: 'Metformin 500mg', dosage: '500mg', route: 'Oral', notes: 'Morning dose with breakfast. FBG 148.', hoursAgo: 42 },
    { admIdx: 1, nurseIdx: 0, medication: 'Telmisartan 40mg', dosage: '40mg', route: 'Oral', notes: 'Transitioning from IV Labetalol. First oral dose.', hoursAgo: 12 },
    { admIdx: 2, nurseIdx: 0, medication: 'Labetalol 100mg', dosage: '100mg', route: 'Oral', notes: 'TDS. BP prior to dose: 142/90.', hoursAgo: 1180 },
    { admIdx: 2, nurseIdx: 0, medication: 'Betamethasone 12mg', dosage: '12mg', route: 'IM', notes: 'Dose 1 of 2 for fetal lung maturity. Repeat in 24h.', hoursAgo: 1190 },
  ];
  for (const ma of medAdminConfigs) {
    const m = medAdminRepo.create({
      organizationId: orgId,
      admissionId: admissions[ma.admIdx].id,
      administeredById: nurses[ma.nurseIdx].id,
      administeredAt: new Date(Date.now() - ma.hoursAgo * 3600000),
      medication: ma.medication,
      dosage: ma.dosage,
      route: ma.route,
      notes: ma.notes
    });
    await medAdminRepo.save(m);
  }
  console.log(`✅ ${medAdminConfigs.length} medication administrations created`);

  // ================================================================
  // 9. DISCHARGE SUMMARY (for discharged admission)
  // ================================================================
  const dischargeRepo = AppDataSource.getRepository(DischargeSummary);
  const ds = dischargeRepo.create({
    organizationId: orgId,
    admissionId: adm3.id,
    doctorId: doctors[4].id,
    dischargeDateTime: daysAgo(45),
    admissionDiagnosis: 'Mild preeclampsia at 28 weeks gestation',
    dischargeDiagnosis: 'Mild preeclampsia – controlled. Gestational hypertension.',
    briefSummary: 'Patient was admitted for mild preeclampsia with BP 148/96 and proteinuria. Managed with Labetalol. BP stabilized. Betamethasone given for fetal lung maturity. Fetal monitoring reassuring throughout. Discharged in stable condition.',
    treatmentGiven: 'Labetalol 100mg TDS, Betamethasone 12mg IM × 2 doses, strict bed rest, NST monitoring q8h.',
    conditionAtDischarge: 'Stable. BP 128/82. Proteinuria trace. Fetal movements good, NST reactive.',
    followUpInstructions: 'Weekly antenatal visits with Dr. Lakshmi. Plan transfer to higher center at 37 weeks for delivery. Return immediately if severe headache, visual changes, epigastric pain, or decreased fetal movements.',
    medicationsAtDischarge: 'Labetalol 100mg TDS, Iron & Folic Acid, Calcium supplement',
    dietaryInstructions: 'Low salt diet. Adequate protein. Stay hydrated. Avoid processed foods.',
    activityInstructions: 'Bed rest with bathroom privileges. No heavy lifting. Light walking permitted.',
    specialInstructions: 'Monitor BP twice daily. Maintain kick count chart. Report decreased movements immediately.'
  });
  await dischargeRepo.save(ds);
  console.log(`✅ 1 discharge summary created`);

  // ================================================================
  // 10. SUPPLIERS
  // ================================================================
  const supplierRepo = AppDataSource.getRepository(Supplier);
  const supplierConfigs = [
    { name: 'MedPharma Distributors', contactPerson: 'Venkat Raman', phone: '+91 44 2800 1100', email: 'orders@medpharma.in', address: '34, Industrial Estate, Guindy, Chennai - 600032', notes: 'Primary medicine supplier. 15-day credit. Delivery within 48h.' },
    { name: 'SurgiCare Supplies', contactPerson: 'Anand Kumar', phone: '+91 44 2800 2200', email: 'sales@surgicare.in', address: '12, Ambattur Industrial Estate, Chennai - 600058', notes: 'Surgical supplies and implants. COD / 30-day credit for implants.' },
    { name: 'LabEquip India Pvt Ltd', contactPerson: 'Meera Joshi', phone: '+91 44 2800 3300', email: 'info@labequip.co.in', address: '22, SIPCOT IT Park, Siruseri, Chennai - 600130', notes: 'Lab reagents and equipment. Monthly contract.' },
  ];
  const suppliers: Supplier[] = [];
  for (const sc of supplierConfigs) {
    const s = supplierRepo.create({ organizationId: orgId, name: sc.name, contactPerson: sc.contactPerson, phone: sc.phone, email: sc.email, address: sc.address, isActive: true, notes: sc.notes });
    await supplierRepo.save(s);
    suppliers.push(s);
  }
  console.log(`✅ ${suppliers.length} suppliers created`);

  // ================================================================
  // 11. PURCHASE ORDERS
  // ================================================================
  const poRepo = AppDataSource.getRepository(PurchaseOrder);
  const poConfigs = [
    { orderNumber: 'PO-LNR-2025-001', supplierIdx: 0, status: PurchaseOrderStatus.RECEIVED, items: [{ medicine: 'Metformin 500mg', qty: 500, unitPrice: 8, total: 4000 }, { medicine: 'Amlodipine 5mg', qty: 400, unitPrice: 3, total: 1200 }, { medicine: 'Paracetamol 650mg', qty: 1000, unitPrice: 1.5, total: 1500 }], total: 6700, expectedDelivery: daysAgo(20), receivedDate: daysAgo(18), notes: 'Monthly restock order – received on time.' },
    { orderNumber: 'PO-LNR-2025-002', supplierIdx: 0, status: PurchaseOrderStatus.ORDERED, items: [{ medicine: 'Atorvastatin 10mg', qty: 200, unitPrice: 5, total: 1000 }, { medicine: 'Clopidogrel 75mg', qty: 150, unitPrice: 6, total: 900 }], total: 1900, expectedDelivery: daysFromNow(3), notes: 'Cardiology restock.' },
    { orderNumber: 'PO-LNR-2025-003', supplierIdx: 1, status: PurchaseOrderStatus.PENDING, items: [{ item: 'Knee Immobilizer (L)', qty: 5, unitPrice: 450, total: 2250 }, { item: 'Crepe Bandage 6inch', qty: 50, unitPrice: 40, total: 2000 }], total: 4250, expectedDelivery: daysFromNow(7), notes: 'Ortho supplies. Pending admin approval.' },
    { orderNumber: 'PO-LNR-2025-004', supplierIdx: 2, status: PurchaseOrderStatus.APPROVED, items: [{ item: 'CBC Reagent Kit (100 tests)', qty: 2, unitPrice: 3500, total: 7000 }, { item: 'HbA1c Test Kit (50 tests)', qty: 1, unitPrice: 5000, total: 5000 }], total: 12000, expectedDelivery: daysFromNow(5), notes: 'Lab reagent replenishment. Approved by admin.' },
  ];
  for (const po of poConfigs) {
    const p = poRepo.create({
      organizationId: orgId,
      orderNumber: po.orderNumber,
      supplier: suppliers[po.supplierIdx],
      status: po.status,
      items: po.items as any,
      totalAmount: po.total,
      expectedDeliveryDate: po.expectedDelivery as any,
      receivedDate: po.receivedDate as any,
      createdBy: { id: pharmacist?.id || admin!.id } as any,
      approvedBy: po.status !== PurchaseOrderStatus.PENDING ? { id: admin!.id } as any : undefined,
      notes: po.notes
    });
    await poRepo.save(p);
  }
  console.log(`✅ ${poConfigs.length} purchase orders created`);

  // ================================================================
  // 12. STOCK MOVEMENTS
  // ================================================================
  const smRepo = AppDataSource.getRepository(StockMovement);
  const smConfigs = [
    { medIdx: 0, type: MovementType.PURCHASE, qty: 500, prevStock: 0, newStock: 500, ref: 'PO-LNR-2025-001', notes: 'Initial stock from PO', daysAgo: 18 },
    { medIdx: 0, type: MovementType.SALE, qty: 60, prevStock: 500, newStock: 440, ref: 'RX-001', notes: 'Dispensed: Ramesh Babu – Metformin 500mg × 60', daysAgo: 15 },
    { medIdx: 2, type: MovementType.PURCHASE, qty: 400, prevStock: 0, newStock: 400, ref: 'PO-LNR-2025-001', notes: 'Initial stock from PO', daysAgo: 18 },
    { medIdx: 2, type: MovementType.SALE, qty: 30, prevStock: 400, newStock: 370, ref: 'RX-001', notes: 'Dispensed: Ramesh Babu – Amlodipine 5mg × 30', daysAgo: 15 },
    { medIdx: 6, type: MovementType.SALE, qty: 14, prevStock: 350, newStock: 336, ref: 'RX-003', notes: 'Dispensed: Arjun Reddy – Diclofenac 50mg × 14', daysAgo: 7 },
    { medIdx: 3, type: MovementType.ADJUSTMENT, qty: 1000, prevStock: 950, newStock: 1000, ref: 'ADJ-001', notes: 'Stock count adjustment – found 50 extra units', daysAgo: 10 },
    { medIdx: 7, type: MovementType.EXPIRED, qty: 20, prevStock: 600, newStock: 580, ref: 'EXP-001', notes: 'Batch CEZ-2023-A expired. Disposed per protocol.', daysAgo: 5 },
  ];
  for (const sm of smConfigs) {
    const m = smRepo.create({
      organizationId: orgId,
      medicine: medicines[sm.medIdx],
      movementType: sm.type,
      quantity: sm.qty,
      previousStock: sm.prevStock,
      newStock: sm.newStock,
      referenceNumber: sm.ref,
      notes: sm.notes,
      performedBy: { id: pharmacist?.id || admin!.id } as any
    });
    await smRepo.save(m);
  }
  console.log(`✅ ${smConfigs.length} stock movements created`);

  // ================================================================
  // 13. STOCK ALERTS
  // ================================================================
  const saRepo = AppDataSource.getRepository(StockAlert);
  const saConfigs = [
    { medIdx: 5, alertType: AlertType.LOW_STOCK, status: AlertStatus.ACTIVE, message: 'Clopidogrel 75mg is running low. Current stock: 200, Reorder level: 40.', currentStock: 200, reorderLevel: 40 },
    { medIdx: 7, alertType: AlertType.NEAR_EXPIRY, status: AlertStatus.ACTIVE, message: 'Cetirizine 10mg batch CEZ-2023-B will expire in 60 days.', expiryDate: daysFromNow(60), daysUntilExpiry: 60 },
    { medIdx: 4, alertType: AlertType.LOW_STOCK, status: AlertStatus.ACKNOWLEDGED, message: 'Amoxicillin 500mg stock at reorder level. Current: 250, Reorder: 50.', currentStock: 250, reorderLevel: 50 },
  ];
  for (const sa of saConfigs) {
    const a = saRepo.create({
      organizationId: orgId,
      medicine: medicines[sa.medIdx],
      alertType: sa.alertType,
      status: sa.status,
      message: sa.message,
      currentStock: sa.currentStock,
      reorderLevel: sa.reorderLevel,
      expiryDate: sa.expiryDate as any,
      daysUntilExpiry: sa.daysUntilExpiry
    });
    await saRepo.save(a);
  }
  console.log(`✅ ${saConfigs.length} stock alerts created`);

  // ================================================================
  // 14. INSURANCE: PLANS, POLICIES, CLAIMS
  // ================================================================
  const planRepo = AppDataSource.getRepository(Plan);
  const policyRepo = AppDataSource.getRepository(Policy);
  const claimRepo = AppDataSource.getRepository(Claim);

  const planConfigs = [
    { name: 'Star Health Gold', insurer: 'Star Health Insurance', coverageLevel: 'Comprehensive', priceMonthly: 1500, waitingPeriod: '30 days', benefits: ['OPD coverage', 'IPD coverage up to 5L', 'Pre/post hospitalization', 'Ambulance charges', 'Day care procedures'], country: 'IN' },
    { name: 'ICICI Lombard Silver', insurer: 'ICICI Lombard', coverageLevel: 'Standard', priceMonthly: 800, waitingPeriod: '90 days', benefits: ['IPD coverage up to 3L', 'Pre hospitalization 30 days', 'Post hospitalization 60 days', 'Ambulance up to 2000'], country: 'IN' },
    { name: 'HDFC Ergo Platinum', insurer: 'HDFC Ergo', coverageLevel: 'Premium', priceMonthly: 2500, waitingPeriod: '15 days', benefits: ['OPD + IPD up to 10L', 'Maternity coverage', 'New born cover', 'International emergency', 'No room rent capping', 'Wellness benefits'], country: 'IN' },
  ];
  const plans: Plan[] = [];
  for (const pc of planConfigs) {
    const p = planRepo.create({ name: pc.name, insurer: pc.insurer, coverageLevel: pc.coverageLevel, priceMonthly: pc.priceMonthly, waitingPeriod: pc.waitingPeriod, benefits: pc.benefits as any, country: pc.country, status: 'active' });
    await planRepo.save(p);
    plans.push(p);
  }

  // Policies for patients
  const policyConfigs = [
    { patientIdx: 0, planIdx: 0, billingCycle: 'annual', status: 'active', startDate: daysAgo(365), endDate: daysFromNow(0) },
    { patientIdx: 1, planIdx: 2, billingCycle: 'annual', status: 'active', startDate: daysAgo(180), endDate: daysFromNow(185) },
    { patientIdx: 4, planIdx: 2, billingCycle: 'monthly', status: 'inactive', startDate: daysAgo(365), endDate: daysAgo(30) },
  ];
  for (const pc of policyConfigs) {
    const p = policyRepo.create({
      organizationId: orgId,
      userId: patients[pc.patientIdx].id,
      planId: plans[pc.planIdx].id,
      billingCycle: pc.billingCycle,
      status: pc.status,
      startDate: pc.startDate as any,
      endDate: pc.endDate as any
    });
    await policyRepo.save(p);
  }

  // Claims
  const claimConfigs = [
    { patientIdx: 0, type: 'Hospitalization', amount: 15000, status: 'Approved' },
    { patientIdx: 1, type: 'OPD Consultation', amount: 2800, status: 'Submitted' },
    { patientIdx: 4, type: 'Maternity', amount: 5700, status: 'Approved' },
    { patientIdx: 2, type: 'Emergency', amount: 1700, status: 'Processing' },
  ];
  for (const cc of claimConfigs) {
    const c = claimRepo.create({ organizationId: orgId, userId: patients[cc.patientIdx].id, type: cc.type, amount: cc.amount, status: cc.status as ClaimStatus });
    await claimRepo.save(c);
  }
  console.log(`✅ ${planConfigs.length} plans, ${policyConfigs.length} policies, ${claimConfigs.length} claims created`);

  // ================================================================
  // 15. TELEMEDICINE CONSULTATIONS
  // ================================================================
  const teleRepo = AppDataSource.getRepository(TelemedicineConsultation);
  const teleAppt = allAppts.find(a => a.patient?.id === patients[1]?.id && a.status === AppointmentStatus.CONFIRMED);
  const teleConfigs = [
    { consultationNumber: 'TELE-LNR-001', patientIdx: 1, doctorIdx: 1, appointmentId: teleAppt?.id, consultationType: ConsultationType.VIDEO, status: ConsultationStatus.SCHEDULED, scheduledAt: daysFromNow(3), meetingLink: 'https://meet.lunaris-hospital.com/tele-001', chiefComplaint: 'Follow-up: cardiac evaluation, review lipid & thyroid reports', fee: 500, patientConsent: true, consentTimestamp: daysAgo(5) },
    { consultationNumber: 'TELE-LNR-002', patientIdx: 0, doctorIdx: 0, consultationType: ConsultationType.VIDEO, status: ConsultationStatus.COMPLETED, scheduledAt: daysAgo(8), startedAt: daysAgo(8), endedAt: new Date(daysAgo(8).getTime() + 20 * 60000), durationMinutes: 20, meetingLink: 'https://meet.lunaris-hospital.com/tele-002', chiefComplaint: 'Diabetes management follow-up', diagnosis: 'T2DM – improving with Metformin', prescription: 'Continue Metformin 500mg BD. Add Amlodipine review.', notes: 'Patient reports FBG 130-145 range. Advised strict diet.', fee: 300, isPaid: true, patientConsent: true },
  ];
  for (const tc of teleConfigs) {
    const t = teleRepo.create({
      organizationId: orgId,
      consultationNumber: tc.consultationNumber,
      patientId: patients[tc.patientIdx].id,
      doctorId: doctors[tc.doctorIdx].id,
      appointmentId: tc.appointmentId,
      consultationType: tc.consultationType,
      status: tc.status,
      scheduledAt: tc.scheduledAt,
      startedAt: tc.startedAt,
      endedAt: tc.endedAt,
      durationMinutes: tc.durationMinutes,
      meetingLink: tc.meetingLink,
      chiefComplaint: tc.chiefComplaint,
      diagnosis: tc.diagnosis,
      prescription: tc.prescription,
      notes: tc.notes,
      fee: tc.fee,
      isPaid: tc.isPaid || false,
      patientConsent: tc.patientConsent,
      consentTimestamp: tc.consentTimestamp
    });
    await teleRepo.save(t);
  }
  console.log(`✅ ${teleConfigs.length} telemedicine consultations created`);

  // ================================================================
  // 16. CALLBACK REQUESTS
  // ================================================================
  const cbRepo = AppDataSource.getRepository(CallbackRequest);
  const cbConfigs = [
    { name: 'Suresh Menon', phone: '+91 9876512345', department: 'Cardiology', preferredTime: 'Morning 10-12', message: 'Want to book an appointment for chest pain evaluation.', status: CallbackStatus.COMPLETED, assignedTo: receptionist, callNotes: 'Appointment booked with Dr. Priya Nair for next week.', callOutcome: 'Appointment Scheduled', calledAt: daysAgo(3) },
    { name: 'Priya Devi', phone: '+91 9876523456', department: 'Pediatrics', preferredTime: 'Afternoon 2-4', message: 'Need immunization schedule for my 3-year-old.', status: CallbackStatus.CALLED, assignedTo: receptionist, callNotes: 'Shared immunization chart. Follow-up needed to confirm appointment.', calledAt: daysAgo(1), followUpDate: daysFromNow(2) },
    { name: 'Govindan Nair', phone: '+91 9876534567', department: 'Orthopedics', preferredTime: 'Anytime', message: 'Chronic back pain for 2 months. Need specialist opinion.', status: CallbackStatus.PENDING },
    { name: 'Lakshmi S.', phone: '+91 9876545678', department: 'General Medicine', message: 'Inquiry about health checkup packages and pricing.', status: CallbackStatus.NO_ANSWER, assignedTo: receptionist, callNotes: 'Called twice. No answer. Will retry.', calledAt: daysAgo(1) },
  ];
  for (const cb of cbConfigs) {
    const c = cbRepo.create({
      organizationId: orgId,
      name: cb.name,
      phone: cb.phone,
      department: cb.department,
      preferredTime: cb.preferredTime,
      message: cb.message,
      status: cb.status,
      assignedTo: cb.assignedTo || undefined,
      callNotes: cb.callNotes,
      callOutcome: cb.callOutcome,
      calledAt: cb.calledAt,
      followUpDate: cb.followUpDate
    });
    await cbRepo.save(c);
  }
  console.log(`✅ ${cbConfigs.length} callback requests created`);

  // ================================================================
  // 17. DEPOSITS
  // ================================================================
  const depositRepo = AppDataSource.getRepository(Deposit);
  const depositConfigs = [
    { patientIdx: 2, admissionId: adm1.id, receiptNumber: 'DEP-LNR-001', amount: 25000, paymentMethod: 'card', transactionId: 'TXN-CC-78234', purpose: DepositPurpose.SURGERY, status: DepositStatus.RECEIVED, notes: 'Pre-surgical deposit for ACL reconstruction.' },
    { patientIdx: 0, admissionId: adm2.id, receiptNumber: 'DEP-LNR-002', amount: 10000, paymentMethod: 'upi', transactionId: 'UPI-9840000001-45678', purpose: DepositPurpose.ADMISSION, status: DepositStatus.RECEIVED, notes: 'Admission deposit for hypertension observation.' },
    { patientIdx: 4, admissionId: adm3.id, receiptNumber: 'DEP-LNR-003', amount: 15000, paymentMethod: 'cash', purpose: DepositPurpose.ADMISSION, status: DepositStatus.ADJUSTED, adjustedAmount: 12000, notes: 'Adjusted against final bill. Refund of 3000 pending.' },
  ];
  for (const dc of depositConfigs) {
    const d = depositRepo.create({
      organizationId: orgId,
      patientId: patients[dc.patientIdx].id,
      admissionId: dc.admissionId,
      receiptNumber: dc.receiptNumber,
      amount: dc.amount,
      paymentMethod: dc.paymentMethod,
      transactionId: dc.transactionId,
      purpose: dc.purpose,
      status: dc.status,
      adjustedAmount: dc.adjustedAmount || 0,
      receivedBy: { id: accountant?.id || admin!.id } as any,
      receivedAt: daysAgo(7),
      notes: dc.notes
    });
    await depositRepo.save(d);
  }
  console.log(`✅ ${depositConfigs.length} deposits created`);

  // ================================================================
  // 18. APPOINTMENT HISTORY
  // ================================================================
  const ahRepo = AppDataSource.getRepository(AppointmentHistory);
  const ahConfigs = [
    // Ramesh's appointment journey
    { apptIdx: 0, action: 'created', details: 'Appointment created via reception.', changedBy: receptionist?.id, daysAgo: 32 },
    { apptIdx: 0, action: 'confirmed', details: 'Confirmed by reception after phone call.', changedBy: receptionist?.id, daysAgo: 31 },
    { apptIdx: 0, action: 'notes_updated', details: 'Consultation notes added by Dr. Rajesh.', changedBy: doctors[0]?.id, daysAgo: 30 },
    // Arjun's cancelled appointment
    { apptIdx: 4, action: 'created', details: 'Follow-up appointment created.', changedBy: receptionist?.id, daysAgo: 5 },
    { apptIdx: 4, action: 'cancelled', details: 'Patient unable to travel – rescheduled.', changedBy: patients[2]?.id, daysAgo: 2 },
    // Arjun's rescheduled appointment
    { apptIdx: 5, action: 'created', details: 'Rescheduled from cancelled appointment.', changedBy: receptionist?.id, daysAgo: 2 },
    { apptIdx: 5, action: 'confirmed', details: 'Confirmed via phone.', changedBy: receptionist?.id, daysAgo: 1 },
    // Kavitha's telemedicine
    { apptIdx: 3, action: 'created', details: 'Telemedicine follow-up scheduled.', changedBy: doctors[1]?.id, daysAgo: 6 },
    { apptIdx: 3, action: 'confirmed', details: 'Patient confirmed via portal.', changedBy: patients[1]?.id, daysAgo: 5 },
  ];
  let ahCount = 0;
  for (const ah of ahConfigs) {
    if (allAppts[ah.apptIdx]) {
      const h = ahRepo.create({
        organizationId: orgId,
        appointmentId: allAppts[ah.apptIdx].id,
        action: ah.action as AppointmentAction,
        details: ah.details,
        changedBy: ah.changedBy
      });
      await ahRepo.save(h);
      ahCount++;
    }
  }
  console.log(`✅ ${ahCount} appointment history entries created`);

  // ================================================================
  // 19. RADIOLOGY ORDERS & REPORTS
  // ================================================================
  const radOrderRepo = AppDataSource.getRepository(RadiologyOrder);
  const radReportRepo = AppDataSource.getRepository(RadiologyReport);

  // Chest X-ray for Arjun (pre-surgical)
  const radOrder1 = radOrderRepo.create({
    organizationId: orgId,
    locationId: loc?.id,
    orderNumber: 'RAD-LNR-2025-001',
    patientId: patients[2].id,
    referringDoctorId: doctors[2].id,
    modalityType: ModalityType.XRAY,
    bodyPart: 'Chest',
    laterality: Laterality.NA,
    studyDescription: 'Chest X-ray PA view – Pre-operative clearance',
    clinicalHistory: 'ACL tear, pre-surgical workup. No respiratory symptoms.',
    provisionalDiagnosis: 'Pre-op screening',
    priority: RadiologyPriority.ROUTINE,
    status: RadiologyOrderStatus.COMPLETED,
    scheduledDate: daysAgo(6) as any,
    performedDate: daysAgo(6),
    reportedDate: daysAgo(6),
    verifiedDate: daysAgo(6),
    billingStatus: 'billed',
    estimatedCost: 500
  });
  await radOrderRepo.save(radOrder1);

  const radReport1 = radReportRepo.create({
    orderId: radOrder1.id,
    radiologistId: doctors[0].id,
    findings: 'Both lung fields are clear. No consolidation or effusion. Heart size normal. Costophrenic angles clear. Trachea central. No bony abnormality.',
    impression: 'Normal chest X-ray. Cleared for surgery.',
    criticalFinding: false,
    reportStatus: ReportStatus.FINAL,
    reportedAt: daysAgo(6),
    verifiedAt: daysAgo(6),
    verifiedBy: doctors[0].id
  });
  await radReportRepo.save(radReport1);

  // MRI Knee for Arjun
  const radOrder2 = radOrderRepo.create({
    organizationId: orgId,
    locationId: loc?.id,
    orderNumber: 'RAD-LNR-2025-002',
    patientId: patients[2].id,
    referringDoctorId: doctors[2].id,
    modalityType: ModalityType.MRI,
    bodyPart: 'Knee',
    laterality: Laterality.RIGHT,
    studyDescription: 'MRI Right Knee – ACL injury evaluation',
    clinicalHistory: 'Acute right knee injury during football. Lachman +ve. Suspected ACL tear.',
    provisionalDiagnosis: 'ACL tear right knee',
    priority: RadiologyPriority.URGENT,
    status: RadiologyOrderStatus.VERIFIED,
    scheduledDate: daysAgo(5) as any,
    performedDate: daysAgo(5),
    reportedDate: daysAgo(4),
    verifiedDate: daysAgo(4),
    billingStatus: 'billed',
    estimatedCost: 6000
  });
  await radOrderRepo.save(radOrder2);

  const radReport2 = radReportRepo.create({
    orderId: radOrder2.id,
    radiologistId: doctors[0].id,
    findings: 'ACL: Complete tear of the ACL with retraction. Increased T2 signal at the femoral attachment. Bone marrow edema at lateral femoral condyle and posterolateral tibial plateau (bone bruise pattern). MCL: Intact. Menisci: Intact, no tear. PCL: Intact. Joint effusion: Moderate.',
    impression: 'Complete ACL tear (Grade III) with associated bone bruising. No meniscal or collateral ligament injury. Surgical reconstruction recommended.',
    recommendation: 'Orthopedic consultation for ACL reconstruction planning. Consider arthroscopy.',
    criticalFinding: false,
    reportStatus: ReportStatus.FINAL,
    reportedAt: daysAgo(4),
    verifiedAt: daysAgo(4),
    verifiedBy: doctors[0].id
  });
  await radReportRepo.save(radReport2);

  // Echo for Kavitha (cardiology)
  const radOrder3 = radOrderRepo.create({
    organizationId: orgId,
    locationId: loc?.id,
    orderNumber: 'RAD-LNR-2025-003',
    patientId: patients[1].id,
    referringDoctorId: doctors[1].id,
    modalityType: ModalityType.ECHO,
    bodyPart: 'Heart',
    laterality: Laterality.NA,
    studyDescription: '2D Echocardiography – Cardiac function assessment',
    clinicalHistory: 'Palpitations, chest tightness. ECG: mild ST depression V4-V6. Family h/o MI.',
    provisionalDiagnosis: 'Suspected coronary artery disease',
    priority: RadiologyPriority.ROUTINE,
    status: RadiologyOrderStatus.VERIFIED,
    scheduledDate: daysAgo(10) as any,
    performedDate: daysAgo(10),
    reportedDate: daysAgo(10),
    verifiedDate: daysAgo(9),
    billingStatus: 'billed',
    estimatedCost: 2000
  });
  await radOrderRepo.save(radOrder3);

  const radReport3 = radReportRepo.create({
    orderId: radOrder3.id,
    radiologistId: doctors[1].id,
    findings: 'LV cavity size: Normal. LVEF: 55% (by Simpson\'s). Regional wall motion: No regional wall motion abnormality. Diastolic function: Grade I diastolic dysfunction (impaired relaxation). Valves: All valves normal. No regurgitation. Pericardium: Normal. No effusion. RV function: Normal. TAPSE 2.2 cm.',
    impression: 'Normal LV systolic function (LVEF 55%). Mild (Grade I) diastolic dysfunction. No structural heart disease.',
    recommendation: 'Clinical correlation with symptoms. Consider TMT/stress test if symptoms persist.',
    criticalFinding: false,
    reportStatus: ReportStatus.FINAL,
    reportedAt: daysAgo(10),
    verifiedAt: daysAgo(9),
    verifiedBy: doctors[1].id
  });
  await radReportRepo.save(radReport3);

  // Pending ultrasound for Shalini (prenatal)
  const radOrder4 = radOrderRepo.create({
    organizationId: orgId,
    locationId: loc?.id,
    orderNumber: 'RAD-LNR-2025-004',
    patientId: patients[4].id,
    referringDoctorId: doctors[4].id,
    modalityType: ModalityType.ULTRASOUND,
    bodyPart: 'Abdomen (Obstetric)',
    laterality: Laterality.NA,
    studyDescription: 'Obstetric Ultrasound – Growth scan at 28 weeks',
    clinicalHistory: 'G2P1 at 28 weeks. Mild preeclampsia. Monitoring fetal growth.',
    provisionalDiagnosis: 'Mild preeclampsia, fetal growth monitoring',
    priority: RadiologyPriority.ROUTINE,
    status: RadiologyOrderStatus.COMPLETED,
    scheduledDate: daysAgo(49) as any,
    performedDate: daysAgo(49),
    reportedDate: daysAgo(48),
    billingStatus: 'billed',
    estimatedCost: 1500
  });
  await radOrderRepo.save(radOrder4);
  console.log(`✅ 4 radiology orders + 3 radiology reports created`);

  // ================================================================
  // SUMMARY
  // ================================================================
  console.log('\n🏥 ═══════════════════════════════════════════════');
  console.log('   LUNARIS ALL MODULES SEED COMPLETED');
  console.log('═══════════════════════════════════════════════\n');
  console.log(`  Wards:                    ${wards.length}`);
  console.log(`  Rooms:                    ${rooms.length}`);
  console.log(`  Beds:                     ${bedCount}`);
  console.log(`  Admissions:               3 (2 active, 1 discharged)`);
  console.log(`  Inpatient Vitals:         ${ipVitalConfigs.length}`);
  console.log(`  Nursing Notes:            ${nursingConfigs.length}`);
  console.log(`  Doctor Notes (SOAP):      ${doctorNoteConfigs.length}`);
  console.log(`  Medication Admin:         ${medAdminConfigs.length}`);
  console.log(`  Discharge Summaries:      1`);
  console.log(`  Suppliers:                ${suppliers.length}`);
  console.log(`  Purchase Orders:          ${poConfigs.length}`);
  console.log(`  Stock Movements:          ${smConfigs.length}`);
  console.log(`  Stock Alerts:             ${saConfigs.length}`);
  console.log(`  Insurance Plans:          ${planConfigs.length}`);
  console.log(`  Insurance Policies:       ${policyConfigs.length}`);
  console.log(`  Insurance Claims:         ${claimConfigs.length}`);
  console.log(`  Telemedicine Consults:    ${teleConfigs.length}`);
  console.log(`  Callback Requests:        ${cbConfigs.length}`);
  console.log(`  Deposits:                 ${depositConfigs.length}`);
  console.log(`  Appointment History:      ${ahCount}`);
  console.log(`  Radiology Orders:         4`);
  console.log(`  Radiology Reports:        3`);
  console.log('');

  return { success: true };
}

// ======================== CLI RUNNER ========================
if (require.main === module) {
  AppDataSource.initialize()
    .then(() => seedLunarisAllModules())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seed failed:', err);
      process.exit(1);
    });
}
