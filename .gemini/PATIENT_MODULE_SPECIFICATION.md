# Patient Module - Complete Specification
## Ayphen Care Hospital Management System

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Patient Data Structure](#patient-data-structure)
3. [Patient Information Categories](#patient-information-categories)
4. [Entity Relationships](#entity-relationships)
5. [Patient Detail View - Tabs & Features](#patient-detail-view)
6. [Enhanced Patient Requirements](#enhanced-patient-requirements)
7. [Sample Test Data](#sample-test-data)

---

## 🏥 Overview

The **Patient Module** is the central entity in the Hospital Management System. A patient connects to virtually every other module including:
- **Appointments** (scheduled visits)
- **Doctors** (treating physicians)
- **Departments** (assigned care units)
- **Prescriptions** (medications)
- **Lab Results** (diagnostic tests)
- **Billing/Invoices** (payments)
- **Inpatient** (admissions)

---

## 📊 Patient Data Structure

### Core Patient Entity

```typescript
interface Patient {
  // ═══════════════════════════════════════════════════════════
  // SECTION 1: IDENTIFICATION
  // ═══════════════════════════════════════════════════════════
  id: string;                          // UUID - System generated
  patientId?: string;                  // Human-readable ID (e.g., PAT-2025-0001)
  
  // ═══════════════════════════════════════════════════════════
  // SECTION 2: PERSONAL INFORMATION
  // ═══════════════════════════════════════════════════════════
  firstName: string;                   // Required
  lastName: string;                    // Required
  middleName?: string;                 // Optional
  dateOfBirth: string;                 // Required (YYYY-MM-DD)
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  
  // Profile & Demographics
  profileImage?: string;               // Photo URL
  nationality?: string;
  ethnicity?: string;
  religion?: string;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed' | 'separated';
  occupation?: string;
  
  // ═══════════════════════════════════════════════════════════
  // SECTION 3: CONTACT INFORMATION
  // ═══════════════════════════════════════════════════════════
  email: string;                       // Required
  phone: string;                       // Required (Primary)
  alternatePhone?: string;             // Secondary phone
  
  // Address
  address?: string;                    // Street address
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  
  // ═══════════════════════════════════════════════════════════
  // SECTION 4: EMERGENCY CONTACT
  // ═══════════════════════════════════════════════════════════
  emergencyContact?: {
    name: string;
    relationship: string;              // e.g., Spouse, Parent, Sibling
    phone: string;
    email?: string;
    address?: string;
  };
  
  // ═══════════════════════════════════════════════════════════
  // SECTION 5: MEDICAL INFORMATION
  // ═══════════════════════════════════════════════════════════
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  height?: number;                     // in cm
  weight?: number;                     // in kg
  bmi?: number;                        // Calculated
  
  // Medical History
  allergies?: string[];                // e.g., ['Penicillin', 'Peanuts']
  conditions?: string[];               // Chronic conditions e.g., ['Diabetes', 'Hypertension']
  medications?: string[];              // Current medications
  pastSurgeries?: string[];            // Surgical history
  familyHistory?: string[];            // Hereditary conditions
  
  // Lifestyle
  smokingStatus?: 'never' | 'former' | 'current';
  alcoholConsumption?: 'none' | 'occasional' | 'moderate' | 'heavy';
  exerciseFrequency?: 'none' | 'light' | 'moderate' | 'active';
  dietaryRestrictions?: string[];
  
  // ═══════════════════════════════════════════════════════════
  // SECTION 6: INSURANCE INFORMATION
  // ═══════════════════════════════════════════════════════════
  insurance?: {
    provider: string;                  // e.g., "Blue Cross Blue Shield"
    policyNumber: string;              // Policy ID
    groupNumber?: string;              // Group ID
    subscriberName?: string;           // Primary policyholder
    subscriberRelationship?: string;   // e.g., "Self", "Spouse"
    validFrom?: string;
    validUntil: string;
    coverageType?: 'individual' | 'family' | 'employer';
    copayAmount?: number;
    deductible?: number;
  };
  
  // Secondary Insurance (if applicable)
  secondaryInsurance?: {
    provider: string;
    policyNumber: string;
    validUntil: string;
  };
  
  // ═══════════════════════════════════════════════════════════
  // SECTION 7: SYSTEM & STATUS
  // ═══════════════════════════════════════════════════════════
  status: 'active' | 'inactive' | 'archived' | 'deceased';
  registrationDate: string;
  lastVisit?: string;
  
  // Assigned Care
  primaryDoctorId?: string;            // Primary physician
  primaryDepartmentId?: string;        // Primary department
  
  // Preferences
  preferredLanguage?: string;
  communicationPreference?: 'email' | 'phone' | 'sms';
  
  // Notes
  notes?: string;                      // General notes
  specialInstructions?: string;        // Special care instructions
  
  // Metadata
  createdAt?: string;
  updatedAt?: string;
  organizationId: string;              // Multi-tenant support
}
```

---

## 📁 Patient Information Categories

### Category 1: Personal Details
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `firstName` | string | ✅ Yes | Legal first name |
| `lastName` | string | ✅ Yes | Legal last name |
| `middleName` | string | ❌ No | Middle name/initial |
| `dateOfBirth` | date | ✅ Yes | Birth date (Age auto-calculated) |
| `gender` | enum | ✅ Yes | Male/Female/Other/Prefer not to say |
| `profileImage` | URL | ❌ No | Patient photo |
| `maritalStatus` | enum | ❌ No | Single/Married/Divorced/Widowed |
| `occupation` | string | ❌ No | Current job/profession |

### Category 2: Contact Information
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | email | ✅ Yes | Primary email (for login/portal) |
| `phone` | string | ✅ Yes | Primary contact number |
| `alternatePhone` | string | ❌ No | Secondary phone |
| `address` | string | ❌ No | Street address |
| `city` | string | ❌ No | City |
| `state` | string | ❌ No | State/Province |
| `zipCode` | string | ❌ No | ZIP/Postal code |
| `country` | string | ❌ No | Country |

### Category 3: Emergency Contact
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ⚠️ Recommended | Emergency contact name |
| `relationship` | string | ⚠️ Recommended | Relation (Spouse, Parent, etc.) |
| `phone` | string | ⚠️ Recommended | Emergency phone |
| `email` | string | ❌ No | Emergency email |

### Category 4: Medical Information
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `bloodGroup` | enum | ⚠️ Recommended | Blood type (A+, O-, etc.) |
| `height` | number | ❌ No | Height in cm |
| `weight` | number | ❌ No | Weight in kg |
| `allergies` | string[] | ⚠️ Critical | Known allergies (drugs, food, etc.) |
| `conditions` | string[] | ❌ No | Chronic conditions |
| `medications` | string[] | ❌ No | Current medications |
| `pastSurgeries` | string[] | ❌ No | Surgical history |
| `familyHistory` | string[] | ❌ No | Hereditary conditions |

### Category 5: Insurance Details
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `provider` | string | ⚠️ Recommended | Insurance company name |
| `policyNumber` | string | ⚠️ Recommended | Policy ID number |
| `groupNumber` | string | ❌ No | Employer group number |
| `validUntil` | date | ⚠️ Recommended | Policy expiration date |
| `copayAmount` | number | ❌ No | Standard copay |

---

## 🔗 Entity Relationships

```
                              ┌─────────────────────┐
                              │    ORGANIZATION     │
                              │   (Multi-Tenant)    │
                              └─────────┬───────────┘
                                        │
                                        │ 1:N
                                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                            PATIENT                                  │
│                    (Central Entity)                                 │
└─────────────────────────────────────────────────────────────────────┘
         │               │               │               │
         │ 1:N           │ N:1           │ 1:N           │ 1:N
         ▼               ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ APPOINTMENT │  │   DOCTOR    │  │ PRESCRIPTION│  │  LAB ORDER  │
│             │  │(User+Doctor)│  │             │  │             │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │                │
       │ N:1            │ N:1            │ 1:N            │ 1:N
       ▼                ▼                ▼                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  SERVICE    │  │ DEPARTMENT  │  │ PRESCRIPTION│  │ LAB RESULTS │
│             │  │             │  │   ITEMS     │  │             │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
                        │
                        │ 1:N
                        ▼
                ┌─────────────┐
                │  SERVICES   │
                └─────────────┘
```

### Relationship Details:

| From | To | Relationship | Description |
|------|-----|--------------|-------------|
| Patient | Organization | N:1 | Each patient belongs to one org |
| Patient | Appointments | 1:N | Patient can have many appointments |
| Patient | Doctor | N:N | Patient can see many doctors |
| Patient | Department | N:1 | Patient has primary department |
| Patient | Prescriptions | 1:N | Patient can have many prescriptions |
| Patient | Lab Orders | 1:N | Patient can have many lab tests |
| Patient | Invoices | 1:N | Patient can have many bills |
| Patient | Inpatient Records | 1:N | Patient admission history |
| Appointment | Service | N:1 | Appointment is for a service |
| Appointment | Doctor | N:1 | Appointment is with a doctor |
| Doctor | Department | N:1 | Doctor belongs to department |

---

## 📱 Patient Detail View

The Patient Detail page has the following tabs:

### Tab 1: Overview
Displays:
- **Quick Stats Cards:**
  - Total Appointments
  - Active Prescriptions
  - Lab Tests Done
  - Patient Age

- **Personal Information:**
  - Full Name, DOB, Age
  - Gender, Blood Group
  - Email, Phone
  - Full Address
  - Emergency Contact

- **Medical Information:**
  - Known Allergies (highlighted in RED)
  - Chronic Conditions (highlighted in ORANGE)
  - Current Medications (highlighted in BLUE)

### Tab 2: Appointments
Table showing:
| Column | Description |
|--------|-------------|
| Date & Time | Appointment schedule |
| Doctor | Treating physician |
| Department | Medical department |
| Reason | Visit reason |
| Status | Scheduled/Completed/Cancelled |

### Tab 3: Prescriptions
Table showing:
| Column | Description |
|--------|-------------|
| Date | Prescription date |
| Doctor | Prescribing physician |
| Medications | Number of medicines |
| Status | Active/Completed |

### Tab 4: Lab Results
Table showing:
| Column | Description |
|--------|-------------|
| Test Date | When test was done |
| Test Name | Type of test |
| Result | Test outcome |
| Status | Pending/Completed |

### Tab 5: Medical History (Enhanced)
- Vitals Timeline
- Visit History
- Surgical History
- Vaccination Records

### Tab 6: Billing
- Outstanding Invoices
- Payment History
- Insurance Claims

---

## 🚀 Enhanced Patient Requirements

### Additional Fields to Consider:

#### 1. Identity Documents
```typescript
identityDocuments?: {
  type: 'passport' | 'drivers_license' | 'national_id' | 'ssn';
  number: string;
  issuingCountry?: string;
  expiryDate?: string;
  documentImageUrl?: string;
}[];
```

#### 2. Vital Signs History
```typescript
vitalSigns?: {
  date: string;
  temperature?: number;        // °F or °C
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  heartRate?: number;          // BPM
  respiratoryRate?: number;    // Breaths per minute
  oxygenSaturation?: number;   // SpO2 %
  weight?: number;
  height?: number;
  painLevel?: number;          // 1-10 scale
  notes?: string;
  recordedBy?: string;         // Staff ID
}[];
```

#### 3. Consent & Legal
```typescript
consents?: {
  type: 'treatment' | 'data_sharing' | 'research' | 'marketing';
  status: boolean;
  signedDate?: string;
  expiryDate?: string;
  documentUrl?: string;
}[];

advanceDirectives?: {
  livingWill?: boolean;
  healthcareProxy?: {
    name: string;
    phone: string;
    relationship: string;
  };
  dnrOrder?: boolean;
  organDonor?: boolean;
};
```

#### 4. Social & Support
```typescript
socialInfo?: {
  housingStatus?: 'owned' | 'rented' | 'homeless' | 'assisted_living';
  livesAlone?: boolean;
  primaryCaregiver?: string;
  transportationAccess?: boolean;
  languageBarrier?: boolean;
  interpreterNeeded?: boolean;
  preferredLanguage?: string;
};
```

#### 5. Clinical Notes
```typescript
clinicalNotes?: {
  id: string;
  date: string;
  type: 'progress' | 'admission' | 'discharge' | 'consultation' | 'procedure';
  content: string;
  author: string;              // Doctor ID
  department?: string;
  attachments?: string[];      // File URLs
}[];
```

---

## 📅 Patient History Tracking (NEW)

This section defines all historical data that should be tracked for each patient within the hospital.

### 1. Admission History (Inpatient)
All times the patient was admitted as an inpatient:

```typescript
interface AdmissionHistory {
  id: string;
  patientId: string;
  admissionDate: string;              // When admitted
  dischargeDate?: string;             // When released (null if still admitted)
  wardId: string;                     // Ward/Floor
  roomNumber?: string;                // Room assignment
  bedNumber?: string;                 // Bed number
  admissionReason: string;            // Chief complaint / Why admitted
  admissionType: 'emergency' | 'elective' | 'transfer';
  primaryDiagnosis?: string;          // Main condition (ICD-10)
  secondaryDiagnoses?: string[];      // Additional diagnoses
  attendingDoctorId: string;          // Primary physician
  consultingDoctorIds?: string[];     // Other doctors involved
  totalDays?: number;                 // Length of stay (calculated)
  dischargeSummary?: string;          // Final notes
  dischargeStatus?: 'recovered' | 'improved' | 'unchanged' | 'transferred' | 'deceased' | 'left_ama';
  followUpDate?: string;              // Post-discharge follow-up
  createdAt: string;
  updatedAt: string;
}
```

| Field | Description |
|-------|-------------|
| Admission Date | When patient was admitted |
| Discharge Date | When patient was released |
| Ward/Room | Where patient stayed |
| Bed Number | Specific bed assignment |
| Admission Reason | Why admitted (chest pain, surgery, etc.) |
| Admission Type | Emergency/Elective/Transfer |
| Primary Diagnosis | Main diagnosed condition |
| Attending Doctor | Primary treating physician |
| Total Days | Length of hospital stay |
| Discharge Summary | Final notes and instructions |
| Discharge Status | Outcome (Recovered/Improved/etc.) |

---

### 2. Visit History (OPD - Outpatient)
All outpatient visits:

```typescript
interface VisitHistory {
  id: string;
  patientId: string;
  visitDate: string;                  // Date of visit
  visitTime: string;                  // Time of visit
  appointmentId?: string;             // Link to appointment
  departmentId: string;               // Which department
  doctorId: string;                   // Consulting doctor
  visitType: 'new' | 'follow_up' | 'routine_checkup' | 'emergency';
  chiefComplaint: string;             // Reason for visit
  symptoms?: string[];                // Reported symptoms
  diagnosis?: string;                 // What was diagnosed
  treatmentGiven?: string;            // Treatment/procedure done
  prescriptionId?: string;            // Link to prescription if any
  labOrderIds?: string[];             // Lab tests ordered
  vitalSignsId?: string;              // Link to vitals recorded
  followUpDate?: string;              // Next appointment
  notes?: string;                     // Clinical notes
  outcome?: 'resolved' | 'ongoing' | 'referred' | 'admitted';
  createdAt: string;
}
```

| Field | Description |
|-------|-------------|
| Visit Date | When the visit occurred |
| Department | Which department was visited |
| Doctor | Consulting physician |
| Visit Type | New/Follow-up/Routine/Emergency |
| Chief Complaint | Reason for visit |
| Diagnosis | What was diagnosed |
| Treatment Given | Medications/procedures done |
| Follow-up Date | Next scheduled visit |
| Outcome | How the visit concluded |

---

### 3. Vital Signs Timeline
Historical health metrics recorded over time:

```typescript
interface VitalSignsRecord {
  id: string;
  patientId: string;
  recordedAt: string;                 // Date and time
  recordedById: string;               // Nurse/Staff who recorded
  visitId?: string;                   // Link to visit
  admissionId?: string;               // Link to admission (if inpatient)
  
  // Core Vitals
  temperature?: number;               // °F or °C
  temperatureUnit?: 'fahrenheit' | 'celsius';
  bloodPressureSystolic?: number;     // mmHg
  bloodPressureDiastolic?: number;    // mmHg
  heartRate?: number;                 // BPM (beats per minute)
  respiratoryRate?: number;           // Breaths per minute
  oxygenSaturation?: number;          // SpO2 % (0-100)
  
  // Body Measurements
  weight?: number;                    // kg
  height?: number;                    // cm
  bmi?: number;                       // Calculated (kg/m²)
  
  // Additional Vitals
  bloodGlucose?: number;              // mg/dL
  painLevel?: number;                 // 1-10 scale
  
  notes?: string;
}
```

| Vital | Unit | Normal Range |
|-------|------|--------------|
| Temperature | °F / °C | 97.8-99.1°F / 36.5-37.3°C |
| Blood Pressure | mmHg | 90/60 - 120/80 |
| Heart Rate | BPM | 60-100 |
| Respiratory Rate | /min | 12-20 |
| SpO2 | % | 95-100% |
| Blood Glucose | mg/dL | 70-100 (fasting) |
| Pain Level | 1-10 | N/A |

---

### 4. Lab Test History
All diagnostic tests ordered and completed:

```typescript
interface LabTestHistory {
  id: string;
  patientId: string;
  orderId: string;                    // Lab order reference
  orderDate: string;                  // When ordered
  testDate?: string;                  // When sample collected
  resultDate?: string;                // When results available
  orderedById: string;                // Doctor who ordered
  testName: string;                   // CBC, Lipid Panel, etc.
  testCategory: 'blood' | 'urine' | 'imaging' | 'pathology' | 'microbiology' | 'other';
  sampleType?: string;                // Blood, Urine, Tissue, etc.
  results?: {
    parameter: string;                // Test parameter (e.g., Hemoglobin)
    value: string;                    // Result value
    unit: string;                     // Unit of measurement
    referenceRange: string;           // Normal range
    status: 'normal' | 'abnormal_low' | 'abnormal_high' | 'critical';
  }[];
  overallStatus: 'pending' | 'sample_collected' | 'processing' | 'completed' | 'cancelled';
  interpretation?: string;            // Doctor's interpretation
  reportUrl?: string;                 // PDF report link
  notes?: string;
}
```

| Field | Description |
|-------|-------------|
| Order Date | When test was ordered |
| Test Date | When sample was collected |
| Result Date | When results became available |
| Ordered By | Requesting physician |
| Test Name | Type of test (CBC, X-Ray, etc.) |
| Results | Individual test parameters with values |
| Status | Normal/Abnormal/Critical |
| Report | Downloadable PDF |

---

### 5. Prescription History
All medications prescribed:

```typescript
interface PrescriptionHistory {
  id: string;
  patientId: string;
  visitId?: string;                   // Link to visit
  admissionId?: string;               // Link to admission
  prescribedDate: string;             // When prescribed
  prescribedById: string;             // Doctor who prescribed
  diagnosis?: string;                 // Diagnosis this treats
  items: {
    medicationName: string;           // Drug name
    genericName?: string;             // Generic equivalent
    dosage: string;                   // e.g., "500mg"
    frequency: string;                // e.g., "Twice daily"
    duration: string;                 // e.g., "7 days"
    route: 'oral' | 'topical' | 'injection' | 'inhalation' | 'iv';
    instructions?: string;            // e.g., "Take after meals"
    quantity?: number;                // Number of units
  }[];
  status: 'active' | 'completed' | 'discontinued' | 'expired';
  dispensedDate?: string;             // When filled at pharmacy
  dispensedById?: string;             // Pharmacist
  refillsRemaining?: number;
  notes?: string;
}
```

| Field | Description |
|-------|-------------|
| Date | When prescribed |
| Doctor | Prescribing physician |
| Medications | List of medicines with dosage |
| Frequency | How often to take |
| Duration | How long to take |
| Status | Active/Completed/Discontinued |
| Dispensed | When filled at pharmacy |

---

### 6. Procedure/Surgery History
All medical procedures and surgeries:

```typescript
interface ProcedureHistory {
  id: string;
  patientId: string;
  admissionId?: string;               // If inpatient
  procedureDate: string;
  procedureName: string;              // What was done
  procedureCode?: string;             // CPT/ICD code
  procedureType: 'diagnostic' | 'therapeutic' | 'surgical' | 'cosmetic';
  surgeonId?: string;                 // Primary surgeon
  assistantIds?: string[];            // Assisting staff
  anesthesiaType?: 'none' | 'local' | 'regional' | 'general' | 'sedation';
  anesthesiologistId?: string;
  duration?: number;                  // Minutes
  location?: string;                  // OR number, procedure room
  preOpDiagnosis?: string;
  postOpDiagnosis?: string;
  findings?: string;                  // What was found
  complications?: string;             // Any complications
  outcome: 'successful' | 'partial' | 'unsuccessful' | 'complications';
  operativeNotes?: string;            // Detailed notes
  postOpInstructions?: string;        // Recovery instructions
  followUpDate?: string;
}
```

| Field | Description |
|-------|-------------|
| Date | When procedure was done |
| Procedure Name | What was performed |
| Surgeon | Who performed it |
| Anesthesia Type | Local/General/Sedation |
| Duration | How long it took |
| Findings | What was discovered |
| Outcome | Success/Complications |
| Post-Op Notes | Recovery instructions |

---

### 7. Billing & Payment History
All financial transactions:

```typescript
interface BillingHistory {
  id: string;
  patientId: string;
  invoiceNumber: string;              // Invoice reference
  invoiceDate: string;
  dueDate?: string;
  visitId?: string;                   // Link to visit
  admissionId?: string;               // Link to admission
  items: {
    description: string;              // Service/item name
    category: 'consultation' | 'procedure' | 'lab' | 'medication' | 'room' | 'other';
    quantity: number;
    unitPrice: number;
    discount?: number;
    total: number;
  }[];
  subtotal: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  insuranceCovered?: number;          // Amount covered by insurance
  patientResponsibility: number;      // Amount patient owes
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'overdue' | 'waived';
  payments: {
    paymentDate: string;
    amount: number;
    method: 'cash' | 'card' | 'insurance' | 'bank_transfer' | 'upi';
    reference?: string;               // Transaction ID
  }[];
  insuranceClaimId?: string;          // Insurance claim reference
  notes?: string;
}
```

| Field | Description |
|-------|-------------|
| Invoice Date | When billed |
| Invoice Number | Reference number |
| Services | Itemized charges |
| Total Amount | Total bill |
| Insurance Covered | Insurance payment |
| Patient Responsibility | Amount patient owes |
| Payment Status | Paid/Pending/Overdue |
| Payments | Payment history |

---

### 8. Document Uploads
Patient documents stored:

```typescript
interface PatientDocument {
  id: string;
  patientId: string;
  documentType: 'lab_report' | 'xray' | 'mri' | 'ct_scan' | 'discharge_summary' | 
                'insurance_card' | 'id_proof' | 'consent_form' | 'referral' | 
                'external_report' | 'prescription' | 'other';
  documentName: string;
  fileName: string;
  fileUrl: string;                    // Storage URL
  fileSize?: number;                  // Bytes
  mimeType?: string;                  // image/jpeg, application/pdf
  uploadedAt: string;
  uploadedById: string;               // Staff who uploaded
  sourceType?: 'internal' | 'external'; // From this hospital or external
  relatedVisitId?: string;
  relatedAdmissionId?: string;
  description?: string;
  tags?: string[];
  isConfidential?: boolean;
}
```

| Document Type | Examples |
|---------------|----------|
| Lab Reports | Blood test results PDF |
| Imaging | X-Ray, MRI, CT scan images |
| Discharge Summary | Previous admission summaries |
| Insurance | Insurance card copy |
| ID Proof | Passport, Driver's License |
| Consent Forms | Signed consent documents |
| External Reports | Reports from other hospitals |

---

### 9. Clinical Notes Timeline
Doctor and nurse notes:

```typescript
interface ClinicalNote {
  id: string;
  patientId: string;
  visitId?: string;
  admissionId?: string;
  noteDate: string;
  noteTime: string;
  authorId: string;                   // Doctor/Nurse ID
  authorRole: 'doctor' | 'nurse' | 'specialist' | 'therapist';
  noteType: 'progress' | 'soap' | 'admission' | 'discharge' | 
            'consultation' | 'procedure' | 'nursing' | 'telephone';
  
  // SOAP Format (common for clinical notes)
  subjective?: string;                // Patient's complaints
  objective?: string;                 // Observations, vitals, exam findings
  assessment?: string;                // Diagnosis/impression
  plan?: string;                      // Treatment plan
  
  // Or free-form content
  content?: string;                   // Full note text
  
  attachments?: string[];             // Related file URLs
  isAddendum?: boolean;               // If this is an addition to previous note
  parentNoteId?: string;              // Original note if addendum
  isConfidential?: boolean;           // Restricted access
  createdAt: string;
  updatedAt?: string;
}
```

| Note Type | When Used |
|-----------|-----------|
| Progress Note | Regular patient updates |
| SOAP Note | Structured clinical documentation |
| Admission Note | Initial admission assessment |
| Discharge Note | Final discharge summary |
| Consultation Note | Specialist consultation |
| Procedure Note | Post-procedure documentation |
| Nursing Note | Nursing observations |

---

### 📊 Patient History Dashboard View

```
┌─────────────────────────────────────────────────────────────────────┐
│                   PATIENT HISTORY - John Doe                        │
│                   ID: PAT-2025-0001                                 │
├─────────────────────────────────────────────────────────────────────┤
│ [Timeline] [Admissions] [Visits] [Vitals] [Labs] [Rx] [Procedures] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  📅 TIMELINE VIEW (All History Combined)                           │
│  ─────────────────────────────────────────                         │
│                                                                     │
│  2025-01-15  │ 🏥 OPD Visit - Cardiology                           │
│              │    Dr. Sarah Johnson                                 │
│              │    Diagnosis: Hypertension follow-up                 │
│              │    [View Details] [View Prescription]                │
│              │                                                      │
│  2025-01-14  │ 🧪 Lab Test Completed                               │
│              │    Lipid Profile, CBC                                │
│              │    Status: Normal                                    │
│              │    [View Results]                                    │
│              │                                                      │
│  2024-12-20  │ 💊 Prescription Issued                              │
│              │    Dr. Michael Chen                                  │
│              │    3 medications prescribed                          │
│              │    [View Prescription]                               │
│              │                                                      │
│  2024-11-10  │ 🏨 Discharged                                       │
│  to          │    Ward: 3A, Room: 302                               │
│  2024-11-05  │    5 days stay - Chest Pain Evaluation              │
│              │    Outcome: Improved                                 │
│              │    [View Discharge Summary]                          │
│              │                                                      │
│  2024-10-25  │ 📝 Vital Signs Recorded                             │
│              │    BP: 140/90, HR: 78, Temp: 98.6°F                  │
│              │    [View Details]                                    │
│              │                                                      │
│  2024-08-15  │ 🔪 Surgery                                          │
│              │    Appendectomy - Dr. Emily Rodriguez                │
│              │    Outcome: Successful                               │
│              │    [View Operative Notes]                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📝 Sample Test Data

### Patient 1: Adult Male
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1985-03-15",
  "gender": "male",
  "email": "john.doe@email.com",
  "phone": "9876543001",
  "bloodGroup": "O+",
  "address": "123 Main Street",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "USA",
  "emergencyContact": {
    "name": "Jane Doe",
    "relationship": "Spouse",
    "phone": "9876543002"
  },
  "allergies": ["Penicillin", "Shellfish"],
  "conditions": ["Hypertension", "Type 2 Diabetes"],
  "medications": ["Metformin 500mg", "Lisinopril 10mg"],
  "insurance": {
    "provider": "Blue Cross Blue Shield",
    "policyNumber": "BCBS-123456789",
    "groupNumber": "GRP-001",
    "validUntil": "2026-12-31"
  },
  "occupation": "Software Engineer",
  "maritalStatus": "married"
}
```

### Patient 2: Elderly Female
```json
{
  "firstName": "Mary",
  "lastName": "Johnson",
  "dateOfBirth": "1948-07-22",
  "gender": "female",
  "email": "mary.johnson@email.com",
  "phone": "9876543003",
  "bloodGroup": "A-",
  "address": "456 Oak Avenue",
  "city": "Los Angeles",
  "state": "CA",
  "zipCode": "90001",
  "country": "USA",
  "emergencyContact": {
    "name": "Robert Johnson",
    "relationship": "Son",
    "phone": "9876543004"
  },
  "allergies": ["Aspirin", "Iodine", "Latex"],
  "conditions": ["Arthritis", "Osteoporosis", "Atrial Fibrillation"],
  "medications": ["Warfarin 5mg", "Calcium + D3", "Celebrex 200mg"],
  "pastSurgeries": ["Hip Replacement 2019", "Cataract Surgery 2021"],
  "insurance": {
    "provider": "Medicare",
    "policyNumber": "MCR-987654321",
    "validUntil": "2027-01-01"
  },
  "maritalStatus": "widowed",
  "smokingStatus": "former"
}
```

### Patient 3: Pediatric
```json
{
  "firstName": "Emily",
  "lastName": "Davis",
  "dateOfBirth": "2018-05-30",
  "gender": "female",
  "email": "parents_davis@email.com",
  "phone": "9876543005",
  "bloodGroup": "B+",
  "address": "789 Pine Road",
  "city": "Chicago",
  "state": "IL",
  "zipCode": "60601",
  "country": "USA",
  "emergencyContact": {
    "name": "Sarah Davis",
    "relationship": "Mother",
    "phone": "9876543006"
  },
  "allergies": ["Eggs", "Peanuts"],
  "conditions": ["Asthma"],
  "medications": ["Albuterol Inhaler PRN"],
  "familyHistory": ["Asthma", "Allergies"],
  "insurance": {
    "provider": "Aetna",
    "policyNumber": "AET-555888999",
    "subscriberName": "Michael Davis",
    "subscriberRelationship": "Father",
    "validUntil": "2026-06-30"
  }
}
```

### Patient 4: Pregnant Female
```json
{
  "firstName": "Jennifer",
  "lastName": "Williams",
  "dateOfBirth": "1992-11-08",
  "gender": "female",
  "email": "jennifer.williams@email.com",
  "phone": "9876543007",
  "bloodGroup": "AB+",
  "address": "321 Maple Drive",
  "city": "Houston",
  "state": "TX",
  "zipCode": "77001",
  "country": "USA",
  "emergencyContact": {
    "name": "Mark Williams",
    "relationship": "Husband",
    "phone": "9876543008"
  },
  "allergies": [],
  "conditions": ["Pregnancy - 28 weeks", "Gestational Diabetes"],
  "medications": ["Prenatal Vitamins", "Insulin (Gestational)"],
  "insurance": {
    "provider": "United Healthcare",
    "policyNumber": "UHC-777888999",
    "validUntil": "2026-03-31"
  },
  "maritalStatus": "married",
  "occupation": "Marketing Manager",
  "primaryDepartmentId": "obstetrics-gynecology-uuid"
}
```

### Patient 5: Emergency Case
```json
{
  "firstName": "Michael",
  "lastName": "Brown",
  "dateOfBirth": "1978-09-12",
  "gender": "male",
  "email": "michael.brown@email.com",
  "phone": "9876543009",
  "bloodGroup": "O-",
  "address": "555 Emergency Lane",
  "city": "Miami",
  "state": "FL",
  "zipCode": "33101",
  "country": "USA",
  "emergencyContact": {
    "name": "Linda Brown",
    "relationship": "Sister",
    "phone": "9876543010"
  },
  "allergies": ["Morphine", "Codeine"],
  "conditions": ["None known"],
  "medications": [],
  "insurance": {
    "provider": "Cigna",
    "policyNumber": "CIG-111222333",
    "validUntil": "2025-12-31"
  },
  "notes": "Arrived via ambulance. MVA victim. Primary survey complete."
}
```

---

## 📊 Patient Statistics & Analytics

The system should track:

| Metric | Description |
|--------|-------------|
| Total Patients | Active patient count |
| New Patients (Month) | New registrations this month |
| Returning Patients | Patients with >1 visit |
| Average Age | Demographics |
| Gender Distribution | Male/Female ratio |
| Top Conditions | Most common diagnoses |
| Insurance Coverage | % with insurance |
| No-Show Rate | Missed appointments |
| Average Wait Time | Queue management |
| Patient Satisfaction | Feedback scores |

---

## 🔐 Data Privacy & Compliance

| Standard | Requirements |
|----------|--------------|
| **HIPAA** | PHI encryption, access logs, minimum necessary |
| **GDPR** | Right to erasure, data portability, consent management |
| **HL7 FHIR** | Interoperability standard for health data |
| **ICD-10** | Diagnosis coding standards |

---

*Document Version: 1.0*  
*Last Updated: January 2025*  
*Author: Ayphen Care Development Team*
