# 📧 EMAIL INTEGRATION MAP - Hospital Management System

## ✅ SMTP Configuration Status

**Location:** `/backend/.env`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=dhilipwing@gmail.com
SMTP_PASS="zeksdfbdplgudysu"
SMTP_FROM_NAME=Hospital Management System
SMTP_FROM_EMAIL=dhilipwing@gmail.com
```

**Email Service:** `/backend/src/services/email.service.ts`
- ✅ Fully implemented with Nodemailer
- ✅ Initialized in server.ts
- ✅ Professional HTML email templates
- ⚠️ Gmail authentication pending (need valid app password)

---

## 📋 EMAIL INTEGRATION BY FEATURE

### 1️⃣ AUTHENTICATION & USER MANAGEMENT

#### ✅ User Registration
**File:** `controllers/auth.controller.ts`
**Status:** ✅ INTEGRATED
**Trigger:** When new user registers
**Email:** Welcome email with login credentials
```typescript
// Line ~126 in auth.controller.ts
await EmailService.sendWelcomeEmail(user.email, user.firstName);
```

#### ✅ Password Reset
**File:** `controllers/auth.controller.ts`
**Status:** ✅ INTEGRATED
**Trigger:** When user requests password reset
**Email:** Password reset link with 15-minute expiry
```typescript
// In forgotPassword method
await EmailService.sendPasswordResetEmail(user.email, user.firstName, resetUrl);
```

#### ✅ Staff Onboarding (Doctor/Nurse/Receptionist)
**File:** `controllers/user.controller.ts`
**Status:** ✅ INTEGRATED
**Trigger:** When admin creates new staff account
**Email:** Role-specific welcome email with credentials
```typescript
// Universal welcome email for all roles
await EmailService.sendUniversalWelcomeEmail(
  email, firstName, tempPassword, organizationName, subdomain, role
);
```

---

### 2️⃣ APPOINTMENT SYSTEM

#### ✅ Appointment Confirmation
**File:** `services/notification.service.ts`
**Status:** ✅ INTEGRATED
**Trigger:** When appointment is booked/confirmed
**Email:** Appointment details with doctor, date, time
```typescript
// Line ~48 in notification.service.ts
await EmailService.sendAppointmentConfirmationEmail(
  user.email, patientName, doctorName, appointmentTime, department
);
```

#### ✅ Appointment Reminders (Automated)
**File:** `jobs/appointment-reminder.job.ts`
**Status:** ✅ INTEGRATED (Cron job ready)
**Trigger:** 24 hours before appointment
**Email:** Reminder with appointment details
```typescript
// Line ~51 in appointment-reminder.job.ts
await EmailService.sendAppointmentReminderEmail(
  patient.email, patientName, doctorName, appointmentTime
);
```

**Cron Schedule:** Runs every hour to check upcoming appointments
**Note:** Requires cron job to be started in production

#### ❌ Appointment Cancellation
**File:** `controllers/appointment.controller.ts`
**Status:** ❌ NOT INTEGRATED
**Action Required:** Add email notification when appointment cancelled
**Recommended Location:** `cancelAppointment` method

#### ❌ Appointment Rescheduling
**File:** `controllers/appointment.controller.ts`
**Status:** ❌ NOT INTEGRATED
**Action Required:** Add email notification when appointment rescheduled
**Recommended Location:** `rescheduleAppointment` method

---

### 3️⃣ LABORATORY MODULE

#### ✅ Lab Results - Critical Values
**File:** `controllers/lab-result.controller.ts`
**Status:** ✅ INTEGRATED
**Trigger:** When critical lab result is entered
**Email:** Alert to doctor about critical values
```typescript
// Line ~95 in lab-result.controller.ts
await EmailService.sendEmail({
  to: orderItem.labOrder.doctor.email,
  subject: '🚨 CRITICAL Lab Result',
  html: criticalResultTemplate
});
```

#### ❌ Lab Results - Normal Results
**File:** `controllers/lab-result.controller.ts`
**Status:** ❌ NOT INTEGRATED
**Action Required:** Add email to patient when results ready
**Recommended:** Use `sendTestResultNotificationEmail`

#### ❌ Lab Order Confirmation
**File:** `controllers/lab-order.controller.ts`
**Status:** ❌ NOT INTEGRATED
**Action Required:** Email patient when lab test ordered
**Recommended Location:** `createLabOrder` method

---

### 4️⃣ PHARMACY & PRESCRIPTIONS

#### ❌ Prescription Created
**File:** `controllers/pharmacy/prescription.controller.ts`
**Status:** ❌ NOT INTEGRATED
**Action Required:** Email patient when prescription created
**Recommended:** Use `sendPrescriptionNotificationEmail`

#### ❌ Prescription Ready for Pickup
**File:** `controllers/pharmacy/prescription.controller.ts`
**Status:** ❌ NOT INTEGRATED
**Action Required:** Email patient when prescription dispensed
**Recommended Location:** After status changed to 'dispensed'

#### ❌ Medicine Out of Stock
**File:** `controllers/pharmacy/medicine.controller.ts`
**Status:** ❌ NOT INTEGRATED
**Action Required:** Email pharmacist when stock below threshold
**Recommended:** Add to inventory management

---

### 5️⃣ INPATIENT MANAGEMENT (IPD)

#### ❌ Patient Admission
**File:** `controllers/inpatient/admission.controller.ts`
**Status:** ❌ NOT INTEGRATED
**Action Required:** Email patient/family about admission details
**Recommended Location:** `createAdmission` method

#### ❌ Patient Discharge
**File:** `controllers/inpatient/admission.controller.ts`
**Status:** ❌ NOT INTEGRATED
**Action Required:** Email discharge summary to patient
**Recommended Location:** `dischargePatient` method

#### ❌ Bed Transfer
**File:** `controllers/inpatient/admission.controller.ts`
**Status:** ❌ NOT INTEGRATED
**Action Required:** Notify family about bed transfer
**Recommended Location:** `transferPatient` method

---

### 6️⃣ BILLING & PAYMENTS

#### ❌ Bill Generated
**File:** `controllers/billing.controller.ts`
**Status:** ❌ NOT INTEGRATED
**Action Required:** Email patient when bill is generated
**Recommended:** Add after bill creation

#### ❌ Payment Confirmation
**File:** `controllers/billing.controller.ts`
**Status:** ❌ NOT INTEGRATED
**Action Required:** Email receipt when payment received
**Recommended:** Add after payment processing

#### ❌ Payment Reminder
**File:** `controllers/billing.controller.ts`
**Status:** ❌ NOT INTEGRATED
**Action Required:** Email reminder for pending bills
**Recommended:** Add cron job for overdue bills

---

### 7️⃣ COMMUNICATION & NOTIFICATIONS

#### ✅ Generic Notifications
**File:** `services/email.service.ts`
**Status:** ✅ INTEGRATED
**Trigger:** System announcements, emergency alerts
**Email:** Generic notification template
```typescript
await EmailService.sendNotificationEmail(email, title, message, type);
```

#### ❌ Message Notifications
**File:** `controllers/messaging.controller.ts`
**Status:** ❌ NOT INTEGRATED
**Action Required:** Email when new message received
**Recommended:** Add to message creation

---

### 8️⃣ EMERGENCY SERVICES

#### ❌ Emergency Request Received
**File:** `controllers/emergency.controller.ts`
**Status:** ❌ NOT INTEGRATED
**Action Required:** Email confirmation to requester
**Recommended Location:** After emergency request created

#### ❌ Emergency Request Assigned
**File:** `controllers/emergency.controller.ts`
**Status:** ❌ NOT INTEGRATED
**Action Required:** Email doctor/staff assigned to emergency
**Recommended Location:** When emergency assigned

---

### 9️⃣ QUEUE MANAGEMENT

#### ❌ Queue Position Update
**File:** `controllers/queue.controller.ts`
**Status:** ❌ NOT INTEGRATED
**Action Required:** Email/SMS when patient's turn is near
**Recommended:** Add to queue advancement logic

---

### 🔟 PATIENT PORTAL

#### ❌ Access Grant Request
**File:** `controllers/patient-access-grant.controller.ts`
**Status:** ❌ NOT INTEGRATED
**Action Required:** Email when access request sent/approved/rejected
**Recommended:** Add to all access grant status changes

---

## 🔧 REQUIRED IMPLEMENTATIONS

### HIGH PRIORITY (Add Email Notifications)

1. **Appointment Cancellation Email**
   ```typescript
   // In appointment.controller.ts - cancelAppointment method
   await EmailService.sendEmail({
     to: patient.email,
     subject: '❌ Appointment Cancelled',
     html: cancellationTemplate
   });
   ```

2. **Lab Results Ready Email**
   ```typescript
   // In lab-result.controller.ts - after result entry
   await EmailService.sendTestResultNotificationEmail(
     patient.email, patientName, testName
   );
   ```

3. **Prescription Ready Email**
   ```typescript
   // In prescription.controller.ts - after creation
   await EmailService.sendPrescriptionNotificationEmail(
     patient.email, patientName, doctorName
   );
   ```

4. **Bill Generated Email**
   ```typescript
   // In billing.controller.ts - after bill creation
   await EmailService.sendEmail({
     to: patient.email,
     subject: '💰 New Bill Generated',
     html: billTemplate
   });
   ```

5. **Discharge Summary Email**
   ```typescript
   // In admission.controller.ts - dischargePatient method
   await EmailService.sendEmail({
     to: patient.email,
     subject: '📋 Discharge Summary',
     html: dischargeSummaryTemplate,
     attachments: [{ filename: 'discharge.pdf', content: pdfBuffer }]
   });
   ```

### MEDIUM PRIORITY

6. Appointment Rescheduling Email
7. Payment Confirmation Email
8. Emergency Request Confirmation Email
9. Access Grant Status Email
10. Medicine Stock Alert Email

### LOW PRIORITY

11. Queue Position Update Email
12. Message Notification Email
13. Payment Reminder Email (Cron)
14. Bed Transfer Notification Email

---

## 🚀 CRON JOBS FOR AUTOMATED EMAILS

### ✅ Appointment Reminders
**File:** `jobs/appointment-reminder.job.ts`
**Status:** ✅ IMPLEMENTED
**Schedule:** Every hour
**Action:** Send reminder 24h before appointment

### ❌ Payment Reminders
**File:** NOT CREATED
**Status:** ❌ NOT IMPLEMENTED
**Schedule:** Daily at 9 AM
**Action:** Send reminder for overdue bills

### ❌ Lab Result Follow-up
**File:** NOT CREATED
**Status:** ❌ NOT IMPLEMENTED
**Schedule:** Daily
**Action:** Remind patients to check pending results

---

## 📊 INTEGRATION SUMMARY

| Feature | Email Type | Status | Priority |
|---------|-----------|--------|----------|
| User Registration | Welcome | ✅ Done | - |
| Password Reset | Reset Link | ✅ Done | - |
| Staff Onboarding | Credentials | ✅ Done | - |
| Appointment Confirmation | Confirmation | ✅ Done | - |
| Appointment Reminder | Reminder | ✅ Done | - |
| Appointment Cancellation | Cancellation | ❌ Missing | 🔴 High |
| Appointment Rescheduling | Update | ❌ Missing | 🟡 Medium |
| Lab Results (Critical) | Alert | ✅ Done | - |
| Lab Results (Normal) | Notification | ❌ Missing | 🔴 High |
| Lab Order Confirmation | Confirmation | ❌ Missing | 🟡 Medium |
| Prescription Created | Notification | ❌ Missing | 🔴 High |
| Prescription Ready | Pickup Notice | ❌ Missing | 🟡 Medium |
| Bill Generated | Bill Notice | ❌ Missing | 🔴 High |
| Payment Confirmation | Receipt | ❌ Missing | 🟡 Medium |
| Discharge Summary | Summary | ❌ Missing | 🔴 High |
| Emergency Request | Confirmation | ❌ Missing | 🟡 Medium |
| Access Grant | Status Update | ❌ Missing | 🟢 Low |

**Overall Integration:** 6/20 (30% Complete)

---

## ⚠️ IMPORTANT NOTES

1. **Gmail App Password Issue:** Current app password not authenticating. Need to:
   - Verify 2-Step Verification is enabled
   - Generate new app password
   - Update `.env` file

2. **Email Service Initialization:** Already done in `server.ts`

3. **Error Handling:** All email sends are wrapped in try-catch to prevent breaking app flow

4. **Testing:** Use `test-email-config.js` to verify SMTP before deploying

5. **Production:** Consider using SendGrid/Mailgun for better deliverability

---

## 🔗 FILES TO MODIFY

1. `controllers/appointment.controller.ts` - Add cancellation/rescheduling emails
2. `controllers/lab-result.controller.ts` - Add patient notification
3. `controllers/pharmacy/prescription.controller.ts` - Add prescription emails
4. `controllers/billing.controller.ts` - Add billing emails
5. `controllers/inpatient/admission.controller.ts` - Add discharge emails
6. `controllers/emergency.controller.ts` - Add emergency emails

---

## 📝 NEXT STEPS

1. ✅ SMTP configuration added to `.env`
2. ⚠️ Fix Gmail authentication (generate new app password)
3. ❌ Add missing email integrations (see HIGH PRIORITY list)
4. ❌ Create additional email templates as needed
5. ❌ Test all email flows end-to-end
6. ❌ Set up cron jobs for automated emails
7. ❌ Consider SMS integration for critical notifications

---

**Last Updated:** Feb 3, 2026
**Status:** Email service ready, awaiting valid Gmail credentials
