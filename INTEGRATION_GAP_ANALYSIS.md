# Hospital Management System - Complete Integration Gap Analysis

**Date:** February 12, 2026
**Scope:** Full-stack review of backend (45 controllers, 52 route files, 55+ models) and frontend (120+ pages/components)

---

## Table of Contents

1. [Critical Integration Gaps](#1-critical-integration-gaps)
2. [Multi-Location Scoping Gaps](#2-multi-location-scoping-gaps)
3. [Multi-Tenant (Organization) Gaps](#3-multi-tenant-organization-gaps)
4. [Authentication & Authorization Gaps](#4-authentication--authorization-gaps)
5. [Frontend-Backend API Mismatches](#5-frontend-backend-api-mismatches)
6. [Data Model Gaps](#6-data-model-gaps)
7. [Route Registration Gaps](#7-route-registration-gaps)
8. [Email & Notification Gaps](#8-email--notification-gaps)
9. [Module-Specific Gaps](#9-module-specific-gaps)
10. [Frontend UI/UX Gaps](#10-frontend-uiux-gaps)
11. [Security Gaps](#11-security-gaps)
12. [Recently Fixed Issues](#12-recently-fixed-issues)
13. [Priority Action Plan](#13-priority-action-plan)

---

## 1. Critical Integration Gaps

### GAP-001: Location Scoping Missing on ALL Core Models (CRITICAL)

**Problem:** Only the `User` model has a `locationId` column. ALL other models (Appointment, Bill, LabOrder, Prescription, ConsultationNote, Diagnosis, VitalSigns, etc.) have NO `locationId` field.

**Impact:** When a multi-location organization has branches, there is NO way to:
- Filter appointments by location
- Show only the current branch's lab orders
- Restrict prescriptions to a specific branch
- Generate location-specific reports

**Affected Models (missing `locationId`):**
| Model | File | Impact |
|-------|------|--------|
| `Appointment` | `models/Appointment.ts` | Cannot filter appointments by branch |
| `Bill` | `models/Bill.ts` | Cannot generate branch-specific billing |
| `ConsultationNote` | `models/ConsultationNote.ts` | Consultations not tied to branch |
| `Diagnosis` | `models/Diagnosis.ts` | Diagnoses not location-scoped |
| `LabOrder` | `models/LabOrder.ts` | Lab orders shared across all branches |
| `LabResult` | `models/LabResult.ts` | Results not branch-specific |
| `LabSample` | `models/LabSample.ts` | Samples not location-tracked |
| `Prescription` (via pharmacy) | `models/pharmacy/Prescription.ts` | Prescriptions not branch-scoped |
| `VitalSigns` | `models/VitalSigns.ts` | Vitals not tied to branch |
| `QueueItem` | `models/QueueItem.ts` | Queue shared across all branches |
| `EmergencyRequest` | `models/EmergencyRequest.ts` | Emergency not branch-specific |
| `CallbackRequest` | `models/CallbackRequest.ts` | Callbacks not branch-scoped |
| `MedicalRecord` | `models/MedicalRecord.ts` | Records not location-aware |
| `Feedback` | `models/Feedback.ts` | Feedback not branch-specific |
| `Triage` | `models/Triage.ts` | Triage not location-scoped |
| `Visit` | `models/Visit.ts` | Visits not branch-tracked |
| `Department` | `models/Department.ts` | Departments are org-wide, not per-branch |
| `Service` | `models/Service.ts` | Services are org-wide, not per-branch |
| `Inpatient/Admission` | `models/inpatient/Admission.ts` | Admissions not branch-scoped |
| `Inpatient/Bed` | `models/inpatient/Bed.ts` | Beds not tied to specific branch |
| `Inpatient/Ward` | `models/inpatient/Ward.ts` | Wards not location-specific |
| `Inpatient/Room` | `models/inpatient/Room.ts` | Rooms not location-specific |

**Fix Required:** Add `locationId` column to all core transactional models. Update controllers to filter by `locationId` when a branch context is active.

---

### GAP-002: Frontend LocationContext Not Used in API Calls

**Problem:** The frontend has a `LocationContext` (`contexts/LocationContext.tsx`) that tracks `selectedLocation`, but almost NO frontend page passes `locationId` as a query parameter to API calls.

**Impact:** Even if the backend supported location filtering, the frontend never sends the location context to the API.

**Affected Pages (not sending locationId):**
- `pages/admin/AppointmentsAdmin.tsx` - fetches `/appointments` without locationId
- `pages/admin/DoctorsAdmin.tsx` - fetches `/users?role=doctor` without locationId
- `pages/admin/DepartmentsAdmin.tsx` - fetches `/departments` without locationId
- `pages/admin/ServicesAdmin.tsx` - fetches `/services` without locationId
- `pages/admin/PrescriptionsAdmin.tsx` - fetches prescriptions without locationId
- `pages/admin/LabOrdersAdmin.tsx` - fetches lab orders without locationId
- `pages/admin/QueueManagement.tsx` - fetches queue without locationId
- `pages/admin/EmergencyDashboard.tsx` - fetches emergencies without locationId
- `pages/admin/CallbackQueue.tsx` - fetches callbacks without locationId
- `pages/pharmacy/Dashboard.tsx` - fetches pharmacy data without locationId
- `pages/laboratory/LabDashboard.tsx` - fetches lab data without locationId
- `pages/inpatient/BedManagement.tsx` - fetches beds without locationId
- `pages/billing/BillingManagement.tsx` - fetches bills without locationId
- `pages/Dashboard.tsx` - fetches dashboard stats without locationId
- `pages/PremiumDashboard.tsx` - fetches dashboard stats without locationId

**Fix Required:** All admin/dashboard pages should read from `LocationContext` and append `?locationId=xxx` to API calls.

---

### GAP-003: Backend Controllers Not Filtering by Location (6 of 45 controllers support it)

**Problem:** Only 6 controllers accept `locationId` as a filter parameter:
1. `analytics.controller.ts` - supports locationId filtering
2. `user.controller.ts` - supports locationId filtering
3. `auth.controller.ts` - uses locationId for branch assignment
4. `appointment.controller.ts` - partial locationId support
5. `location.controller.ts` - manages locations themselves
6. `organization.controller.ts` - references locationId

**The remaining 39 controllers ignore location entirely:**
- `department.controller.ts` - filters by org only
- `service.controller.ts` - filters by org only
- `consultation.controller.ts` - filters by org only
- `diagnosis.controller.ts` - filters by org only
- `vital-signs.controller.ts` - filters by org only
- `lab-order.controller.ts` - filters by org only
- `lab-result.controller.ts` - filters by org only
- `lab-test.controller.ts` - filters by org only
- `lab-sample.controller.ts` - filters by org only
- `pharmacy/prescription.controller.ts` - filters by org only
- `pharmacy/medicine.controller.ts` - filters by org only
- `pharmacy/inventory.controller.ts` - filters by org only
- `inventory.controller.ts` - filters by org only
- `supplier.controller.ts` - filters by org only
- `purchase-order.controller.ts` - filters by org only
- `inpatient/admission.controller.ts` - filters by org only
- `inpatient/bed.controller.ts` - filters by org only
- `inpatient/ward.controller.ts` - filters by org only
- `inpatient/room.controller.ts` - filters by org only
- `inpatient/nursing-care.controller.ts` - filters by org only
- `inpatient/doctor-rounds.controller.ts` - filters by org only
- `emergency.controller.ts` - filters by org only
- `callback.controller.ts` - filters by org only
- `feedback.controller.ts` - filters by org only
- `notification.controller.ts` - filters by org only
- `messaging.controller.ts` - filters by org only
- `reminder.controller.ts` - filters by org only
- `report.controller.ts` - filters by org only
- `medicalRecords.controller.ts` - filters by org only
- `allergy.controller.ts` - filters by org only
- `availability.controller.ts` - filters by org only
- `doctorAvailability.controller.ts` - filters by org only
- `appointmentFeedback.controller.ts` - filters by org only
- `insurance.controller.ts` - filters by org only
- `role.controller.ts` - filters by org only
- `audit-log.controller.ts` - filters by org only
- `patient-history.controller.ts` - filters by org only
- `patient-access-grant.controller.ts` - filters by org only
- `health-article.controller.ts` - filters by org only

---

## 2. Multi-Location Scoping Gaps

### GAP-004: Department & Service Not Location-Aware

**Problem:** Departments and Services are created at the organization level. There's no way to have different departments or services per branch.

**Scenario:** Chennai branch has Cardiology, Bangalore branch doesn't. Currently both branches see all departments.

**Impact:** Branch-specific department/service management impossible.

---

### GAP-005: Queue System Not Location-Scoped

**Problem:** `QueueItem` model has `organizationId` but no `locationId`. The queue system (`queue.routes.ts`, `ReceptionQueue.tsx`, `TriageStation.tsx`, `DoctorConsole.tsx`) shows ALL patients across ALL branches.

**Impact:** Reception at Chennai branch sees patients queued at Bangalore branch.

---

### GAP-006: Inpatient Module Not Location-Scoped

**Problem:** Wards, Rooms, and Beds are created at org level. `Ward`, `Room`, and `Bed` models have `organizationId` but no `locationId`.

**Impact:** 
- Bed availability shows ALL beds across ALL branches
- Ward overview mixes branches
- Admission can be assigned to a bed at a different branch

---

### GAP-007: Pharmacy/Inventory Not Location-Scoped

**Problem:** Medicines, inventory, and prescriptions are org-level. No `locationId` on `Medicine`, `MedicineTransaction`, or `Prescription` models.

**Impact:**
- Stock levels are shared across branches (inaccurate)
- Dispensing at Chennai reduces stock shown at Bangalore
- Purchase orders not branch-specific

---

### GAP-008: Laboratory Not Location-Scoped

**Problem:** Lab tests, orders, samples, and results have no `locationId`.

**Impact:**
- Lab technician at Chennai sees orders from Bangalore
- Sample collection not branch-specific
- Results not tied to the branch where the test was done

---

### GAP-009: Location Switcher Not Filtering Data

**Problem:** The `SaaSLayout` location switcher dropdown allows selecting a branch, but switching branches does NOT:
1. Update the `LocationContext`
2. Re-fetch data for the selected branch
3. Pass `locationId` to any API call

**Current behavior:** Switching branch only updates a local state variable and shows a toast message. No actual data filtering happens.

**File:** `frontend/src/components/SaaSLayout.tsx` (lines 1211-1231)

---

## 3. Multi-Tenant (Organization) Gaps

### GAP-010: Tenant Middleware Sets Super Admin to First Org

**Problem:** `tenant.middleware.ts` sets `req.tenant` to the first active organization for super_admin users. This means all tenant-scoped API calls from super admin are locked to one org.

**Impact:** Super admin cannot view data from other organizations without the special `/all` endpoints.

**Status:** Partially fixed (added `/locations/all` endpoint), but most other endpoints still locked.

---

### GAP-011: Duplicate Route Registration in server.ts

**Problem:** Routes are registered TWICE in `server.ts`:
- Once in the `setupRoutes()` method (lines 264-316)
- Again in the `setupRoutesOld()` method (lines 910-944)

Some routes have different paths between the two registrations:
- `/api/reports` vs `/api` (report routes)
- `/api/referrals` vs `/api` (referral routes)
- `/api/insurance` vs `/api` (insurance routes)
- `/api/organization` vs `/api/organizations` (organization routes)
- `/api/diagnosis` vs `/api/diagnoses` (diagnosis routes)

**Impact:** Potential route conflicts, confusion about which endpoint to use.

---

### GAP-012: Organization Creation Missing Fields in Frontend

**Problem:** The `OrganizationsManagement.tsx` create form sends limited fields. The backend `createOrganization` now auto-creates a main branch, but the frontend form doesn't have address/city/state fields for the main branch.

**Impact:** Main branch is created with empty address fields.

---

## 4. Authentication & Authorization Gaps

### GAP-013: Branch Admin vs Org Admin Role Ambiguity

**Problem:** Both org-level admin and branch-level admin use the same `admin` role. There's no `branch_admin` role distinction.

**Impact:**
- A branch admin (assigned to one location) has the same role as the org admin
- Authorization checks (`user.role === 'admin'`) don't distinguish between org admin and branch admin
- Branch admin can potentially access/modify data from other branches

**Current workaround:** Branch admin is an `admin` user with `locationId` set. But no controller checks `user.locationId` to restrict access.

---

### GAP-014: No Location-Based Access Control in Controllers

**Problem:** No controller checks if the requesting user's `locationId` matches the data they're accessing.

**Example:** A branch admin at Chennai (locationId=CHN) can:
- View/edit appointments at Bangalore branch
- Manage beds at Bangalore branch
- Access lab orders from Bangalore branch

**Fix Required:** Controllers should check `user.locationId` and restrict data access for branch-level admins.

---

### GAP-015: Password Reset Flow Not Org-Scoped

**Problem:** `PasswordResetToken` model has no `organizationId`. If the same email exists in multiple organizations, password reset could affect the wrong account.

---

### GAP-016: Google Auth Not Multi-Tenant Aware

**Problem:** `google-auth.controller.ts` finds users by `googleId` without org context. If a user has accounts in multiple orgs, Google login always returns the first match.

---

## 5. Frontend-Backend API Mismatches

### GAP-017: Dashboard Stats Not Location-Aware

**Problem:** `Dashboard.tsx` and `PremiumDashboard.tsx` fetch stats from multiple endpoints without passing `locationId`:
- `/api/users?role=patient` (patient count)
- `/api/appointments` (appointment count)
- `/api/users?role=doctor` (doctor count)

**Impact:** Dashboard shows org-wide numbers even when a specific branch is selected.

---

### GAP-018: Doctor Schedule Not Location-Filtered

**Problem:** `MySchedule.tsx` and `AvailabilitySetup.tsx` fetch doctor availability without location context. A doctor assigned to Chennai sees availability slots for all branches.

---

### GAP-019: Patient Registration Not Location-Aware

**Problem:** `PatientForm.tsx` creates patients without assigning them to a location. The patient's `locationId` is never set during registration.

**Impact:** Patients are org-wide, not branch-specific. Cannot track which branch registered the patient.

---

### GAP-020: Appointment Booking Not Location-Filtered

**Problem:** `BookAppointmentStepper.tsx` and `BookAppointmentAuth.tsx` fetch doctors and services without location filtering. A patient at Chennai branch sees doctors from Bangalore.

---

### GAP-021: Telemedicine Routes Duplicated (JS and TS)

**Problem:** Two telemedicine route files exist:
- `routes/telemedicine.js` (JavaScript, 12KB)
- `routes/telemedicineRoutes.ts` (TypeScript, 898 bytes)

Only the TypeScript version is imported in `server.ts`. The JS file is dead code.

---

### GAP-022: Insurance Controller TypeScript Errors

**Problem:** `insurance.controller.ts` has TypeScript errors — `organizationId` doesn't exist on `Plan` model's `FindOptionsWhere` type. The `Plan` model may be missing the `organizationId` column.

---

### GAP-023: Billing Routes Have Inline Controllers

**Problem:** `billing.routes.ts` (11KB) contains inline controller logic instead of importing from a separate controller file. This is inconsistent with the rest of the codebase.

---

### GAP-024: Queue Routes Have Inline Controllers

**Problem:** `queue.routes.ts` (10KB) contains inline controller logic. Same issue as billing.

---

### GAP-025: Visit Routes Have Inline Controllers

**Problem:** `visit.routes.ts` (10KB) contains inline controller logic.

---

### GAP-026: Ambulance Routes Have Inline Controllers

**Problem:** `ambulance.routes.ts` (19KB) contains inline controller logic.

---

### GAP-027: Symptom Checker Routes Have Inline Controllers

**Problem:** `symptom-checker.routes.ts` (13KB) contains inline controller logic.

---

## 6. Data Model Gaps

### GAP-028: Appointment Model Missing Location Relation

**Problem:** `Appointment` model has `organizationId` but no `locationId`. Cannot track which branch the appointment is at.

**Fields present:** `id`, `patientId`, `doctorId`, `serviceId`, `organizationId`, `date`, `time`, `status`, etc.
**Fields missing:** `locationId`

---

### GAP-029: Bill Model Missing Location

**Problem:** `Bill` model has `organizationId` but no `locationId`. Cannot generate branch-specific financial reports.

---

### GAP-030: LabTest Model - Org-Wide Only

**Problem:** Lab tests are defined at org level. Cannot have branch-specific test catalogs or pricing.

---

### GAP-031: Medicine Model - Org-Wide Only

**Problem:** Medicines are org-wide. Cannot track branch-specific stock levels.

---

### GAP-032: No Referral Model Integration

**Problem:** `Referral` model exists (`models/Referral.ts`, 715 bytes) but is very minimal. No integration with appointment booking or cross-location referral workflow.

---

### GAP-033: TelemedicineSession Not Integrated

**Problem:** `TelemedicineSession` model exists but the frontend `TelemedicineHub.tsx` has many TODOs and uses mock data. No real video call integration.

---

## 7. Route Registration Gaps

### GAP-034: Missing Super Admin Routes for Cross-Org Data

**Problem:** `super-admin.routes.ts` only has 4 routes:
- `GET /super-admin/stats`
- `GET /super-admin/tenants`
- `POST /super-admin/approve/:id`
- `POST /super-admin/impersonate`

**Missing routes for super admin:**
- Cross-org appointment viewing
- Cross-org billing/revenue reports
- Cross-org patient search
- Cross-org staff management
- System-wide analytics

---

### GAP-035: Analytics Routes Limited

**Problem:** `analytics.routes.ts` only has 1 route: `GET /analytics/dashboard`. No routes for:
- Revenue analytics
- Patient flow analytics
- Department utilization
- Location comparison analytics

---

### GAP-036: No Audit Trail for Critical Operations

**Problem:** `audit-log.controller.ts` exists but audit logging is not integrated into most controllers. Critical operations like:
- User creation/deletion
- Location creation
- Role changes
- Data exports
- Patient record access

...are NOT being audit-logged.

---

## 8. Email & Notification Gaps

### GAP-037: No Email on Appointment Status Changes

**Problem:** When an appointment is confirmed, cancelled, or rescheduled, no email notification is sent to the patient (despite `EmailService.sendAppointmentConfirmationEmail` existing).

---

### GAP-038: No Email on Lab Results Ready

**Problem:** When lab results are entered, no notification is sent to the patient or doctor. `EmailService.sendTestResultNotificationEmail` exists but is never called.

---

### GAP-039: No Email on Prescription Created

**Problem:** When a doctor writes a prescription, no notification is sent to the patient. `EmailService.sendPrescriptionNotificationEmail` exists but is never called.

---

### GAP-040: No In-App Notification Integration

**Problem:** `Notification` model and `notification.controller.ts` exist, but notifications are NOT created by other controllers when events happen. The notification system is standalone and disconnected.

**Events that should create notifications but don't:**
- New appointment booked
- Appointment confirmed/cancelled
- Lab results ready
- Prescription created
- Admission/discharge
- Queue status changes
- Emergency alerts

---

### GAP-041: No Push Notification / Real-Time Updates

**Problem:** No WebSocket or Server-Sent Events implementation. All data is fetched via polling or manual refresh. Critical for:
- Queue display (TV Display page)
- Emergency alerts
- Chat/messaging
- Real-time bed availability

---

## 9. Module-Specific Gaps

### GAP-042: Pharmacy - No Dispensing Workflow

**Problem:** Pharmacy module has medicine management and inventory, but no complete dispensing workflow:
- No "dispense prescription" action
- No stock deduction on dispensing
- No prescription-to-dispensing link
- No billing integration for dispensed medicines

---

### GAP-043: Laboratory - Incomplete Workflow

**Problem:** Lab module has test catalog, ordering, sample collection, and results entry, but:
- No auto-notification when results are ready
- No integration with billing (lab tests not auto-billed)
- No sample tracking (barcode/QR)
- No result PDF generation

---

### GAP-044: Inpatient - No Discharge Billing Integration

**Problem:** Discharge summary exists but doesn't:
- Auto-generate a final bill
- Include all charges (bed, medicines, procedures)
- Trigger billing workflow

---

### GAP-045: OT Management - Route-Only Implementation

**Problem:** `ot.routes.ts` (7KB) has inline controllers with basic CRUD. No integration with:
- Surgeon scheduling
- Anesthesia management
- Pre-op/post-op workflow
- OT availability calendar

---

### GAP-046: Ambulance - No Real Tracking

**Problem:** Ambulance routes have CRUD operations but no:
- Real-time GPS tracking
- Driver assignment workflow
- ETA calculation
- Integration with emergency module

---

### GAP-047: Insurance - Claims Not Integrated

**Problem:** Insurance module has `Plan`, `Policy`, and `Claim` models but:
- No integration with billing
- No claim submission workflow
- No pre-authorization flow
- Frontend shows placeholder (`/insurance/claims` → ModulePlaceholder)

---

### GAP-048: Radiology - Placeholder Only

**Problem:** `/radiology` route exists but maps to `ModulePlaceholder`. No backend model, controller, or routes for radiology.

---

### GAP-049: Billing - No Payment Gateway

**Problem:** Billing module has invoice generation but no:
- Online payment integration (Razorpay/Stripe)
- Payment receipt generation
- Refund workflow
- Insurance claim auto-submission

---

### GAP-050: Telemedicine - No Video Integration

**Problem:** `TelemedicineHub.tsx` has UI but no actual video call integration. Uses mock data. No WebRTC or third-party video SDK.

---

## 10. Frontend UI/UX Gaps

### GAP-051: Multiple Duplicate Pages

**Problem:** Several pages have duplicate versions:
- `Login.tsx`, `LoginNew.tsx`, `LoginFixed.tsx` (3 login pages)
- `RegisterPage.tsx`, `RegisterStepper.tsx`, `RegisterFixed.tsx` (3 register pages)
- `Emergency.tsx`, `EmergencyNew.tsx` (2 emergency pages)
- `Departments.tsx`, `DepartmentsNew.tsx` (2 department pages)
- `Services.tsx`, `ServicesNew.tsx` (2 service pages)
- `BookAppointment.tsx`, `BookAppointmentEnhanced.tsx`, `BookAppointmentWizard.tsx` (3 booking pages)
- `DoctorsAdmin.tsx`, `DoctorsAdminEnhanced.tsx` (2 doctor admin pages)
- `ScheduleSession.tsx`, `ScheduleSessionSimple.tsx`, `ScheduleSessionWorking.tsx` (3 schedule pages)
- `AmbulanceManagement.tsx`, `AmbulanceAdvanced.tsx` (2 ambulance pages)

**Impact:** Code maintenance burden, confusion about which version is active.

---

### GAP-052: SaaS Routes Reuse Non-SaaS Components

**Problem:** Several SaaS-specific routes reuse generic components:
- `/saas/system-health` → `SuperAdminDashboard` (same as `/saas/dashboard`)
- `/saas/analytics` → `ReportsAdmin` (same as `/admin/reports`)
- `/saas/api` → `Dashboard` (generic dashboard, not API management)
- `/saas/onboarding` → `OrganizationsManagement` (same as `/saas/organizations`)

---

### GAP-053: No Loading States on Many Pages

**Problem:** Many pages fetch data on mount but don't show loading spinners during the fetch. Users see empty tables briefly.

---

### GAP-054: 520+ TODO Comments in Frontend

**Problem:** 520 TODO/FIXME comments across 120 frontend files indicate many incomplete implementations.

---

## 11. Security Gaps

### GAP-055: No Rate Limiting on Login

**Problem:** No rate limiting on `/api/auth/login`. Vulnerable to brute-force attacks.

---

### GAP-056: No CSRF Protection

**Problem:** No CSRF tokens implemented. API uses JWT in Authorization header (which is CSRF-safe), but cookie-based sessions (if any) would be vulnerable.

---

### GAP-057: No Input Sanitization

**Problem:** No XSS sanitization middleware. User inputs (names, addresses, notes) are stored and rendered without sanitization.

---

### GAP-058: No File Upload Validation

**Problem:** Profile picture uploads and medical record attachments have no file type/size validation.

---

### GAP-059: Super Admin Impersonation Has No Audit Trail

**Problem:** `POST /super-admin/impersonate` allows super admin to log in as any org admin, but this action is not audit-logged.

---

## 12. Recently Fixed Issues

These issues were identified and fixed in the current session:

| # | Issue | Status |
|---|-------|--------|
| 1 | Super admin sees only first org's locations | FIXED |
| 2 | Location switcher empty for super admin | FIXED |
| 3 | Auth controller not returning availableBranches for super admin | FIXED |
| 4 | LocationsManagement not showing all orgs' locations for super admin | FIXED |
| 5 | OrganizationsManagement missing location count | FIXED |
| 6 | No main branch auto-created when org is created | FIXED |
| 7 | No branch admin creation option when creating location | FIXED |
| 8 | No email notification when location is created with admin | FIXED |
| 9 | Admin user not assigned to main branch on org creation | FIXED |

---

## 13. Priority Action Plan

### Phase 1: Critical (Must Fix for Multi-Location to Work)

| Priority | Task | Effort |
|----------|------|--------|
| P0 | Add `locationId` to Appointment, Bill, QueueItem, Prescription models | 2 days |
| P0 | Update appointment controller to filter by locationId | 1 day |
| P0 | Update queue controller to filter by locationId | 0.5 day |
| P0 | Frontend: Pass locationId from LocationContext to all API calls | 2 days |
| P0 | Location switcher should update LocationContext and re-fetch data | 1 day |
| P0 | Branch admin access control (check user.locationId in controllers) | 2 days |

### Phase 2: High Priority (Core Workflow Completion)

| Priority | Task | Effort |
|----------|------|--------|
| P1 | Add `locationId` to Lab, Inpatient, Pharmacy models | 2 days |
| P1 | Email notifications for appointment status changes | 1 day |
| P1 | Email notifications for lab results ready | 0.5 day |
| P1 | In-app notification creation from controllers | 2 days |
| P1 | Pharmacy dispensing workflow | 3 days |
| P1 | Lab-to-billing integration | 1 day |
| P1 | Discharge-to-billing integration | 1 day |

### Phase 3: Medium Priority (Feature Completion)

| Priority | Task | Effort |
|----------|------|--------|
| P2 | Clean up duplicate pages (keep only *Fixed/*Enhanced versions) | 1 day |
| P2 | Remove duplicate route registration in server.ts | 0.5 day |
| P2 | Fix TypeScript errors in insurance, role controllers | 1 day |
| P2 | Extract inline controllers from billing, queue, visit routes | 2 days |
| P2 | Super admin cross-org analytics dashboard | 2 days |
| P2 | Audit logging integration in all controllers | 2 days |
| P2 | Department/Service per-location configuration | 2 days |

### Phase 4: Low Priority (Enhancement)

| Priority | Task | Effort |
|----------|------|--------|
| P3 | Payment gateway integration | 3 days |
| P3 | Real-time WebSocket for queue/notifications | 3 days |
| P3 | Telemedicine video integration | 5 days |
| P3 | Radiology module | 5 days |
| P3 | Insurance claims workflow | 3 days |
| P3 | Rate limiting and security hardening | 1 day |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| **Total Integration Gaps Found** | 59 |
| **Critical (P0)** | 6 |
| **High Priority (P1)** | 7 |
| **Medium Priority (P2)** | 7 |
| **Low Priority (P3)** | 6 |
| **Models Missing locationId** | 22 |
| **Controllers Missing Location Filtering** | 39 of 45 |
| **Frontend Pages Not Sending locationId** | 15+ |
| **TODO/FIXME Comments** | 520+ (frontend) + 11 (backend) |
| **Duplicate Pages** | 9 sets |
| **Recently Fixed** | 9 issues |

---

*This document should be reviewed and updated as fixes are implemented.*
