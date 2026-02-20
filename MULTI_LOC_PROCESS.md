
# 🏛️ 3-Tier Multi-Location Process & Manual Steps

This document outlines the architecture, manual setup, and verification steps for the 3-Tier organization structure.

## 👥 1. The 3-Tier Hierarchy

| Tier | Role Name | Who is it? | Access Scope | Switcher? |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1** | **Platform Owner** | You (SaaS Provider) | **Management Only**. Sees all hospitals/billing. **No clinical data** (Protected patient privacy). | **NO** |
| **Tier 2** | **Hospital Group CEO** | The Business Owner | **Group Oversight**. Sees clinical data for **ALL** their branches (e.g., Chennai + Delhi). | **YES** |
| **Tier 3** | **Branch Admin** | Local Hospital Manager | **Branch Locked**. Sees clinical data **ONLY** for their specific branch. | **NO** |

---

## 🛠️ 2. Manual Setup Steps (Creating 2 Branches for 1 Group)

To create a new hospital group with two locations and a single Master CEO login, follow these API/Database steps:

### Phase A: Register the First Branch (Chennai)
1.  **Use Endpoint**: `POST /api/organizations`
2.  **Request Body**:
    ```json
    {
      "name": "Tamil Nadu Hospital - Chennai",
      "subdomain": "tn-chennai",
      "adminEmail": "ceo@tamilnadu.com",  // <--- The Group CEO Email
      "adminPassword": "Password@123",
      "adminFirstName": "Tamil",
      "adminLastName": "CEO"
    }
    ```

### Phase B: Register the Second Branch (Delhi)
1.  **Use Endpoint**: `POST /api/organizations`
2.  **Request Body**:
    ```json
    {
      "name": "Tamil Nadu Hospital - Delhi",
      "subdomain": "tn-delhi",
      "adminEmail": "ceo@tamilnadu.com",  // <--- USE THE EXACT SAME EMAIL
      "adminPassword": "Password@123",
      "adminFirstName": "Tamil",
      "adminLastName": "CEO"
    }
    ```
    *Note: The system identifies the duplicate email and automatically enables the Location Switcher for this user.*

### Phase C: create a Locked Branch Admin (Tier 3)
1.  Log in to the **Chennai Branch** dashboard.
2.  Navigate to **HR / Staff Management**.
3.  Click **"Add Staff Member"**.
4.  Choose **Role**: `Admin`.
5.  Use a **Unique Email** (e.g., `admin.chn@tamilnadu.demo`).
    *Note: Since this email only exists in one branch, they will be "Locked" and won't see the switcher.*

---

## 🔐 3. Verification Credentials (Current Demo)

| Tier | Account | Email | Password | Access Context |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1** | Platform Owner | `superadmin@hospital.com` | `SuperAdmin@2025` | Management Organization (System Level) |
| **Tier 2** | Hospital CEO | `ceo@tamilnadu.com` | `Password@123` | **Chennai + Delhi** (Switcher Enabled) |
| **Tier 3** | Chennai Admin | `admin.chn@tamilnadu.demo` | `Password@123` | Chennai Branch **Only** (Locked) |
| **Tier 3** | Delhi Admin | `admin.del@tamilnadu.demo` | `Password@123` | Delhi Branch **Only** (Locked) |

---

## ⚙️ 4. Technical Rule (How it works in Backend)
The `AuthController.getCurrentUser` logic now performs this check:
1.  Fetch all accounts matching the user's email across the database.
2.  If the user is an `admin` and has **more than 1 account**, unlock the `availableLocations` array.
3.  The frontend detects this array and renders the **Location Switcher** dropdown.
