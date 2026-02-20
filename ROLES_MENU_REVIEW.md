# HMS Roles & Menu Structure Review

## Executive Summary

The Ayphen Care HMS implements a sophisticated role-based access control (RBAC) system with 8 distinct user roles, each having tailored menu structures. The application features a comprehensive public landing page and a modular internal navigation system organized by functional suites.

---

## 1. User Roles & Permissions

### 1.1 Role Hierarchy

| Role | Level | Description | Primary Access |
|------|-------|-------------|----------------|
| **super_admin** | Platform Owner | Manages entire SaaS platform | All organizations, global settings |
| **admin** | Hospital Admin | Manages single hospital | All hospital operations |
| **doctor** | Clinical Staff | Medical practitioners | Clinical modules, patient care |
| **nurse** | Clinical Staff | Nursing staff | Patient care, ward management |
| **receptionist** | Front Office | Patient registration | Appointments, billing |
| **pharmacist** | Pharmacy | Pharmacy operations | Pharmacy, inventory |
| **lab_technician** | Lab Staff | Laboratory operations | Lab tests, results |
| **accountant** | Finance | Financial operations | Billing, reports |
| **patient** | End User | Patients | Portal access |

### 1.2 Permission System

**Core Permissions:**
- `view_user`, `create_user`, `update_user`, `delete_user`
- `view_patient`, `create_patient`, `update_patient`, `delete_patient`
- `view_appointment`, `create_appointment`, `update_appointment`, `delete_appointment`
- `view_medical_record`, `create_medical_record`, `update_medical_record`
- `view_bill`, `create_bill`, `update_bill`
- `view_inventory`, `manage_inventory`
- `manage_settings`, `manage_roles`
- `view_reports`, `generate_reports`

---

## 2. Menu Structure Analysis

### 2.1 Super Admin Menu (Platform Level)

**Structure: 17 Top-Level Items**

#### 🏛️ **SaaS Management**
- Organizations (Multi-tenant management)
- Subscriptions (Plan management)
- Audit Logs (System monitoring)
- Global Analytics (Cross-organization metrics)
- Sales Leads (Business development)

#### 💬 **Communications**
- Broadcast Alerts (System notifications)
- Messages (Internal communication)
- System Feedback (User feedback)

#### ⚙️ **Global Admin**
- User Directory (All platform users)
- Roles & Permissions (RBAC management)
- Locations & Branches (Multi-location)
- Staff HR (Human resources)
- Departments (Service catalog)
- Global Settings (Platform configuration)

#### ❤️ **Clinical Suite**
- Doctors (Provider management)
- Appointments (Scheduling)
- Patients (Patient records)
- Telemedicine (Virtual care)
- Service Catalog (Medical services)

#### 🏢 **Operations Suite**
- Inpatient (IPD) (Ward management)
- Operation Theatre (Surgical)
- Dialysis (Specialized services)
- Ambulance & EMS (Emergency transport)
- Queue Management (Patient flow)

#### 🔬 **Diagnostics Suite**
- Laboratory (Lab services)
- Pharmacy (Medication management)
- Radiology (Imaging services)
- Blood Bank (Blood services)

#### 💰 **Finance Suite**
- Billing & Invoices (Revenue cycle)
- Packages & Deposits (Financial products)
- Insurance Claims (Third-party billing)
- Financial Reports (Analytics)

#### 📋 **Records & Certificates**
- Death Certificates (Vital records)
- Birth Register (Vital statistics)
- Consent Management (Legal compliance)
- MLC (Medico-Legal Cases)
- Biomedical Waste (Environmental compliance)
- Incident Reports (Safety tracking)
- Infection Control (Quality assurance)

#### 📺 **Telemedicine** (Standalone)
- Virtual consultations platform

#### 👥 **HR Management**
- Duty Roster (Staff scheduling)

#### 🔧 **Asset Management**
- Equipment and infrastructure tracking

#### ☕ **Diet Management**
- Nutrition services

#### 💊 **Drug Register**
- Pharmacy compliance (Schedule H/H1)

#### 🛡️ **ABHA/ABDM**
- Digital health ID integration

#### 📄 **PCPNDT Form F**
- Regulatory compliance

#### 🏦 **Insurance/TPA**
- Third-party administrator management

#### 🏥 **Physiotherapy**
- Rehabilitation services

#### 📁 **Records Digitization**
- Document management

---

### 2.2 Standard User Menu (Hospital Level)

**Role-Based Filtering Applied**

#### 🏥 **Common Modules (Most Roles)**
- **Dashboard** (Admin, Doctor, Nurse, Receptionist, Pharmacist, Lab Tech, Accountant)

#### 👥 **Patient Management**
- **Patients** (Admin, Doctor, Nurse, Receptionist, Accountant)
- *Excluded: Lab Tech, Pharmacist*

#### 📅 **Appointments**
- **Book Appointment** (Admin, Doctor, Nurse, Receptionist)
- **View Appointments** (All clinical roles)
- **All Appointments** (Admin only)
- **Patients**: Single "Appointments" item (no submenu)

#### 📋 **Medical Records**
- **Medical Records** (Admin, Doctor, Nurse, Receptionist, Accountant)
- *Excluded: Lab Tech, Pharmacist*

#### 🚨 **Queue & Visit Operations**
- **Reception Queue** (Admin, Super Admin, Receptionist)
- **Triage Station** (Admin, Super Admin, Nurse)
- **Doctor Console** (Doctor)

#### 🔬 **Laboratory**
- **Lab Tech**: Focused lab menu (Dashboard, Collection, Results, View)
- **Doctor**: Lab ordering capabilities (Order, View Results)

#### 💊 **Pharmacy**
- **Pharmacist**: Full pharmacy suite (Dashboard, Inventory, Orders, Billing)
- **Doctor**: Prescription capabilities (Prescribe, View)

#### 🏥 **Inpatient Management**
- **Admin, Nurse**: Full IPD access (Beds, Wards, Nursing, Discharge)
- **Doctor**: Clinical IPD access (Rounds, Discharge Summary)

#### 💰 **Billing & Payments**
- **Admin, Receptionist, Accountant**: Full billing access
- **Doctor**: View only access

#### 🚨 **Emergency**
- **Admin, Receptionist**: Emergency management
- **Doctor, Nurse**: Clinical emergency access

#### 📊 **Reports**
- **Admin, Accountant**: Full reporting suite
- **Doctor**: Clinical reports only

#### ⚙️ **Settings**
- **Admin**: Full settings access
- **Others**: Limited profile settings

---

### 2.3 Patient Menu (Portal Level)

**Simplified Patient-Facing Navigation**

#### 🏠 **Patient Dashboard**
- Overview of health information
- Quick actions (Book appointment, View records)

#### 📅 **Appointments**
- Book new appointments
- View upcoming/past appointments
- Cancel/reschedule

#### 📋 **Medical Records**
- View medical history
- Download reports
- Lab results

#### 💊 **My Pharmacy**
- Prescription history
- Medicine reminders

#### 💰 **Billing History**
- View invoices
- Payment status
- Download receipts

#### 🏥 **Insurance**
- Insurance details
- Claim status

#### 🔍 **Symptom Checker**
- Self-assessment tool

---

## 3. Landing Page Analysis

### 3.1 Public Landing Page Structure

**Hero Section:**
- Split-screen layout (Text + Image)
- Primary branding: "Ayphen Care"
- Call-to-action buttons: Book Appointment, Emergency
- Background: Maroon theme (#800000) with gradient overlay

**Key Sections:**
1. **Our Centres of Excellence** - Specialized departments
2. **Our Services** - Medical services overview
3. **Why Choose Us** - Value propositions
4. **Success Stories** - Patient testimonials
5. **Book Appointment** - Appointment booking CTA
6. **Emergency Services** - 24/7 emergency contact

**Design Elements:**
- Glassmorphism effects on cards
- Smooth animations and transitions
- Responsive grid layouts
- Professional medical imagery
- Consistent color scheme (Maroon/Pink)

---

## 4. Issues Identified

### 4.1 Menu Structure Issues

1. **Super Admin Menu Overcrowding**
   - 17 top-level items is cognitive overload
   - Some items could be grouped better
   - Redundant entries (e.g., Telemedicine appears twice)

2. **Inconsistent Grouping**
   - Related modules scattered across different sections
   - No clear functional hierarchy
   - Some single items could be sub-items

3. **Navigation Depth**
   - Too many clicks to reach frequently used features
   - No quick access toolbar
   - Missing search functionality

### 4.2 Role-Based Access Issues

1. **Permission Granularity**
   - Some roles have too broad access
   - Lab tech and pharmacist restrictions are good
   - Accountant access could be more focused

2. **Menu Inconsistencies**
   - Same module appears differently for different roles
   - Some features hidden behind multiple clicks

### 4.3 Landing Page Issues

1. **Theme Inconsistency**
   - Landing uses maroon theme
   - Application uses pink theme
   - Brand disconnect between public and private areas

2. **Information Architecture**
   - Too much information above fold
   - Could benefit from clearer value propositions
   - Missing clear navigation to different user types

---

## 5. Recommendations

### 5.1 Menu Restructuring

**Proposed Super Admin Menu (8 Groups):**

#### 🏛️ **Platform Management**
- Organizations
- Subscriptions
- Global Settings
- Audit Logs

#### 🏥 **Clinical Operations**
- Patients
- Doctors
- Appointments
- Medical Records
- Telemedicine

#### 🔬 **Diagnostic Services**
- Laboratory
- Pharmacy
- Radiology
- Blood Bank

#### 🏨 **Hospital Operations**
- Inpatient Management
- Operation Theatre
- Emergency Services
- Queue Management
- Ambulance

#### 💰 **Financial Management**
- Billing & Invoices
- Insurance Claims
- Financial Reports
- Packages & Deposits

#### 📋 **Compliance & Records**
- Medical Records Digitization
- Drug Register
- PCPNDT Compliance
- Infection Control
- Certificates (Birth/Death)

#### 🔗 **Integrations**
- ABHA/ABDM
- Third-party Systems
- APIs

#### ⚙️ **System Administration**
- User Management
- Roles & Permissions
- Departments
- Locations
- HR Management

### 5.2 Theme Unification

**Recommendations:**
1. Unify landing page with pink theme (#e91e63)
2. Create consistent brand experience
3. Use same design language throughout
4. Maintain professional medical aesthetic

### 5.3 Navigation Improvements

**Quick Actions Toolbar:**
- Book Appointment
- New Patient Registration
- Emergency Access
- Quick Search
- Notifications

**Global Search:**
- Search patients, appointments, bills
- Quick access to any module
- Keyboard shortcuts

**Breadcrumb Navigation:**
- Clear location context
- Easy navigation back
- Module hierarchy indication

### 5.4 Role-Based Enhancements

**Improved Role Separation:**
1. **Super Admin**: Platform-level focus only
2. **Admin**: Hospital operations focus
3. **Clinical Roles**: Patient care focus
4. **Support Roles**: Specific function focus
5. **Patients**: Self-service focus

---

## 6. Implementation Priority

### Phase 1: Critical (1 week)
- [ ] Unify theme colors (landing page)
- [ ] Implement menu grouping for Super Admin
- [ ] Add global search functionality
- [ ] Create quick actions toolbar

### Phase 2: Important (2 weeks)
- [ ] Redesign role-based menus
- [ ] Improve navigation hierarchy
- [ ] Add breadcrumb navigation
- [ ] Optimize mobile navigation

### Phase 3: Enhancement (3 weeks)
- [ ] Advanced search features
- [ ] Personalized dashboards
- [ ] Keyboard shortcuts
- [ ] Accessibility improvements

---

## 7. Conclusion

The HMS has a comprehensive role-based menu system with good separation of concerns. The main issues are:

1. **Menu overcrowding** for Super Admin (17 items → 8 groups)
2. **Theme inconsistency** between landing and application
3. **Navigation efficiency** could be improved with search and quick actions

The proposed restructuring will significantly improve usability while maintaining the robust security model and comprehensive functionality.

---

*Prepared by: HMS Architecture Review Team*
*Date: February 17, 2026*
