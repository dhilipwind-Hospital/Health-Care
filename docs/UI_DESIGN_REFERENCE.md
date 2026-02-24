# UI Design Reference - Lunaris Style Guide

## Overview
This document captures the UI design patterns from the Lunaris HMS reference screenshots to guide improvements in our Ayphen Care Hospital Management System.

---

## Design System Elements

### Color Palette
| Element | Color | Usage |
|---------|-------|-------|
| **Primary (Dark Sidebar)** | `#1a2332` | Sidebar background |
| **Primary Accent** | `#00d4aa` / Teal | Active menu items, buttons |
| **Success** | `#10b981` | Completed, Confirmed status |
| **Warning** | `#f59e0b` | Pending, Waiting status |
| **Danger** | `#ef4444` | Critical, No Show, Urgent |
| **Info** | `#3b82f6` | In Progress status |
| **Background** | `#f8fafc` | Page background |
| **Card Background** | `#ffffff` | Content cards |

### Typography
- **Headings**: Bold, large (24-32px)
- **Subheadings**: Medium weight (16-18px)
- **Body**: Regular (14px)
- **Labels**: Uppercase, small (12px), muted color

### Component Patterns

#### Stats Cards (Top Row)
- 4 cards in a row
- Large number display (32-48px)
- Small label above (uppercase, muted)
- Subtitle below (comparison or context)
- Subtle background colors for different metrics

#### Data Tables
- Clean, minimal borders
- Row hover effects
- Status badges (pill-shaped)
- Action buttons on right
- Filter tabs above table (All, Pending, Completed, etc.)

#### Sidebar Navigation
- Dark background
- Icon + text menu items
- Active item highlighted with accent color
- User info at bottom

---

## Role-Specific Screens

### 1. Receptionist / Front Desk

#### Appointments Page
**Screenshot Reference**: Image 1

**Key Elements**:
- **Header**: "Appointments" with subtitle "Manage and schedule patient appointments"
- **Search**: "Search patients..." input
- **Action Button**: "+ New Appointment" (teal)

**Stats Cards** (4 columns):
| Stat | Example | Subtitle |
|------|---------|----------|
| TODAY'S APPOINTMENTS | 42 | 8 completed |
| UPCOMING | 28 | Next in 10 mins |
| CANCELLED | 3 | 2 rescheduled |
| NO SHOW | 5 | ↑ 12% from last week |

**Table - Today's Schedule**:
- Filter tabs: All, Upcoming, Completed
- Columns: TIME, PATIENT (name + ID), DOCTOR, DEPARTMENT, TYPE, STATUS
- Status badges: Checked In (green), Waiting (orange), Confirmed (teal), No Show (red)

**Current Implementation**: `/pages/appointments/`
**Improvements Needed**:
- Add stats cards row
- Improve table styling with status badges
- Add filter tabs

---

### 2. Doctor

#### Patient Queue Page
**Screenshot Reference**: Image 2

**Key Elements**:
- **Header**: "Patient Queue" with subtitle "Patients waiting for consultation"
- **Action Button**: "Call Next Patient" (teal)

**Stats Cards** (4 columns):
| Stat | Example | Subtitle |
|------|---------|----------|
| IN QUEUE | 12 | Avg. wait: 18 min |
| CONSULTING | 3 | Currently in room |
| SEEN TODAY | 24 | ↑ 15% from yesterday |
| PRIORITY | 4 | Urgent cases |

**Table - Queue List**:
- Filter tabs: Priority, All
- Columns: #, PATIENT (name, age, gender, ID), TOKEN, TYPE, WAIT TIME, PRIORITY, ACTION
- Priority badges: Urgent (red), Normal (green)
- Action: "Call In" button

**Current Implementation**: `/pages/queue/DoctorConsole.tsx`
**Improvements Needed**:
- Add stats cards row
- Add priority filtering
- Show wait time per patient
- Add "Call In" action buttons

---

#### Lab Orders Page
**Screenshot Reference**: Image 3

**Key Elements**:
- **Header**: "Lab Orders" with subtitle "Track and manage laboratory test orders"
- **Search**: "Search lab orders..."
- **Action Button**: "+ New Lab Order" (teal)

**Stats Cards** (4 columns):
| Stat | Example | Subtitle |
|------|---------|----------|
| PENDING RESULTS | 9 | Avg TAT: 4 hrs |
| COMPLETED TODAY | 15 | All reviewed |
| CRITICAL | 2 | Needs immediate review |
| THIS WEEK | 64 | ↑ 5% from last week |

**Table - Lab Orders**:
- Filter tabs: All, Pending, Critical
- Columns: ORDER #, PATIENT (name + ID), TESTS, ORDERED, STATUS
- Status badges: Critical (red), In Progress (blue), Completed (green)

**Current Implementation**: `/pages/laboratory/`
**Improvements Needed**:
- Add stats cards for doctor view
- Add critical alerts highlighting
- Improve order tracking UI

---

#### Prescriptions Page
**Screenshot Reference**: Image 4

**Key Elements**:
- **Header**: "Prescriptions" with subtitle "View and manage all prescriptions issued"
- **Search**: "Search prescriptions..."
- **Action Button**: "+ New Prescription" (teal)

**Stats Cards** (4 columns):
| Stat | Example | Subtitle |
|------|---------|----------|
| TODAY'S RX | 18 | 6 dispensed |
| PENDING | 7 | Awaiting pharmacy |
| THIS WEEK | 86 | ↑ 8% from last week |
| REFILLS DUE | 12 | Needs review |

**Table - Recent Prescriptions**:
- Filter tabs: All, Pending, Dispensed
- Columns: RX #, PATIENT (name + ID), MEDICATIONS, DATE, STATUS
- Status badges: Pending (orange), Dispensed (green)

**Current Implementation**: `/pages/doctor/Prescriptions.tsx`
**Improvements Needed**:
- Add stats cards row
- Show medication details in table
- Add filter tabs

---

### 3. Billing / Accountant

#### Billing & Invoicing Page
**Screenshot Reference**: Image 5

**Key Elements**:
- **Header**: "Billing & Invoicing" with invoice number and token
- **Action Buttons**: "Print Invoice", "+ New Invoice" (teal)

**Stats Cards** (4 columns):
| Stat | Example | Subtitle |
|------|---------|----------|
| TOTAL DUE | ₹4,850 | Current invoice |
| COLLECTED TODAY | ₹1,24,500 | 78 payments |
| PENDING | ₹32,400 | 12 overdue invoices |
| INVOICES TODAY | 94 | ↑8% from yesterday |

**Invoice Details Section**:
- **Left Panel**: Invoice Line Items table
  - Columns: ITEM, DEPT, QTY, RATE, AMOUNT
  - Subtotal, GST, Discount breakdown
  - Total Amount Due (large, prominent)

- **Right Panel**: 
  - Patient Details card (Name, ID, Doctor, Department, Visit Date)
  - Payment section (Payment Method dropdown, Discount Code)
  - Amount Due display
  - Action buttons: "Collect Payment", "Email Invoice", "Mark Pending"

**Current Implementation**: `/pages/billing/BillingManagement.tsx`
**Improvements Needed**:
- Add stats cards row
- Split into invoice items + patient details layout
- Add payment method selection
- Add discount code input
- Improve invoice line items display

---

## Sidebar Navigation Structure

### Main Menu (Receptionist)
- Queue Dashboard
- Patient Registration
- Appointments
- Billing

### Doctor Menu
- My Dashboard
- Patient Queue
- Consultation
- Prescriptions
- Lab Orders

### Common Elements
- Logo at top
- User info at bottom (name, email)
- Active item highlighted with accent color bar

---

## Implementation Priority

### Phase 1 - High Priority
1. **Stats Cards Component**: Create reusable component for all dashboards
2. **Status Badge Component**: Standardize status badges across tables
3. **Sidebar Redesign**: Dark theme with accent highlights

### Phase 2 - Medium Priority
4. **Table Enhancements**: Filter tabs, improved styling
5. **Doctor Queue Page**: Add stats, priority filtering
6. **Billing Page**: Two-column layout with invoice details

### Phase 3 - Polish
7. **Appointments Page**: Full redesign with stats
8. **Lab Orders Page**: Add critical alerts
9. **Prescriptions Page**: Add stats and filters

---

## Mapping to Current Application

| Reference Screen | Current Page | Status |
|-----------------|--------------|--------|
| Appointments | `/appointments/AppointmentList.tsx` | Needs redesign |
| Patient Queue | `/queue/DoctorConsole.tsx` | Needs stats cards |
| Lab Orders | `/laboratory/LabDashboard.tsx` | Needs redesign |
| Prescriptions | `/doctor/Prescriptions.tsx` | Needs stats cards |
| Billing | `/billing/BillingManagement.tsx` | Needs two-column layout |

---

---

## Additional Role-Specific Screens

### 4. Laboratory Technician

#### Test Results Page
**Screenshot Reference**: New Image 1

**Key Elements**:
- **Header**: "Test Results" with subtitle "Review, validate and release laboratory test results"
- **Search**: "Search results..."
- **Action Button**: "+ New Test Order" (teal)

**Stats Cards** (4 columns):
| Stat | Example | Subtitle |
|------|---------|----------|
| PENDING REVIEW | 32 | Awaiting pathologist review |
| VALIDATED | 156 | Results approved this week |
| ABNORMAL | 8 | Out of range values |
| CRITICAL | 3 | Immediate action required |

**Table - Test Results**:
- Filter tabs: All, Pending, Validated, Critical
- Columns: TEST ID, PATIENT (name + MRN), TEST NAME, RESULT, STATUS, ACTIONS
- Result badges: Abnormal (orange), Normal (green), Critical (red)
- Status badges: Pending (orange), Validated (green), In Progress (blue), Critical (red)

**Current Implementation**: `/pages/laboratory/ResultsEntry.tsx`
**Improvements Needed**:
- Add stats cards for pending/validated/abnormal/critical
- Add result value indicators (normal vs abnormal)
- Add filter tabs

---

#### Sample Processing Page
**Screenshot Reference**: New Image 2

**Key Elements**:
- **Header**: "Sample Processing" with subtitle "Receive, process and track laboratory samples"
- **Search**: "Search samples..."
- **Action Button**: "+ Register Sample" (teal)

**Stats Cards** (4 columns):
| Stat | Example | Subtitle |
|------|---------|----------|
| SAMPLES RECEIVED | 47 | Today's intake |
| IN PROGRESS | 18 | Being processed |
| RESULTS READY | 24 | Awaiting dispatch |
| CRITICAL RESULTS | 3 | Needs immediate attention |

**Table - Sample Tracking**:
- Filter tabs: All, In Progress, Completed, Critical
- Columns: SAMPLE ID, PATIENT (name + MRN), TEST TYPE, COLLECTED, PRIORITY, STATUS
- Priority badges: Urgent (red), Routine (green), Critical (red)
- Status badges: In Progress (blue), Completed (green), Pending (orange)

**Current Implementation**: `/pages/laboratory/SampleCollection.tsx`
**Improvements Needed**:
- Add stats cards for sample tracking
- Add priority indicators
- Add collection timestamp display

---

### 5. Operation Theatre (OT)

#### OT Equipment & Resources Page
**Screenshot Reference**: New Image 3

**Key Elements**:
- **Header**: "OT Equipment & Resources" with subtitle "Manage Equipment, Sterilization & Staff Allocation"
- **Action Buttons**: "Generate Report", "+ Add Equipment" (teal)

**Stats Cards** (4 columns):
| Stat | Example | Subtitle |
|------|---------|----------|
| TOTAL EQUIPMENT | 248 | Across 5 OT rooms |
| STERILIZED READY | 189 | 76% of total inventory |
| UNDER MAINTENANCE | 14 | 7 due for calibration |
| STAFF ON DUTY | 32 | 8 surgeons, 12 nurses, 12 techs |

**Table - Equipment Inventory**:
- Search: "Search equipment..."
- Category filter dropdown: "All Categories"
- Columns: EQUIPMENT (name + ID), CATEGORY, OT ROOM, STATUS, LAST STERILIZED, ACTION
- Status indicators: In Use (red dot), Sterilized (green dot), Maintenance (orange dot), Available (teal dot)

**Current Implementation**: `/pages/ot/` (if exists)
**Improvements Needed**:
- Create OT equipment management page
- Add sterilization tracking
- Add staff allocation display

---

#### OT Live Monitor Page
**Screenshot Reference**: New Image 4

**Key Elements**:
- **Header**: "OT Live Monitor" with subtitle "Real-time Operation Theatre Status"
- **Action Buttons**: "LIVE" indicator (red), "Refresh"

**OT Room Cards** (Grid layout):
Each card shows:
- OT Room number (OT-1, OT-2, etc.)
- Status badge: In Surgery (red), Pre-Op Prep (orange), Available (green)
- Patient name
- Procedure name
- Surgeon name
- Started/Scheduled time
- Anesthesiologist name
- Progress bar (for active surgeries)

**Card States**:
- **In Surgery**: Red border, red status badge, progress bar
- **Pre-Op Prep**: Orange border, orange status badge
- **Available**: Green border, green checkmark, "Available" badge

**Current Implementation**: `/pages/ot/` (if exists)
**Improvements Needed**:
- Create OT live monitoring dashboard
- Real-time status updates
- Surgery progress tracking

---

#### Operation Theatre Schedule Page
**Screenshot Reference**: New Image 5

**Key Elements**:
- **Header**: "Operation Theatre Schedule" with subtitle "Today's Surgeries & Scheduling Overview"
- **Action Buttons**: "Refresh", "+ Schedule Surgery" (teal)

**Stats Cards** (4 columns):
| Stat | Example | Subtitle |
|------|---------|----------|
| TODAY'S SURGERIES | 12 | 3 pending, 9 completed |
| IN PROGRESS | 3 | OT-1, OT-2, OT-3 active |
| OT ROOMS AVAILABLE | 2/5 | OT-4, OT-5 free |
| EMERGENCY | 1 | Trauma case - OT-1 |

**Table - Surgery Schedule**:
- Search: "Search surgeries..."
- Filter dropdown: "All OT Rooms"
- Columns: OT ROOM, PATIENT (name + PID), PROCEDURE, SURGEON, TIME, STATUS, ACTION
- Status badges: In Surgery (red), Completed (green), Scheduled (teal), Pre-Op Prep (orange)
- Status legend at bottom

**Current Implementation**: `/pages/ot/` (if exists)
**Improvements Needed**:
- Create OT scheduling page
- Add surgery status tracking
- Add room availability display

---

### 5. Pharmacy Module

#### Pharmacy Dispense Page
**Screenshot Reference**: Pharmacy Dispense

**Key Elements**:
- Two-column layout: Prescription Queue (left) + Selected Prescription Details (right)
- Search bar with "Scan Barcode" and "Manual Entry" buttons
- Stats cards row at top

**Stats Cards**:
| Stat | Color | Subtitle |
|------|-------|----------|
| Pending Rx | Orange (#F59E0B) | X urgent refills |
| Dispensed Today | Teal (#00D4AA) | +X% from yesterday |
| Low / Out of Stock | Red (#EF4444) | X critical items |
| Revenue Today | Green (#10B981) | X transactions |

**Prescription Queue Table**:
| Column | Description |
|--------|-------------|
| Rx # | Prescription number (e.g., RX-1042) |
| Patient | Patient name + ID |
| Doctor | Prescribing doctor |
| Items | Number of medications |
| Status | Pending/Ready/Verified/Urgent badges |
| Time | Time since prescription |

**Selected Prescription Panel**:
- Patient name, Doctor name
- Date, Priority badge
- Prescribed Medications list with:
  - Medicine name, dosage
  - Instructions (route, timing)
  - Stock status badge (In Stock/Low Stock)
- Dispense Actions section:
  - Pharmacist Notes textarea
  - Total Amount display
  - "Dispense Medications" primary button (teal)
  - "Hold" and "Reject" secondary buttons

**Current Implementation**: `/pharmacy/Prescriptions.tsx`, `/pharmacy/PrescriptionsEnhanced.tsx`

**Improvements Needed**:
- Add two-column layout with prescription details panel
- Add barcode scanning functionality
- Add stock status badges on medications
- Add Hold/Reject actions

---

#### Inventory Management Page
**Screenshot Reference**: Pharmacy Inventory

**Key Elements**:
- Stats cards for inventory overview
- Stock list table with status badges
- Search and "Add Stock" button

**Stats Cards**:
| Stat | Color | Subtitle |
|------|-------|----------|
| Total Items | Blue (#1E3A5F) | All categories |
| Low Stock | Orange (#F59E0B) | Below minimum level |
| Out of Stock | Red (#EF4444) | Needs reorder |
| Expiring Soon | Yellow (#F59E0B) | Within 30 days |

**Stock List Table**:
| Column | Description |
|--------|-------------|
| Item Code | Pharmacy item code (e.g., PHR-0421) |
| Medicine | Name + form + quantity per pack |
| Category | Antibiotics/Antidiabetic/Analgesic |
| Stock | Current quantity |
| Min Level | Minimum stock level |
| Expiry | Expiration date |
| Status | Adequate/Low/Out/Expiring badges |

**Status Badges**:
- Adequate: Green
- Low: Orange
- Out: Red
- Expiring: Yellow

**Current Implementation**: `/pharmacy/Inventory.tsx`, `/pharmacy/InventoryEnhanced.tsx`

**Improvements Needed**:
- Add expiry tracking column
- Add status badges (Adequate/Low/Out/Expiring)
- Add category column
- Add min level tracking

---

#### Purchase Orders Page
**Screenshot Reference**: Pharmacy Purchase Orders

**Key Elements**:
- Stats cards for order overview
- Filter tabs: All, Pending, Approved, Delivered
- Purchase orders table

**Stats Cards**:
| Stat | Color | Subtitle |
|------|-------|----------|
| Open Orders | Blue (#0EA5E9) | X arriving today |
| Delivered Today | Teal (#00D4AA) | All verified |
| Pending Approval | Orange (#F59E0B) | Awaiting manager |
| Total Spend | Green (#10B981) | This month |

**Purchase Orders Table**:
| Column | Description |
|--------|-------------|
| PO # | Purchase order number |
| Supplier | Supplier name + location |
| Items | Number of items |
| Order Date | Date ordered |
| Delivery | Expected delivery date |
| Amount | Order amount (₹) |
| Status | Delivered/In Transit/Pending/Approved badges |

**Current Implementation**: `/pharmacy/PurchaseOrders.tsx`

**Improvements Needed**:
- Add stats cards
- Add filter tabs
- Add supplier location display
- Add delivery date tracking

---

#### Returns & Adjustments Page
**Screenshot Reference**: Pharmacy Returns

**Key Elements**:
- Stats cards for returns overview
- Filter tabs: All, Pending, Processed, Rejected
- Return requests table

**Stats Cards**:
| Stat | Color | Subtitle |
|------|-------|----------|
| Pending Returns | Orange (#F59E0B) | Awaiting processing |
| Processed Today | Teal (#00D4AA) | Completed returns |
| Expired Items | Red (#EF4444) | Need attention |
| Credit Received | Green (#10B981) | This month |

**Return Requests Table**:
| Column | Description |
|--------|-------------|
| Return # | Return request number |
| Item | Medicine name + batch number |
| Reason | Expired/Damaged/Recall/Wrong Delivery |
| Qty | Quantity returned |
| Date | Return date |
| Value | Return value (₹) |
| Status | Processed/Pending/Approved/Rejected badges |

**Current Implementation**: None (needs to be created)

**Improvements Needed**:
- Create Returns page
- Add batch tracking
- Add reason categorization
- Add credit tracking

---

#### Reports & Analytics Page
**Screenshot Reference**: Pharmacy Reports

**Key Elements**:
- Stats cards with comparison to last month
- Two-column layout: Top Selling Medications + Quick Reports
- Export Report button

**Stats Cards**:
| Stat | Color | Subtitle |
|------|-------|----------|
| Revenue | Green (#10B981) | +X% from last month |
| Prescriptions Filled | Blue (#0EA5E9) | +X% from last month |
| Avg. Turnaround | Teal (#00D4AA) | -X min from last month |
| Return Rate | Red (#EF4444) | -X% from last month |

**Top Selling Medications List**:
- Ranked list (1-5)
- Medicine name
- Units sold
- Revenue (₹)

**Quick Reports Panel**:
- Daily Sales Report
- Stock Movement
- Expiry Report
- Supplier Summary

**Current Implementation**: `/pharmacy/ReportsEnhanced.tsx`, `/pharmacy/InventoryReports.tsx`

**Improvements Needed**:
- Add comparison percentages
- Add Quick Reports panel
- Add top selling medications list
- Add export functionality

---

## Complete Role-Page Mapping

| Role | Lunaris Screen | Our Current Page | Priority |
|------|---------------|------------------|----------|
| **Receptionist** | Appointments | `/appointments/` | High |
| **Doctor** | Patient Queue | `/queue/DoctorConsole.tsx` | High |
| **Doctor** | Lab Orders | `/laboratory/` | Medium |
| **Doctor** | Prescriptions | `/doctor/Prescriptions.tsx` | Medium |
| **Accountant** | Billing | `/billing/BillingManagement.tsx` | High |
| **Lab Tech** | Test Results | `/laboratory/ResultsEntry.tsx` | High |
| **Lab Tech** | Sample Processing | `/laboratory/SampleCollection.tsx` | High |
| **OT Staff** | Equipment | `/pages/ot/` (create) | Medium |
| **OT Staff** | Live Monitor | `/pages/ot/` (create) | Medium |
| **OT Staff** | Schedule | `/pages/ot/` (create) | Medium |
| **Pharmacist** | Dispense | `/pharmacy/PrescriptionsEnhanced.tsx` | High |
| **Pharmacist** | Inventory | `/pharmacy/InventoryEnhanced.tsx` | High |
| **Pharmacist** | Purchase Orders | `/pharmacy/PurchaseOrders.tsx` | Medium |
| **Pharmacist** | Returns | `/pharmacy/Returns.tsx` (create) | Medium |
| **Pharmacist** | Reports | `/pharmacy/ReportsEnhanced.tsx` | Medium |

---

## Notes
- All screenshots from "Lunaris" HMS reference design
- Target: Modern, clean, professional healthcare UI
- Focus on data visibility and quick actions
- Mobile responsiveness to be considered in implementation
- Pharmacy module requires two-column layouts for dispense workflow
