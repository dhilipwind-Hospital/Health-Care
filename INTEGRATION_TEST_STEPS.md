# Manual Test Plan: Cross-Module Integrations

This document outlines the manual test steps to verify the newly implemented cross-module integrations.

## 1. Appointment ↔ Queue Integration (Patient Check-In)

**Objective:** Verify that checking in an appointment creates a visit and queue token, and notifies the doctor.

**Prerequisites:**
- `ENABLE_QUEUE=true` in `.env`.
- An existing appointment for "Today" (Status: Scheduled).
- Logged in as: Receptionist or Admin.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | **Create Appointment** | Create a new appointment for a patient for today's date. |
| 2 | **Check In** | Send `POST /api/appointments/{id}/check-in` (or use UI button if available). |
| 3 | **Verify Response** | Response should include `success: true` and a `tokenNumber` (e.g., `T-ORG-260203-0001`). |
| 4 | **Verify Visit** | Query the `visits` table or UI. A new visit should exist with `status: 'created'`. |
| 5 | **Verify Queue** | Query the `queue_items` table or Queue Dashboard. A new item should exist with `stage: 'triage'` (or `doctor` if `skipTriage: true`). |
| 6 | **Verify Appointment** | Check the Appointment details. Status should be `in_progress`. `visitId` field should be populated. |
| 7 | **Verify Notification** | Log in as the assigned Doctor. Check notifications. Expect: "New Appointment: Patient Name - Token T-... - Now Waiting". |

---

## 2. Prescription ↔ Stock Check (Warnings)

**Objective:** Verify that doctors receive warnings when prescribing low-stock items.

**Prerequisites:**
- Medicine A: `currentStock: 0` (Out of Stock).
- Medicine B: `currentStock: 5` (Low Stock).
- Medicine C: `currentStock: 100` (Available).
- Logged in as: Doctor.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | **Check Stock API** | Call `POST /api/pharmacy/prescriptions/check-stock` with items for Medicine A, B, and C. |
| 2 | **Verify Check Response** | Response `hasIssues: true`. <br> - Medicine A: `status: 'out_of_stock'` <br> - Medicine B: `status: 'low'` <br> - Medicine C: `status: 'available'` |
| 3 | **Create Prescription** | Call `POST /api/pharmacy/prescriptions` including Medicine A and B. |
| 4 | **Verify Create Response** | Response should be `201 Created`. Message should be "Prescription created with stock warnings". `stockWarnings` array should be present in response body. |
| 5 | **Verify Data** | Prescription is saved despite the warning (non-blocking). |

---

## 3. Lab Result Verification ↔ Notification

**Objective:** Verify patient is notified when lab results are verified.

**Prerequisites:**
- A generic Lab Order with status `ordered` or `sample_collected`.
- Logged in as: Lab Technician or Admin.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | **Enter Result** | Call `POST /api/lab/results` to enter a result value for a specific test in the order. |
| 2 | **Verify Result** | Call `POST /api/lab/results/{id}/verify`. |
| 3 | **Verify Notification** | Log in as the **Patient** (or check `notifications` table for patient ID). |
| 4 | **Check Content** | Expect notification: Title "Test Results Available", Message "Your [Test Name] results are now available". |

---

## 4. Prescription Dispense ↔ Notification

**Objective:** Verify patient is notified when prescription is ready/dispensed.

**Prerequisites:**
- A pending prescription.
- Logged in as: Pharmacist.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | **Dispense Medicines** | Call `PUT /api/pharmacy/prescriptions/{id}/dispense` with all items marked as `DISPENSED`. |
| 2 | **Verify Response** | Response `message`: "Prescription dispensed successfully". |
| 3 | **Verify Notification** | Log in as the **Patient**. Check notifications. |
| 4 | **Check Content** | Expect notification: Title "Prescription Ready", Message "Your prescription is ready for pickup...". |

---

## 5. Doctor Notification on Check-In

**Objective:** Verify doctor gets a specific alert when patient checks in.

**Prerequisites:**
- Existing appointment.
- Logged in as: Doctor (Target) AND Receptionist (Actor).

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | **Doctor Login** | Log in as the Doctor assigned to the appointment. Note the current notification count. |
| 2 | **Act as Receptionist** | Perform the Check-In action (Step 1 above). |
| 3 | **Check Doctor View** | Refresh Doctor's notification list. |
| 4 | **Verify Content** | New notification: "New Appointment", Body: "Token [X] - Now Waiting". |
