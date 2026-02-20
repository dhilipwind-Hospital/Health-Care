# Multi-Location Organization & Admin Access Strategy

## 1. UI Simplification (Immediate Action)
As requested, the **Organization Signup Form** will be simplified to focus on high-level location data:
- **Remove**: `Street Address`, `State/Province`, `Zip/Postal Code`.
- **Keep**: `Country`, `City`.
- **Enhancement**: Convert `City` from a text input to a **Dropdown** dependent on the selected `Country`.
  - *Example*: Select "India" → City Dropdown shows "Chennai", "Delhi", "Mumbai", "Bangalore", etc.

## 2. Multi-Location Admin Architecture
**Scenario**: User creates "Apollo Hospital" in **Chennai** and later adds "Apollo Hospital" in **Delhi**.
**Goal**: A single Admin managing both locations seamlessly.

### Proposed Solution: Organization Groups & Linked Access
 To achieve this without compromising security (preventing random users from claiming "Apollo"), we introduce a **Management Layer**:

#### A. The "First Location" is the Anchor
1.  **Creation**: You create "Apollo Hospital (Chennai)". You become the **Super Admin** of this organization.
2.  **Expansion**: Instead of using the public Signup Form for the second location, you log in to the **Chennai Dashboard** and click **"Add New Location"**.
3.  **Linking**:
    - The system creates a new Tenant ("Apollo Delhi").
    - The System automatically links your **Admin User ID** to this new tenant.
    - Your User profile now holds a list of `accessibleOrganizationIds = [Chennai_ID, Delhi_ID]`.

#### B. Admin Access Flow ("Who will be the admin?")
- **Single Identity**: You do NOT need multiple accounts. Your email (`admin@apollo.com`) is the key.
- **Login**: When you log in, the system checks: "Does this user belong to multiple organizations?"
    - **If Yes**: It loads the last accessed location or prompts you to select one.
    - **If No**: It loads the single location.

#### C. Dashboard "Location Switcher"
- A top-bar dropdown menu in the Dashboard will allow instant switching between **Chennai** and **Delhi**.
- Switching updates the current session context (`organizationId`) without requiring re-login.

### Database Implications
1.  **User Model**: Needs a relationship or JSON array to store linked organizations.
    - *Current*: `organizationId` (Single).
    - *New*: `organizationId` (Current Context) + `linkedOrganizations` (One-to-Many).
2.  **Organization Model**: (Already updated) Removed Unique Constraint on `name` to allow duplicate names.

## 3. Implementation Plan
1.  **Update UI**: Modify `OrganizationSignup.tsx` to remove address fields and implement the Country-City cascade.
2.  **Backend Logic**: Verify User entity can handle multi-tenancy access (future step).

---
*Ready to proceed with the UI Simplification (Step 1) immediately.*
