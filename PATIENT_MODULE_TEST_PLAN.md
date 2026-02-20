# Patient Module - Manual Test Plan

This test plan covers the manual verification of the recently implemented **Patient History Tracking**, **Request Callback**, and **Emergency SOS** features within the Patient Portal.

---

## 🛠️ Prerequisites & Test Environment

**1. Application Status**
   - Ensure app is running (`docker-compose up`).

**2. Test Credentials (Created via Seeding)**
   - **Organization**: General Hospital
   - **Patient User**:
     - Email: `patient@example.com`
     - Password: `password123`
   - **Doctor User**:
     - Email: `doctor@hospital.com`
     - Password: `password123`
   - **Admin User**:
     - Email: `admin@hospital.com`
     - Password: `password123`

**3. Test Data Populated**
   - **History**: 5 Past Appointments, 1 Admission (Discharged), 5 Vitals records, 3 Prescriptions, 3 Lab Orders.
   - **Departments**: Cardiology, General Practice, Orthopedics, Pediatrics.

---

## 🧪 Test Case 1: Patient History Dashboard

**Objective**: Verify that the Patient History component correctly loads and displays all historical data tabs.

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1.1 | Login as a **Patient** or Admin. | Effectively logged in. | |
| 1.2 | Navigate to **Patient Details** page (e.g., click on a patient from the list). | Patient details page loads with the new layout. | |
| 1.3 | Scroll down to the **Tabs** section. | "Medical History" tab should be visible. | |
| 1.4 | Click on the **"Medical History"** tab. | The history component loads. Default view is **Timeline**. | |
| 1.5 | Verify **Summary Stats** cards (top row). | Cards for Admissions, Visits, Vitals, Labs, Prescriptions, Procedures should show counts. | |
| 1.6 | Review the **Timeline** tab. | A chronological list of events (admissions, visits, labs, etc.) is displayed. | |
| 1.7 | Click **"Refresh"** button. | Loading spinner appears briefly, then data refreshes. | |

---

## 🧪 Test Case 2: Individual History Tabs

**Objective**: Verify that each specific data tab displays the correct table format and content.

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 2.1 | Click **"Admissions"** tab. | Table shows Admission Date, Reason, Ward/Room, Days, Status. | |
| 2.2 | Click **"Visits"** tab. | Table shows Visit Date, Department, Doctor, Complaint, Outcome. | |
| 2.3 | Click **"Vitals"** tab. | Table shows Date, BP, Heart Rate, Temp, SpO2, Weight. | |
| 2.4 | Click **"Labs"** tab. | Table shows Date, Test Name, Category, Status. | |
| 2.5 | Click **"Rx"** (Prescriptions) tab. | Table shows Date, Doctor, Medication Count, Status. | |
| 2.6 | Click **"Procedures"** tab. | Table shows Date, Procedure Name, Type, Surgeon. | |
| 2.7 | Click **"Docs"** (Documents) tab. | Table shows Upload Date, Name, Type, and a "View" link. | |
| 2.8 | Click **"Notes"** tab. | Table shows Date, Type, Author, and Content snippet. | |

---

## 🧪 Test Case 3: Request Callback Feature

**Objective**: Verify that a patient can successfully request a callback.

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 3.1 | On Patient Detail page, locate header actions. | **"Request Callback"** button (white) is visible. | |
| 3.2 | Click **"Request Callback"**. | A modal dialog opens with "Request Callback" title. | |
| 3.3 | Check pre-filled fields. | "Contact Number" should be pre-filled with patient's phone. | |
| 3.4 | Fill **Department** (e.g., 'Cardiology'). | Selection works. | |
| 3.5 | Fill **Preferred Time** (e.g., 'Morning'). | Selection works. | |
| 3.6 | Fill **Message** (e.g., 'Need to reschedule'). | Text input accepts value. | |
| 3.7 | Click **"Submit Request"**. | Modal closes. Success message "Callback requested successfully" appears. | |
| 3.8 | (Optional) Verify in Backend/Database. | A new record in `callback_requests` table with status 'pending'. | |

---

## 🧪 Test Case 4: Emergency SOS Feature

**Objective**: Verify that a patient can trigger an emergency alert.

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 4.1 | On Patient Detail page, locate header actions. | **"Emergency SOS"** button (red) is visible. | |
| 4.2 | Click **"Emergency SOS"**. | A modal dialog opens with a **Red Warning Alert**. | |
| 4.3 | Check pre-filled fields. | "Contact Number" pre-filled. "Location" defaults to "Hospital Premises". | |
| 4.4 | Modify **Location** (e.g., 'Lobby Entrance'). | Input accepts changes. | |
| 4.5 | Add **Emergency Details** (e.g., 'Chest pain'). | Text input accepts value. | |
| 4.6 | Click **"SEND EMERGENCY ALERT"** (Red Button). | Modal closes. Success message "Emergency alert sent!..." appears. | |
| 4.7 | (Optional) Verify in Backend/Database. | A new record in `emergency_requests` table with priority 'high'/'critical'. | |

---

## 🧪 Test Case 5: Data Persistence & Integration

**Objective**: Ensure data entered via backend/frontend integration is consistent.

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 5.1 | Add a new **Appointment** for the patient (via Admin/Doctor portal). | Appointment created successfully. | |
| 5.2 | Mark appointment as **Completed**. | Status updates. | |
| 5.3 | Go back to **Patient History > Timeline**. | The new "Visit" should appear in recent history. | |
| 5.4 | Go to **Patient History > Visits**. | The new visit should appear in the table. | |

---

## 🐛 Defect Reporting Template

If any test fails, use this format to report it:

- **Defect ID**: [e.g., DEF-001]
- **Feature**: [e.g., Emergency SOS]
- **Description**: [What happened vs. expected]
- **Steps to Reproduce**:
  1. Go to...
  2. Click...
- **Severity**: [Critical/High/Medium/Low]
