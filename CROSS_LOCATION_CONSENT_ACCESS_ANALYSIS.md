# 🏥 Cross-Location Patient Consent Access - Implementation Analysis

## Document Created: January 21, 2026
## ✅ Implementation Status: COMPLETED

---

### 🎉 Implementation Summary

| Component | Status | File |
|-----------|--------|------|
| **Backend Model** | ✅ Done | `backend/src/models/PatientAccessGrant.ts` |
| **Backend Controller** | ✅ Done | `backend/src/controllers/patient-access-grant.controller.ts` |
| **Backend Routes** | ✅ Done | `backend/src/routes/patient-access-grant.routes.ts` |
| **Cross-Org Middleware** | ✅ Done | `backend/src/middleware/cross-org-access.middleware.ts` |
| **Server Registration** | ✅ Done | `backend/src/server.ts` |
| **Doctor UI** | ✅ Done | `frontend/src/pages/doctor/CrossLocationAccess.tsx` |
| **Patient UI** | ✅ Done | `frontend/src/pages/portal/PatientAccessManagement.tsx` |
| **Email Approval Page** | ✅ Done | `frontend/src/pages/portal/AccessGrantApproval.tsx` |
| **Frontend Routes** | ✅ Done | `frontend/src/App.tsx` |

### Access Duration Options
- ⏰ **24 Hours** - For emergency consultations
- 📅 **3 Days** - For short-term follow-up
- 📆 **1 Week** - For extended care



## 📋 Executive Summary

This document analyzes the implementation of a **Cross-Location Consent-Based Patient Access** feature where:
1. A patient from Location A visits a doctor at Location B
2. The doctor searches for patient by ID
3. Patient receives email notification requesting access
4. Patient grants **temporary, time-limited access**
5. Doctor can view patient records during the granted period

---

## 🔐 Current Access Control Architecture

### Layer 1: Organization/Tenant Isolation (CRITICAL)
**File**: `backend/src/middleware/tenant.middleware.ts`

```
Request → tenantContext middleware → sets req.tenant based on:
   ├─ Priority 0: User's organizationId (HIGHEST)
   ├─ Priority 1: Subdomain extraction
   ├─ Priority 2: X-Tenant-Subdomain header
   └─ Priority 3: ?tenant= query parameter
```

**Key behavior**:
- User's `organizationId` from JWT token is **always used first**
- ALL data queries are scoped to `req.tenant.id`
- A doctor in Org A **CANNOT** see Org B patient data (hard block)

### Layer 2: Role-Based Access Control
**File**: `backend/src/middleware/access.middleware.ts`

```typescript
canDoctorAccessPatient(patientId, doctorId) → boolean
├─ Check 1: Doctor's departmentId === Patient's primaryDepartmentId ✅
├─ Check 2: Referral exists from patient to doctor's department ✅
└─ Check 3: Any appointment exists between doctor and patient ✅
```

**Where it's used**:
| File | Method | Purpose |
|------|--------|---------|
| `referral.controller.ts:59` | `doctorCreateReferral` | Verify before creating referral |
| `referral.controller.ts:83` | `doctorListReferrals` | Verify before listing referrals |
| `report.routes.ts:18,36,46` | Various report routes | Middleware enforcement |

### Layer 3: Patient Self-Access (Controller Level)
**File**: `backend/src/controllers/patient-history.controller.ts`

```typescript
if (user.role === 'patient' && user.id !== id) {
  return res.status(403).json({ message: 'Access denied' });
}
```

**Locations** (6 places):
- Line 27: `getHistorySummary`
- Line 118: `getHistoryTimeline`
- Line 264: `getVitals`
- Line 299: `getProcedures`
- Line 336: `getDocuments`
- Line 371: `getClinicalNotes`

---

## 🚨 Current Cross-Organization Limitations

### Why a Doctor in Org B Cannot Access Org A Patient Today

```
Doctor (Org B) calls: GET /api/patients/{patientId}/history/summary
   │
   ▼
[authenticate middleware]
   → Sets req.user = { id: doctorId, organizationId: OrgB_ID }
   │
   ▼
[tenantContext middleware]
   → Uses req.user.organizationId = OrgB_ID
   → Sets req.tenant = Org B
   │
   ▼
[PatientHistoryController.getHistorySummary]
   → Queries: WHERE organization.id = OrgB_ID AND patient.id = {patientId}
   → Patient from Org A has organizationId = OrgA_ID
   → RESULT: Empty data (Patient not found in Org B)
```

**BLOCK REASON**: Tenant isolation is working correctly - this is a FEATURE, not a bug.

---

## 🎯 Proposed Feature: Consent-Based Cross-Location Access

### New Components Needed

#### 1. Database Model: `PatientAccessGrant`
```typescript
@Entity('patient_access_grants')
export class PatientAccessGrant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  patient: User;                    // Patient granting access
  
  @Column()
  patientId: string;

  @ManyToOne(() => User)
  requestingDoctor: User;           // Doctor requesting access
  
  @Column()
  requestingDoctorId: string;

  @ManyToOne(() => Organization)
  patientOrganization: Organization; // Where patient's data lives
  
  @Column()
  patientOrganizationId: string;

  @ManyToOne(() => Organization)
  doctorOrganization: Organization;  // Where doctor works
  
  @Column()
  doctorOrganizationId: string;

  @Column({ type: 'enum', enum: ['pending', 'approved', 'rejected', 'expired', 'revoked'] })
  status: string;

  @Column({ nullable: true })
  accessToken: string;              // Unique secure token for approval link

  @Column({ type: 'timestamp', nullable: true })
  grantedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;                  // When access expires

  @Column({ type: 'int', default: 24 })
  accessDurationHours: number;      // How long access lasts after approval

  @Column({ nullable: true })
  reason: string;                   // Why doctor needs access

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### 2. New API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/access-requests` | POST | Doctor requests access to patient |
| `/api/access-requests/search-patient` | GET | Doctor searches patient by ID across orgs |
| `/api/access-requests/pending` | GET | Doctor sees their pending requests |
| `/api/access-requests/:id/approve/:token` | GET | Patient approves (via email link) |
| `/api/access-requests/:id/reject/:token` | GET | Patient rejects (via email link) |
| `/api/access-requests/:id/revoke` | POST | Patient revokes before expiry |
| `/api/access-requests/active` | GET | Patient sees who has active access |

#### 3. Modified Access Middleware

**Enhanced `canDoctorAccessPatient()`**:
```typescript
export async function canDoctorAccessPatient(
  patientId: string, 
  doctorId: string, 
  allowCrossOrg: boolean = false
): Promise<boolean> {
  
  // Existing checks (same organization)
  // ... (primary dept, referral, appointment)
  
  // NEW: Cross-organization consent check
  if (allowCrossOrg) {
    const grantRepo = AppDataSource.getRepository(PatientAccessGrant);
    const activeGrant = await grantRepo.findOne({
      where: {
        patientId,
        requestingDoctorId: doctorId,
        status: 'approved',
        expiresAt: MoreThan(new Date()) // Not expired
      }
    });
    
    if (activeGrant) return true;
  }
  
  return false;
}
```

---

## ⚠️ Impact Analysis: Will This Break Existing Implementation?

### ✅ SAFE Changes (No Breaking Impact)

| Component | Impact | Reason |
|-----------|--------|--------|
| New `PatientAccessGrant` model | ✅ None | New table, doesn't affect existing |
| New API routes for access requests | ✅ None | New endpoints, doesn't change existing |
| New email templates | ✅ None | Adding new templates |
| New frontend pages (Doctor search, Patient approval) | ✅ None | New UI components |

### ⚠️ CAREFUL Changes (Modification Required)

| Component | Current Behavior | New Behavior | Risk |
|-----------|-----------------|--------------|------|
| `canDoctorAccessPatient()` | Returns `false` if no match | Add optional cross-org check | **LOW** - Default behavior unchanged |
| `access.middleware.ts` | Same-org only | Add cross-org grant lookup | **LOW** - Only when explicitly enabled |

### 🔴 PROTECTED (Must NOT Change)

| Component | Protection |
|-----------|------------|
| `tenantContext` middleware | DO NOT modify - tenant isolation must remain |
| Patient role check in controllers | DO NOT modify - patients always see only own data |
| Organization scoping in all queries | DO NOT modify - data isolation is paramount |

---

## 🛡️ Security Considerations

### 1. Cross-Org Access Scope
The granted access should be **READ-ONLY** and limited to:
- ✅ View patient history summary
- ✅ View vitals
- ✅ View prescriptions
- ✅ View lab results
- ❌ NOT create prescriptions
- ❌ NOT create appointments
- ❌ NOT modify any records

### 2. Time-Limited Access
- Default: 24 hours
- Maximum: 72 hours (configurable)
- Auto-expire via database check
- Cron job to clean expired grants

### 3. Audit Trail
```typescript
// Log every cross-org access attempt
await auditLogRepo.save({
  action: 'CROSS_ORG_PATIENT_ACCESS',
  requestingDoctorId,
  requestingDoctorOrg,
  patientId,
  patientOrg,
  accessGrantId,
  timestamp: new Date(),
  success: true/false
});
```

### 4. Patient Control
- Patient must explicitly approve via email
- Patient can revoke at any time
- Patient can see all active access grants
- Patient receives notification when access expires

---

## 📊 Data Flow: Cross-Location Access

```
SCENARIO: Dr. Smith (Care Hospital - Mumbai) needs records of 
          Patient Raj (Care Hospital - Bangalore)

┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: DOCTOR SEARCHES FOR PATIENT                            │
└─────────────────────────────────────────────────────────────────┘
Dr. Smith enters Patient ID: "PID-BLR-ABC123"
   │
   ▼
[POST /api/access-requests/search-patient]
   │
   ├─ Query: SELECT * FROM users WHERE role='patient' 
   │         AND id LIKE '%ABC123%'
   │         (Search across ALL organizations - special permission)
   │
   └─ Returns: { 
        id: "abc123", 
        name: "Raj Kumar", 
        organization: "Care Hospital - Bangalore",
        maskedDetails: true  // Don't show full data yet
      }

┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: DOCTOR REQUESTS ACCESS                                  │
└─────────────────────────────────────────────────────────────────┘
Dr. Smith clicks "Request Access" with reason: "Emergency consultation"
   │
   ▼
[POST /api/access-requests]
{
  patientId: "abc123",
  reason: "Emergency consultation",
  requestedDuration: 24  // hours
}
   │
   ├─ Create PatientAccessGrant with status: 'pending'
   ├─ Generate secure accessToken (UUID)
   │
   ▼
[EMAIL SERVICE]
   → Send email to patient@email.com:
   "Dr. Smith from Care Hospital Mumbai is requesting access to 
    your medical records for 24 hours. Reason: Emergency consultation
    
    [APPROVE ACCESS] - https://app/access-requests/approve/{token}
    [DENY ACCESS] - https://app/access-requests/reject/{token}"

┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: PATIENT APPROVES                                        │
└─────────────────────────────────────────────────────────────────┘
Patient Raj clicks [APPROVE ACCESS] in email
   │
   ▼
[GET /api/access-requests/{id}/approve/{token}]
   │
   ├─ Validate token matches
   ├─ Update grant: status = 'approved'
   ├─ Set grantedAt = now()
   ├─ Set expiresAt = now() + 24 hours
   │
   ▼
[EMAIL SERVICE]
   → Notify Dr. Smith: "Access granted for 24 hours"
   → Notify Patient: "You granted access until {expiry date}"

┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: DOCTOR ACCESSES RECORDS                                 │
└─────────────────────────────────────────────────────────────────┘
Dr. Smith navigates to patient history
   │
   ▼
[GET /api/patients/{patientId}/history/summary]
   │
   ├─ [authenticate] → User: Dr. Smith, Org: Mumbai
   ├─ [tenantContext] → Tenant: Mumbai
   │
   ├─ [NEW: crossOrgAccessCheck middleware]
   │   ├─ Check: Does Dr. Smith have active grant for this patient?
   │   ├─ Find: PatientAccessGrant where doctorId=Smith AND patientId=abc123
   │   │         AND status='approved' AND expiresAt > now()
   │   ├─ YES → Temporarily set req.crossOrgPatientAccess = {
   │   │           grantId, patientOrgId, expiresAt
   │   │        }
   │   └─ Continue to controller
   │
   ▼
[PatientHistoryController.getHistorySummary]
   │
   ├─ Check: req.crossOrgPatientAccess exists?
   │   └─ YES → Use patientOrgId for queries instead of tenant.id
   │
   └─ Return: Patient history from Bangalore org

┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: ACCESS EXPIRES                                          │
└─────────────────────────────────────────────────────────────────┘
After 24 hours OR patient clicks "Revoke"
   │
   ├─ Cron job: UPDATE patient_access_grants 
   │            SET status='expired' 
   │            WHERE expiresAt < now() AND status='approved'
   │
   ├─ OR: [POST /api/access-requests/{id}/revoke]
   │      → Update status = 'revoked'
   │
   ▼
[ACCESS DENIED]
Dr. Smith tries to access again → 403 Forbidden
```

---

## 🔧 Implementation Steps (Ordered)

### Phase 1: Database Setup (No Code Impact)
1. [ ] Create `PatientAccessGrant` entity
2. [ ] Create migration for `patient_access_grants` table
3. [ ] Run migration

### Phase 2: Backend API (New Endpoints Only)
4. [ ] Create `access-request.controller.ts`
5. [ ] Create `access-request.routes.ts`
6. [ ] Register routes in `index.ts`
7. [ ] Add email templates for access request/approval

### Phase 3: Cross-Org Access Logic (Careful Modification)
8. [ ] Create `crossOrgAccessCheck` middleware (NEW file)
9. [ ] Add optional cross-org check to `canDoctorAccessPatient()` (backward compatible)
10. [ ] Create cron job for expiring grants

### Phase 4: Controller Updates (Minimal Changes)
11. [ ] Update `patient-history.controller.ts` to handle cross-org context
12. [ ] Ensure READ-ONLY access in cross-org mode

### Phase 5: Frontend UI
13. [ ] Create Doctor Patient Search component
14. [ ] Create Access Request modal
15. [ ] Create Patient Access Management page
16. [ ] Create email approval landing page

---

## ✅ Testing Checklist

### Existing Functionality (Must Still Work)
- [ ] Same-org patient access by doctor
- [ ] Same-org patient access by admin
- [ ] Patient can only see own records
- [ ] Referral-based access works
- [ ] Appointment-based access works
- [ ] Tenant isolation between orgs

### New Functionality
- [ ] Doctor can search patient across orgs
- [ ] Doctor can request access
- [ ] Patient receives email
- [ ] Patient can approve/reject via link
- [ ] Doctor gets access after approval
- [ ] Access automatically expires
- [ ] Patient can revoke access
- [ ] Audit logs created for cross-org access

---

## 📋 Summary: Breaking Changes Assessment

| Risk Level | Area | Change | Breaking? |
|------------|------|--------|-----------|
| 🟢 None | New model | `PatientAccessGrant` | No |
| 🟢 None | New routes | `/api/access-requests/*` | No |
| 🟢 None | New middleware | `crossOrgAccessCheck` | No |
| 🟢 None | New UI | Doctor search, Patient management | No |
| 🟡 Low | `canDoctorAccessPatient()` | Add optional parameter | No (backward compatible) |
| 🟡 Low | `patient-history.controller.ts` | Add cross-org context check | No (else-branch only) |
| 🔴 HIGH | `tenantContext` | MUST NOT CHANGE | N/A - Protected |

**CONCLUSION: Implementation is SAFE if we follow the outlined approach.**

---

## 📅 Document History

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-21 | System | Initial comprehensive analysis |

