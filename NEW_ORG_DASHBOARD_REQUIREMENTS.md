# 🏥 Premium Hospital Dashboard Requirements

This document defines the high-end, comprehensive dashboard layout and features for the Hospital Management System. This design serves as the gold standard for all new organizations.

## 🎨 Visual Aesthetics & Design System
*   **Aesthetic Direction**: Ultra-modern, premium "Sleek Dark" or "Clean Glassmorphism" theme. 
*   **Interactive Elements**: Vibrant gradients for status bars, subtle micro-animations for notifications, and clear status indicators (Available/Busy/Critical).
*   **Typography**: Clean sans-serif (e.g., Inter or Roboto) with clear hierarchy and high readability.

---

## 🏗️ Dashboard Architecture

### 1. Global Header & Quick Controls
*   **Organization Identity**: Branding and current session info (Date/Time).
*   **Action Hub**: High-visibility buttons for `+ New Patient` and `📊 Reports`.
*   **Context Switcher**: Secondary navigation for `Overview`, `Patients`, `Appointments`, `Staff`, and `Inventory`.

### 2. High-Level KPI Row (Top Cards)
*   **Total Patients**: Dynamic count with daily trend indicator (e.g., +23 today).
*   **Bed Occupancy**: Radial or horizontal progress bar showing real-time capacity.
*   **Emergency Cases**: Critical count with "High Alert" visual styling.
*   **Pending Discharges**: Workflow stage indicator for turnover management.

### 3. Real-Time Operations (Main Grid)
*   **📅 Today's Appointments**: 
    - Detailed list view: Patient Name, Doctor, Time, Specialty.
    - Status Pills: `Confirmed`, `Waiting`, `In-Progress`, `Completed`.
*   **🔔 Alerts & Notifications Hub**: 
    - Color-coded severity (Red for Critical, Yellow for Warning, Blue for Info).
    - Categories: ICU vitals, Pharmacy stock, Lab results, Staff updates.

### 4. Specialization & Resource Tracking
*   **Department Status**: Progress bars or "load" indicators for Emergency, ICU, Surgery, Pediatrics, and Cardiology.
*   **👨‍⚕️ Doctors on Duty**: Live status track (🟢 Available, 🔴 Busy, 🟡 On Break) with patient load counts.
*   **Activity Stream**: Chronological feed of institutional events (Admissions, Surgery completions, Discharges).

### 5. Detailed Metric Footer (Summary Strip)
*   **Volume Metrics**: Total Inpatients vs. Outpatients.
*   **Operational Volume**: Count of Surgeries performed today and Lab Tests pending.
*   **Financial Pulse**: `Revenue Today` displayed in high-contrast styling (e.g., Emerald Green).

---

## 🛠️ Functional Capabilities
*   **Interactive Drills**: Clicking any card or list item opens detailed management views.
*   **Live Updates**: Websocket integration for real-time occupancy and alert changes.
*   **Filtering**: Quick toggle to filter dashboard views by Department or Time Shift.
