// @ts-nocheck
/**
 * Complete Seed: Ayphen Care Hospital
 * All passwords: Password@123
 * Usage: npx ts-node src/scripts/seed-ayphen-complete.ts
 */
import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import { AppDataSource } from '../config/database';

function daysAgo(n: number): Date { const d = new Date(); d.setDate(d.getDate() - n); return d; }
function daysFromNow(n: number): Date { const d = new Date(); d.setDate(d.getDate() + n); return d; }
function ts(d: Date): string { return d.toISOString(); }
function ds(d: Date): string { return d.toISOString().split('T')[0]; }

async function ins(table: string, data: Record<string, any>): Promise<string> {
  const keys = Object.keys(data);
  const cols = keys.map(k => `"${k}"`).join(', ');
  const phs = keys.map((_, i) => `$${i + 1}`).join(', ');
  const vals = keys.map(k => data[k]);
  const r = await AppDataSource.query(`INSERT INTO "${table}" (${cols}) VALUES (${phs}) RETURNING id`, vals);
  return r[0].id;
}

export async function seedAyphenComplete() {
  console.log('🏥 Starting Ayphen Care Hospital Complete Seed...\n');
  const pw = await bcrypt.hash('Password@123', 10);

  // ===== ORGANIZATION =====
  console.log('📋 Creating Organization...');
  const orgId = await ins('organizations', {
    name: 'Ayphen Care Hospital', subdomain: 'ayphen-care',
    description: 'Multi-specialty hospital', address: '42, Anna Salai, Chennai 600018',
    phone: '+91 44 2834 5678', email: 'admin@ayphencare.com',
    settings: JSON.stringify({ branding: { primaryColor: '#1890ff' }, features: { telemedicine: true, pharmacy: true, laboratory: true, bloodBank: true }, subscription: { plan: 'enterprise', maxUsers: 500 } }),
    isActive: true
  });
  console.log(`  ✅ Organization (${orgId})`);

  // ===== LOCATION =====
  console.log('📍 Creating Location...');
  const locId = await ins('locations', {
    organization_id: orgId, name: 'Ayphen Care - Main Campus', code: 'CHN',
    address: '42, Anna Salai, Chennai 600018', city: 'Chennai', state: 'Tamil Nadu',
    country: 'India', phone: '+91 44 2834 5678', email: 'chennai@ayphencare.com',
    is_main_branch: true, is_active: true,
    settings: JSON.stringify({ operatingHours: '24/7', capacity: 200 })
  });
  console.log('  ✅ Main Campus, Chennai');

  // ===== DEPARTMENTS =====
  console.log('🏢 Creating Departments...');
  const deptNames = [
    ['General Medicine', 'Internal medicine and general healthcare'],
    ['Orthopedics', 'Bone, joint, and musculoskeletal disorders'],
    ['Pediatrics', 'Healthcare for children and adolescents'],
    ['Cardiology', 'Heart and cardiovascular system disorders'],
    ['Laboratory', 'Diagnostic laboratory services'],
    ['Pharmacy', 'Pharmaceutical dispensing and counseling']
  ];
  const deptIds: string[] = [];
  for (const [n, d] of deptNames) {
    deptIds.push(await ins('departments', { organization_id: orgId, name: n, description: d, status: 'active' }));
    console.log(`  ✅ ${n}`);
  }

  // ===== SERVICES =====
  console.log('🩺 Creating Services...');
  const svcData = [
    [deptIds[0], 'General Consultation', 'Outpatient consultation', 20],
    [deptIds[0], 'Follow-up Visit', 'Follow-up treatment', 15],
    [deptIds[1], 'Orthopedic Consultation', 'Bone/joint consultation', 30],
    [deptIds[2], 'Pediatric Consultation', 'Child health', 25],
    [deptIds[3], 'Cardiac Consultation', 'Heart health checkup', 30],
    [deptIds[3], 'ECG', 'Electrocardiogram', 15],
  ];
  const svcIds: string[] = [];
  for (const [dId, n, d, dur] of svcData) {
    svcIds.push(await ins('services', { organization_id: orgId, department_id: dId, name: n, description: d, status: 'active', averageDuration: dur }));
  }
  console.log(`  ✅ ${svcIds.length} Services`);

  // ===== USERS =====
  console.log('👥 Creating Users...');
  const adminId = await ins('users', { organization_id: orgId, location_id: locId, firstName: 'Arjun', lastName: 'Nair', email: 'admin@ayphencare.com', phone: '+919876543210', password: pw, role: 'admin', isActive: true, gender: 'Male', joinDate: ds(daysAgo(365)) });
  console.log('  ✅ Admin: Arjun Nair');

  const doctorId = await ins('users', { organization_id: orgId, location_id: locId, firstName: 'Rajesh', lastName: 'Kumar', email: 'doctor@ayphencare.com', phone: '+919876543211', password: pw, role: 'doctor', isActive: true, gender: 'Male', department_id: deptIds[0], qualification: 'MBBS, MD (General Medicine)', experience: 15, consultationFee: 500, licenseNumber: 'TN-MED-2010-4521', specialization: 'General Medicine', joinDate: ds(daysAgo(730)), workingDays: 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday', availableFrom: '09:00', availableTo: '17:00' });
  console.log('  ✅ Doctor: Dr. Rajesh Kumar');

  const nurseId = await ins('users', { organization_id: orgId, location_id: locId, firstName: 'Lakshmi', lastName: 'Devi', email: 'nurse@ayphencare.com', phone: '+919876543212', password: pw, role: 'nurse', isActive: true, gender: 'Female', department_id: deptIds[0], qualification: 'B.Sc Nursing', experience: 8, joinDate: ds(daysAgo(500)) });
  console.log('  ✅ Nurse: Lakshmi Devi');

  const recepId = await ins('users', { organization_id: orgId, location_id: locId, firstName: 'Kavitha', lastName: 'Sundaram', email: 'receptionist@ayphencare.com', phone: '+919876543213', password: pw, role: 'receptionist', isActive: true, gender: 'Female', joinDate: ds(daysAgo(300)) });
  console.log('  ✅ Receptionist: Kavitha Sundaram');

  const pharmId = await ins('users', { organization_id: orgId, location_id: locId, firstName: 'Venkat', lastName: 'Raman', email: 'pharmacist@ayphencare.com', phone: '+919876543214', password: pw, role: 'pharmacist', isActive: true, gender: 'Male', department_id: deptIds[5], qualification: 'B.Pharm, M.Pharm', experience: 10, licenseNumber: 'TN-PH-2015-1234', joinDate: ds(daysAgo(600)) });
  console.log('  ✅ Pharmacist: Venkat Raman');

  const labId = await ins('users', { organization_id: orgId, location_id: locId, firstName: 'Meena', lastName: 'Iyer', email: 'labtech@ayphencare.com', phone: '+919876543215', password: pw, role: 'lab_technician', isActive: true, gender: 'Female', department_id: deptIds[4], qualification: 'B.Sc MLT', experience: 6, joinDate: ds(daysAgo(400)) });
  console.log('  ✅ Lab Tech: Meena Iyer');

  const acctId = await ins('users', { organization_id: orgId, location_id: locId, firstName: 'Suresh', lastName: 'Pillai', email: 'accountant@ayphencare.com', phone: '+919876543216', password: pw, role: 'accountant', isActive: true, gender: 'Male', qualification: 'B.Com, CA Inter', joinDate: ds(daysAgo(200)) });
  console.log('  ✅ Accountant: Suresh Pillai');

  // ===== PATIENTS =====
  console.log('🧑‍⚕️ Creating 5 Patients...');
  const pts = [
    { firstName: 'Anand', lastName: 'Krishnan', email: 'anand.k@gmail.com', phone: '+919900110001', gender: 'Male', dateOfBirth: '1985-03-15', blood_group: 'O+', address: '12, MG Road, T. Nagar', city: 'Chennai', state: 'Tamil Nadu', marital_status: 'married', father_or_spouse_name: 'Meera Krishnan' },
    { firstName: 'Priya', lastName: 'Sharma', email: 'priya.sharma@gmail.com', phone: '+919900110002', gender: 'Female', dateOfBirth: '1990-07-22', blood_group: 'A+', address: '45, Gandhi Nagar, Adyar', city: 'Chennai', state: 'Tamil Nadu', marital_status: 'single', father_or_spouse_name: 'Ramesh Sharma' },
    { firstName: 'Vikram', lastName: 'Patel', email: 'vikram.patel@gmail.com', phone: '+919900110003', gender: 'Male', dateOfBirth: '1978-11-08', blood_group: 'B+', address: '78, Nehru Street, Mylapore', city: 'Chennai', state: 'Tamil Nadu', marital_status: 'married', father_or_spouse_name: 'Deepa Patel' },
    { firstName: 'Divya', lastName: 'Menon', email: 'divya.menon@gmail.com', phone: '+919900110004', gender: 'Female', dateOfBirth: '1995-01-30', blood_group: 'AB+', address: '23, Lake Area, Nungambakkam', city: 'Chennai', state: 'Tamil Nadu', marital_status: 'single', father_or_spouse_name: 'Gopalan Menon' },
    { firstName: 'Karthik', lastName: 'Rajan', email: 'karthik.rajan@gmail.com', phone: '+919900110005', gender: 'Male', dateOfBirth: '1970-06-12', blood_group: 'O-', address: '56, Anna Nagar West', city: 'Chennai', state: 'Tamil Nadu', marital_status: 'married', father_or_spouse_name: 'Saroja Rajan' },
  ];
  const pIds: string[] = [];
  for (const p of pts) {
    pIds.push(await ins('users', { organization_id: orgId, location_id: locId, ...p, password: pw, role: 'patient', isActive: true, country: 'India', nationality: 'Indian', postalCode: '600018' }));
    console.log(`  ✅ ${p.firstName} ${p.lastName} (${p.blood_group})`);
  }

  // ===== DOCTOR AVAILABILITY =====
  console.log('📅 Creating Doctor Availability...');
  for (const day of ['monday','tuesday','wednesday','thursday','friday','saturday']) {
    await ins('availability_slots', { organization_id: orgId, doctor_id: doctorId, dayOfWeek: day, startTime: '09:00', endTime: '13:00', isActive: true });
    await ins('availability_slots', { organization_id: orgId, doctor_id: doctorId, dayOfWeek: day, startTime: '14:00', endTime: '17:00', isActive: true });
  }
  for (let i = 0; i < 7; i++) {
    const d = daysFromNow(i);
    if (d.getDay() !== 0) await ins('doctor_availability', { organization_id: orgId, doctor_id: doctorId, date: ds(d), startTime: '09:00', endTime: '17:00', slotDurationMinutes: 20, maxPatientsPerDay: 24, status: 'available', isRecurring: false });
  }
  console.log('  ✅ Mon-Sat, 9AM-5PM');

  // ===== MEDICINES =====
  console.log('💊 Creating Medicines...');
  const meds = [
    { name: 'Paracetamol 500mg', genericName: 'Acetaminophen', brandName: 'Dolo 500', manufacturer: 'Micro Labs', category: 'Analgesic', dosageForm: 'tablet', strength: '500mg', unitPrice: 1.5, sellingPrice: 2.0, batchNumber: 'BAT-001', currentStock: 5000, reorderLevel: 500, schedule_type: 'otc', requires_prescription: false },
    { name: 'Amoxicillin 500mg', genericName: 'Amoxicillin', brandName: 'Mox 500', manufacturer: 'Cipla', category: 'Antibiotic', dosageForm: 'capsule', strength: '500mg', unitPrice: 5.0, sellingPrice: 8.0, batchNumber: 'BAT-002', currentStock: 3000, reorderLevel: 300, schedule_type: 'schedule_h', requires_prescription: true },
    { name: 'Metformin 500mg', genericName: 'Metformin HCl', brandName: 'Glycomet', manufacturer: 'USV', category: 'Antidiabetic', dosageForm: 'tablet', strength: '500mg', unitPrice: 2.0, sellingPrice: 3.5, batchNumber: 'BAT-003', currentStock: 4000, reorderLevel: 400, schedule_type: 'schedule_h', requires_prescription: true },
    { name: 'Atorvastatin 10mg', genericName: 'Atorvastatin', brandName: 'Atorva', manufacturer: 'Zydus', category: 'Statin', dosageForm: 'tablet', strength: '10mg', unitPrice: 3.0, sellingPrice: 5.0, batchNumber: 'BAT-004', currentStock: 2500, reorderLevel: 250, schedule_type: 'schedule_h', requires_prescription: true },
    { name: 'Omeprazole 20mg', genericName: 'Omeprazole', brandName: 'Omez', manufacturer: 'Dr. Reddys', category: 'PPI', dosageForm: 'capsule', strength: '20mg', unitPrice: 2.5, sellingPrice: 4.0, batchNumber: 'BAT-005', currentStock: 3500, reorderLevel: 350, schedule_type: 'schedule_h', requires_prescription: true },
    { name: 'Cetirizine 10mg', genericName: 'Cetirizine HCl', brandName: 'Cetzine', manufacturer: 'Alkem', category: 'Antihistamine', dosageForm: 'tablet', strength: '10mg', unitPrice: 1.0, sellingPrice: 1.5, batchNumber: 'BAT-006', currentStock: 4000, reorderLevel: 400, schedule_type: 'otc', requires_prescription: false },
    { name: 'Azithromycin 500mg', genericName: 'Azithromycin', brandName: 'Azithral', manufacturer: 'Alembic', category: 'Antibiotic', dosageForm: 'tablet', strength: '500mg', unitPrice: 15.0, sellingPrice: 22.0, batchNumber: 'BAT-007', currentStock: 2000, reorderLevel: 200, schedule_type: 'schedule_h', requires_prescription: true },
    { name: 'Pantoprazole 40mg', genericName: 'Pantoprazole', brandName: 'Pan 40', manufacturer: 'Alkem', category: 'PPI', dosageForm: 'tablet', strength: '40mg', unitPrice: 3.0, sellingPrice: 5.5, batchNumber: 'BAT-008', currentStock: 3000, reorderLevel: 300, schedule_type: 'schedule_h', requires_prescription: true },
  ];
  const mIds: string[] = []; const mPrices: number[] = [];
  for (const m of meds) {
    mIds.push(await ins('medicines', { organization_id: orgId, ...m, manufactureDate: ds(daysAgo(180)), expiryDate: ds(daysFromNow(365)), isActive: true, is_narcotic: false }));
    mPrices.push(m.sellingPrice);
  }
  console.log(`  ✅ ${mIds.length} Medicines`);

  // ===== LAB TESTS =====
  console.log('🧪 Creating Lab Tests...');
  const lts = [
    { name: 'Complete Blood Count', code: 'CBC', description: 'Full blood count', category: 'hematology', sampleType: 'blood', normalRange: 'WBC:4000-11000', units: 'multiple', cost: 350, turnaroundTimeMinutes: 120 },
    { name: 'Fasting Blood Sugar', code: 'FBS', description: 'Glucose after fasting', category: 'biochemistry', sampleType: 'blood', normalRange: '70-100 mg/dL', units: 'mg/dL', cost: 150, turnaroundTimeMinutes: 60 },
    { name: 'HbA1c', code: 'HBA1C', description: 'Glycated hemoglobin', category: 'biochemistry', sampleType: 'blood', normalRange: '4-5.6%', units: '%', cost: 500, turnaroundTimeMinutes: 180 },
    { name: 'Lipid Profile', code: 'LIPID', description: 'Cholesterol', category: 'biochemistry', sampleType: 'blood', normalRange: 'TC:<200 mg/dL', units: 'mg/dL', cost: 600, turnaroundTimeMinutes: 180 },
    { name: 'Liver Function Test', code: 'LFT', description: 'Liver enzymes', category: 'biochemistry', sampleType: 'blood', normalRange: 'ALT:7-56 U/L', units: 'U/L', cost: 700, turnaroundTimeMinutes: 180 },
    { name: 'Kidney Function Test', code: 'KFT', description: 'Renal function', category: 'biochemistry', sampleType: 'blood', normalRange: 'Creatinine:0.7-1.3', units: 'mg/dL', cost: 600, turnaroundTimeMinutes: 180 },
    { name: 'Thyroid Profile', code: 'THYROID', description: 'T3, T4, TSH', category: 'endocrine', sampleType: 'blood', normalRange: 'TSH:0.4-4.0', units: 'mIU/L', cost: 800, turnaroundTimeMinutes: 240 },
    { name: 'Urine Routine', code: 'URINE-R', description: 'Urine analysis', category: 'pathology', sampleType: 'urine', normalRange: 'pH:4.6-8', units: 'multiple', cost: 200, turnaroundTimeMinutes: 60 },
  ];
  const ltIds: string[] = []; const ltCosts: number[] = [];
  for (const t of lts) {
    ltIds.push(await ins('lab_tests', { organization_id: orgId, ...t, isActive: true }));
    ltCosts.push(t.cost);
  }
  console.log(`  ✅ ${ltIds.length} Lab Tests`);

  // ===== ALLERGIES =====
  console.log('⚠️ Creating Allergies...');
  const allergies = [
    [pIds[0], 'drug', 'Penicillin', 'severe', 'Anaphylaxis'],
    [pIds[1], 'food', 'Peanuts', 'moderate', 'Hives and rash'],
    [pIds[2], 'drug', 'Aspirin', 'mild', 'Stomach upset'],
    [pIds[3], 'environmental', 'Dust Mites', 'moderate', 'Sneezing, runny nose'],
    [pIds[4], 'drug', 'Sulfonamides', 'severe', 'Severe skin rash'],
  ];
  for (const a of allergies) {
    await ins('allergies', { organization_id: orgId, patient_id: a[0], allergenType: a[1], allergenName: a[2], reactionSeverity: a[3], reactionDescription: a[4], isActive: true, dateIdentified: ds(daysAgo(90)), verified_by: doctorId });
  }
  console.log('  ✅ 5 allergies');

  // ===== OPD FLOW =====
  console.log('🏥 Creating OPD Flow...');
  const opd = [
    { pi: 0, si: 0, reason: 'Fever and body ache', db: 5, diag: 'Viral Fever', icd: 'R50.9', cc: 'High fever 102°F', ax: 'Viral fever with myalgia', plan: 'Symptomatic. Rest 3 days.', rx: [[0,'1 tab','3x/day','5d',15],[5,'1 tab','Night','5d',5]], labs: [0,1], v: [120,80,92,38.9,97,72,170], sev: 'moderate' },
    { pi: 1, si: 0, reason: 'Headaches and fatigue', db: 3, diag: 'Tension Headache', icd: 'G44.2', cc: 'Frequent headaches 2 weeks', ax: 'Tension headache, stress. Rule out thyroid.', plan: 'Analgesics, stress mgmt.', rx: [[0,'1 tab','2x/day','7d',14]], labs: [6], v: [110,70,78,36.8,99,58,160], sev: 'mild' },
    { pi: 2, si: 0, reason: 'Diabetes follow-up', db: 7, diag: 'Type 2 Diabetes', icd: 'E11.9', cc: 'Sugar not controlled', ax: 'HbA1c elevated. Dose adjust.', plan: 'Increase Metformin. Diet. F/U 1mo.', rx: [[2,'1 tab','2x/day','30d',60],[3,'1 tab','Night','30d',30]], labs: [1,2,3], v: [140,88,80,36.6,98,85,175], sev: 'moderate' },
    { pi: 3, si: 0, reason: 'Cough and sore throat', db: 2, diag: 'URTI', icd: 'J06.9', cc: 'Dry cough 4 days', ax: 'URTI, no lower resp involvement.', plan: 'Antibiotics. F/U if persists.', rx: [[6,'1 tab','1x/day','3d',3],[4,'1 cap','AM','5d',5]], labs: [0], v: [118,76,88,37.8,96,52,155], sev: 'mild' },
    { pi: 4, si: 4, reason: 'Chest discomfort', db: 1, diag: 'Hypertensive Heart Disease', icd: 'I11.9', cc: 'Chest tightness on exertion', ax: 'HTN with cardiac strain. ECG: LVH.', plan: 'Antihypertensives. Echo.', rx: [[3,'1 tab','Night','30d',30],[7,'1 tab','AM','30d',30]], labs: [3,4,5], v: [160,95,96,36.7,94,90,168], sev: 'severe' },
  ];

  for (let i = 0; i < opd.length; i++) {
    const f = opd[i];
    const st = daysAgo(f.db); st.setHours(9+i,0,0);
    const et = new Date(st); et.setMinutes(et.getMinutes()+20);

    const apptId = await ins('appointments', { organization_id: orgId, patient_id: pIds[f.pi], doctor_id: doctorId, service_id: svcIds[f.si], startTime: ts(st), endTime: ts(et), status: 'completed', reason: f.reason, mode: 'in-person', appointmentType: 'standard', completedAt: ts(et) });
    const visitId = await ins('visits', { organization_id: orgId, patient_id: pIds[f.pi], visit_number: `VIS-2026-${String(i+1).padStart(4,'0')}`, status: 'closed' });
    await AppDataSource.query('UPDATE appointments SET "visitId" = $1 WHERE id = $2', [visitId, apptId]);
    await ins('queue_items', { organization_id: orgId, visit_id: visitId, stage: 'doctor', priority: i===4?'urgent':'standard', token_number: `T-${String(i+1).padStart(3,'0')}`, assigned_doctor_id: doctorId, status: 'served' });
    await ins('triage', { organization_id: orgId, visit_id: visitId, vitals: JSON.stringify({temperature:f.v[3],systolic:f.v[0],diastolic:f.v[1],heartRate:f.v[2],spO2:f.v[4],weight:f.v[5],height:f.v[6]}), symptoms: f.cc, priority: i===4?'urgent':'standard', notes: 'Triage by nursing' });

    const bmi = Math.round((f.v[5]/((f.v[6]/100)**2))*10)/10;
    await ins('vital_signs', { organization_id: orgId, patient_id: pIds[f.pi], recorded_by: nurseId, systolicBp: f.v[0], diastolicBp: f.v[1], heartRate: f.v[2], temperature: f.v[3], temperatureUnit: 'C', oxygenSaturation: f.v[4], weight: f.v[5], weightUnit: 'kg', height: f.v[6], heightUnit: 'cm', bmi, recorded_at: ts(st) });

    const cId = await ins('consultation_notes', { organization_id: orgId, appointment_id: apptId, patient_id: pIds[f.pi], doctor_id: doctorId, chiefComplaint: f.cc, historyPresentIllness: f.reason, physicalExamination: `BP:${f.v[0]}/${f.v[1]},HR:${f.v[2]},T:${f.v[3]}°C,SpO2:${f.v[4]}%`, assessment: f.ax, plan: f.plan, isSigned: true, signedAt: ts(et), signed_by: doctorId });
    await ins('diagnoses', { organization_id: orgId, consultation_id: cId, patient_id: pIds[f.pi], diagnosed_by: doctorId, icd10Code: f.icd, diagnosisName: f.diag, diagnosisType: 'primary', status: 'confirmed', severity: f.sev, onsetDate: ds(st), isChronic: i===2 });

    const rxId = await ins('prescriptions', { organization_id: orgId, patient_id: pIds[f.pi], doctor_id: doctorId, diagnosis: f.diag, prescriptionDate: ds(st), status: 'dispensed', visit_id: visitId, appointment_id: apptId });
    for (const m of f.rx) {
      await ins('prescription_items', { organization_id: orgId, prescription_id: rxId, medicine_id: mIds[m[0] as number], dosage: m[1], frequency: m[2], duration: m[3], quantity: m[4], instructions: 'After meals', status: 'dispensed' });
    }

    if (f.labs.length > 0) {
      const loId = await ins('lab_orders', { organization_id: orgId, orderNumber: `LAB-2026-${String(i+1).padStart(4,'0')}`, doctor_id: doctorId, patient_id: pIds[f.pi], orderDate: ds(st), clinicalNotes: f.ax, diagnosis: f.diag, status: 'completed', isUrgent: false, visit_id: visitId, appointment_id: apptId });
      for (let j = 0; j < f.labs.length; j++) {
        const li = f.labs[j];
        const smpId = await ins('lab_samples', { organization_id: orgId, sampleId: `SMP-${i+1}${j+1}`, sampleType: lts[li].sampleType, collectionTime: ts(st), collected_by: labId, status: 'analyzed' });
        const resId = await ins('lab_results', { organization_id: orgId, resultValue: lts[li].normalRange, units: lts[li].units, referenceRange: lts[li].normalRange, interpretation: 'Within normal limits', flag: 'normal', resultTime: ts(new Date(st.getTime()+3600000)), performed_by: labId, verified_by: doctorId, verificationTime: ts(new Date(st.getTime()+7200000)), isVerified: true });
        await ins('lab_order_items', { organization_id: orgId, lab_order_id: loId, lab_test_id: ltIds[li], status: 'completed', sample_id: smpId, result_id: resId });
      }
    }

    const cFee=500; const lFee=f.labs.reduce((s:number,i:number)=>s+ltCosts[i],0); const mFee=f.rx.reduce((s:number,m:any)=>s+mPrices[m[0]]*(m[4] as number),0); const tot=cFee+lFee+mFee;
    await ins('bills', { organization_id: orgId, patient_id: pIds[f.pi], appointment_id: apptId, visit_id: visitId, billNumber: `BILL-2026-${String(i+1).padStart(4,'0')}`, billType: 'opd', amount: tot, paidAmount: tot, status: 'paid', paymentMethod: 'upi', billDate: ds(st), paidDate: ds(st), description: `OPD - ${f.diag}`, itemDetails: JSON.stringify([{name:'Consultation',qty:1,price:cFee,total:cFee}]), subtotal: tot, grandTotal: tot, balanceDue: 0, discountAmount: 0, waiverAmount: 0, depositAmount: 0, advanceAmount: 0, refundAmount: 0, isCreditBill: false });
    await ins('medical_records', { organization_id: orgId, patient_id: pIds[f.pi], doctor_id: doctorId, type: 'consultation', title: `OPD - ${f.diag}`, description: f.ax, diagnosis: f.diag, treatment: f.plan, recordDate: ds(st) });
    console.log(`  ✅ ${pts[f.pi].firstName}: ${f.diag}`);
  }

  // ===== IPD =====
  console.log('🛏️ Creating IPD...');
  const wardId = await ins('wards', { organization_id: orgId, name: 'General Ward A', wardNumber: 'GW-A', description: 'General medical ward', department_id: deptIds[0], capacity: 20, isActive: true, location: 'Ground Floor' });
  const roomId = await ins('rooms', { organization_id: orgId, roomNumber: 'GW-A-101', ward_id: wardId, roomType: 'semi_private', capacity: 2, dailyRate: 1500, isActive: true, features: 'AC, Bathroom, TV' });
  const b1Id = await ins('beds', { organization_id: orgId, bedNumber: 'GW-A-101-B1', room_id: roomId, status: 'occupied' });
  const b2Id = await ins('beds', { organization_id: orgId, bedNumber: 'GW-A-101-B2', room_id: roomId, status: 'available' });

  const admDt = daysAgo(3);
  const admId = await ins('admissions', { organization_id: orgId, admissionNumber: 'ADM-2026-0001', patient_id: pIds[4], admitting_doctor_id: doctorId, bed_id: b1Id, admissionDateTime: ts(admDt), admissionReason: 'Hypertensive emergency. BP: 180/110.', admissionDiagnosis: 'Hypertensive Heart Disease', status: 'admitted', isEmergency: true, allergies: 'Sulfonamides', specialInstructions: 'BP monitoring q2h. Low salt diet.' });
  await AppDataSource.query('UPDATE beds SET current_admission_id = $1 WHERE id = $2', [admId, b1Id]);

  await ins('doctor_notes', { organization_id: orgId, admission_id: admId, doctor_id: doctorId, noteDateTime: ts(admDt), subjective: 'Severe chest tightness. HTN 5 years.', objective: 'BP:180/110, HR:96, SpO2:94%. ECG:LVH.', assessment: 'Hypertensive emergency with LVH.', plan: 'IV Labetalol. Troponin stat. Echo tomorrow.', noteType: 'admission' });
  await ins('doctor_notes', { organization_id: orgId, admission_id: admId, doctor_id: doctorId, noteDateTime: ts(daysAgo(2)), subjective: 'Improving. Chest tightness reduced.', objective: 'BP:150/90, HR:82, SpO2:97%. Troponin neg.', assessment: 'Responding to treatment. No ACS.', plan: 'Oral meds. Plan discharge 1-2 days.', noteType: 'progress' });
  await ins('nursing_notes', { organization_id: orgId, admission_id: admId, nurse_id: nurseId, noteDateTime: ts(admDt), notes: 'Admitted via ER. IV line secured. Meds started.', noteType: 'assessment' });
  await ins('nursing_notes', { organization_id: orgId, admission_id: admId, nurse_id: nurseId, noteDateTime: ts(daysAgo(2)), notes: 'Morning care done. Patient comfortable.', noteType: 'routine' });
  await ins('nursing_notes', { organization_id: orgId, admission_id: admId, nurse_id: nurseId, noteDateTime: ts(daysAgo(1)), notes: 'Patient stable. Diet taken well.', noteType: 'routine' });

  const ipVitals = [[72,37.2,96,20,180,110,94,90,'6'],[64,37.0,90,18,170,100,95,90,'5'],[56,36.8,86,18,160,95,96,90,'4'],[48,36.9,84,16,155,92,97,89,'3'],[40,36.7,82,16,150,90,97,89,'3'],[32,36.8,80,16,145,88,98,89,'2'],[24,36.6,78,16,140,85,98,89,'2'],[16,36.7,76,15,138,84,98,89,'1'],[8,36.6,74,15,135,82,99,89,'1']];
  for (const v of ipVitals) {
    await ins('inpatient_vital_signs', { organization_id: orgId, admission_id: admId, recorded_by: nurseId, recordedAt: ts(new Date(Date.now()-(v[0] as number)*3600000)), temperature: v[1], heartRate: v[2], respiratoryRate: v[3], systolicBP: v[4], diastolicBP: v[5], oxygenSaturation: v[6], weight: v[7], painScore: v[8] });
  }

  for (const ma of [[70,'IV Labetalol','20mg bolus','IV'],[66,'IV Labetalol','40mg infusion','IV'],[48,'Amlodipine','5mg tab','Oral'],[36,'Atorvastatin','10mg tab','Oral'],[24,'Amlodipine','5mg tab','Oral'],[12,'Pantoprazole','40mg tab','Oral']]) {
    await ins('medication_administrations', { organization_id: orgId, admission_id: admId, administered_by: nurseId, administeredAt: ts(new Date(Date.now()-(ma[0] as number)*3600000)), medication: ma[1], dosage: ma[2], route: ma[3] });
  }

  const ipdT = 1500*3+2500;
  await ins('bills', { organization_id: orgId, patient_id: pIds[4], admission_id: admId, billNumber: 'BILL-2026-0006', billType: 'ipd', amount: ipdT, paidAmount: 0, status: 'pending', billDate: ds(admDt), description: 'IPD - Hypertensive Emergency', itemDetails: JSON.stringify([{name:'Room x3',qty:3,price:1500,total:4500},{name:'Meds',qty:1,price:2000,total:2000},{name:'Nursing',qty:1,price:500,total:500}]), subtotal: ipdT, grandTotal: ipdT, balanceDue: ipdT, discountAmount: 0, waiverAmount: 0, depositAmount: 0, advanceAmount: 0, refundAmount: 0, isCreditBill: false });
  console.log('  ✅ Karthik Rajan admitted (cardiac, 3 days)');

  // ===== SUPPLIERS =====
  console.log('📦 Creating Suppliers...');
  await ins('suppliers', { organization_id: orgId, name: 'MedPharma Distributors', contactPerson: 'Ravi Kumar', phone: '+919845012345', email: 'orders@medpharma.in', address: 'Ambattur, Chennai', isActive: true });
  await ins('suppliers', { organization_id: orgId, name: 'LabEquip India', contactPerson: 'Sanjay Gupta', phone: '+919845012346', email: 'sales@labequip.in', address: 'Guindy, Chennai', isActive: true });
  console.log('  ✅ 2 Suppliers');

  // ===== BLOOD BANK =====
  console.log('🩸 Creating Blood Bank...');
  const donId = await ins('blood_donors', { organization_id: orgId, location_id: locId, donorNumber: 'BD-001', firstName: 'Mohan', lastName: 'Das', dateOfBirth: '1988-05-20', gender: 'Male', bloodGroup: 'O+', phone: '+919900220001', city: 'Chennai', state: 'Tamil Nadu', weight: 75, hemoglobin: 14.5, totalDonations: 3, lastDonationDate: ds(daysAgo(120)), isDeferral: false, isActive: true, consentGiven: true, consentDate: ds(daysAgo(120)) });
  await ins('blood_inventory', { organization_id: orgId, location_id: locId, bagNumber: 'BB-001', donor_id: donId, bloodGroup: 'O+', component: 'whole_blood', volume: 450, collectionDate: ds(daysAgo(5)), expiryDate: ds(daysFromNow(30)), storageTemp: '2-6°C', status: 'available', testResults: JSON.stringify({hiv:'neg',hbsag:'neg',hcv:'neg',vdrl:'neg',malaria:'neg'}) });
  console.log('  ✅ 1 donor + 1 bag');

  // ===== DIALYSIS =====
  console.log('🔬 Creating Dialysis...');
  const machId = await ins('dialysis_machines', { organization_id: orgId, location_id: locId, machineNumber: 'DM-001', brand: 'Fresenius', model: '5008S', serialNumber: 'FRE-001', status: 'available', lastMaintenanceDate: ds(daysAgo(30)), nextMaintenanceDate: ds(daysFromNow(60)), totalSessions: 150, installationDate: ds(daysAgo(365)), warrantyExpiry: ds(daysFromNow(365)), isActive: true });
  await ins('dialysis_sessions', { organization_id: orgId, location_id: locId, sessionNumber: 'DS-001', patient_id: pIds[2], doctor_id: doctorId, nurse_id: nurseId, machine_id: machId, scheduledDate: ds(daysFromNow(2)), scheduledTime: '09:00', sessionType: 'hemodialysis', status: 'scheduled', durationMinutes: 240, dialyzerType: 'FX80', dialyzerReuse: 1, accessType: 'avf', accessSite: 'Left forearm', preWeight: 85, preBP: '140/90', preHR: 80, billingStatus: 'not_billed' });
  console.log('  ✅ 1 machine + 1 session');

  // ===== OT =====
  console.log('🔪 Creating OT...');
  const otId = await ins('ot_rooms', { organization_id: orgId, location_id: locId, name: 'OT Room 1', code: 'OT-01', type: 'major', status: 'available', floor: '2nd Floor', capacity: 1, equipment: JSON.stringify([{name:'ESU',status:'working'}]), features: JSON.stringify({hasLaminarFlow:true,hasCArm:true}), isActive: true });
  await ins('surgeries', { organization_id: orgId, location_id: locId, ot_room_id: otId, patient_id: pIds[2], primary_surgeon_id: doctorId, surgeryNumber: 'SURG-001', procedureName: 'Appendectomy', procedureCode: '44960', surgeryType: 'elective', priority: 'elective', scheduledDate: ds(daysFromNow(5)), scheduledStartTime: '10:00', scheduledEndTime: '12:00', status: 'scheduled', preOpDiagnosis: 'Chronic appendicitis', anesthesiaType: 'general', estimatedDuration: 120, consentObtained: true, billingStatus: 'not_billed' });
  console.log('  ✅ 1 OT + 1 surgery');

  // ===== PHYSIOTHERAPY =====
  console.log('🤸 Creating Physiotherapy...');
  const ptId = await ins('physiotherapy_orders', { organization_id: orgId, order_number: 'PT-001', patient_id: pIds[2], doctor_id: doctorId, diagnosis: 'Lower back pain', treatment_type: 'Spinal Rehab', body_part: 'Lower Back', total_sessions: 10, completed_sessions: 2, session_duration_minutes: 45, frequency: '3x/week', status: 'in_progress', instructions: 'Core strengthening', goals: 'Reduce pain', start_date: ds(daysAgo(10)), end_date: ds(daysFromNow(20)) });
  await ins('physiotherapy_sessions', { organization_id: orgId, order_id: ptId, session_number: 1, scheduled_date: ds(daysAgo(10)), actual_date: ds(daysAgo(10)), status: 'completed', notes: 'Initial assessment', pain_level_before: 7, pain_level_after: 5, progress: 'Baseline set' });
  await ins('physiotherapy_sessions', { organization_id: orgId, order_id: ptId, session_number: 2, scheduled_date: ds(daysAgo(7)), actual_date: ds(daysAgo(7)), status: 'completed', notes: 'Core exercises started', pain_level_before: 6, pain_level_after: 4, progress: 'Improving' });
  await ins('physiotherapy_sessions', { organization_id: orgId, order_id: ptId, session_number: 3, scheduled_date: ds(daysFromNow(1)), status: 'scheduled' });
  console.log('  ✅ 1 order + 3 sessions');

  // ===== DIET =====
  console.log('🍽️ Creating Diet...');
  await ins('diet_orders', { organization_id: orgId, patient_id: pIds[4], admission_id: admId, dietType: 'cardiac', mealType: 'all', specialInstructions: 'Low sodium. No fried food.', allergies: 'Sulfonamides', restrictions: 'Salt,Fried,Red meat', startDate: ds(admDt), status: 'active', ordered_by_id: doctorId, ward_bed: 'GW-A-101-B1', calorieTarget: 1800, proteinTarget: 60 });
  console.log('  ✅ Cardiac diet');

  // ===== HOUSEKEEPING =====
  console.log('🧹 Creating Housekeeping...');
  await ins('housekeeping_tasks', { organization_id: orgId, task_number: 'HK-001', ward_id: wardId, bed_id: b2Id, task_type: 'sanitization', priority: 'routine', status: 'completed', assigned_to_id: adminId, assigned_by_id: nurseId, scheduled_time: ts(daysAgo(1)), started_at: ts(daysAgo(1)), completed_at: ts(daysAgo(1)), verified_at: ts(daysAgo(1)), verified_by_id: nurseId, turnaround_minutes: 30 });
  await ins('housekeeping_tasks', { organization_id: orgId, task_number: 'HK-002', ward_id: wardId, location_name: 'Ward A Common Area', task_type: 'cleaning', priority: 'routine', status: 'pending', assigned_by_id: nurseId, scheduled_time: ts(new Date()) });
  console.log('  ✅ 2 tasks');

  // ===== STAFF ATTENDANCE =====
  console.log('📋 Creating Attendance...');
  for (const sId of [doctorId, nurseId, recepId, pharmId, labId, acctId]) {
    for (let d = 3; d >= 0; d--) {
      const dt = daysAgo(d);
      if (dt.getDay() !== 0) {
        const ci = new Date(dt); ci.setHours(8, 55+Math.floor(Math.random()*10), 0);
        const co = new Date(dt); co.setHours(17, Math.floor(Math.random()*30), 0);
        await ins('staff_attendance', { organization_id: orgId, staff_id: sId, date: ds(dt), clock_in_time: ts(ci), clock_out_time: d===0?null:ts(co), hours_worked: d===0?null:8, status: 'present', overtime: 0, marked_by_id: adminId });
      }
    }
  }
  console.log('  ✅ 4 days attendance');

  // ===== VISITORS =====
  console.log('👥 Creating Visitors...');
  const v2d = daysAgo(2);
  await ins('inpatient_visitors', { organization_id: orgId, pass_number: 'VP-001', visitor_name: 'Saroja Rajan', phone: '+919900330001', relationship: 'Wife', patient_id: pIds[4], admission_id: admId, purpose: 'Visit spouse', visit_date: ds(v2d), check_in_time: ts(new Date(v2d.getFullYear(),v2d.getMonth(),v2d.getDate(),10,0)), check_out_time: ts(new Date(v2d.getFullYear(),v2d.getMonth(),v2d.getDate(),12,0)), status: 'checked_out', id_type: 'Aadhaar', id_number: '9876-5432-1098', approved_by_id: nurseId });
  const tod = new Date();
  await ins('inpatient_visitors', { organization_id: orgId, pass_number: 'VP-002', visitor_name: 'Arun Rajan', phone: '+919900330002', relationship: 'Son', patient_id: pIds[4], admission_id: admId, purpose: 'Visit father', visit_date: ds(tod), check_in_time: ts(new Date(tod.getFullYear(),tod.getMonth(),tod.getDate(),15,0)), status: 'checked_in', id_type: 'DL', id_number: 'TN-DL-1234', approved_by_id: nurseId });
  console.log('  ✅ 2 visitors');

  // ===== NOTIFICATIONS =====
  console.log('🔔 Creating Notifications...');
  for (const [uid, typ, ttl, msg] of [
    [pIds[0],'appointment_confirmed','Appointment Done','Consultation with Dr. Rajesh completed.'],
    [pIds[4],'general','Admission Confirmed','Admitted to General Ward A, Bed B1.'],
    [doctorId,'test_result_ready','Lab Results','Results for Karthik Rajan ready.'],
    [nurseId,'general','Vital Alert','Karthik Rajan BP 180/110.'],
    [pharmId,'prescription_new','New Rx','5 prescriptions pending.']
  ]) {
    await ins('notifications', { organization_id: orgId, user_id: uid, type: typ, title: ttl, message: msg, priority: 'medium', isRead: false });
  }
  console.log('  ✅ 5 notifications');

  // ===== FUTURE APPOINTMENTS =====
  console.log('📅 Creating Future Appointments...');
  for (let i = 0; i < 3; i++) {
    const [pid, sid, rsn, dn] = [[pIds[0],svcIds[1],'Follow-up viral fever',3],[pIds[2],svcIds[0],'Diabetes follow-up',14],[pIds[3],svcIds[0],'URTI follow-up',7]][i];
    const s = daysFromNow(dn as number); s.setHours(10+i,0,0);
    const e = new Date(s); e.setMinutes(e.getMinutes()+20);
    await ins('appointments', { organization_id: orgId, patient_id: pid, doctor_id: doctorId, service_id: sid, startTime: ts(s), endTime: ts(e), status: 'confirmed', reason: rsn, mode: 'in-person', appointmentType: 'standard' });
  }
  console.log('  ✅ 3 future appointments');

  // ===== SUPER ADMIN =====
  console.log('👑 Creating Super Admin...');
  await ins('users', { firstName: 'Super', lastName: 'Admin', email: 'superadmin@ayphencare.com', phone: '+919876540000', password: pw, role: 'super_admin', isActive: true, gender: 'Male' });
  console.log('  ✅ superadmin@ayphencare.com');

  // ===== DONE =====
  console.log('\n' + '='.repeat(55));
  console.log('🎉 AYPHEN CARE HOSPITAL SEED COMPLETE!');
  console.log('='.repeat(55));
  console.log('\n👥 Logins (password: Password@123):');
  console.log('  superadmin@ayphencare.com | admin@ayphencare.com');
  console.log('  doctor@ayphencare.com     | nurse@ayphencare.com');
  console.log('  receptionist@ayphencare.com | pharmacist@ayphencare.com');
  console.log('  labtech@ayphencare.com   | accountant@ayphencare.com');
  console.log('  Patients: anand.k / priya.sharma / vikram.patel / divya.menon / karthik.rajan @gmail.com');
  console.log('\n📊 Data: 5 OPD visits + 3 future appts + 1 IPD admission');
  console.log('   6 bills, 5 Rx, 5 lab orders, blood bank, dialysis, OT, physio, diet\n');
}

async function main() {
  try {
    await AppDataSource.initialize();
    await seedAyphenComplete();
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}
main();
