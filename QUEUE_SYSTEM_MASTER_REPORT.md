# 🏥 Master Report: Patient Queue & Triage System Optimization

## 📅 Execution Date: February 9, 2026

## 📋 1. Executive Summary
This report documents a critical stabilization of the **Hospital Queue Management System**. Earlier today, the system was experiencing a series of "404 Not Found" errors and data reflection issues that prevented patients from moving through the Triage and Doctor stages. 

All identified blockers have been resolved by standardizing the backend's data retrieval methods and organization-context handling.

---

## 🏗️ 2. System Architecture Overview
The system follows a three-stage pipeline across both **Chennai** and **Bangalore** branches:

1.  **Stage: Reception** (`ReceptionQueue.tsx`)
    *   **Action**: Create Visit.
    *   **Backend**: `POST /api/visits` (Creates `Visit` + `QueueItem`).
2.  **Stage: Triage** (`TriageStation.tsx`)
    *   **Action**: Nurse "Calls" patient -> Records Vitals -> Advances to Doctor.
    *   **Backend**: `POST /api/queue/:id/call`, `PATCH /api/triage/:visitId`, `POST /api/visits/:id/advance`.
3.  **Stage: Consultation** (`DoctorConsole.tsx`)
    *   **Action**: Doctor "Calls" patient -> Completes Session.
    *   **Backend**: `POST /api/queue/call-next` (filtered by `doctorId`).

---

## 🔍 3. Root Cause Analysis (Bugs Fixed)

### 🔴 Bug A: The "Invisible Patient" (Returning Data Issue)
*   **The Problem**: In `backend/src/routes/queue.routes.ts`, the system was using high-performance atomic updates:
    ```typescript
    await manager.createQueryBuilder().update(QueueItem).set({status: 'called'}).where(...)
    ```
*   **The Failure**: PostgreSQL does **not** return the updated row by default. When the code tried to read `upd.raw[0]`, it received `undefined`, causing the backend to wrongly report "Queue item not found" 404.
*   **The Resolution**: Added `.returning('*')` to all update queries. This forces the database to send back the updated record immediately.

### 🔴 Bug B: Organization Context Loss
*   **The Problem**: Several files in `backend/src/routes/` were using `req.user.organization_id` (snake_case) or querying the DB with raw column names like `u.organization_id`.
*   **The Failure**: TypeORM entities use camelCase (`organizationId`). Because of this mismatch, the system couldn't verify which hospital the user belonged to, resulting in "Organization context required" errors.
*   **The Resolution**: Standardized all references to `organizationId` across `server.ts`, `visit.routes.ts`, `queue.routes.ts`, and `triage.routes.ts`.

---

## 🔄 4. Comparative Analysis: Before vs. After

| Feature | State Before Fix | State After Fix (STABLE) |
| :--- | :--- | :--- |
| **Visit Creation** | Message shown but queue didn't update. | Token generated and visible in list immediately. |
| **Calling Patient** | Threw "404 Not Found" in Nurse/Doctor view. | Successfully updates status to 'Called' (Yellow Tag). |
| **Vitals Storage** | Intermittent failures in saving/loading. | Reliable persistence linked to correct Org ID. |
| **Doctor Flow** | All-hospital view (Chennai saw Bangalore). | Strict isolation (Doctor only sees their hospital). |

---

## 🛠️ 5. Technical Changes Implemented (Code Details)

### Backend: `queue.routes.ts`
*   Modified the `call-next` and `call` endpoints.
*   Ensured that after a `.returning('*')` update, the system performs a secondary `repo.findOne` using the resulting ID to ensure the frontend receives all decorators (like patient names and token strings).

### Backend: `triage.routes.ts` & `visit.routes.ts`
*   Corrected the `orgId` variable extraction to check both `req.tenant.id` and `req.user.organizationId` correctly.
*   Updated the query logic to use entity properties instead of raw database columns.

---

## 🚀 6. Future Roadmap (Recommended Enhancements)
To move from a "Functional" to a "Premium" state, we recommend:

1.  **WebSockets (Socket.io)**: Eliminate page refreshes. When a nurse clicks "Call", the TV display should play a sound and update instantly.
2.  **Persistent Triage State**: Implement a "Draft" system for vitals, so if a network error occurs, the nurse doesn't have to re-type the patient's heart rate or BP.
3.  **Triage to Lab Auto-Routing**: If certain vitals (e.g., high sugar) are recorded, auto-suggest a Lab visit before the Doctor consultation.

---

**Status**: **PROTECTED & STABLE** ✅
**Action Required**: None. The fixes are applied to the local files and the Docker backend service has been synced.
