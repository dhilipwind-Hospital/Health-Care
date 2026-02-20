# Impact Analysis & Risk Assessment: UI/UX Overhaul

## Executive Summary
**Verdict: NO BREAKING CHANGES EXPECTED.**
Implementing the "Lunaris Pink Premium Theme" as specified is a **Low-Risk, High-Value** update. Since the backend logic, API endpoints, and database models remain **100% untouched**, the core functionality of the application will remain stable.

The changes are strictly limited to the **Presentation Layer** (Frontend React Components & CSS).

---

## 1. Detailed Scenario Analysis

### Scenario A: Functionality & Logic Integrity
*   **Concern**: Will moving the "Patient Registration" form into a Modal break the data submission?
*   **Analysis**: No. The underlying JavaScript logic (`createVisit(values)`) remains exactly the same. We are simply changing *where* the user inputs the data (inside a floating box instead of an inline form). The data payload sent to the API is identical.
*   **Risk Level**: **Zero**.
*   **Mitigation**: Ensure the Modal correctly resets its form fields (`form.resetFields()`) after submission, just as the inline form did.

### Scenario B: Data Availability (The "Missing Data" Check)
*   **Concern**: The new designs show "Allergies" on the Doctor's Header and "Stock Progress Bars" in Pharmacy. Do we have this data?
*   **Analysis**:
    *   **Allergies**: Yes. The `Triage` model already captures `allergies`. We just need to ensure the Doctor's page fetches this existing data.
    *   **Stock Levels**: Yes. The `Medicine` model has `currentStock` and `reorderLevel`. The "Progress Bar" is just a visual calculation (`current / reorder * 100`) done on the frontend.
*   **Risk Level**: **Low**.
*   **Mitigation**: Verify that the `getTriage` API call is made when the Doctor loads a patient. (Currently, it might only be called in the Triage station).

### Scenario C: CSS & Visual Conflicts
*   **Concern**: Will the new "Pink Theme" CSS break existing Ant Design components (like DatePickers or Dropdowns)?
*   **Analysis**: Ant Design is robust. We are using **CSS Variables** (`--primary: #EB2F96`) to control colors. This is the standard, safe way to clear theme. We are *not* deleting core AntD styles, only overriding specific tokens.
*   **Risk Level**: **Low**.
*   **Mitigation**: We will use a dedicated `theme.css` or `App.css` file for the new variables to avoid polluting the global namespace unexpectedly.

### Scenario D: Responsiveness (Mobile/Tablet)
*   **Concern**: The new "Grid" layouts (3-column Doctor View) might look squished on smaller screens.
*   **Analysis**: The design uses Ant Design's `<Row>` and `<Col>` system.
    *   *Desktop*: 3 Columns.
    *   *Tablet*: 2 Columns (Sidebar moves to bottom or hamburger menu).
    *   *Mobile*: 1 Column (Stacked).
*   **Risk Level**: **Medium** (Requires careful CSS coding).
*   **Mitigation**: Use responsive breakpoints (e.g., `xs={24} md={12} lg={8}`) in the code.

---

## 2. Codebase Impact Area

| Module | Files to Touch | Nature of Change | Impact Score (1-10) |
| :--- | :--- | :--- | :--- |
| **Global Styles** | `index.css`, `App.tsx` | **Add** CSS Variables, **Update** Theme Config. | 2 (Safe) |
| **Reception** | `ReceptionQueue.tsx` | **Refactor** JSX layout to Grid; **Add** Modal. | 3 (Safe UI Refactor) |
| **Doctor** | `ConsultationForm.tsx`, `DoctorConsole.tsx` | **Add** Header Component, **Refactor** Fields to Tabs. | 4 (Moderate UI Refactor) |
| **Pharmacy** | `Dashboard.tsx` | **Update** Table Columns (Add Progress Bar). | 2 (Safe) |
| **Nurse** | `WardOverview.tsx` | **Update** Card Styles (Colors). | 2 (Safe) |
| **Backend** | *None* | **None**. | 0 (No Impact) |

---

## 3. Rollback Strategy (Safety Net)
In the unlikely event that a UI change causes a display issue:
1.  **Version Control**: Since we are using Git, we can revert any specific file (e.g., `git checkout origin/main -- src/pages/queue/ReceptionQueue.tsx`) instantly.
2.  **Component Isolation**: We can build the new UI as *new* components (e.g., `ReceptionQueueV2.tsx`) and simply swap the route import. This allows us to keep the old UI as a backup until the new one is verified.

## Conclusion
You are safe to proceed. The changes are purely cosmetic and structural organization of existing features. No business logic or backend data integrity is at risk.
