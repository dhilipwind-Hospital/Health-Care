# Patient Journey Test Plan: End-to-End Integrations

This document details the manual test steps from the **Patient's perspective**, validating that the backend integrations translate to a seamless user experience.

---

## 📅 Scenario 1: The Booking & Check-In Experience
**Goal:** Verify the Patient ↔ Appointment ↔ Queue flow.

### Step-by-Step Patient Actions:

1.  **Patient Login**
    *   Log in to the Patient Portal.
    *   Navigate to **"Book Appointment"**.

2.  **Book Appointment**
    *   Select a Doctor (e.g., Dr. Smith) for **Today**.
    *   Confirm booking.
    *   **Verify:** You see the appointment in "Upcoming Appointments" with status **Scheduled**.

3.  **The "Invisible" Check-In (performed by Receptionist)**
    *   *Simulate arrival at hospital.*
    *   (Admin/Receptionist clicks "Check In" on your appointment).
    *   **Verify Notification:** As the patient (if logged in on mobile/web), you might *not* see a notification yet, but the **Doctor** gets one saying "Patient Arrived".

4.  **View "Current Visit" Status**
    *   Refresh the Patient Portal Dashboard.
    *   **Verify:** You should ideally see a status change or a "Active Visit" indicator (if UI supports it).
    *   *Note: Backend now links your appointment to a generic "Visit" record.*

---

## 💊 Scenario 2: The Prescription Notification
**Goal:** Verify Patient gets notified when meds are ready.

1.  **Consultation (Doctor's Action)**
    *   Doctor creates a prescription for you.
    *   **Verify Notification:** You (Patient) receive a notification: **"New Prescription from Dr. Smith"**.

2.  **Dispensing (Pharmacist's Action)**
    *   Pharmacist dispenses the medicine.
    *   **Verify Notification:** You (Patient) receive a second notification: **"Prescription Ready: Your prescription is ready for pickup at the pharmacy"**.

3.  **View Prescription**
    *   Navigate to **"My Medications"** or **"Prescriptions"** in Patient Portal.
    *   **Verify:** The prescription status shows "Dispensed".

---

## 🧪 Scenario 3: Lab Results Journey
**Goal:** Verify Patient gets notified of test results immediately.

1.  **Lab Order (Doctor's Action)**
    *   Doctor orders a "Blood Test".
    *   **Verify:** Order appears in your "Lab Reports" section as "Pending".

2.  **Result Verification (Lab Tech's Action)**
    *   Lab Tech enters results and clicks **"Verify"**.
    *   **Verify Notification:** You (Patient) receive a notification: **"Test Results Available: Your Blood Test results are now available"**.

3.  **View Report**
    *   Click the notification or go to **"Lab Reports"**.
    *   **Verify:** You can see the actual result values (e.g., "Hemoglobin: 14.5") and status is "Completed".

---

## 🔔 Scenario 4: Notifications Hub
**Goal:** Verify all communications are centralized.

1.  **Open Notifications Panel**
    *   Click the Bell icon in the Patient Portal.
2.  **Verify History**
    *   You should see a timeline of alerts:
        *   "Appointment Confirmed"
        *   "New Prescription"
        *   "Prescription Ready"
        *   "Test Results Available"
3.  **Verify Read Status**
    *   Click a notification.
    *   **Verify:** The "Unread" badge count decreases.

---

## 🛑 Edge Case: "Out of Stock" Warning (Doctor's View impacting Patient)
*This is technically invisible to the patient, but ensures safety.*

1.  **Prescribing**
    *   Doctor prescribes "Medicine X".
    *   Doctor sees **"Warning: Low Stock"**.
2.  **Patient Impact**
    *   Doctor might verbally tell you: "The pharmacy is low on this, but I've sent the order. They may need to partial dispense."
    *   *Result:* You are informed *before* walking to the pharmacy, preventing frustration.
