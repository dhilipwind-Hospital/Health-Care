# Multi-Location Testing Plan

## Objective
Verify the end-to-end functionality of the Multi-Location Architecture, ensuring a single Admin user can create and manage multiple organization tenants (Locations) using a single email identity.

## Test Scope
We will validate the following components:
1.  **Organization Creation (Location 1)**: creating the primary organization.
2.  **Organization Creation (Location 2)**: creating a second organization using the **Same Admin Email**. (Previously blocked).
3.  **Authentication & Context**: Verifying the Login response contains the correctly mapped `availableLocations`.
4.  **Data Isolation**: Ensuring users created in one location are distinct database entities (scoped by Organization).

## automated Testing Strategy
Since I am testing "on my own", I will create a backend integration script (`backend/src/scripts/verify-multiloc-flow.ts`) to simulate the User/Frontend actions via direct Controller/Service execution.

### Test Scenario: "The Apollo Expansion"
1.  **Step 1**: Create **"Apollo Chennai"**.
    -   *Input*: Name="Apollo Hospitals", Subdomain="apollo-chn-test", City="Chennai", Email="dr.arun@apollo.test".
    -   *Expected Result*: Success. Org ID generated. User ID generated.

2.  **Step 2**: Create **"Apollo Delhi"**.
    -   *Input*: Name="Apollo Hospitals", Subdomain="apollo-del-test", City="Delhi", Email="dr.arun@apollo.test" (**Same Email**).
    -   *Expected Result*: **Success**. (This validates the removal of the specific Email Uniqueness check in `OrganizationController`).

3.  **Step 3**: **Admin Login**.
    -   *Action*: Login with `dr.arun@apollo.test` / password.
    -   *Expected Result*:
        -   Auth Token returned.
        -   `availableLocations` array is present.
        -   Array contains TWO entries: "Apollo Chennai" and "Apollo Delhi".

4.  **Step 4**: **Context Validation**.
    -   *Action*: Verify that the User entities for Chennai and Delhi are separate rows (different IDs) but linked by the same Email.

## Manual UI Verification (To be performed if Browser is available)
1.  Go to Signup Page -> Create "Apollo Chennai".
2.  Go to Signup Page again -> Create "Apollo Delhi" with same email.
3.  Login -> Check Dashboard Header for "Switch Location" dropdown.
4.  Select "Apollo Delhi" -> Page should redirect/reload to Delhi context.

---
*I will proceed to execute the **Automated Testing Strategy** via the script.*
