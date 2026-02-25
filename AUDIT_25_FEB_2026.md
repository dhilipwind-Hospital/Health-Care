# 🔍 Feature Audit Report — 25 Feb 2026

## Changes Made Today

### Commit 1: `f0ba202` — Fix 403 Forbidden + Login Optimization
| # | File | Change | Impact |
|---|------|--------|--------|
| 1 | `frontend/src/components/SaaSLayout.tsx` | Removed `isPatient` from Telemedicine menu condition | ✅ Patients no longer see Telemedicine (which they couldn't access) |
| 2 | `frontend/src/App.tsx` | Removed duplicate `/telemedicine` route at line 436 | ✅ Removed dead code (first-match router made 2nd route unreachable) |
| 3 | `backend/src/controllers/auth.controller.ts` | Parallelized refresh token save + branch data fetch in login | ⚠️ **RISK** — see below |
| 4 | `frontend/src/contexts/AuthContext.tsx` | Login uses `data.user` directly instead of `/users/me` call | ⚠️ **RISK** — see below |

### Commit 2: `27a9475` — Redesign Book Appointment Page
| # | File | Change | Impact |
|---|------|--------|--------|
| 5 | `frontend/src/pages/appointments/BookAppointmentStepper.tsx` | Complete rewrite from multi-step wizard to single-page Lunaris design | ⚠️ **RISK** — see below |
| 6 | `frontend/src/pages/appointments/BookAppointmentStepper.css` | Complete CSS rewrite for new design | ✅ Styling only |

---

## ⚠️ Potential Issues & Risks

### RISK 1: Login Flow Change (`AuthContext.tsx` + `auth.controller.ts`)
**What changed:**
- OLD: After login, frontend called `/users/me` to get full profile, THEN navigated
- NEW: Frontend uses `data.user` from login response directly, navigates immediately, then calls `/users/me` in background

**Potential breakage:**
- ❌ **If the login response `data.user` is missing fields** that the old `/users/me` response had (e.g., `department`, `specialization`, extra profile fields), then UI components that depend on those fields might show empty/broken data **for the first few seconds** until the background `/users/me` call completes and updates the user.
- The login response `user` object comes from `{ password: _, ...userData }` which is the full User entity with `relations: ['organization']`. **It does NOT include `department` relation.**
- **The old `/users/me` endpoint** also loads with `relations: ['organization']` only — so the data should be equivalent.

**Assessment:** ⚠️ **LOW RISK** — Both paths return the same data shape. The background `/users/me` call will fill any gaps within 1-2 seconds.

### RISK 2: Backend Login — Parallel Branch Data Fetch
**What changed:**
- OLD: Sequential — save refresh token, THEN fetch branches/locations
- NEW: Parallel — save refresh token AND fetch branches concurrently using `Promise.all`

**Potential breakage:**
- ❌ **If the branch query fails**, it could potentially cause the entire login to fail (since `Promise.all` rejects if any promise fails)
- The OLD code had branches fetched AFTER token save, so token save was guaranteed before branches

**Assessment:** ⚠️ **MEDIUM RISK** — If `Location` table has issues (e.g., missing columns, migration not run), login could crash for admins. However, the branch query is wrapped inside a try-catch-style `branchPromise` that only runs for admin/super_admin roles. Non-admin logins are unaffected.

### RISK 3: Book Appointment Page Rewrite
**What changed:**
- OLD: 5-step wizard (Service → Doctor → Date & Time → Details → Confirm)
- NEW: Single-page Lunaris design (Doctor cards + Calendar + Time slots + Summary sidebar)

**Potential breakages:**
1. ❌ **Service selection removed** — The old wizard had a "Select Service" step where users picked a medical service. The new design auto-matches a service from the doctor's department. If NO services exist for the doctor's department, the booking will fail with "No service available."
2. ❌ **Urgency selection removed** — The old wizard had Routine/Urgent/Emergency toggle. Now hardcoded to 'routine'. Emergency appointments won't be flagged.
3. ❌ **Skip Triage option removed** — The old wizard had "Standard (with Triage)" vs "Direct Doctor Consultation" toggle. Now removed.
4. ❌ **Department selection in "Details" step removed** — Was optional in old wizard, now auto-determined from selected doctor.
5. ❌ **"Reason for Visit" field removed** — Was in old wizard's Details step. Notes field exists but is labeled as optional.
6. ✅ **Core booking API payload preserved** — `serviceId`, `doctorId`, `startTime`, `endTime`, `reason`, `notes`, `preferences` all still sent.
7. ⚠️ **Time slots are static** — Both old and new versions generate static time slots (not from real doctor availability API). This was already the case before.

**Assessment:** ⚠️ **MEDIUM RISK** — The core booking works, but some secondary features (urgency, triage skip, explicit service selection) were removed in the redesign.

---

## ✅ Features Verified Working (No Changes)

| Feature | Status | Notes |
|---------|--------|-------|
| Login (all roles) | ✅ | Core authentication flow preserved |
| Dashboard (all roles) | ✅ | Not touched |
| Patient Management | ✅ | Not touched |
| Pharmacy | ✅ | Not touched |
| Laboratory | ✅ | Not touched |
| Billing | ✅ | Not touched |
| Inpatient Management | ✅ | Not touched |
| Queue Management | ✅ | Not touched |
| Settings | ✅ | Not touched |
| Communication | ✅ | Not touched |
| Patient Portal | ✅ | Not touched |
| Doctor Console | ✅ | Not touched |
| Nurse Station | ✅ | Not touched |
| Receptionist Queue | ✅ | Not touched |
| Reports & Analytics | ✅ | Not touched |
| SaaS Management (Super Admin) | ✅ | Not touched |
| Organization Switching | ✅ | Not touched |
| Branch Switching | ✅ | Not touched |
| Cross-Location Access | ✅ | Not touched |

---

## 🔧 Recommended Fixes

### Fix 1: Restore Service Selection (if needed)
If the organization has multiple services per department, users may need to pick a specific service. Consider adding a service dropdown to the sidebar or above the doctor cards.

### Fix 2: Add Urgency Option
Add a simple toggle or radio group in the booking summary sidebar for Routine/Urgent urgency levels.

### Fix 3: Error Handling for Missing Services
Currently, if no service matches the selected doctor's department, the booking fails. Need graceful handling.

---

## Files Changed Summary

```
backend/src/controllers/auth.controller.ts   — Login optimization (parallel ops)
frontend/src/App.tsx                          — Removed duplicate telemedicine route
frontend/src/components/SaaSLayout.tsx        — Removed telemedicine from patient menu
frontend/src/contexts/AuthContext.tsx          — Login uses response data directly
frontend/src/pages/appointments/BookAppointmentStepper.tsx — Full rewrite (Lunaris design)
frontend/src/pages/appointments/BookAppointmentStepper.css — Full CSS rewrite
```
