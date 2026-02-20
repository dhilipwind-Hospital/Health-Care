# Super Admin Sidebar Audit & Fix Plan

## 1. Sidebar Feature Audit (Live Status)
Current state of `SaaSLayout.tsx` (Source of Truth) vs "Production Standard".

| Feature | Menu Item | Route | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **SaaS Management** | `SaaS Management` | `/saas/*` | ✅ **FIXED** | Now includes Audit Logs, Tenants, Subscriptions, System Health. |
| **Audit Logs** | `Audit Logs` | `/admin/logs` | ✅ **FIXED** | Added to SaaS Management section. |
| **Locations** | `Locations` | `/admin/locations` | ✅ **FIXED** | Added to Administration section. |
| **Roles** | `Roles & Permissions` | `/admin/roles` | ✅ **FIXED** | Added to Administration section (visible to Super Admin). |
| **Billing** | `Billing Management` | `/billing/management` | ✅ **FIXED** | Redirects to management tool instead of dashboard. |
| **OT Manage** | `OT Management` | `/admin/ot` | ✅ **FIXED** | Available in Admin section. |
| **Ambulance** | `Ambulance` | `/admin/ambulance-advanced` | ✅ **FIXED** | Available in Admin section. |
| **Services** | `Services` | `/admin/services` | ✅ **FIXED** | Available. |
| **Doctors** | `Doctors` | `/admin/doctors` | ✅ **FIXED** | Available. |
| **Audit Logs** | `Audit Logs` | `/admin/logs` | ✅ **FIXED** | Added under SaaS Management. |

---

## 2. Completed Fixes (Jan 23)
The following critical gaps were identified and closed in `SaaSLayout.tsx`:
1.  **SaaS Visibility:** The "SaaS Management" block was exposed for Super Admins.
2.  **Audit Trail:** The `Audit Logs` link was injected.
3.  **Multi-Location:** `Locations` & `Roles` were added to the Admin section.
4.  **Billing Navigation:** Fixed the broken `/billing` link to point to `/billing/management`.

---

## 3. Requirement Analysis: "What is Required vs Optional?"

A production-grade "Super Admin" implies COMPLETE control. Here is the breakdown:

### 🚨 **REQUIRED (Must Work Perfectly)**
These are "God Mode" features. If they break, the platform is unmanageable.
1.  **Tenant Management:** Creating/Suspending Hospitals (`/saas/organizations`).
2.  **User Access Control:** Resetting passwords, Assigning Roles (`/admin/users`, `/admin/roles`).
3.  **Audit Logs:** Tracking "Who deleted the patient record?" (`/admin/logs`).
4.  **Global Search:** Finding any record instantly (Header Bar).
5.  **Financial Oversight:** Seeing total platform revenue (`/saas/analytics`).

### ⚠️ **IMPORTANT (Operational)**
These are needed for day-to-day hospital operations but might be managed by local Admins.
1.  **Location Settings:** Configuring branches (`/admin/locations`).
2.  **Service Catalog:** Price list for treatments (`/admin/services`).
3.  **Staff Database:** HR Management (`/admin/staff`).

### ⚪ **OPTIONAL / "Nice to Have"**
Features that enhance experience but aren't blockers for launch.
1.  **System Health Dashboard:** CPU/Memory stats (Good for DevOps, less for Business/SuperAdmin).
2.  **API Management:** Managing API keys for 3rd party integrations (Future Phase).
3.  **Broadcast Messaging:** Sending system-wide alerts to all doctors.

---

## 4. Next Steps
- **Verify:** Click through each new link in the sidebar to ensure no 404s.
- **Deep Dive:** Test the *functionality* of the "Locations" page next.

