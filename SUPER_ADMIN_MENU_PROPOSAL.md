# Ideal Super Admin Menu Structure

To achieve a true "Platform Owner" feel, we should declutter the sidebar. A Super Admin manages the **System**, not individual patient queues (unless investigating).

Here is the proposed **Cleaned Up Structure**:

## 1. 🚀 Platform Core (Top Priority)
**Start here. These are your "God Mode" tools.**
- **Command Center** (Dashboard)
- **SaaS Management** `[Expandable]`
  - Organizations (Tenants)
  - Subscriptions (Revenue)
  - System Health
  - **Audit Logs** (Security)
- **Communications** `[Expandable]`
  - **Broadcast Alerts** (New!)
  - System Messages

## 2. ⚙️ Global Administration
**Configure how the platform works.**
- **User Management** (Global User Search)
- **Roles & Permissions** (RBAC)
- **Locations & Branches**
- **Settings** (White-labeling, API Keys)

## 3. 🏥 Hospital Modules (Grouped)
**Group the operational tools so they don't clutter the view.**

- **Clinical Suite** `[Expandable]`
  - Doctors
  - Patients
  - Appointments
  - Electronic Health Records (EHR)
  - Telemedicine

- **Operations Suite** `[Expandable]`
  - Inpatient (Wards/Beds)
  - OT Management
  - Ambulance & Emergency
  - Queue Management

- **diagnostic Suite** `[Expandable]`
  - Laboratory
  - Pharmacy & Inventory

- **Finance Suite** `[Expandable]`
  - Billing & Invoices
  - Financial Reports
  - Insurance Claims

## What to Remove/Hide?
These items are for *Patients* or *Staff*, not Super Admins. Hide them unless explicitly needed for testing:
- ❌ **"My Medical Records"** (You are an admin, you don't have records)
- ❌ **"Book Appointment"** (Use "Schedule Session" or "Appointments Admin" instead)
- ❌ **"My Prescriptions"**

---

## Action Plan
1.  **Hide Irrelevant Items:** Remove Patient/Staff-specific links for Super Admin.
2.  **Group Modules:** Create the "Clinical", "Operations", and "Diagnostic" groups in the sidebar.
3.  **Promote Platform Tools:** Move SaaS Management to the top.

**Shall I apply this "Clean Up" to the sidebar code?**
