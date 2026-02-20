# User Roles & Profile Coverage Report

## 1. Receptionist (Front Desk Profile)
**Persona**: "The Coordinator"
**Primary Goal**: Rapid patient intake and queue management to minimize wait times.

### Covered Features & UI Flows:
*   **Dashboard (The "Sunrise" View)**:
    *   **Hero Stats**: Immediate visibility of "Total Visits Today" and "Average Wait Time" to gauge lobby pressure.
    *   **Queue Management**: A centralized, real-time list of waiting patients with status indicators (Waiting, With Doctor, Triage).
*   **Patient Registration**:
    *   **Walk-in Modal**: A streamlined, 3-step modal (Search -> Demographics -> Visit Reason) designed for speed.
    *   **Quick Search**: Global search bar to find existing patients by Phone/Name instantly.
*   **Appointment Booking**:
    *   **Calendar Interface**: Drag-and-drop slots for booking future visits.
*   **Billing (Basic)**:
    *   **Invoice Generation**: Quick generation of OPD consulting slips.

### 2. Doctor (Clinical Profile)
**Persona**: "The Decision Maker"
**Primary Goal**: Efficient clinical documentation and rapid decision-making with full context.

### Covered Features & UI Flows:
*   **Doctor Console (The Inbox)**:
    *   **Patient Queue**: A prioritized list of patients assigned to them.
    *   **Priority Indicators**: Visual tags for "Emergency" or "Senior Citizen" to help prioritize care.
*   **Consultation Workspace (The "Focus" View)**:
    *   **Sticky Patient Header**: A persistent pink ribbon used to display critical info (Allergies, Age, Gender) at all times.
    *   **Timeline View**: A vertical history rail showing past visits; clicking acts as an accordion to reveal details.
    *   **SOAP Editor**:
        *   *Subjective*: Distraction-free text area.
        *   *Objective*: Vitals pre-filled from Triage; Physical exam templates.
        *   *Assessment*: ICD-10 Search tools.
        *   *Plan*: e-Prescribing and Lab Order checklists.
*   **Inpatient Rounds**:
    *   **Ward List**: List of admitted patients requiring daily rounds.

### 3. Nurse (Caregiver Profile)
**Persona**: "The Monitor"
**Primary Goal**: Accurate monitoring of patient conditions and efficient execution of doctor orders.

### Covered Features & UI Flows:
*   **Triage Station**:
    *   **Vitals Entry**: Large, touch-friendly inputs for BP, Temp, HR.
    *   **Safety Alerts**: Visual "Shake" animation and red glow when entering abnormal values (e.g., Temp > 100°F).
*   **Ward Management (Inpatient)**:
    *   **Visual Bed Map**: A 2D grid representation of the ward.
    *   **Bed Cards**: Color-coded cards (Pink=Occupied, White=Free, Yellow=Discharging) for instant occupancy awareness.
    *   **Admission/Discharge**: Workflows to assign beds or process discharges.
*   **Task Management**:
    *   **Nursing Notes**: Digital log for shift notes and observations.

### 4. Pharmacist (Dispenser Profile)
**Persona**: "The Gatekeeper"
**Primary Goal**: Safe dispensing of medications and inventory control.

### Covered Features & UI Flows:
*   **Dispensing Screen (POS Style)**:
    *   **Prescription Viewer**: Digital view of the doctor's order.
    *   **Stock Check**: Instant "Available/Unavailable" indicators next to each prescribed item.
    *   **Substitutes**: One-click suggestion for generic alternatives if the brand is out of stock.
*   **Inventory Management**:
    *   **Stock Dashboard**: Visual "Progress Bars" indicating stock levels (Full vs. Low).
    *   **Expiry Alerts**: Red-tinted rows for medicines expiring within 30 days.

### 5. Laboratory Technician (Analyst Profile)
**Persona**: "The Verifier"
**Primary Goal**: Accurate processing of samples and timely result entry.

### Covered Features & UI Flows:
*   **Lab Dashboard (Kanban)**:
    *   **Workflow Board**: Columns for "Pending Collection", "Processing", and "Verification".
    *   **Urgency Tags**: "STAT/Emergency" tests highlighted in Red at the top of the list.
*   **Result Entry**:
    *   **Split Screen**: Left side shows the Doctor's Order; Right side is the Data Entry form.
    *   **Reference Ranges**: Helper text showing normal ranges (e.g., "12-16 g/dL") below inputs.
    *   **Auto-Flagging**: Inputs highlight Yellow/Red automatically if the entered value is out of range.

### 6. Administrator (Oversight Profile)
**Persona**: "The Controller"
**Primary Goal**: Operational oversight and performance monitoring.

### Covered Features & UI Flows:
*   **Executive Dashboard**:
    *   **KPI Cards**: High-level metrics for Revenue, Footfall, and Bed Occupancy.
    *   **Trend Charts**: Pink/Purple gradient area charts showing performance over the last 30 days.
*   **User Management**:
    *   **Staff Grid**: Management of employee accounts, roles, and access permissions.
*   **Dept & Services**:
    *   **Configuration**: Tools to add new departments, services, or hospital locations.

---

## Summary of Design Scope
*   **Total Roles Covered**: 6
*   **Total Key Views**: ~18 (Dashboards, Workspaces, Grids)
*   **Theme Applied**: Lunaris Pink (Warm, Caring, Efficient)
