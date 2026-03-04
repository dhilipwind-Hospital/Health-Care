/**
 * Supplementary Seed: Complete Patient Data for Lunaris HMS
 *
 * Adds missing data on top of seed-lunaris-hms.ts:
 * - Vital signs for each patient visit
 * - Visit & Queue records (OPD flow)
 * - Triage records
 * - Notifications (appointment, prescription, lab, system)
 * - Messages (patient-doctor conversations)
 * - Reminders (medication, follow-up, appointment)
 * - Feedback & Appointment Feedback (ratings/reviews)
 * - Consent records (treatment, data, telemedicine)
 * - Emergency requests
 * - Lab results for completed lab orders
 * - Referrals (cross-department)
 *
 * Run AFTER seed-lunaris-hms.ts
 * Usage: npx ts-node src/scripts/seed-lunaris-complete-data.ts
 */

import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import { UserRole } from '../types/roles';
import { Appointment, AppointmentStatus } from '../models/Appointment';
import { Department } from '../models/Department';
import { VitalSigns, TemperatureUnit, WeightUnit, HeightUnit } from '../models/VitalSigns';
import { Visit } from '../models/Visit';
import { QueueItem } from '../models/QueueItem';
import { Triage } from '../models/Triage';
import { Notification, NotificationType, NotificationPriority } from '../models/Notification';
import { Message, MessageStatus } from '../models/Message';
import { Reminder, ReminderType, ReminderStatus } from '../models/Reminder';
import { Feedback, FeedbackType, FeedbackStatus } from '../models/Feedback';
import { AppointmentFeedback } from '../models/AppointmentFeedback';
import { ConsentRecord, ConsentType, ConsentStatus } from '../models/ConsentRecord';
import { EmergencyRequest, EmergencyStatus, EmergencyPriority } from '../models/EmergencyRequest';
import { LabResult } from '../models/LabResult';
import { LabOrder } from '../models/LabOrder';
import { LabOrderItem } from '../models/LabOrderItem';
import { Referral } from '../models/Referral';

// ======================== HELPERS ========================
function daysAgo(n: number): Date {
  const d = new Date(); d.setDate(d.getDate() - n); return d;
}
function daysFromNow(n: number): Date {
  const d = new Date(); d.setDate(d.getDate() + n); return d;
}
function hoursAgo(n: number): Date {
  return new Date(Date.now() - n * 3600000);
}

// ======================== MAIN ========================
export async function seedLunarisCompleteData() {
  // Get repos
  const orgRepo = AppDataSource.getRepository(Organization);
  const userRepo = AppDataSource.getRepository(User);
  const apptRepo = AppDataSource.getRepository(Appointment);
  const deptRepo = AppDataSource.getRepository(Department);
  const vitalsRepo = AppDataSource.getRepository(VitalSigns);
  const visitRepo = AppDataSource.getRepository(Visit);
  const queueRepo = AppDataSource.getRepository(QueueItem);
  const triageRepo = AppDataSource.getRepository(Triage);
  const notifRepo = AppDataSource.getRepository(Notification);
  const msgRepo = AppDataSource.getRepository(Message);
  const reminderRepo = AppDataSource.getRepository(Reminder);
  const feedbackRepo = AppDataSource.getRepository(Feedback);
  const apptFeedbackRepo = AppDataSource.getRepository(AppointmentFeedback);
  const consentRepo = AppDataSource.getRepository(ConsentRecord);
  const emergencyRepo = AppDataSource.getRepository(EmergencyRequest);
  const labResultRepo = AppDataSource.getRepository(LabResult);
  const labOrderRepo = AppDataSource.getRepository(LabOrder);
  const labOrderItemRepo = AppDataSource.getRepository(LabOrderItem);
  const referralRepo = AppDataSource.getRepository(Referral);

  // Find Lunaris org
  const org = await orgRepo.findOne({ where: { subdomain: 'lunaris-hms' } });
  if (!org) {
    console.log('❌ Lunaris HMS org not found. Run seed-lunaris-hms.ts first.');
    return;
  }
  const orgId = org.id;

  // Load users by role
  const patients = await userRepo.find({ where: { organizationId: orgId, role: UserRole.PATIENT }, order: { createdAt: 'ASC' } });
  const doctors = await userRepo.find({ where: { organizationId: orgId, role: UserRole.DOCTOR }, order: { createdAt: 'ASC' } });
  const nurses = await userRepo.find({ where: { organizationId: orgId, role: UserRole.NURSE }, order: { createdAt: 'ASC' } });
  const admin = await userRepo.findOne({ where: { organizationId: orgId, role: UserRole.ADMIN } });
  const labTech = await userRepo.findOne({ where: { organizationId: orgId, role: UserRole.LAB_TECHNICIAN } });
  const pharmacist = await userRepo.findOne({ where: { organizationId: orgId, role: UserRole.PHARMACIST } });
  const receptionist = await userRepo.findOne({ where: { organizationId: orgId, role: UserRole.RECEPTIONIST } });

  // Load completed appointments
  const completedAppts = await apptRepo.find({
    where: { organizationId: orgId, status: AppointmentStatus.COMPLETED },
    relations: ['patient', 'doctor', 'service'],
    order: { startTime: 'ASC' }
  });

  // Load all appointments
  const allAppts = await apptRepo.find({
    where: { organizationId: orgId },
    relations: ['patient', 'doctor'],
    order: { startTime: 'ASC' }
  });

  // Load departments
  const departments = await deptRepo.find({ where: { organizationId: orgId } });
  const deptByName = new Map(departments.map(d => [d.name, d]));

  // Load lab orders with items
  const labOrders = await labOrderRepo.find({
    where: { organizationId: orgId },
    relations: ['items']
  });

  console.log(`📊 Found: ${patients.length} patients, ${doctors.length} doctors, ${completedAppts.length} completed appts, ${labOrders.length} lab orders\n`);

  // ================================================================
  // 1. VITAL SIGNS (for each completed appointment)
  // ================================================================
  const vitalsData = [
    // Patient 0 (Ramesh) - Visit 1: High sugar, high BP
    { patientIdx: 0, doctorIdx: 0, nurseIdx: 0, systolic: 148, diastolic: 92, hr: 82, rr: 18, temp: 98.4, spo2: 97, weight: 82, height: 170, pain: 2, daysAgo: 30 },
    // Patient 0 (Ramesh) - Visit 2: Slightly improved
    { patientIdx: 0, doctorIdx: 0, nurseIdx: 0, systolic: 140, diastolic: 88, hr: 78, rr: 16, temp: 98.2, spo2: 98, weight: 81, height: 170, pain: 1, daysAgo: 15 },
    // Patient 1 (Kavitha) - Cardiology visit
    { patientIdx: 1, doctorIdx: 1, nurseIdx: 2, systolic: 130, diastolic: 85, hr: 92, rr: 18, temp: 98.6, spo2: 97, weight: 65, height: 162, pain: 3, daysAgo: 20 },
    // Patient 1 (Kavitha) - Echo visit
    { patientIdx: 1, doctorIdx: 1, nurseIdx: 2, systolic: 126, diastolic: 82, hr: 76, rr: 16, temp: 98.0, spo2: 98, weight: 64.5, height: 162, pain: 0, daysAgo: 10 },
    // Patient 2 (Arjun) - Emergency visit
    { patientIdx: 2, doctorIdx: 2, nurseIdx: 0, systolic: 135, diastolic: 80, hr: 98, rr: 20, temp: 99.1, spo2: 96, weight: 78, height: 178, pain: 8, daysAgo: 7 },
    // Patient 3 (Priya child) - Pediatric checkup
    { patientIdx: 3, doctorIdx: 3, nurseIdx: 1, systolic: 90, diastolic: 60, hr: 100, rr: 22, temp: 98.6, spo2: 99, weight: 18, height: 108, pain: 0, daysAgo: 60 },
    // Patient 4 (Shalini) - Prenatal visit
    { patientIdx: 4, doctorIdx: 4, nurseIdx: 0, systolic: 118, diastolic: 72, hr: 84, rr: 18, temp: 98.4, spo2: 98, weight: 62, height: 158, pain: 1, daysAgo: 90 },
  ];
  for (const v of vitalsData) {
    const vs = vitalsRepo.create({
      organizationId: orgId,
      patient: patients[v.patientIdx],
      recordedBy: nurses[v.nurseIdx] || doctors[v.doctorIdx],
      systolicBp: v.systolic,
      diastolicBp: v.diastolic,
      heartRate: v.hr,
      respiratoryRate: v.rr,
      temperature: v.temp,
      temperatureUnit: TemperatureUnit.FAHRENHEIT,
      oxygenSaturation: v.spo2,
      weight: v.weight,
      weightUnit: WeightUnit.KG,
      height: v.height,
      heightUnit: HeightUnit.CM,
      bmi: Math.round((v.weight / ((v.height / 100) ** 2)) * 10) / 10,
      painScale: v.pain,
      recordedAt: daysAgo(v.daysAgo)
    });
    await vitalsRepo.save(vs);
  }
  console.log(`✅ ${vitalsData.length} vital sign records created`);

  // ================================================================
  // 2. VISITS & QUEUE ITEMS (OPD flow for completed appointments)
  // ================================================================
  let visitCount = 0;
  const visits: Visit[] = [];
  for (let i = 0; i < Math.min(completedAppts.length, 6); i++) {
    const appt = completedAppts[i];
    const visitNum = `LNR-V-${String(i + 1).padStart(4, '0')}`;
    const visit = visitRepo.create({
      organizationId: orgId,
      patientId: appt.patient.id,
      visitNumber: visitNum,
      status: 'closed' as any
    });
    await visitRepo.save(visit);
    visits.push(visit);
    visitCount++;

    // Queue stages: reception → triage → doctor → billing (all served)
    const stages: Array<{ stage: string; priority: string; token: string }> = [
      { stage: 'reception', priority: 'standard', token: `R-${String(i + 1).padStart(3, '0')}` },
      { stage: 'triage', priority: 'standard', token: `T-${String(i + 1).padStart(3, '0')}` },
      { stage: 'doctor', priority: appt.appointmentType === 'emergency' ? 'emergency' : 'standard', token: `D-${String(i + 1).padStart(3, '0')}` },
      { stage: 'billing', priority: 'standard', token: `B-${String(i + 1).padStart(3, '0')}` }
    ];
    for (const s of stages) {
      const qi = queueRepo.create({
        organizationId: orgId,
        visitId: visit.id,
        stage: s.stage as any,
        priority: s.priority as any,
        tokenNumber: s.token,
        assignedDoctorId: s.stage === 'doctor' ? appt.doctor?.id : undefined,
        status: 'served' as any
      });
      await queueRepo.save(qi);
    }
  }

  // Active visit (in-progress appointment)
  const inProgressAppt = allAppts.find(a => a.status === AppointmentStatus.IN_PROGRESS);
  if (inProgressAppt) {
    const activeVisit = visitRepo.create({
      organizationId: orgId,
      patientId: inProgressAppt.patient.id,
      visitNumber: `LNR-V-${String(visitCount + 1).padStart(4, '0')}`,
      status: 'with_doctor' as any
    });
    await visitRepo.save(activeVisit);
    visits.push(activeVisit);
    visitCount++;

    // Active queue items
    await queueRepo.save(queueRepo.create({ organizationId: orgId, visitId: activeVisit.id, stage: 'reception' as any, priority: 'standard' as any, tokenNumber: `R-${String(visitCount).padStart(3, '0')}`, status: 'served' as any }));
    await queueRepo.save(queueRepo.create({ organizationId: orgId, visitId: activeVisit.id, stage: 'triage' as any, priority: 'standard' as any, tokenNumber: `T-${String(visitCount).padStart(3, '0')}`, status: 'served' as any }));
    await queueRepo.save(queueRepo.create({ organizationId: orgId, visitId: activeVisit.id, stage: 'doctor' as any, priority: 'standard' as any, tokenNumber: `D-${String(visitCount).padStart(3, '0')}`, assignedDoctorId: inProgressAppt.doctor?.id, status: 'called' as any }));
  }
  console.log(`✅ ${visitCount} visits with queue items created`);

  // ================================================================
  // 3. TRIAGE RECORDS (for visits)
  // ================================================================
  const triageData = [
    { visitIdx: 0, vitals: { temperature: 98.4, systolic: 148, diastolic: 92, heartRate: 82, spo2: 97, weight: 82, height: 170 }, symptoms: 'Persistent fatigue, increased thirst, frequent urination for 3 weeks', allergies: 'Penicillin (severe – anaphylaxis)', currentMeds: 'None', painScale: 2, priority: 'standard' as const, notes: 'First visit. Blood sugar check recommended.' },
    { visitIdx: 1, vitals: { temperature: 98.2, systolic: 140, diastolic: 88, heartRate: 78, spo2: 98, weight: 81, height: 170 }, symptoms: 'Follow-up for diabetes. Mild ankle swelling.', allergies: 'Penicillin', currentMeds: 'Metformin 500mg BD', painScale: 1, priority: 'standard' as const, notes: 'Diabetes follow-up. Monitor BP.' },
    { visitIdx: 2, vitals: { temperature: 98.6, systolic: 130, diastolic: 85, heartRate: 92, spo2: 97, weight: 65, height: 162 }, symptoms: 'Palpitations, chest tightness on exertion. Referred from Gen Med.', allergies: 'Latex (contact dermatitis)', currentMeds: 'Eltroxin 50mcg', painScale: 3, priority: 'urgent' as const, notes: 'Cardiology referral. ECG ordered.' },
    { visitIdx: 4, vitals: { temperature: 99.1, systolic: 135, diastolic: 80, heartRate: 98, spo2: 96, weight: 78, height: 178 }, symptoms: 'Acute right knee injury – twisted during football. Unable to bear weight. Heard a pop.', allergies: 'Ibuprofen/NSAIDs (urticaria, bronchospasm)', currentMeds: 'None', painScale: 8, priority: 'emergency' as const, notes: 'Emergency – suspected ACL tear. Ortho consult stat.' },
    { visitIdx: 5, vitals: { temperature: 98.6, systolic: 90, diastolic: 60, heartRate: 100, spo2: 99, weight: 18, height: 108 }, symptoms: 'Routine pediatric checkup. No acute complaints.', allergies: 'Peanuts (severe anaphylaxis – carries epinephrine)', currentMeds: 'None', painScale: 0, priority: 'standard' as const, notes: 'Growth assessment. Immunization schedule review.' },
  ];
  for (const td of triageData) {
    if (visits[td.visitIdx]) {
      const t = triageRepo.create({
        organizationId: orgId,
        visitId: visits[td.visitIdx].id,
        vitals: td.vitals,
        symptoms: td.symptoms,
        allergies: td.allergies,
        currentMeds: td.currentMeds,
        painScale: td.painScale,
        priority: td.priority,
        notes: td.notes
      });
      await triageRepo.save(t);
    }
  }
  console.log(`✅ ${triageData.length} triage records created`);

  // ================================================================
  // 4. NOTIFICATIONS (diverse types for all patients)
  // ================================================================
  const notifConfigs = [
    // Patient 0 (Ramesh) – appointment + prescription + lab
    { userIdx: 0, type: NotificationType.APPOINTMENT_CONFIRMED, priority: NotificationPriority.MEDIUM, title: 'Appointment Confirmed', message: 'Your appointment with Dr. Rajesh Iyer on tomorrow at 9:30 AM has been confirmed.', actionUrl: '/appointments', read: false, daysAgo: 1 },
    { userIdx: 0, type: NotificationType.PRESCRIPTION_READY, priority: NotificationPriority.HIGH, title: 'Prescription Ready for Pickup', message: 'Your prescription (Metformin 500mg, Amlodipine 5mg) has been dispensed and is ready for pickup at the pharmacy.', actionUrl: '/prescriptions', read: true, daysAgo: 15 },
    { userIdx: 0, type: NotificationType.TEST_RESULT_READY, priority: NotificationPriority.HIGH, title: 'Lab Results Available', message: 'Your lab results (CBC, HbA1c, Lipid Profile, FBG) are now available. Please review with your doctor.', actionUrl: '/lab-results', read: true, daysAgo: 13 },
    { userIdx: 0, type: NotificationType.APPOINTMENT_REMINDER, priority: NotificationPriority.MEDIUM, title: 'Appointment Reminder', message: 'Reminder: You have an appointment tomorrow at 9:30 AM with Dr. Rajesh Iyer for chronic disease follow-up.', actionUrl: '/appointments', read: false, daysAgo: 0 },

    // Patient 1 (Kavitha) – referral + telemedicine
    { userIdx: 1, type: NotificationType.APPOINTMENT_NEW, priority: NotificationPriority.MEDIUM, title: 'New Appointment Scheduled', message: 'A telemedicine follow-up has been scheduled with Dr. Priya Nair (Cardiology) in 3 days.', actionUrl: '/appointments', read: true, daysAgo: 5 },
    { userIdx: 1, type: NotificationType.PRESCRIPTION_NEW, priority: NotificationPriority.MEDIUM, title: 'New Prescription', message: 'Dr. Priya Nair has prescribed Atorvastatin 10mg and Clopidogrel 75mg. Collect from pharmacy.', actionUrl: '/prescriptions', read: false, daysAgo: 20 },
    { userIdx: 1, type: NotificationType.TEST_RESULT_READY, priority: NotificationPriority.HIGH, title: 'Lipid Profile Results Ready', message: 'Your Lipid Profile results are available. TC: 242 mg/dL (high). Discuss with Dr. Priya Nair.', actionUrl: '/lab-results', read: true, daysAgo: 8 },

    // Patient 2 (Arjun) – emergency + follow-up
    { userIdx: 2, type: NotificationType.EMERGENCY_NEW, priority: NotificationPriority.URGENT, title: 'Emergency Visit Recorded', message: 'Your emergency visit for knee injury has been recorded. Dr. Karthik Subramanian is your treating doctor.', actionUrl: '/appointments', read: true, daysAgo: 7 },
    { userIdx: 2, type: NotificationType.APPOINTMENT_CANCELLED, priority: NotificationPriority.MEDIUM, title: 'Appointment Cancelled', message: 'Your follow-up appointment has been cancelled. Please reschedule at your convenience.', actionUrl: '/appointments', read: true, daysAgo: 2 },
    { userIdx: 2, type: NotificationType.APPOINTMENT_RESCHEDULED, priority: NotificationPriority.MEDIUM, title: 'Appointment Rescheduled', message: 'Your orthopedic follow-up has been rescheduled to 4 days from now with Dr. Karthik.', actionUrl: '/appointments', read: false, daysAgo: 2 },

    // Patient 3 (Priya child) – immunization reminder
    { userIdx: 3, type: NotificationType.APPOINTMENT_CONFIRMED, priority: NotificationPriority.HIGH, title: 'Immunization Appointment Confirmed', message: 'DPT booster vaccination appointment confirmed with Dr. Meenakshi Sundaram in 2 days.', actionUrl: '/appointments', read: true, daysAgo: 3 },

    // System announcements (all patients)
    { userIdx: 0, type: NotificationType.SYSTEM_ANNOUNCEMENT, priority: NotificationPriority.LOW, title: 'Hospital Working Hours Update', message: 'Lunaris Hospital will have extended OPD hours on Saturdays (7 AM - 6 PM) starting next week.', actionUrl: null, read: false, daysAgo: 2 },
    { userIdx: 1, type: NotificationType.SYSTEM_ANNOUNCEMENT, priority: NotificationPriority.LOW, title: 'Hospital Working Hours Update', message: 'Lunaris Hospital will have extended OPD hours on Saturdays (7 AM - 6 PM) starting next week.', actionUrl: null, read: false, daysAgo: 2 },
    { userIdx: 2, type: NotificationType.SYSTEM_ANNOUNCEMENT, priority: NotificationPriority.LOW, title: 'Hospital Working Hours Update', message: 'Lunaris Hospital will have extended OPD hours on Saturdays (7 AM - 6 PM) starting next week.', actionUrl: null, read: false, daysAgo: 2 },

    // Notifications for doctors
    { userIdx: -1, type: NotificationType.APPOINTMENT_NEW, priority: NotificationPriority.MEDIUM, title: 'New Appointment', message: 'New appointment booked: Ramesh Babu – Chronic Disease Management, tomorrow 9:30 AM.', actionUrl: '/appointments', read: false, daysAgo: 1, isDoctor: true, doctorIdx: 0 },
    { userIdx: -1, type: NotificationType.EMERGENCY_ASSIGNED, priority: NotificationPriority.URGENT, title: 'Emergency Patient Assigned', message: 'Emergency: Arjun Reddy – Acute knee injury. Immediate ortho assessment required.', actionUrl: '/emergency', read: true, daysAgo: 7, isDoctor: true, doctorIdx: 2 },
  ];
  for (const nc of notifConfigs) {
    const userId = (nc as any).isDoctor ? doctors[(nc as any).doctorIdx].id : patients[nc.userIdx]?.id;
    if (!userId) continue;
    const n = notifRepo.create({
      organizationId: orgId,
      user: { id: userId } as any,
      type: nc.type,
      priority: nc.priority,
      title: nc.title,
      message: nc.message,
      actionUrl: nc.actionUrl,
      isRead: nc.read,
      readAt: nc.read ? daysAgo(nc.daysAgo) : undefined
    });
    await notifRepo.save(n);
  }
  console.log(`✅ ${notifConfigs.length} notifications created`);

  // ================================================================
  // 5. MESSAGES (patient-doctor conversations)
  // ================================================================
  const msgConfigs = [
    // Ramesh ↔ Dr. Rajesh conversation
    { senderIdx: 0, senderRole: 'patient', recipientIdx: 0, recipientRole: 'doctor', subject: 'Blood Sugar Readings', content: 'Dear Dr. Rajesh, my fasting blood sugar readings this week: Mon 138, Tue 142, Wed 135, Thu 128, Fri 132. Is this improvement satisfactory?', status: MessageStatus.READ, daysAgo: 5 },
    { senderIdx: 0, senderRole: 'doctor', recipientIdx: 0, recipientRole: 'patient', subject: 'Re: Blood Sugar Readings', content: 'Dear Ramesh, good progress! Your readings are trending down. Continue Metformin as prescribed. Please bring your food diary to the next visit. Also monitor BP twice daily.', status: MessageStatus.READ, daysAgo: 5 },
    { senderIdx: 0, senderRole: 'patient', recipientIdx: 0, recipientRole: 'doctor', subject: 'Ankle Swelling Concern', content: 'Doctor, I noticed mild ankle swelling in the evenings. Should I be concerned? It goes away after rest.', status: MessageStatus.READ, daysAgo: 3 },
    { senderIdx: 0, senderRole: 'doctor', recipientIdx: 0, recipientRole: 'patient', subject: 'Re: Ankle Swelling Concern', content: 'This can be a side effect of Amlodipine. We will assess at your next visit. If swelling worsens or is painful, come in immediately. Elevate legs when resting.', status: MessageStatus.READ, daysAgo: 3 },

    // Kavitha ↔ Dr. Priya conversation
    { senderIdx: 1, senderRole: 'patient', recipientIdx: 1, recipientRole: 'doctor', subject: 'Telemedicine Link', content: 'Hi Dr. Priya, could you share the telemedicine link for our upcoming follow-up? I want to test it beforehand.', status: MessageStatus.READ, daysAgo: 4 },
    { senderIdx: 1, senderRole: 'doctor', recipientIdx: 1, recipientRole: 'patient', subject: 'Re: Telemedicine Link', content: 'Hello Kavitha, the link will be sent 30 minutes before the appointment. Please keep your lipid profile and thyroid reports handy for discussion. Your Echo results look encouraging – LVEF is normal.', status: MessageStatus.SENT, daysAgo: 4 },

    // Arjun ↔ Dr. Karthik conversation
    { senderIdx: 2, senderRole: 'patient', recipientIdx: 2, recipientRole: 'doctor', subject: 'MRI Report Query', content: 'Dr. Karthik, I got my MRI done. The report mentions "Grade II-III ACL tear with bone bruise." What does this mean? Will I need surgery?', status: MessageStatus.READ, daysAgo: 3 },
    { senderIdx: 2, senderRole: 'doctor', recipientIdx: 2, recipientRole: 'patient', subject: 'Re: MRI Report Query', content: 'Arjun, Grade II-III means a partial to near-complete tear. We need to discuss surgical vs conservative options. Given your age and activity level, ACL reconstruction is likely recommended. We will discuss in detail at your follow-up. Keep using the knee immobilizer.', status: MessageStatus.READ, daysAgo: 2 },
  ];
  for (const mc of msgConfigs) {
    const sender = mc.senderRole === 'patient' ? patients[mc.senderIdx] : doctors[mc.senderIdx];
    const recipient = mc.recipientRole === 'patient' ? patients[mc.recipientIdx] : doctors[mc.recipientIdx];
    const m = msgRepo.create({
      organizationId: orgId,
      sender,
      recipient,
      subject: mc.subject,
      content: mc.content,
      status: mc.status,
      isRead: mc.status === MessageStatus.READ,
      readAt: mc.status === MessageStatus.READ ? daysAgo(mc.daysAgo) : undefined
    });
    await msgRepo.save(m);
  }
  console.log(`✅ ${msgConfigs.length} messages created`);

  // ================================================================
  // 6. REMINDERS
  // ================================================================
  const reminderConfigs = [
    // Patient 0 – Medication & follow-up reminders
    { patientIdx: 0, type: ReminderType.MEDICATION, title: 'Take Metformin', message: 'Time to take Metformin 500mg with your morning meal.', scheduledFor: daysFromNow(0), status: ReminderStatus.PENDING, medicationName: 'Metformin 500mg', sendNotification: true },
    { patientIdx: 0, type: ReminderType.MEDICATION, title: 'Take Amlodipine', message: 'Time to take Amlodipine 5mg (morning dose for blood pressure).', scheduledFor: daysFromNow(0), status: ReminderStatus.PENDING, medicationName: 'Amlodipine 5mg', sendNotification: true },
    { patientIdx: 0, type: ReminderType.FOLLOWUP, title: 'Diabetes Follow-up', message: 'You have a follow-up appointment tomorrow with Dr. Rajesh Iyer for BP & sugar review. Remember to bring your food diary and BP readings.', scheduledFor: daysFromNow(0), status: ReminderStatus.PENDING, sendEmail: true, sendNotification: true },
    { patientIdx: 0, type: ReminderType.APPOINTMENT, title: 'Appointment Tomorrow', message: 'Reminder: Chronic Disease Management appointment at 9:30 AM tomorrow with Dr. Rajesh Iyer.', scheduledFor: daysFromNow(0), status: ReminderStatus.PENDING, sendEmail: true, sendSms: true, sendNotification: true },

    // Patient 1 – Telemedicine reminder
    { patientIdx: 1, type: ReminderType.APPOINTMENT, title: 'Telemedicine Appointment', message: 'Your telemedicine follow-up with Dr. Priya Nair is in 3 days. Ensure stable internet connection and keep reports ready.', scheduledFor: daysFromNow(2), status: ReminderStatus.PENDING, sendEmail: true, sendNotification: true },
    { patientIdx: 1, type: ReminderType.MEDICATION, title: 'Take Atorvastatin', message: 'Time to take Atorvastatin 10mg at bedtime.', scheduledFor: daysFromNow(0), status: ReminderStatus.PENDING, medicationName: 'Atorvastatin 10mg', sendNotification: true },

    // Patient 2 – Follow-up reminder
    { patientIdx: 2, type: ReminderType.FOLLOWUP, title: 'ACL Follow-up with MRI', message: 'Bring your MRI CD to the follow-up with Dr. Karthik in 4 days. Keep knee elevated.', scheduledFor: daysFromNow(3), status: ReminderStatus.PENDING, sendEmail: true, sendNotification: true },

    // Patient 3 – Immunization reminder
    { patientIdx: 3, type: ReminderType.APPOINTMENT, title: 'DPT Booster Vaccination', message: 'Priya has her DPT booster vaccination scheduled in 2 days with Dr. Meenakshi. Please bring immunization card.', scheduledFor: daysFromNow(1), status: ReminderStatus.PENDING, sendEmail: true, sendSms: true, sendNotification: true },

    // Sent reminders (past)
    { patientIdx: 0, type: ReminderType.LAB_RESULT, title: 'Lab Results Available', message: 'Your HbA1c and Lipid Profile results are ready. Please check in the patient portal.', scheduledFor: daysAgo(13), status: ReminderStatus.SENT, sendNotification: true, sentAt: daysAgo(13) },
  ];
  for (const rc of reminderConfigs) {
    const r = reminderRepo.create({
      organizationId: orgId,
      userId: patients[rc.patientIdx].id,
      type: rc.type,
      title: rc.title,
      message: rc.message,
      scheduledFor: rc.scheduledFor,
      status: rc.status,
      medicationName: rc.medicationName,
      sendEmail: rc.sendEmail || false,
      sendSms: rc.sendSms || false,
      sendNotification: rc.sendNotification || true,
      sentAt: (rc as any).sentAt
    });
    await reminderRepo.save(r);
  }
  console.log(`✅ ${reminderConfigs.length} reminders created`);

  // ================================================================
  // 7. FEEDBACK (general hospital feedback)
  // ================================================================
  const feedbackConfigs = [
    { patientIdx: 0, type: FeedbackType.DOCTOR, subject: 'Excellent care by Dr. Rajesh', message: 'Dr. Rajesh took time to explain my diabetes management thoroughly. Very patient and knowledgeable. The diet chart he provided is very helpful.', rating: 5, status: FeedbackStatus.REVIEWED, response: 'Thank you for your kind feedback, Mr. Ramesh. We are glad Dr. Rajesh could help you.', respondedBy: admin },
    { patientIdx: 1, type: FeedbackType.FACILITY, subject: 'Clean and well-maintained facility', message: 'The cardiology wing is very well maintained. Waiting area is comfortable. Only suggestion – more parking space would be helpful.', rating: 4, status: FeedbackStatus.REVIEWED, response: 'Thank you, Kavitha. We are working on expanding parking facilities.', respondedBy: admin },
    { patientIdx: 2, type: FeedbackType.APPOINTMENT, subject: 'Quick emergency response', message: 'I came in with a knee injury at 10:30 PM and was attended to within 15 minutes. The emergency team was very efficient. Dr. Karthik was reassuring.', rating: 5, status: FeedbackStatus.RESOLVED },
    { patientIdx: 2, type: FeedbackType.COMPLAINT, subject: 'Long wait for pharmacy', message: 'After the emergency consultation, I had to wait 40 minutes at the pharmacy for just 2 medicines. This should be faster for emergency patients.', rating: 2, status: FeedbackStatus.REVIEWED, response: 'We apologize for the delay. Emergency prescriptions will now be prioritized at the pharmacy counter.', respondedBy: admin },
    { patientIdx: 3, type: FeedbackType.STAFF, subject: 'Very friendly pediatric nurses', message: 'Nurse Divya was wonderful with my daughter. She made the checkup fun and Priya was not scared at all. Thank you!', rating: 5, status: FeedbackStatus.PENDING },
    { patientIdx: 0, type: FeedbackType.SUGGESTION, subject: 'Online payment option needed', message: 'It would be very convenient to have online/UPI payment option for bills. Currently I have to visit the hospital for payment.', rating: 3, status: FeedbackStatus.PENDING },
  ];
  for (const fc of feedbackConfigs) {
    const f = feedbackRepo.create({
      organizationId: orgId,
      user: patients[fc.patientIdx],
      type: fc.type,
      subject: fc.subject,
      message: fc.message,
      rating: fc.rating,
      status: fc.status,
      response: fc.response,
      respondedBy: fc.respondedBy || undefined,
      respondedAt: fc.response ? daysAgo(1) : undefined
    });
    await feedbackRepo.save(f);
  }
  console.log(`✅ ${feedbackConfigs.length} feedback entries created`);

  // ================================================================
  // 8. APPOINTMENT FEEDBACK (ratings for completed visits)
  // ================================================================
  const apptFeedbackConfigs = [
    // Ramesh → Dr. Rajesh (initial visit)
    { apptIdx: 0, patientIdx: 0, doctorIdx: 0, doctorRating: 5, facilityRating: 4, staffRating: 5, overallRating: 5, doctorComment: 'Dr. Rajesh explained everything clearly about my diabetes. Very thorough examination.', facilityComment: 'Clean and organized clinic.', overallComment: 'Highly recommend this hospital.', wouldRecommend: true },
    // Kavitha → Dr. Priya (cardiology)
    { apptIdx: 2, patientIdx: 1, doctorIdx: 1, doctorRating: 5, facilityRating: 5, staffRating: 4, overallRating: 5, doctorComment: 'Dr. Priya is very competent. She clearly explained the ECG findings and the need for Echo.', facilityComment: 'Cardiology wing has excellent equipment.', overallComment: 'Great specialist care.', wouldRecommend: true },
    // Arjun → Dr. Karthik (emergency)
    { apptIdx: 4, patientIdx: 2, doctorIdx: 2, doctorRating: 5, facilityRating: 4, staffRating: 5, overallRating: 5, doctorComment: 'Dr. Karthik handled my emergency efficiently. He remembered my NSAID allergy and prescribed a safe alternative.', facilityComment: 'Emergency wing is well-equipped.', overallComment: 'Excellent emergency care. Quick response.', wouldRecommend: true, followUpNeeded: true, followUpReason: 'MRI review and surgical planning for ACL reconstruction' },
  ];
  for (const af of apptFeedbackConfigs) {
    if (completedAppts[af.apptIdx]) {
      const fb = apptFeedbackRepo.create({
        appointmentId: completedAppts[af.apptIdx].id,
        patientId: patients[af.patientIdx].id,
        doctorId: doctors[af.doctorIdx].id,
        organizationId: orgId,
        doctorRating: af.doctorRating,
        facilityRating: af.facilityRating,
        staffRating: af.staffRating,
        overallRating: af.overallRating,
        doctorComment: af.doctorComment,
        facilityComment: af.facilityComment,
        overallComment: af.overallComment,
        wouldRecommend: af.wouldRecommend || false,
        followUpNeeded: af.followUpNeeded || false,
        followUpReason: af.followUpReason
      });
      await apptFeedbackRepo.save(fb);
    }
  }
  console.log(`✅ ${apptFeedbackConfigs.length} appointment feedback entries created`);

  // ================================================================
  // 9. CONSENT RECORDS
  // ================================================================
  const consentConfigs = [
    // Patient 0 – Treatment + Data Processing
    { patientIdx: 0, consentType: ConsentType.TREATMENT, purpose: 'Diabetes and hypertension management', consentText: 'I, Ramesh Babu, consent to treatment for Type 2 Diabetes Mellitus and Essential Hypertension at Lunaris Multi-Specialty Hospital under Dr. Rajesh Iyer. I understand the treatment plan, medications, and potential side effects.', status: ConsentStatus.GRANTED, grantedAt: daysAgo(30), version: '1.0' },
    { patientIdx: 0, consentType: ConsentType.DATA_PROCESSING, purpose: 'Medical records processing and storage', consentText: 'I consent to the collection, storage, and processing of my personal health information by Lunaris Hospital for the purpose of providing healthcare services, in compliance with DPDP Act 2023.', status: ConsentStatus.GRANTED, grantedAt: daysAgo(30), version: '2.0' },
    { patientIdx: 0, consentType: ConsentType.ABDM_HEALTH_RECORDS, purpose: 'ABHA Health Records Linking', consentText: 'I consent to link my health records from Lunaris Hospital with my ABHA ID (ABHA-LNR-001) for digital health record access via the ABDM network.', status: ConsentStatus.GRANTED, grantedAt: daysAgo(30), version: '1.0' },

    // Patient 1 – Treatment + Telemedicine
    { patientIdx: 1, consentType: ConsentType.TREATMENT, purpose: 'Cardiac evaluation and management', consentText: 'I, Kavitha Selvam, consent to cardiac evaluation including ECG, Echocardiography, and medication management under Dr. Priya Nair at Lunaris Hospital.', status: ConsentStatus.GRANTED, grantedAt: daysAgo(20), version: '1.0' },
    { patientIdx: 1, consentType: ConsentType.TELEMEDICINE, purpose: 'Telemedicine consultation follow-up', consentText: 'I consent to receive telemedicine consultations via video call with Dr. Priya Nair. I understand the limitations of remote consultation and agree to visit in-person if advised.', status: ConsentStatus.GRANTED, grantedAt: daysAgo(5), version: '1.0' },
    { patientIdx: 1, consentType: ConsentType.DATA_PROCESSING, purpose: 'Medical records processing', consentText: 'I consent to the processing of my medical data including cardiac reports and lab results by Lunaris Hospital.', status: ConsentStatus.GRANTED, grantedAt: daysAgo(20), version: '2.0' },

    // Patient 2 – Treatment + Emergency
    { patientIdx: 2, consentType: ConsentType.TREATMENT, purpose: 'Emergency orthopedic treatment', consentText: 'I, Arjun Reddy, consent to emergency orthopedic evaluation and treatment for acute right knee injury at Lunaris Hospital under Dr. Karthik Subramanian.', status: ConsentStatus.GRANTED, grantedAt: daysAgo(7), version: '1.0' },
    { patientIdx: 2, consentType: ConsentType.EMERGENCY_CONTACT, purpose: 'Emergency contact authorization', consentText: 'I authorize Lunaris Hospital to contact Venkat Reddy (father) at +91 9876500097 in case of emergency.', status: ConsentStatus.GRANTED, grantedAt: daysAgo(7), version: '1.0' },

    // Patient 3 – Treatment (minor – parent consent)
    { patientIdx: 3, consentType: ConsentType.TREATMENT, purpose: 'Pediatric care and immunization', consentText: 'I, Murugan K. (parent/guardian), consent to pediatric care and immunization for my daughter Priya Murugan at Lunaris Hospital under Dr. Meenakshi Sundaram.', status: ConsentStatus.GRANTED, grantedAt: daysAgo(60), witnessName: 'Nurse Divya Mohan', version: '1.0' },

    // Patient 4 – Withdrawn consent (discharged)
    { patientIdx: 4, consentType: ConsentType.DATA_SHARING, purpose: 'Prenatal data sharing with referring hospital', consentText: 'I consented to share my prenatal care records with the referring higher center for delivery management.', status: ConsentStatus.WITHDRAWN, grantedAt: daysAgo(90), withdrawnAt: daysAgo(30), withdrawalReason: 'Patient transferred to higher center. Consent withdrawn as records have been shared.', version: '1.0' },
  ];
  for (const cc of consentConfigs) {
    const c = consentRepo.create({
      organizationId: orgId,
      patientId: patients[cc.patientIdx].id,
      consentType: cc.consentType,
      purpose: cc.purpose,
      consentText: cc.consentText,
      status: cc.status,
      isGranted: cc.status === ConsentStatus.GRANTED,
      grantedAt: cc.grantedAt,
      grantedById: patients[cc.patientIdx].id,
      withdrawnAt: (cc as any).withdrawnAt,
      withdrawalReason: (cc as any).withdrawalReason,
      witnessName: (cc as any).witnessName,
      version: cc.version,
      ipAddress: '192.168.1.100'
    });
    await consentRepo.save(c);
  }
  console.log(`✅ ${consentConfigs.length} consent records created`);

  // ================================================================
  // 10. EMERGENCY REQUESTS
  // ================================================================
  const emergencyConfigs = [
    // Resolved – Arjun's knee injury
    { name: 'Arjun Reddy', phone: '+91 9876500003', location: 'Football ground, Velachery, Chennai', message: 'Severe knee injury during football match. Cannot bear weight. Need immediate orthopedic attention.', status: EmergencyStatus.RESOLVED, priority: EmergencyPriority.HIGH, assignedTo: doctors[2], responseNotes: 'Patient brought to ER. Dr. Karthik on scene within 15 minutes. X-ray clear, MRI ordered. Knee immobilizer applied.', respondedAt: daysAgo(7) },
    // In-progress – walk-in chest pain
    { name: 'Vikram Sharma', phone: '+91 9876599999', location: 'Lunaris Hospital Lobby', message: 'Walk-in patient with chest pain and breathlessness. Age 55.', status: EmergencyStatus.IN_PROGRESS, priority: EmergencyPriority.CRITICAL, assignedTo: doctors[1], responseNotes: 'ECG initiated. Cardiology team alerted.' },
    // Pending – ambulance request
    { name: 'Lakshmi Devi', phone: '+91 9876588888', location: '14, Thiruvanmiyur, Chennai', message: 'Elderly woman (72) with sudden giddiness and vomiting. Need ambulance.', status: EmergencyStatus.PENDING, priority: EmergencyPriority.HIGH },
    // Cancelled
    { name: 'Raju Kumar', phone: '+91 9876577777', location: 'OMR, Chennai', message: 'Minor hand injury from glass. Bleeding controlled.', status: EmergencyStatus.CANCELLED, priority: EmergencyPriority.LOW, responseNotes: 'Patient self-treated and cancelled request.' },
  ];
  for (const ec of emergencyConfigs) {
    const e = emergencyRepo.create({
      organizationId: orgId,
      name: ec.name,
      phone: ec.phone,
      location: ec.location,
      message: ec.message,
      status: ec.status,
      priority: ec.priority,
      assignedTo: ec.assignedTo || undefined,
      responseNotes: ec.responseNotes || undefined,
      respondedAt: ec.respondedAt || undefined
    });
    await emergencyRepo.save(e);
  }
  console.log(`✅ ${emergencyConfigs.length} emergency requests created`);

  // ================================================================
  // 11. LAB RESULTS (for completed lab orders)
  // ================================================================
  if (labTech) {
    const completedOrder = labOrders.find(lo => lo.status === 'completed');
    if (completedOrder) {
      const labResultConfigs = [
        { resultValue: 'Hb: 13.8 g/dL, WBC: 7200/μL, Platelets: 2.5 lakhs/μL, RBC: 4.8 million/μL', units: 'g/dL, cells/μL', referenceRange: 'Hb: 12-16, WBC: 4000-11000, Plt: 1.5-4.0 lakhs', interpretation: 'All values within normal limits.', flag: 'normal' },
        { resultValue: '142 mg/dL', units: 'mg/dL', referenceRange: '70-100 mg/dL (fasting)', interpretation: 'Elevated fasting glucose. Consistent with T2DM diagnosis.', flag: 'abnormal' },
        { resultValue: '8.2%', units: '%', referenceRange: '<5.7% normal, 5.7-6.4% prediabetes, ≥6.5% diabetes', interpretation: 'HbA1c significantly elevated. Confirms T2DM. Poor glycemic control over past 3 months.', flag: 'abnormal' },
        { resultValue: 'TC: 242, LDL: 168, HDL: 38, TG: 195 mg/dL', units: 'mg/dL', referenceRange: 'TC<200, LDL<130, HDL>40, TG<150', interpretation: 'Dyslipidemia: Elevated TC, LDL, TG. Low HDL. Cardiovascular risk assessment needed.', flag: 'abnormal' },
      ];
      for (const lr of labResultConfigs) {
        const r = labResultRepo.create({
          organizationId: orgId,
          resultValue: lr.resultValue,
          units: lr.units,
          referenceRange: lr.referenceRange,
          interpretation: lr.interpretation,
          flag: lr.flag as any,
          resultTime: daysAgo(13),
          performedById: labTech.id,
          verifiedById: doctors[0].id,
          verificationTime: daysAgo(13),
          isVerified: true,
          comments: 'Results verified and shared with treating physician.'
        });
        await labResultRepo.save(r);
      }
      console.log(`✅ ${labResultConfigs.length} lab results created`);
    }
  }

  // ================================================================
  // 12. REFERRALS (cross-department)
  // ================================================================
  const cardiologyDept = deptByName.get('Cardiology');
  const orthoDept = deptByName.get('Orthopedics');
  const genMedDept = deptByName.get('General Medicine');
  const referralConfigs = [
    // Kavitha: Gen Med → Cardiology
    { patientIdx: 1, dept: cardiologyDept },
    // Ramesh: Gen Med → anticipated cardiology referral
    { patientIdx: 0, dept: cardiologyDept },
    // Arjun: Emergency → Ortho (for surgical planning)
    { patientIdx: 2, dept: orthoDept },
  ];
  let referralCount = 0;
  for (const rc of referralConfigs) {
    if (rc.dept) {
      const r = referralRepo.create({
        patientId: patients[rc.patientIdx].id,
        departmentId: rc.dept.id
      });
      await referralRepo.save(r);
      referralCount++;
    }
  }
  console.log(`✅ ${referralCount} referrals created`);

  // ================================================================
  // SUMMARY
  // ================================================================
  console.log('\n🏥 ═══════════════════════════════════════════════');
  console.log('   LUNARIS COMPLETE DATA SEED FINISHED');
  console.log('═══════════════════════════════════════════════\n');
  console.log(`  Vital Signs:         ${vitalsData.length}`);
  console.log(`  Visits & Queues:     ${visitCount}`);
  console.log(`  Triage Records:      ${triageData.length}`);
  console.log(`  Notifications:       ${notifConfigs.length}`);
  console.log(`  Messages:            ${msgConfigs.length}`);
  console.log(`  Reminders:           ${reminderConfigs.length}`);
  console.log(`  Feedback:            ${feedbackConfigs.length}`);
  console.log(`  Appointment Feedback:${apptFeedbackConfigs.length}`);
  console.log(`  Consent Records:     ${consentConfigs.length}`);
  console.log(`  Emergency Requests:  ${emergencyConfigs.length}`);
  console.log(`  Lab Results:         4`);
  console.log(`  Referrals:           ${referralCount}`);
  console.log('');

  return { success: true };
}

// ======================== CLI RUNNER ========================
if (require.main === module) {
  AppDataSource.initialize()
    .then(() => seedLunarisCompleteData())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seed failed:', err);
      process.exit(1);
    });
}
