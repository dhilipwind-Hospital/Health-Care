# 🩺 Triage to Doctor Flow Analysis

## 🚨 The Reported Issue
The user reports: "from nurse i have made this call this from the nurse profile but it is not getting reflecting in the doctor profile"

## 🔍 Investigation Process

### 1. **Frontend: `TriageStation.tsx`**
*   **Action**: Nurse clicks "Save & Send to Doctor".
*   **Code**:
    ```typescript
    await saveTriage(current.visitId, payload);
    await advanceVisit(current.visitId, 'doctor', vals?.doctorId); // <-- Critical Step
    await serveQueueItem(current.id);
    ```
*   **Result**: The code calls `advanceVisit` with `toStage: 'doctor'` and an optional `doctorId`.

### 2. **Backend: `visit.routes.ts` (The Advance Logic)**
*   **Route**: `POST /api/visits/:id/advance`
*   **Logic**:
    1.  Calculates `nextStatus`.
    2.  Check for `doctorId`.
    3.  **Crucial Check**:
        ```typescript
        if (String(toStage) === 'doctor' && doctorId) {
          const doc = await userRepo.createQueryBuilder('u')...
          if (doc) assignDoctorId = (doc as any).id;
        }
        ```
    4.  Creates a new `QueueItem` with `stage: 'doctor'` and `status: 'waiting'`.
    5.  **If a doctor was assigned**, it sets `assignedDoctorId`.

### 3. **Backend: `queue.routes.ts` (The Doctor's View)**
*   **Route**: `GET /api/queue`
*   **Filter Logic**:
    ```typescript
    if (stage === 'doctor' && doctorId) {
      qb.andWhere('(q.assignedDoctorId IS NULL OR q.assignedDoctorId = :doc)', { doc: doctorId });
    }
    ```
*   **The Mismatch Theory**:
    *   If the Nurse selects a *specific* doctor (e.g., Dr. Arun), the new queue item gets `assignedDoctorId = 'Dr-Arun-UUID'`.
    *   If Dr. Priya logs in, her query filters for `assignedDoctorId = 'Dr-Priya-UUID'` OR `NULL`. She will **NOT** see Dr. Arun's patient.
    *   **If the Nurse does NOT select a doctor**, `assignedDoctorId` is `NULL`. **ALL** doctors can see the patient.

---

## 🧪 Root Cause Hypothesis: "The Specific Assignment Trap"
The issue is likely that the Nurse is assigning the patient to **Doctor A** (e.g., in the dropdown), but the User is logging in as **Doctor B** (or checking the wrong profile).

**Scenario:**
1.  Nurse selects "Dr. Vikram" in the Triage form.
2.  Backend creates QueueItem with `assignedDoctorId = 'Vikram-ID'`.
3.  User logs in as "Dr. Sunita".
4.  Dr. Sunita's queue query: `WHERE assignedDoctorId IS NULL OR assignedDoctorId = 'Sunita-ID'`.
5.  **Result**: Dr. Sunita does **not** see the patient. This is *technically correct behavior* but appears as "not working" to the user testing the flow.

## 🛠️ Proposed Solution
We need to confirm if the user is assigning a doctor. If they are, they MUST log in as *that specific doctor*.

To make the system more robust for testing (where we might want any doctor to see patients), we can:
1.  **Strict Mode**: Keep it as is (feature, not bug).
2.  **Loose Mode**: Allow doctors to toggle "Show All Patients" (ignoring assignment).

**Action Plan**:
I will verify the `TriageStation` form logic. The `assignedDoctorId` logic in `visit.routes.ts` seems correct. The issue is purely a logical mismatch between "Who was assigned" and "Who is looking".

**Verification Step**:
*   Check if the keys match (`organizationId` validation passed).
*   The `queue.routes.ts` filter `(q.assignedDoctorId IS NULL OR q.assignedDoctorId = :doc)` is correct for a strict assignment system.

**Potential Bug in `visit.routes.ts`**:
Look at lines 181-189:
```typescript
if (String(toStage) === 'doctor' && doctorId) {
  // ... checks if doctor exists ...
}
```
If `doctorId` is passed as an *empty string* or `undefined` from the frontend, it skips assignment (which is good).
But if the frontend sends a doctor ID for a doctor who is *inactive* or *different org*, the previous logic silently failed to assign (which is also safe, falling back to NULL).

**Conclusion**: The code is logically sound. The "error" described is almost certainly:
**"Nurse assigned Patient to Doctor X, but User logged in as Doctor Y."**
