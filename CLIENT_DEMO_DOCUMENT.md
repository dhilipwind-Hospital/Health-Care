# Ayphen Care - Hospital Management System
## Client Demo & Technical Overview Documentation

---

## 1. Executive Summary

**Ayphen Care** is a cutting-edge, enterprise-grade **Hospital Management System (HMS)** designed to digitize and streamline the complex operations of modern healthcare facilities. Built on a scalable, multi-tenant SaaS architecture, it empowers hospitals, clinics, and multi-specialty chains to manage their entire clinical and administrative workflow from a single, unified platform.

By connecting doctors, nurses, pharmacists, lab technicians, and administrators, Ayphen Care eliminates data silos, reduces manual errors, and significantly enhances the patient experience. The platform is designed with a "Patient-First" philosophy, ensuring that technology serves as an enabler for better care delivery.

---

## 2. Comprehensive Module Breakdown

### 🏥 A. Patient Registration & Management
Ideally the entry point for any healthcare interaction, this module ensures seamless patient onboarding.
*   **Unified Patient Profile:** A 360-degree view of the patient, aggregating demographics, medical history, allergies, insurance details, and past visits.
*   **Smart Search:** Quickly locate patients using name, phone number, or unique Patient ID (UHID).
*   **Document Management:** Upload and store external reports, ID proofs, and consent forms securely.
*   **Family Linking:** Link family members for easier billing and shared medical history tracking.

### 📅 B. Appointment & Scheduling
Efficiently manages the provider's most valuable resource: time.
*   **Multi-Channel Booking:** Supports walk-ins via reception, phone bookings, and patient self-scheduling via the portal.
*   **Doctor Availability Management:** Doctors can set complex recurring schedules, break times, and leave days.
*   **Automated Reminders:** Reduces no-shows by sending automated SMS/Email reminders to patients.
*   **Calendar View:** Visual daily, weekly, and monthly views for receptionists to manage slot utilization.

### 🚦 C. Queue Management System (QMS)
Transforms chaotic waiting rooms into organized, efficient spaces.
*   **Token Generation:** automatically assigns a token number upon check-in.
*   **Real-Time Stage Tracking:** Tracks patient movement from `Reception` -> `Triage` -> `Waiting` -> `In-Consultation` -> `Completed`.
*   **TV Display Interface:** dedicated "TV Mode" screens for waiting areas to display current token numbers, reducing patient anxiety.
*   **Priority Handling:** Ability to flag "Emergency" or "VIP" patients to bypass standard queues.

### 🩺 D. Clinical Care (EMR/EHR)
The heart of the system, empowering clinicians to deliver data-driven care.
*   **Digital Prescription Writing:** Select medicines from a master database, auto-fill dosages, and print professional prescriptions.
*   **ICD-10 Diagnosis Coding:** Standardized recording of diagnoses for insurance and statistical compliance.
*   **Lab Order Entry (CPOE):** Order lab tests directly from the consultation screen with one click.
*   **Vitals Charting:** visualize trends in Blood Pressure, BMI, Temperature, and Sugar levels over time.
*   **Clinical Notes:** Structured templates for SOAP (Subjective, Objective, Assessment, Plan) notes.

### 💊 E. Pharmacy Management
A robust retail pharmacy solution integrated directly with clinical data.
*   **Prescription Fulfillment:** Pharmacists see pending prescriptions instantly; no need to decipher handwriting.
*   **Stock Management:** Real-time tracking of batches, expiry dates, and stock levels.
*   **Dispensing Workflow:** "Partial Dispensing" support for when full stock isn't available.
*   **Low Stock Alerts:** Automated notifications when inventory dips below re-order levels.
*   **Sales & Billing:** Generate compliant tax invoices for medicines and OTC products.

### 🔬 F. Laboratory Information System (LIS)
End-to-end management of the diagnostic workflow.
*   **Sample Collection:** Barcode generation and sample tracking from collection to analysis.
*   **Result Entry:** Digital entry forms with reference ranges automatically flagging abnormal results.
*   **Report Generation:** One-click PDF generation of verified lab reports with digital signatures.
*   **Patient Access:** Reports are automatically pushed to the Patient Portal once verified.

### 🛡️ G. Administration & Analytics
Tools for hospital leadership to maintain control and visibility.
*   **Role-Based Access Control (RBAC):** Granular permission settings (e.g., "View Only", "Edit", "Delete") for every module.
*   **Audit Trails:** detailed logs of who accessed what date and when—critical for HIPAA/GDPR compliance.
*   **Financial Reports:** Daily collection reports, doctor revenue shares, and department-wise earnings.
*   **Operational Dashboards:** Live metrics on patient footfall, average wait times, and bed occupancy.

---

## 3. Technology Stack & Architecture

Ayphen Care is built on a modern, cloud-native stack designed for high availability, security, and performance.

### **Frontend (The User Experience)**
*   **Core Framework:** **React 18** (with **TypeScript**) ensures a responsive, bug-free user interface.
*   **Build System:** **Vite** provides lightning-fast load times and optimized asset delivery.
*   **Component Library:** **Ant Design (Enterprise)** offers a consistent, professional look-and-feel across 500+ screens.
*   **State Management:** **React Context API** handles complex data flows (like valid user sessions) efficiently.
*   **Visualization:** **Ant Design Charts** & **Recharts** for turning raw data into actionable clinical insights.

### **Backend (The Core Engine)**
*   **Runtime:** **Node.js** allows for high-concurrency handling, perfect for real-time hospital environments.
*   **API Framework:** **Express.js** provides a robust RESTful API architecture.
*   **Language:** **TypeScript** is used throughout the stack to prevent data type errors before they happen.
*   **Database:** **PostgreSQL** (v15+) offers ACID-compliant, relational data storage reliability.
*   **ORM:** **TypeORM** abstracts complex database queries into clean, maintainable code.

### **Security & Data Privacy**
*   **Access Security:** **JSON Web Tokens (JWT)** ensure stateless, secure authentication. Every API call is verified against a secure signature.
*   **Data Encryption:** Sensitive fields (like passwords) are hashed using **Bcrypt**. Data in transit is encrypted via **HTTPS/TLS**.
*   **Input Validation:** **class-validator** and **JOI** rigorous checks prevent SQL injection and XSS attacks.

---

## 4. User Personas & "Day in the Life" Scenarios

### 👤 Persona: Dr. Arun (General Physician)
*   **Morning:** Logs in to view his dashboard. Sees 15 appointments scheduled.
*   **Consultation:** Opens the first patient's file. Reviews their diabetic history graph.
*   **Action:** Records current BP. Prescribes "Metformin 500mg". Orders "HbA1c" lab test.
*   **Outcome:** Clicks "Finish". The prescription goes to Pharmacy, Lab Request goes to Pathology.

### 👤 Persona: Ms. Sarah (Front Desk / Reception)
*   **Check-In:** A patient arrives. Sarah searches them by phone number. clicks "Check-In".
*   **Queue:** The system assigns Token #24. The TV in the lobby announces "Token 24 to Triage".
*   **Emergency:** An ambulance arrives. Sarah quickly registers a "New Emergency Patient" bypassing the queue.

### 👤 Persona: Mr. Suresh (Pharmacist)
*   **Notification:** Sees a red badge on "Pending Prescriptions".
*   **Processing:** Opens Dr. Arun's order. System warns "Metformin stock is low (10 strips left)".
*   **Dispensing:** Scans the medicine box. Clicks "Dispense". The invoice is auto-generated.
*   **Inventory:** System automatically deducts the stock quantity.

---

## 5. Future Roadmap & Innovation

Ayphen Care is constantly evolving. Upcoming features in the pipeline include:

*   **AI-Assisted Diagnostics:** Integration with AI models to suggest preliminary diagnoses based on symptoms and vitals.
*   **Insurance Claims Processing:** Direct integration with TPA (Third Party Administrator) APIs for cashless claim adjudication.
*   **IoT Integration:** Auto-capture vitals from connected devices (Smart BP monitors, Weighing scales).
*   **In-Patient Management (IPD):** Complete bed management, OT scheduling, and discharge summary generation.
