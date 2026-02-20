# 🩺 System Analysis Report: Patient Queue & Triage Flow

## 📋 Overview of the Feature
The application uses a **Stage-Based Queue System**. A patient visit follows this path:
1. **Reception**: Visit is created; patient is added to the Triage waiting list.
2. **Triage (Nurse)**: Nurse "calls" the patient, records vitals, and "advances" the patient to the Doctor.
3. **Doctor Console**: Doctor "calls" the patient from their assigned queue.

---

## 🔍 Detailed File Review

### 1. `frontend/src/pages/queue/ReceptionQueue.tsx`
*   **Role**: Entry point for patients.
*   **Logic**: Calls `createVisit(patientId)`. This creates a `Visit` record and an initial `QueueItem` with `stage: 'reception'`.
*   **Transition**: When clicking "Advance to Triage", it calls `advanceVisit(visitId, 'triage')`.
*   **Sub-Task**: It also calls `serveQueueItem(queueId)` to remove the patient from the Reception list.

### 2. `frontend/src/pages/queue/TriageStation.tsx`
*   **Role**: Patient assessment and vital recording.
*   **Logic**: Displays patients where `stage: 'triage'`.
*   **Interaction**: Has two ways to pick a patient:
    *   **Call Next**: Picks the highest priority/oldest patient.
    *   **Call This**: Picks a specific patient from the table.
*   **Issue**: Both methods are failing with "Queue item not found" because of a backend query return mismatch.

### 3. `backend/src/routes/queue.routes.ts`
*   **Role**: Manages the state transitions of queue items.
*   **Critical Fault**: The update queries for "calling" a patient are attempting to read raw results from a query that doesn't return them.
*   **Faulty Routes**: `POST /call-next` and `POST /:id/call`.

---

## 🚨 List of Identified Issues

### Issue 1: Missing `RETURNING` clause in SQL Updates (RESOLVED ✅)
*   **Fix**: Added `.returning('*')` to all QueryBuilder update calls.
*   **Result**: PostgreSQL now correctly returns the updated row data, enabling the "Call" functionality.

### Issue 2: Property vs Column Name Mismatch (RESOLVED ✅)
*   **Fix**: Standardized all backend routes (`visit`, `queue`, `triage`) to use `organizationId` (camelCase) instead of `organization_id`.
*   **Result**: API calls no longer fail due to missing hospital context.

### Issue 3: Triage Route Naming (RESOLVED ✅)
*   **Fix**: Corrected `organization_id` access in `triage.routes.ts`.
*   **Result**: Nurses can now successfully fetch and save patient vitals.

---

## 🛠️ Planned Fixes
1.  **Add `.returning('*')`**: Ensure all atomic updates in `queue.routes.ts` request the updated row back from the database.
2.  **Refactor Result Handling**: Use the ID from the update result to perform a clean `repo.findOne` to ensure the data is returned as a proper TypeScript Entity with correct camelCase properties.
3.  **Standardize Tenant Access**: Ensure `organizationId` is consistently checked across all status-change routes.
