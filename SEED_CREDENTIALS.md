# 🔐 Seed Data - User Credentials

This document lists all the user accounts created by the seed scripts for the Hospital Management System.

## Organization
**Name:** General Hospital  
**Subdomain:** general-hospital

---

## 👤 User Accounts

### Super Admin
| Field | Value |
|-------|-------|
| **Email** | `superadmin@hospital.com` |
| **Password** | `SuperAdmin@2025` |
| **Role** | `super_admin` |
| **Name** | Super Admin |

---

### Hospital Admin
| Field | Value |
|-------|-------|
| **Email** | `admin@hospital.com` |
| **Password** | `Admin@2025` |
| **Role** | `admin` |
| **Name** | Hospital Admin |

> Alternative: `admin@example.com` / `Admin@123`

---

### Doctor
| Field | Value |
|-------|-------|
| **Email** | `doctor@hospital.com` |
| **Password** | `password123` |
| **Role** | `doctor` |
| **Name** | Dr. Gregory House |

> Alternative: `doc@example.com` / `Doctor@123`

---

### Patient
| Field | Value |
|-------|-------|
| **Email** | `patient@example.com` |
| **Password** | `password123` |
| **Role** | `patient` |
| **Name** | John Doe |

> Additional Patients:
> - `raja.patient@example.com` / `Patient@123`
> - `arun.bharati@example.com` / `password123`
> - `priya.sharma@example.com` / `password123`
> - `ravi.kumar@example.com` / `password123`

---

### Nurse
| Field | Value |
|-------|-------|
| **Email** | `nurse@hospital.com` |
| **Password** | `Nurse@2025` |
| **Role** | `nurse` |
| **Name** | Ward Nurse |

---

### Receptionist
| Field | Value |
|-------|-------|
| **Email** | `reception@hospital.com` |
| **Password** | `Reception@2025` |
| **Role** | `receptionist` |
| **Name** | Front Desk |

---

### Lab Technician
| Field | Value |
|-------|-------|
| **Email** | `labtech@hospital.com` |
| **Password** | `LabTech@123` |
| **Role** | `lab_technician` |
| **Name** | Lab Technician |

---

### Pharmacist
| Field | Value |
|-------|-------|
| **Email** | `pharmacist@example.com` |
| **Password** | `Pharmacist@123` |
| **Role** | `pharmacist` |
| **Name** | Pharmacy Manager |

---

## 🔑 Quick Reference Table

| Role | Email | Password |
|------|-------|----------|
| **Super Admin** | superadmin@hospital.com | SuperAdmin@2025 |
| **Admin** | admin@hospital.com | Admin@2025 |
| **Doctor** | doctor@hospital.com | password123 |
| **Patient** | patient@example.com | password123 |
| **Nurse** | nurse@hospital.com | Nurse@2025 |
| **Receptionist** | reception@hospital.com | Reception@2025 |
| **Lab Tech** | labtech@hospital.com | LabTech@123 |
| **Pharmacist** | pharmacist@example.com | Pharmacist@123 |

---

## 📝 Notes

1. All passwords are hashed using bcrypt before storage
2. Environment variables can override default credentials:
   - `SEED_SUPER_ADMIN_EMAIL`, `SEED_SUPER_ADMIN_PASSWORD`
   - `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`
   - `SEED_DOCTOR_EMAIL`, `SEED_DOCTOR_PASSWORD`
   - `SEED_NURSE_EMAIL`, `SEED_NURSE_PASSWORD`
   - `SEED_RECEPTION_EMAIL`, `SEED_RECEPTION_PASSWORD`
   - `SEED_PHARMACIST_EMAIL`, `SEED_PHARMACIST_PASSWORD`

3. Run seed scripts in this order:
   ```bash
   npx ts-node src/scripts/seed-super-admin.ts
   npx ts-node src/scripts/seed_patient_test_data.ts
   npx ts-node src/scripts/seed-doctor.ts
   npx ts-node src/scripts/seed-nurse.ts
   npx ts-node src/scripts/seed-receptionist.ts
   npx ts-node src/scripts/seed-pharmacist.ts
   npx ts-node src/scripts/seed-labtech.ts
   ```

---

*Last Updated: January 20, 2026*
