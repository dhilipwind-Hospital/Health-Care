# Detailed Implementation Plan — 7 New Modules

**Date:** February 12, 2026
**Scope:** OT Management, Radiology, Enhanced Billing, Blood Bank, Dialysis, Death Certificate, Birth Register

---

## Table of Contents

1. [OT (Operation Theatre) Management](#1-ot-operation-theatre-management)
2. [Radiology / Imaging Module](#2-radiology--imaging-module)
3. [Enhanced Billing (GST, Packages, Deposits)](#3-enhanced-billing-gst-packages-deposits)
4. [Blood Bank Management](#4-blood-bank-management)
5. [Dialysis Unit Management](#5-dialysis-unit-management)
6. [Death Certificate Module](#6-death-certificate-module)
7. [Birth Register Module](#7-birth-register-module)
8. [Breaking Change Analysis](#8-breaking-change-analysis)
9. [Implementation Order & Timeline](#9-implementation-order--timeline)

---

## 1. OT (Operation Theatre) Management

### Current State
- `ot.routes.ts` exists with **in-memory data** (no database persistence)
- Has basic CRUD for rooms, surgeries, checklists, equipment
- Uses mock doctors list
- Frontend page exists at `/ot` route
- **No TypeORM models** — data lost on server restart

### What Needs to Be Built

#### 1.1 Backend Models (5 new models)

**Model: `OtRoom`** — Operation Theatre rooms
```
File: backend/src/models/ot/OtRoom.ts
Table: ot_rooms

Fields:
  id              UUID, PK
  organizationId  UUID, FK → organizations
  locationId      UUID, FK → locations, nullable
  name            varchar(100)         — "OT-1", "OT-2"
  code            varchar(20)          — "OT1", "OT2"
  type            enum('major','minor','emergency','day_care')
  status          enum('available','in_use','maintenance','cleaning','reserved')
  floor           varchar(50), nullable
  capacity        int, default 1
  equipment       jsonb, nullable      — list of permanent equipment
  features        jsonb, nullable      — { hasLaminarFlow, hasCArm, hasLaparoscopy }
  isActive        boolean, default true
  createdAt       timestamp
  updatedAt       timestamp

Relations:
  → Organization (ManyToOne)
  → Location (ManyToOne, nullable)
  → Surgery[] (OneToMany)
```

**Model: `Surgery`** — Scheduled/completed surgeries
```
File: backend/src/models/ot/Surgery.ts
Table: surgeries

Fields:
  id                  UUID, PK
  organizationId      UUID, FK → organizations
  locationId          UUID, FK → locations, nullable
  otRoomId            UUID, FK → ot_rooms
  patientId           UUID, FK → users (patient)
  primarySurgeonId    UUID, FK → users (doctor)
  anesthetistId       UUID, FK → users (doctor), nullable
  admissionId         UUID, FK → admissions, nullable
  surgeryNumber       varchar(50), unique  — "SUR-2026-0001"
  procedureName       varchar(255)
  procedureCode       varchar(50), nullable — ICD-10 PCS code
  surgeryType         enum('elective','emergency','day_care')
  priority            enum('emergency','urgent','elective')
  scheduledDate       date
  scheduledStartTime  time
  scheduledEndTime    time
  actualStartTime     timestamp, nullable
  actualEndTime       timestamp, nullable
  status              enum('scheduled','pre_op','in_progress','post_op','completed','cancelled','postponed')
  preOpDiagnosis      text, nullable
  postOpDiagnosis     text, nullable
  operativeFindings   text, nullable
  operativeNotes      text, nullable
  complications       text, nullable
  bloodLossML         int, nullable
  anesthesiaType      enum('general','spinal','epidural','local','regional','sedation'), nullable
  estimatedDuration   int (minutes)
  actualDuration      int (minutes), nullable
  cancellationReason  text, nullable
  cancelledBy         UUID, FK → users, nullable
  cancelledAt         timestamp, nullable
  consentObtained     boolean, default false
  consentDocumentUrl  text, nullable
  billingStatus       enum('not_billed','billed','partially_billed'), default 'not_billed'
  createdAt           timestamp
  updatedAt           timestamp

Relations:
  → Organization (ManyToOne)
  → Location (ManyToOne, nullable)
  → OtRoom (ManyToOne)
  → User/patient (ManyToOne)
  → User/primarySurgeon (ManyToOne)
  → User/anesthetist (ManyToOne, nullable)
  → Admission (ManyToOne, nullable)
  → SurgicalTeamMember[] (OneToMany)
  → SurgicalChecklist (OneToOne)
  → AnesthesiaRecord (OneToOne)
```

**Model: `SurgicalTeamMember`** — Team members for a surgery
```
File: backend/src/models/ot/SurgicalTeamMember.ts
Table: surgical_team_members

Fields:
  id          UUID, PK
  surgeryId   UUID, FK → surgeries
  userId      UUID, FK → users
  role        enum('primary_surgeon','assistant_surgeon','anesthetist',
              'scrub_nurse','circulating_nurse','ot_technician')
  notes       text, nullable
  createdAt   timestamp

Relations:
  → Surgery (ManyToOne)
  → User (ManyToOne)
```

**Model: `SurgicalChecklist`** — WHO Surgical Safety Checklist
```
File: backend/src/models/ot/SurgicalChecklist.ts
Table: surgical_checklists

Fields:
  id          UUID, PK
  surgeryId   UUID, FK → surgeries (unique)
  
  # Sign In (Before Anesthesia)
  signIn      jsonb — {
    patientIdentityConfirmed: boolean,
    siteMarked: boolean,
    anesthesiaMachineChecked: boolean,
    pulseOximeterAttached: boolean,
    knownAllergies: boolean,
    allergyDetails: string,
    difficultAirway: boolean,
    riskOfBloodLoss: boolean,
    bloodAvailable: boolean,
    completedBy: UUID,
    completedAt: timestamp
  }
  
  # Time Out (Before Skin Incision)
  timeOut     jsonb — {
    teamIntroduced: boolean,
    patientNameConfirmed: boolean,
    procedureConfirmed: boolean,
    siteConfirmed: boolean,
    antibioticGiven: boolean,
    antibioticTime: string,
    anticipatedCriticalEvents: boolean,
    surgeonConcerns: string,
    anesthesiaConcerns: string,
    nursingConcerns: string,
    imagingDisplayed: boolean,
    completedBy: UUID,
    completedAt: timestamp
  }
  
  # Sign Out (Before Patient Leaves OT)
  signOut     jsonb — {
    procedureRecorded: boolean,
    instrumentCountCorrect: boolean,
    spongeCountCorrect: boolean,
    needleCountCorrect: boolean,
    specimenLabeled: boolean,
    equipmentIssues: boolean,
    equipmentIssueDetails: string,
    recoveryPlanDiscussed: boolean,
    completedBy: UUID,
    completedAt: timestamp
  }
  
  status      enum('not_started','sign_in_done','time_out_done','completed')
  createdAt   timestamp
  updatedAt   timestamp

Relations:
  → Surgery (OneToOne)
```

**Model: `AnesthesiaRecord`** — Anesthesia documentation
```
File: backend/src/models/ot/AnesthesiaRecord.ts
Table: anesthesia_records

Fields:
  id                  UUID, PK
  surgeryId           UUID, FK → surgeries (unique)
  anesthetistId       UUID, FK → users
  preOpAssessment     jsonb — {
    asaGrade: enum('I','II','III','IV','V','VI'),
    mallampatiScore: enum('I','II','III','IV'),
    npoStatus: string,
    lastMealTime: timestamp,
    airwayAssessment: string,
    preExistingConditions: string[],
    currentMedications: string[],
    previousAnesthesia: string,
    allergies: string[]
  }
  anesthesiaType      enum('general','spinal','epidural','local','regional','sedation','combined')
  inductionTime       timestamp, nullable
  intubationTime      timestamp, nullable
  extubationTime      timestamp, nullable
  recoveryTime        timestamp, nullable
  drugsAdministered   jsonb[] — [{ drug, dose, route, time }]
  vitalReadings       jsonb[] — [{ time, hr, bp, spo2, etco2, temp }]
  fluidInput          jsonb — { crystalloids, colloids, blood, total }
  fluidOutput         jsonb — { urine, bloodLoss, drain, total }
  complications       text, nullable
  postOpInstructions  text, nullable
  recoveryScore       int, nullable — Aldrete score
  status              enum('planned','in_progress','completed')
  createdAt           timestamp
  updatedAt           timestamp

Relations:
  → Surgery (OneToOne)
  → User/anesthetist (ManyToOne)
```

#### 1.2 Backend Controller & Routes

```
File: backend/src/controllers/ot.controller.ts

Endpoints:
  # OT Rooms
  GET    /api/ot/rooms                      — List OT rooms (with status, availability)
  POST   /api/ot/rooms                      — Create OT room
  PUT    /api/ot/rooms/:id                  — Update OT room
  GET    /api/ot/rooms/:id/availability     — Get room availability for date range
  PATCH  /api/ot/rooms/:id/status           — Update room status

  # Surgeries
  GET    /api/ot/surgeries                  — List surgeries (filters: date, status, surgeon, room)
  POST   /api/ot/surgeries                  — Schedule surgery
  GET    /api/ot/surgeries/:id              — Get surgery details (with team, checklist, anesthesia)
  PUT    /api/ot/surgeries/:id              — Update surgery
  PATCH  /api/ot/surgeries/:id/status       — Update surgery status (triggers room status change)
  DELETE /api/ot/surgeries/:id              — Cancel surgery (soft delete)
  GET    /api/ot/surgeries/calendar         — Calendar view (date range → surgeries)
  GET    /api/ot/surgeries/queue            — Emergency queue (priority sorted)

  # Surgical Team
  POST   /api/ot/surgeries/:id/team         — Add team member
  DELETE /api/ot/surgeries/:id/team/:memberId — Remove team member
  GET    /api/ot/surgeries/:id/team         — Get team members

  # Checklist (WHO Surgical Safety)
  POST   /api/ot/surgeries/:id/checklist    — Create/init checklist
  PUT    /api/ot/surgeries/:id/checklist    — Update checklist (sign-in/time-out/sign-out)
  GET    /api/ot/surgeries/:id/checklist    — Get checklist

  # Anesthesia Record
  POST   /api/ot/surgeries/:id/anesthesia   — Create anesthesia record
  PUT    /api/ot/surgeries/:id/anesthesia   — Update anesthesia record
  GET    /api/ot/surgeries/:id/anesthesia   — Get anesthesia record

  # Analytics
  GET    /api/ot/analytics                  — OT utilization, surgery counts, avg duration
  GET    /api/ot/analytics/surgeon/:id      — Surgeon-wise stats

File: backend/src/routes/ot.routes.ts (REPLACE existing in-memory version)
```

#### 1.3 Frontend Pages (4 pages)

```
File: frontend/src/pages/ot/OtDashboard.tsx
— Overview: today's schedule, room status cards, emergency queue
— Quick stats: surgeries today, in-progress, completed, utilization %

File: frontend/src/pages/ot/OtSchedule.tsx
— Calendar view (week/day) showing surgeries per OT room
— Drag-and-drop rescheduling
— Color-coded by priority (red=emergency, orange=urgent, blue=elective)
— Click to view/edit surgery details

File: frontend/src/pages/ot/SurgeryForm.tsx
— Full surgery scheduling form
— Patient search + select
— Surgeon/anesthetist search + select
— OT room selection with availability check
— Pre-op checklist section
— Team member assignment
— Consent upload

File: frontend/src/pages/ot/SurgicalChecklist.tsx
— WHO Surgical Safety Checklist (3 phases)
— Interactive checklist with sign-off
— Print-ready format
— Timestamp + user tracking per phase

File: frontend/src/pages/ot/AnesthesiaRecord.tsx
— Pre-op assessment form
— Intra-op vitals chart (real-time entry)
— Drug administration log
— Fluid balance calculator
— Post-op recovery scoring (Aldrete)
```

#### 1.4 Scenarios Covered

| Scenario | How It's Handled |
|----------|-----------------|
| Schedule elective surgery | Create surgery → assign room + team → checklist → proceed |
| Emergency surgery | Create with priority=emergency → auto-bumps queue → room auto-assigned |
| Surgery postponed | Update status to 'postponed' → room freed → reschedule |
| Surgery cancelled | Cancel with reason → room freed → notification to team |
| OT room maintenance | Update room status → block scheduling → maintenance log |
| WHO checklist compliance | 3-phase checklist enforced before proceeding |
| Anesthesia documentation | Full pre-op/intra-op/post-op anesthesia record |
| Surgeon workload | Analytics per surgeon: count, avg duration, complication rate |
| OT utilization | Room-wise utilization % per day/week/month |
| Billing integration | Surgery → auto-create bill items (procedure + consumables) |
| Inpatient link | Surgery linked to admission for IPD patients |
| Consent tracking | Digital consent capture + document upload |
| Team assignment | Multiple roles: surgeon, assistant, anesthetist, nurses, technician |
| Post-op recovery | Recovery tracking with Aldrete score |
| Blood loss tracking | Documented in surgery record + anesthesia fluid balance |

---

## 2. Radiology / Imaging Module

### Current State
- No backend models, controllers, or routes for radiology
- Frontend route `/radiology` maps to `ModulePlaceholder`
- Location model has `hasRadiology` feature flag

### What Needs to Be Built

#### 2.1 Backend Models (3 new models)

**Model: `RadiologyOrder`** — Imaging orders
```
File: backend/src/models/radiology/RadiologyOrder.ts
Table: radiology_orders

Fields:
  id                UUID, PK
  organizationId    UUID, FK → organizations
  locationId        UUID, FK → locations, nullable
  orderNumber       varchar(50), unique  — "RAD-2026-0001"
  patientId         UUID, FK → users
  referringDoctorId UUID, FK → users
  radiologistId     UUID, FK → users, nullable
  admissionId       UUID, FK → admissions, nullable (for IPD patients)
  modalityType      enum('xray','ct','mri','ultrasound','mammography',
                    'fluoroscopy','dexa','pet_ct','angiography','ecg','echo')
  bodyPart          varchar(100)         — "Chest", "Abdomen", "Knee-Right"
  laterality        enum('left','right','bilateral','na'), default 'na'
  studyDescription  varchar(255)         — "CT Abdomen with Contrast"
  clinicalHistory   text, nullable
  provisionalDiagnosis text, nullable
  priority          enum('routine','urgent','stat'), default 'routine'
  contrastRequired  boolean, default false
  contrastType      varchar(100), nullable
  patientPrep       text, nullable       — "NPO 6 hours", "Drink 1L water"
  status            enum('ordered','scheduled','in_progress','completed',
                    'reported','verified','cancelled')
  scheduledDate     date, nullable
  scheduledTime     time, nullable
  performedDate     timestamp, nullable
  reportedDate      timestamp, nullable
  verifiedDate      timestamp, nullable
  cancellationReason text, nullable
  billingStatus     enum('not_billed','billed'), default 'not_billed'
  estimatedCost     decimal(10,2), nullable
  createdAt         timestamp
  updatedAt         timestamp

Relations:
  → Organization (ManyToOne)
  → Location (ManyToOne, nullable)
  → User/patient (ManyToOne)
  → User/referringDoctor (ManyToOne)
  → User/radiologist (ManyToOne, nullable)
  → Admission (ManyToOne, nullable)
  → RadiologyReport (OneToOne)
```

**Model: `RadiologyReport`** — Radiologist findings
```
File: backend/src/models/radiology/RadiologyReport.ts
Table: radiology_reports

Fields:
  id                UUID, PK
  orderId           UUID, FK → radiology_orders (unique)
  radiologistId     UUID, FK → users
  verifiedById      UUID, FK → users, nullable
  findings          text                 — Detailed findings
  impression        text                 — Summary/conclusion
  recommendation    text, nullable       — Follow-up recommendations
  criticalFinding   boolean, default false
  criticalFindingDetails text, nullable
  criticalFindingNotifiedTo UUID, FK → users, nullable
  criticalFindingNotifiedAt timestamp, nullable
  templateUsed      varchar(100), nullable — "chest_xray_normal", "ct_abdomen"
  reportStatus      enum('draft','preliminary','final','addendum','amended')
  reportedAt        timestamp
  verifiedAt        timestamp, nullable
  addendumNotes     text, nullable
  addendumDate      timestamp, nullable
  createdAt         timestamp
  updatedAt         timestamp

Relations:
  → RadiologyOrder (OneToOne)
  → User/radiologist (ManyToOne)
  → User/verifiedBy (ManyToOne, nullable)
```

**Model: `RadiologyTemplate`** — Report templates per modality
```
File: backend/src/models/radiology/RadiologyTemplate.ts
Table: radiology_templates

Fields:
  id              UUID, PK
  organizationId  UUID, FK → organizations
  name            varchar(100)         — "Normal Chest X-Ray"
  modalityType    enum (same as RadiologyOrder)
  bodyPart        varchar(100)
  findingsTemplate text                — Template text with placeholders
  impressionTemplate text
  isActive        boolean, default true
  createdBy       UUID, FK → users
  createdAt       timestamp
  updatedAt       timestamp
```

#### 2.2 Backend Controller & Routes

```
File: backend/src/controllers/radiology.controller.ts

Endpoints:
  # Orders
  GET    /api/radiology/orders              — List orders (filters: status, modality, date, patient)
  POST   /api/radiology/orders              — Create order
  GET    /api/radiology/orders/:id          — Get order with report
  PUT    /api/radiology/orders/:id          — Update order
  PATCH  /api/radiology/orders/:id/status   — Update status
  DELETE /api/radiology/orders/:id          — Cancel order

  # Reports
  POST   /api/radiology/orders/:id/report   — Create/submit report
  PUT    /api/radiology/orders/:id/report   — Update report
  PATCH  /api/radiology/orders/:id/report/verify — Verify report (senior radiologist)
  POST   /api/radiology/orders/:id/report/addendum — Add addendum

  # Critical Findings
  POST   /api/radiology/orders/:id/critical — Flag critical finding + notify
  GET    /api/radiology/critical            — List unacknowledged critical findings

  # Templates
  GET    /api/radiology/templates           — List templates
  POST   /api/radiology/templates           — Create template
  PUT    /api/radiology/templates/:id       — Update template

  # Analytics
  GET    /api/radiology/analytics           — Modality-wise counts, TAT, pending
  GET    /api/radiology/worklist            — Radiologist worklist (pending reports)

File: backend/src/routes/radiology.routes.ts
```

#### 2.3 Frontend Pages (4 pages)

```
File: frontend/src/pages/radiology/RadiologyDashboard.tsx
— Stats: pending orders, pending reports, critical findings
— Modality-wise breakdown
— TAT (turnaround time) metrics

File: frontend/src/pages/radiology/RadiologyOrders.tsx
— Order list with filters (status, modality, date, patient)
— Create new order form
— Order detail view with status timeline

File: frontend/src/pages/radiology/RadiologyWorklist.tsx
— Radiologist's pending report queue
— Click to open reporting interface
— Template selection
— Findings + impression text editors
— Critical finding flagging
— Report verification workflow

File: frontend/src/pages/radiology/RadiologyReporting.tsx
— Full reporting interface
— Template-based report generation
— Findings and impression editors
— Critical finding alert with notification
— Print/PDF report generation
— Addendum support
```

#### 2.4 Scenarios Covered

| Scenario | How It's Handled |
|----------|-----------------|
| Doctor orders X-ray | Create order → patient goes to radiology → tech performs → radiologist reports |
| Urgent CT scan | Order with priority=stat → highlighted in worklist → fast-track |
| Critical finding (e.g., pneumothorax) | Radiologist flags critical → auto-notification to referring doctor → acknowledgment tracked |
| Report verification | Junior radiologist drafts → senior verifies → status: final |
| Contrast study | contrastRequired=true → patient prep instructions generated |
| IPD patient imaging | Order linked to admission → results visible in IPD dashboard |
| Report addendum | After final report, radiologist can add addendum with timestamp |
| Template-based reporting | Pre-built templates per modality/body part for faster reporting |
| Billing integration | Order → auto-create bill item based on modality pricing |
| TAT monitoring | Track time from order → performed → reported → verified |
| Modality scheduling | Schedule date/time for MRI/CT (limited slots) |

---

## 3. Enhanced Billing (GST, Packages, Deposits)

### Current State
- `Bill` model exists with: amount, paidAmount, status, paymentMethod, itemDetails (jsonb)
- Basic billing routes exist (inline in `billing.routes.ts`)
- Missing: GST, packages, deposits, discounts, refunds, UPI, credit management

### What Needs to Be Built

#### 3.1 Backend Model Enhancements

**Enhance: `Bill` model** — Add India-specific billing fields
```
File: backend/src/models/Bill.ts
Action: ADD nullable columns (no breaking changes)

New fields:
  locationId          UUID, FK → locations, nullable
  billType            enum('opd','ipd','pharmacy','lab','radiology','ot','emergency','package'), nullable
  
  # GST Fields
  subtotal            decimal(10,2), nullable    — Amount before tax
  cgstRate            decimal(5,2), nullable      — Central GST rate (e.g., 9%)
  cgstAmount          decimal(10,2), nullable
  sgstRate            decimal(5,2), nullable      — State GST rate (e.g., 9%)
  sgstAmount          decimal(10,2), nullable
  igstRate            decimal(5,2), nullable      — Inter-state GST
  igstAmount          decimal(10,2), nullable
  cessAmount          decimal(10,2), nullable
  totalTax            decimal(10,2), nullable
  grandTotal          decimal(10,2), nullable     — subtotal + totalTax
  hsnSacCode          varchar(20), nullable       — HSN/SAC code for service
  gstinOrg            varchar(20), nullable       — Organization GSTIN
  gstinPatient        varchar(20), nullable       — Patient GSTIN (for B2B)
  placeOfSupply       varchar(50), nullable       — State code for GST
  isReverseCharge     boolean, default false
  invoiceType         enum('b2b','b2c','export','sez'), default 'b2c'
  
  # Discount & Waiver
  discountAmount      decimal(10,2), default 0
  discountPercent     decimal(5,2), nullable
  discountReason      text, nullable
  discountApprovedBy  UUID, FK → users, nullable
  waiverAmount        decimal(10,2), default 0
  waiverReason        text, nullable
  waiverApprovedBy    UUID, FK → users, nullable
  
  # Deposit & Advance
  depositAmount       decimal(10,2), default 0
  advanceAmount       decimal(10,2), default 0
  refundAmount        decimal(10,2), default 0
  refundDate          date, nullable
  refundReason        text, nullable
  balanceDue          decimal(10,2), nullable     — grandTotal - paidAmount - depositAmount
  
  # Payment Details
  transactionId       varchar(100), nullable      — UPI/card transaction ref
  receiptNumber       varchar(50), nullable
  paymentGateway      varchar(50), nullable       — 'razorpay','payu','manual'
  
  # Insurance/TPA
  insuranceClaimId    UUID, FK → claims, nullable
  insuranceCoverage   decimal(10,2), nullable
  patientResponsibility decimal(10,2), nullable
  
  # Credit
  isCreditBill        boolean, default false
  creditApprovedBy    UUID, FK → users, nullable
  creditDueDate       date, nullable
  creditSettledDate   date, nullable

New enum values for PaymentMethod:
  UPI = 'upi'
  NET_BANKING = 'net_banking'
  CHEQUE = 'cheque'
  WALLET = 'wallet'
  CREDIT = 'credit'

New enum values for BillStatus:
  PARTIALLY_PAID = 'partially_paid'
  REFUNDED = 'refunded'
  WRITTEN_OFF = 'written_off'
  CREDIT = 'credit'
```

**New Model: `BillingPackage`** — Pre-defined packages
```
File: backend/src/models/BillingPackage.ts
Table: billing_packages

Fields:
  id              UUID, PK
  organizationId  UUID, FK → organizations
  name            varchar(255)         — "Normal Delivery Package", "Appendectomy Package"
  code            varchar(50)
  category        enum('surgery','delivery','daycare','investigation','wellness')
  description     text, nullable
  inclusions      jsonb                — [{ item, category, quantity, unitPrice }]
  exclusions      text[], nullable     — ["ICU charges", "Blood transfusion"]
  totalAmount     decimal(10,2)
  validityDays    int, default 365
  gstApplicable   boolean, default true
  hsnSacCode      varchar(20), nullable
  isActive        boolean, default true
  createdAt       timestamp
  updatedAt       timestamp
```

**New Model: `Deposit`** — Patient deposits/advances
```
File: backend/src/models/Deposit.ts
Table: deposits

Fields:
  id              UUID, PK
  organizationId  UUID, FK → organizations
  patientId       UUID, FK → users
  admissionId     UUID, FK → admissions, nullable
  receiptNumber   varchar(50), unique
  amount          decimal(10,2)
  paymentMethod   enum (same as Bill)
  transactionId   varchar(100), nullable
  purpose         enum('admission','surgery','advance','security')
  status          enum('received','adjusted','refunded','partially_refunded')
  adjustedAmount  decimal(10,2), default 0
  refundedAmount  decimal(10,2), default 0
  adjustedToBillId UUID, FK → bills, nullable
  refundDate      date, nullable
  refundReason    text, nullable
  refundApprovedBy UUID, FK → users, nullable
  receivedBy      UUID, FK → users
  receivedAt      timestamp
  notes           text, nullable
  createdAt       timestamp
  updatedAt       timestamp
```

#### 3.2 Backend Controller & Routes

```
File: backend/src/controllers/billing.controller.ts (NEW — replace inline routes)

Endpoints:
  # Bills
  GET    /api/billing/bills                     — List bills (filters: status, date, patient, type)
  POST   /api/billing/bills                     — Create bill (auto-calculate GST)
  GET    /api/billing/bills/:id                 — Get bill detail
  PUT    /api/billing/bills/:id                 — Update bill
  POST   /api/billing/bills/:id/payment         — Record payment (partial/full)
  POST   /api/billing/bills/:id/discount        — Apply discount (requires approval)
  POST   /api/billing/bills/:id/waiver          — Apply waiver (requires approval)
  POST   /api/billing/bills/:id/refund          — Process refund
  GET    /api/billing/bills/:id/receipt          — Generate receipt (PDF)
  GET    /api/billing/bills/:id/invoice          — Generate GST invoice (PDF)

  # Deposits
  POST   /api/billing/deposits                  — Receive deposit
  GET    /api/billing/deposits                  — List deposits
  POST   /api/billing/deposits/:id/adjust       — Adjust deposit against bill
  POST   /api/billing/deposits/:id/refund       — Refund deposit

  # Packages
  GET    /api/billing/packages                  — List packages
  POST   /api/billing/packages                  — Create package
  PUT    /api/billing/packages/:id              — Update package
  POST   /api/billing/packages/:id/apply/:patientId — Apply package to patient bill

  # GST Reports
  GET    /api/billing/gst/summary               — GST summary (CGST+SGST+IGST)
  GET    /api/billing/gst/b2b                   — B2B invoice register
  GET    /api/billing/gst/b2c                   — B2C invoice register
  GET    /api/billing/gst/hsn                   — HSN-wise summary

  # Revenue Reports
  GET    /api/billing/reports/revenue            — Revenue by date/department/doctor
  GET    /api/billing/reports/outstanding         — Outstanding dues aging report
  GET    /api/billing/reports/collection          — Collection report by payment method
  GET    /api/billing/reports/credit              — Credit patient report

File: backend/src/routes/billing.routes.ts (REPLACE inline version)
```

#### 3.3 Frontend Pages

```
File: frontend/src/pages/billing/BillingDashboard.tsx
— Today's collection, outstanding, deposits
— Revenue chart (daily/weekly/monthly)
— Payment method breakdown (pie chart)

File: frontend/src/pages/billing/CreateBill.tsx
— Patient search → auto-load services/items
— Package selection
— Line items with quantity, rate, discount
— Auto GST calculation (CGST+SGST or IGST based on state)
— Deposit adjustment
— Payment capture (cash/card/UPI/insurance)
— Print invoice/receipt

File: frontend/src/pages/billing/DepositManagement.tsx
— Receive deposit form
— Deposit list with status
— Adjust against bill
— Refund workflow

File: frontend/src/pages/billing/PackageManagement.tsx
— Create/edit billing packages
— Package inclusions/exclusions
— Apply package to patient

File: frontend/src/pages/billing/GstReports.tsx
— GST summary report
— B2B/B2C registers
— HSN-wise summary
— Export for GST filing
```

#### 3.4 Scenarios Covered

| Scenario | How It's Handled |
|----------|-----------------|
| OPD consultation billing | Create bill → add consultation fee → apply GST → payment |
| IPD final bill | Aggregate: bed, medicines, procedures, OT, lab → package or itemized → GST → deposit adjust → balance |
| Package billing | Select package → auto-populate items → any extras added separately |
| Deposit on admission | Receive deposit → receipt → adjust at discharge against final bill |
| Partial payment | Record partial → status: partially_paid → balance tracked |
| Discount approval | Staff requests discount → admin approves → applied to bill |
| GST invoice (B2B) | Corporate patient with GSTIN → B2B invoice with GSTIN |
| Inter-state patient | Different state → IGST instead of CGST+SGST |
| Refund | Overpayment or cancellation → refund with approval → receipt |
| Credit patient | Mark as credit → track due date → aging report |
| UPI payment | Capture UPI transaction ID → link to bill |
| Insurance billing | Split: insurance portion + patient portion → claim tracking |
| GST filing data | Export B2B, B2C, HSN reports for GSTR-1 filing |

---

## 4. Blood Bank Management

### Current State
- No models, controllers, routes, or frontend pages
- Completely new module

### What Needs to Be Built

#### 4.1 Backend Models (5 new models)

**Model: `BloodDonor`** — Donor registration
```
File: backend/src/models/bloodbank/BloodDonor.ts
Table: blood_donors

Fields:
  id                UUID, PK
  organizationId    UUID, FK → organizations
  locationId        UUID, FK → locations, nullable
  donorNumber       varchar(50), unique   — "BD-2026-0001"
  firstName         varchar(100)
  lastName          varchar(100)
  dateOfBirth       date
  gender            enum('male','female','other')
  bloodGroup        enum('A+','A-','B+','B-','AB+','AB-','O+','O-')
  rhFactor          enum('positive','negative')
  phone             varchar(20)
  email             varchar(255), nullable
  address           text, nullable
  city              varchar(100), nullable
  state             varchar(100), nullable
  aadhaarNumber     varchar(12), nullable
  occupation        varchar(100), nullable
  weight            decimal(5,2), nullable  — in kg (must be ≥45 for donation)
  hemoglobin        decimal(4,1), nullable  — g/dL (must be ≥12.5)
  lastDonationDate  date, nullable
  totalDonations    int, default 0
  isDeferral        boolean, default false
  deferralReason    text, nullable
  deferralUntil     date, nullable
  isActive          boolean, default true
  consentGiven      boolean, default false
  consentDate       date, nullable
  createdAt         timestamp
  updatedAt         timestamp
```

**Model: `BloodInventory`** — Blood bag inventory
```
File: backend/src/models/bloodbank/BloodInventory.ts
Table: blood_inventory

Fields:
  id                UUID, PK
  organizationId    UUID, FK → organizations
  locationId        UUID, FK → locations, nullable
  bagNumber         varchar(50), unique   — "BAG-2026-0001"
  donorId           UUID, FK → blood_donors, nullable (null for purchased units)
  bloodGroup        enum('A+','A-','B+','B-','AB+','AB-','O+','O-')
  component         enum('whole_blood','prbc','ffp','platelet_concentrate',
                    'cryoprecipitate','platelet_rich_plasma','packed_cells')
  volume            int                   — in mL
  collectionDate    date
  expiryDate        date
  storageTemp       varchar(20)           — "2-6°C", "-18°C"
  status            enum('available','reserved','cross_matched','issued',
                    'transfused','expired','discarded','quarantine')
  testResults       jsonb — {
    hiv: enum('negative','positive','pending'),
    hbsag: enum('negative','positive','pending'),
    hcv: enum('negative','positive','pending'),
    vdrl: enum('negative','positive','pending'),
    malaria: enum('negative','positive','pending'),
    bloodGroupConfirmed: boolean
  }
  issuedTo          UUID, FK → users (patient), nullable
  issuedDate        timestamp, nullable
  issuedBy          UUID, FK → users (staff), nullable
  crossMatchId      UUID, FK → cross_match_requests, nullable
  discardReason     text, nullable
  discardDate       date, nullable
  notes             text, nullable
  createdAt         timestamp
  updatedAt         timestamp
```

**Model: `CrossMatchRequest`** — Cross-match / compatibility testing
```
File: backend/src/models/bloodbank/CrossMatchRequest.ts
Table: cross_match_requests

Fields:
  id                UUID, PK
  organizationId    UUID, FK → organizations
  requestNumber     varchar(50), unique
  patientId         UUID, FK → users
  requestedBy       UUID, FK → users (doctor)
  patientBloodGroup enum('A+','A-','B+','B-','AB+','AB-','O+','O-')
  componentRequired enum (same as BloodInventory.component)
  unitsRequired     int
  priority          enum('routine','urgent','emergency')
  indication        text                  — "Pre-operative", "Anemia", "Trauma"
  surgeryId         UUID, FK → surgeries, nullable
  admissionId       UUID, FK → admissions, nullable
  status            enum('requested','sample_received','testing','compatible',
                    'incompatible','issued','cancelled')
  sampleCollectedAt timestamp, nullable
  testedBy          UUID, FK → users, nullable
  testedAt          timestamp, nullable
  result            enum('compatible','incompatible','pending'), nullable
  compatibleBagIds  UUID[], nullable      — matched blood bags
  notes             text, nullable
  createdAt         timestamp
  updatedAt         timestamp
```

**Model: `Transfusion`** — Blood transfusion record
```
File: backend/src/models/bloodbank/Transfusion.ts
Table: transfusions

Fields:
  id                UUID, PK
  organizationId    UUID, FK → organizations
  patientId         UUID, FK → users
  bloodInventoryId  UUID, FK → blood_inventory
  crossMatchId      UUID, FK → cross_match_requests, nullable
  administeredBy    UUID, FK → users (nurse)
  supervisedBy      UUID, FK → users (doctor)
  startTime         timestamp
  endTime           timestamp, nullable
  volumeTransfused  int (mL)
  rate              varchar(50), nullable  — "mL/hour"
  preVitals         jsonb — { bp, hr, temp, spo2 }
  postVitals        jsonb — { bp, hr, temp, spo2 }
  reaction          boolean, default false
  reactionType      enum('febrile','allergic','hemolytic','anaphylactic',
                    'taco','trali','other'), nullable
  reactionDetails   text, nullable
  reactionTime      timestamp, nullable
  reactionManagement text, nullable
  status            enum('in_progress','completed','stopped_reaction','stopped_other')
  notes             text, nullable
  createdAt         timestamp
  updatedAt         timestamp
```

**Model: `BloodBankReport`** — For regulatory reporting
```
File: backend/src/models/bloodbank/BloodBankReport.ts
Table: blood_bank_reports

Fields:
  id              UUID, PK
  organizationId  UUID, FK → organizations
  reportType      enum('daily_stock','monthly_collection','annual_license',
                  'wastage','transfusion_reaction')
  reportDate      date
  reportData      jsonb                 — Structured report data
  generatedBy     UUID, FK → users
  status          enum('draft','submitted','approved')
  createdAt       timestamp
```

#### 4.2 Backend Controller & Routes

```
File: backend/src/controllers/bloodbank.controller.ts

Endpoints:
  # Donors
  GET    /api/blood-bank/donors              — List donors
  POST   /api/blood-bank/donors              — Register donor
  GET    /api/blood-bank/donors/:id          — Donor details + history
  PUT    /api/blood-bank/donors/:id          — Update donor
  POST   /api/blood-bank/donors/:id/defer    — Defer donor

  # Inventory
  GET    /api/blood-bank/inventory           — Current stock (group-wise)
  POST   /api/blood-bank/inventory           — Add blood bag (collection/purchase)
  GET    /api/blood-bank/inventory/:id       — Bag details
  PATCH  /api/blood-bank/inventory/:id/status — Update bag status
  GET    /api/blood-bank/inventory/expiring   — Expiring soon (next 7 days)
  GET    /api/blood-bank/inventory/stock-summary — Group + component wise summary

  # Cross-match
  POST   /api/blood-bank/cross-match         — Request cross-match
  GET    /api/blood-bank/cross-match         — List requests
  PUT    /api/blood-bank/cross-match/:id     — Update result
  POST   /api/blood-bank/cross-match/:id/issue — Issue blood

  # Transfusion
  POST   /api/blood-bank/transfusion         — Start transfusion
  PUT    /api/blood-bank/transfusion/:id     — Update (vitals, completion)
  POST   /api/blood-bank/transfusion/:id/reaction — Report reaction

  # Reports
  GET    /api/blood-bank/reports/stock        — Daily stock report
  GET    /api/blood-bank/reports/collection    — Collection report
  GET    /api/blood-bank/reports/wastage       — Wastage report
  GET    /api/blood-bank/reports/reactions      — Transfusion reaction report

File: backend/src/routes/bloodbank.routes.ts
```

#### 4.3 Frontend Pages

```
frontend/src/pages/bloodbank/BloodBankDashboard.tsx   — Stock overview, expiring alerts, pending requests
frontend/src/pages/bloodbank/DonorManagement.tsx      — Donor registration, search, history
frontend/src/pages/bloodbank/BloodInventory.tsx       — Bag-wise inventory, collection, testing
frontend/src/pages/bloodbank/CrossMatchRequests.tsx   — Request list, testing, compatibility results
frontend/src/pages/bloodbank/TransfusionRecord.tsx    — Transfusion monitoring, reaction documentation
frontend/src/pages/bloodbank/BloodBankReports.tsx     — Stock, collection, wastage, reaction reports
```

#### 4.4 Scenarios Covered

| Scenario | How It's Handled |
|----------|-----------------|
| Voluntary donor walks in | Register → screen (weight, Hb) → collect → test (HIV, HBsAg, HCV, VDRL, Malaria) → add to inventory |
| Pre-surgery blood arrangement | Doctor requests cross-match → lab tests compatibility → reserve bags → issue before surgery |
| Emergency blood need | Priority=emergency → skip scheduling → immediate cross-match → issue |
| Transfusion reaction | Nurse reports reaction → stop transfusion → document type → management → report |
| Blood expiry | Daily check → alert for bags expiring in 7 days → discard expired with reason |
| Component separation | Whole blood → separate into PRBC, FFP, Platelets → individual bags in inventory |
| Donor deferral | Donor screened → fails criteria → deferred with reason + until date |
| Stock shortage | Dashboard shows low stock by group → alert → arrange donation camp |
| Regulatory reporting | Auto-generate daily stock, monthly collection, annual license renewal data |
| Wastage tracking | Track discarded bags with reasons → wastage % report |

---

## 5. Dialysis Unit Management

### Current State
- No models, controllers, routes, or frontend pages
- Completely new module

### What Needs to Be Built

#### 5.1 Backend Models (3 new models)

**Model: `DialysisMachine`** — Machine registry
```
File: backend/src/models/dialysis/DialysisMachine.ts
Table: dialysis_machines

Fields:
  id                UUID, PK
  organizationId    UUID, FK → organizations
  locationId        UUID, FK → locations, nullable
  machineNumber     varchar(50), unique   — "DM-001"
  brand             varchar(100)          — "Fresenius", "Nipro", "B.Braun"
  model             varchar(100)
  serialNumber      varchar(100), nullable
  status            enum('available','in_use','maintenance','out_of_order')
  lastMaintenanceDate date, nullable
  nextMaintenanceDate date, nullable
  totalSessions     int, default 0
  installationDate  date, nullable
  warrantyExpiry    date, nullable
  isActive          boolean, default true
  notes             text, nullable
  createdAt         timestamp
  updatedAt         timestamp
```

**Model: `DialysisSession`** — Individual dialysis session
```
File: backend/src/models/dialysis/DialysisSession.ts
Table: dialysis_sessions

Fields:
  id                UUID, PK
  organizationId    UUID, FK → organizations
  locationId        UUID, FK → locations, nullable
  sessionNumber     varchar(50), unique   — "DS-2026-0001"
  patientId         UUID, FK → users
  doctorId          UUID, FK → users (nephrologist)
  nurseId           UUID, FK → users, nullable
  machineId         UUID, FK → dialysis_machines
  admissionId       UUID, FK → admissions, nullable (for IPD patients)
  
  # Schedule
  scheduledDate     date
  scheduledTime     time
  sessionType       enum('hemodialysis','peritoneal','crrt','hemodiafiltration')
  frequency         varchar(50), nullable  — "3x/week", "daily"
  
  # Session Details
  actualStartTime   timestamp, nullable
  actualEndTime     timestamp, nullable
  durationMinutes   int, nullable
  status            enum('scheduled','in_progress','completed','cancelled','missed')
  
  # Dialysis Parameters
  dialyzerType      varchar(100), nullable — "F60", "FX80"
  dialyzerReuse     int, default 1         — Reuse count (1 = new)
  bloodFlowRate     int, nullable          — mL/min
  dialysateFlowRate int, nullable          — mL/min
  targetUF          int, nullable          — Target ultrafiltration (mL)
  actualUF          int, nullable          — Actual UF achieved
  accessType        enum('avf','avg','catheter_tunneled','catheter_temporary'), nullable
  accessSite        varchar(100), nullable — "Left forearm AVF"
  heparinDose       varchar(100), nullable — "5000 IU bolus + 1000 IU/hr"
  
  # Pre-Dialysis Vitals
  preWeight         decimal(5,2), nullable  — kg
  preBP             varchar(20), nullable   — "140/90"
  preHR             int, nullable
  preTemp           decimal(4,1), nullable
  
  # Post-Dialysis Vitals
  postWeight        decimal(5,2), nullable
  postBP            varchar(20), nullable
  postHR            int, nullable
  postTemp          decimal(4,1), nullable
  
  # Intra-Dialysis Monitoring
  hourlyReadings    jsonb[], nullable — [{ time, bp, hr, uf, bloodFlow, notes }]
  
  # Complications
  complications     text[], nullable  — ["Hypotension", "Cramps", "Nausea"]
  complicationNotes text, nullable
  interventions     text, nullable
  
  # Consumables
  consumablesUsed   jsonb[], nullable — [{ item, quantity, batchNumber }]
  
  # Lab (pre/post)
  preLabResults     jsonb, nullable — { bun, creatinine, potassium, hemoglobin }
  postLabResults    jsonb, nullable
  ktv               decimal(4,2), nullable — Dialysis adequacy (target ≥1.2)
  urr               decimal(5,2), nullable — Urea Reduction Ratio (target ≥65%)
  
  notes             text, nullable
  cancelReason      text, nullable
  billingStatus     enum('not_billed','billed'), default 'not_billed'
  createdAt         timestamp
  updatedAt         timestamp
```

**Model: `DialysisPatientProfile`** — Patient's dialysis-specific profile
```
File: backend/src/models/dialysis/DialysisPatientProfile.ts
Table: dialysis_patient_profiles

Fields:
  id                UUID, PK
  patientId         UUID, FK → users (unique)
  organizationId    UUID, FK → organizations
  primaryDiagnosis  varchar(255)         — "CKD Stage 5", "ESRD"
  dialysisStartDate date
  accessType        enum('avf','avg','catheter_tunneled','catheter_temporary')
  accessSite        varchar(100)
  accessCreatedDate date, nullable
  dryWeight         decimal(5,2), nullable — Target dry weight (kg)
  prescribedFrequency varchar(50)        — "3x/week"
  prescribedDuration int                 — minutes per session
  allergies         text[], nullable
  comorbidities     text[], nullable     — ["Diabetes", "Hypertension"]
  currentMedications jsonb[], nullable   — [{ drug, dose, frequency }]
  hepatitisStatus   jsonb, nullable      — { hbsag, hcv, hiv }
  totalSessions     int, default 0
  isActive          boolean, default true
  notes             text, nullable
  createdAt         timestamp
  updatedAt         timestamp
```

#### 5.2 Scenarios Covered

| Scenario | How It's Handled |
|----------|-----------------|
| New dialysis patient | Create profile → set prescription → schedule recurring sessions |
| Regular session | Check in → pre-vitals → connect to machine → hourly monitoring → post-vitals → disconnect |
| Intra-dialysis hypotension | Record complication → intervention (saline bolus) → adjust UF rate |
| Machine breakdown | Mark machine out_of_order → reassign patients to other machines |
| Dialyzer reuse | Track reuse count per dialyzer → alert at max reuse limit |
| Adequacy monitoring | Calculate Kt/V and URR → flag if below target |
| Missed session | Mark as missed → reschedule → track compliance |
| Hepatitis-positive patient | Flag in profile → assign dedicated machine → infection control |
| Consumable tracking | Log dialyzer, lines, needles per session → inventory deduction |
| Billing | Auto-bill per session (dialysis charges + consumables) |

---

## 6. Death Certificate Module

### Current State
- No model or workflow for death documentation
- Inpatient `DischargeSummary` exists but no death-specific fields

### What Needs to Be Built

#### 6.1 Backend Model

**Model: `DeathCertificate`** — Death documentation (Form 4/4A per Registration of Births and Deaths Act)
```
File: backend/src/models/DeathCertificate.ts
Table: death_certificates

Fields:
  id                  UUID, PK
  organizationId      UUID, FK → organizations
  locationId          UUID, FK → locations, nullable
  certificateNumber   varchar(50), unique   — "DC-2026-0001"
  
  # Deceased Details
  patientId           UUID, FK → users
  admissionId         UUID, FK → admissions, nullable
  deceasedName        varchar(255)
  dateOfDeath         timestamp
  timeOfDeath         time
  placeOfDeath        enum('hospital','brought_dead','home','other')
  wardName            varchar(100), nullable
  bedNumber           varchar(50), nullable
  
  # Demographics (as per Form 4)
  age                 int
  ageUnit             enum('years','months','days','hours')
  gender              enum('male','female','other')
  fatherOrHusbandName varchar(255)
  motherName          varchar(255), nullable
  address             text
  religion            varchar(50), nullable
  occupation          varchar(100), nullable
  maritalStatus       enum('single','married','divorced','widowed'), nullable
  nationality         varchar(50), default 'Indian'
  aadhaarNumber       varchar(12), nullable
  
  # Cause of Death (as per WHO ICD Medical Certificate of Cause of Death)
  immediateCause      varchar(255)         — "I(a) Cardiac arrest"
  antecedentCause1    varchar(255), nullable — "I(b) Acute myocardial infarction"
  antecedentCause2    varchar(255), nullable — "I(c) Coronary artery disease"
  underlyingCause     varchar(255), nullable — "I(d) Diabetes mellitus"
  otherConditions     text, nullable        — "II. Hypertension, CKD"
  icdCodePrimary      varchar(20), nullable
  icdCodeSecondary    varchar(20), nullable
  mannerOfDeath       enum('natural','accident','suicide','homicide','pending','unknown')
  
  # Pregnancy Related (for females 15-49)
  wasPregnant         boolean, default false
  pregnancyRelation   enum('during_pregnancy','during_labour','within_42_days',
                      'within_1_year','not_applicable'), nullable
  
  # MLC
  isMlc               boolean, default false
  mlcId               UUID, FK → medico_legal_cases, nullable
  policeInformed      boolean, default false
  postmortemRequired  boolean, default false
  postmortemDone      boolean, default false
  postmortemFindings  text, nullable
  
  # Certification
  certifyingDoctorId  UUID, FK → users
  certifyingDoctorName varchar(255)
  certifyingDoctorReg varchar(100)        — Medical registration number
  certifiedAt         timestamp
  
  # Body Handover
  bodyHandoverTo      varchar(255), nullable
  bodyHandoverRelation varchar(100), nullable — "Son", "Wife"
  bodyHandoverIdProof varchar(255), nullable
  bodyHandoverDate    timestamp, nullable
  bodyHandoverWitness varchar(255), nullable
  
  # Registration
  registrationNumber  varchar(100), nullable — Municipal registration number
  registeredAt        varchar(255), nullable — "Municipal Corporation Chennai"
  registrationDate    date, nullable
  
  status              enum('draft','certified','registered','issued')
  notes               text, nullable
  createdAt           timestamp
  updatedAt           timestamp
```

#### 6.2 Scenarios Covered

| Scenario | How It's Handled |
|----------|-----------------|
| IPD patient death | Admission → death → doctor certifies → certificate generated → body handover |
| Brought dead (DOA) | Emergency → DOA documented → MLC check → certificate → police if needed |
| MLC death | Death + MLC → police intimation → postmortem → certificate after PM |
| Maternal death (15-49F) | Pregnancy-related fields captured → maternal death reporting |
| Cause of death chain | WHO format: I(a)→I(b)→I(c)→I(d) + II (contributing) |
| Body handover | Record: to whom, relation, ID proof, witness, date/time |
| Municipal registration | Certificate number → submitted to registrar → registration number received |
| Print certificate | Generate PDF matching Form 4/4A format |
| Death register | Chronological register of all deaths → monthly/annual reports |

---

## 7. Birth Register Module

### Current State
- No model or workflow for birth documentation
- Completely new module

### What Needs to Be Built

#### 7.1 Backend Model

**Model: `BirthRegister`** — Birth documentation (Form 1 per Registration of Births and Deaths Act)
```
File: backend/src/models/BirthRegister.ts
Table: birth_registers

Fields:
  id                  UUID, PK
  organizationId      UUID, FK → organizations
  locationId          UUID, FK → locations, nullable
  registerNumber      varchar(50), unique   — "BR-2026-0001"
  
  # Child Details
  childName           varchar(255), nullable — May be named later
  dateOfBirth         date
  timeOfBirth         time
  gender              enum('male','female','other')
  birthWeight         decimal(5,3)          — in kg (e.g., 3.250)
  birthLength         decimal(5,2), nullable — in cm
  headCircumference   decimal(5,2), nullable — in cm
  apgarScore1Min      int, nullable          — 0-10
  apgarScore5Min      int, nullable          — 0-10
  birthOrder          int, default 1         — 1st, 2nd, 3rd child
  typeOfBirth         enum('single','twin','triplet','quadruplet','other')
  
  # Delivery Details
  deliveryType        enum('normal_vaginal','assisted_vaginal','lscs','forceps',
                      'vacuum','breech')
  deliveryPlace       enum('hospital','home','transit','other')
  admissionId         UUID, FK → admissions, nullable
  wardName            varchar(100), nullable
  
  # Mother Details
  motherId            UUID, FK → users, nullable
  motherName          varchar(255)
  motherAge           int
  motherAadhaar       varchar(12), nullable
  motherAddress       text
  motherReligion      varchar(50), nullable
  motherNationality   varchar(50), default 'Indian'
  motherEducation     varchar(100), nullable
  motherOccupation    varchar(100), nullable
  gravida             int, nullable          — Total pregnancies
  para                int, nullable          — Total deliveries
  livingChildren      int, nullable
  antenatalCareReceived boolean, default false
  
  # Father Details
  fatherName          varchar(255)
  fatherAge           int, nullable
  fatherAadhaar       varchar(12), nullable
  fatherOccupation    varchar(100), nullable
  fatherEducation     varchar(100), nullable
  fatherNationality   varchar(50), default 'Indian'
  
  # Attending Details
  attendingDoctorId   UUID, FK → users
  attendingDoctorName varchar(255)
  attendingDoctorReg  varchar(100)
  attendedBy          enum('doctor','nurse','midwife','dai','other')
  
  # Complications
  complications       text[], nullable      — ["PPH", "Cord prolapse"]
  neonatalComplications text[], nullable    — ["Birth asphyxia", "Jaundice"]
  nicuAdmission       boolean, default false
  nicuReason          text, nullable
  
  # Stillbirth (if applicable)
  isStillbirth        boolean, default false
  stillbirthType      enum('fresh','macerated'), nullable
  causeOfStillbirth   text, nullable
  
  # Registration
  registrationNumber  varchar(100), nullable
  registeredAt        varchar(255), nullable
  registrationDate    date, nullable
  
  # Vaccination
  bcgGiven            boolean, default false
  opv0Given           boolean, default false
  hepB0Given          boolean, default false
  vitaminKGiven       boolean, default false
  
  status              enum('draft','certified','registered','issued')
  notes               text, nullable
  createdAt           timestamp
  updatedAt           timestamp
```

#### 7.2 Scenarios Covered

| Scenario | How It's Handled |
|----------|-----------------|
| Normal delivery | Admission → delivery → birth record → vaccination → discharge |
| LSCS (C-section) | OT surgery → birth record → link to surgery + admission |
| Twin birth | Two birth records with birthOrder=1,2 → same mother, same admission |
| Stillbirth | isStillbirth=true → type (fresh/macerated) → cause documented |
| Premature baby → NICU | Birth record → nicuAdmission=true → NICU tracking |
| Birth vaccination | BCG, OPV-0, Hep-B0, Vitamin K documented at birth |
| Naming later | childName nullable → updated when parents decide |
| Municipal registration | Certificate → submitted to registrar → registration number |
| Birth certificate print | Generate PDF matching Form 1 format |
| Monthly birth report | Count by gender, delivery type, birth weight categories |
| PCPNDT compliance | No sex determination before birth → only recorded after delivery |

---

## 8. Breaking Change Analysis

| Module | Breaking Risk | Details |
|--------|--------------|---------|
| **OT Management** | 🟢 **NONE** | Replaces in-memory routes with DB-backed. Same API shape, new endpoints added. Frontend OT page already exists — enhance it. |
| **Radiology** | 🟢 **NONE** | Entirely new module. New models, controllers, routes, pages. Nothing existing is touched. |
| **Enhanced Billing** | 🟡 **LOW** | Adds nullable columns to existing `Bill` model. New enum values added (backward compatible). New `BillingPackage` and `Deposit` models. Existing billing API responses unchanged — new fields are nullable. |
| **Blood Bank** | 🟢 **NONE** | Entirely new module. No existing code touched. |
| **Dialysis** | 🟢 **NONE** | Entirely new module. No existing code touched. |
| **Death Certificate** | 🟢 **NONE** | New model. Optional link to existing `Admission` and `User`. No existing code modified. |
| **Birth Register** | 🟢 **NONE** | New model. Optional link to existing `Admission` and `User`. No existing code modified. |

### Safety Summary
> **6 of 7 modules have ZERO breaking risk** (entirely new code).
> **1 module (Billing) has LOW risk** — only additive nullable columns on existing `Bill` model.
> **No existing API contracts, frontend pages, or database schemas are destructively modified.**

---

## 9. Implementation Order & Timeline

### Recommended Order (by dependency + value)

| Order | Module | Effort | Dependencies | Why This Order |
|-------|--------|--------|-------------|----------------|
| **1** | Enhanced Billing | 2-3 days | None (enhances existing) | Foundation for all other modules' billing integration |
| **2** | OT Management | 2-3 days | Billing (for surgery billing) | High clinical value, existing skeleton to build on |
| **3** | Death Certificate | 1 day | None | Legal requirement, simple model |
| **4** | Birth Register | 1 day | None | Legal requirement, simple model |
| **5** | Radiology | 2-3 days | Billing (for radiology billing) | Clinical completeness |
| **6** | Blood Bank | 2-3 days | None | Specialized, standalone |
| **7** | Dialysis | 1-2 days | Billing (for session billing) | Specialized, standalone |

### Total Estimated Timeline
- **Minimum:** 11 days (sequential, single developer)
- **Realistic:** 15-18 days (with testing, UI polish, edge cases)
- **With parallelism (2 devs):** 8-10 days

### What Can Be Done Today

If starting now, the most achievable today:

1. **Death Certificate** (3-4 hours) — Single model + controller + basic frontend
2. **Birth Register** (3-4 hours) — Single model + controller + basic frontend
3. **Enhanced Billing model changes** (2-3 hours) — Add columns to Bill, create Package + Deposit models

These 3 items are the simplest, have zero breaking risk, and provide immediate regulatory compliance value.

---

*This document will be updated as modules are implemented.*
