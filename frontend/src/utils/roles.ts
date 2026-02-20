/**
 * Role Utility Functions
 * Standardized role checking across the application
 */

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  NURSE = 'nurse',
  PATIENT = 'patient',
  RECEPTIONIST = 'receptionist',
  PHARMACIST = 'pharmacist',
  LAB_TECHNICIAN = 'lab_technician',
  LAB_SUPERVISOR = 'lab_supervisor',
  ACCOUNTANT = 'accountant'
}

export enum Permission {
  VIEW_USER = 'view_user',
  CREATE_USER = 'create_user',
  UPDATE_USER = 'update_user',
  DELETE_USER = 'delete_user',
  VIEW_PATIENT = 'view_patient',
  CREATE_PATIENT = 'create_patient',
  UPDATE_PATIENT = 'update_patient',
  DELETE_PATIENT = 'delete_patient',
  VIEW_APPOINTMENT = 'view_appointment',
  CREATE_APPOINTMENT = 'create_appointment',
  UPDATE_APPOINTMENT = 'update_appointment',
  DELETE_APPOINTMENT = 'delete_appointment',
  VIEW_MEDICAL_RECORD = 'view_medical_record',
  CREATE_MEDICAL_RECORD = 'create_medical_record',
  UPDATE_MEDICAL_RECORD = 'update_medical_record',
  VIEW_BILL = 'view_bill',
  CREATE_BILL = 'create_bill',
  UPDATE_BILL = 'update_bill',
  VIEW_INVENTORY = 'view_inventory',
  MANAGE_INVENTORY = 'manage_inventory',
  MANAGE_SETTINGS = 'manage_settings',
  MANAGE_ROLES = 'manage_roles',
  VIEW_REPORTS = 'view_reports',
  GENERATE_REPORTS = 'generate_reports',
  VIEW_QUEUE = 'view_queue',
  MANAGE_QUEUE = 'manage_queue',
  VIEW_LAB = 'view_lab',
  MANAGE_LAB = 'manage_lab',
  VIEW_PHARMACY = 'view_pharmacy',
  MANAGE_PHARMACY = 'manage_pharmacy'
}

export const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission),
  [UserRole.ADMIN]: [
    Permission.VIEW_USER, Permission.CREATE_USER, Permission.UPDATE_USER, Permission.DELETE_USER,
    Permission.MANAGE_SETTINGS, Permission.MANAGE_ROLES, Permission.VIEW_PATIENT, Permission.CREATE_PATIENT, 
    Permission.UPDATE_PATIENT, Permission.VIEW_APPOINTMENT, Permission.CREATE_APPOINTMENT, Permission.UPDATE_APPOINTMENT,
    Permission.VIEW_MEDICAL_RECORD, Permission.VIEW_BILL, Permission.CREATE_BILL,
    Permission.VIEW_INVENTORY, Permission.VIEW_REPORTS, Permission.GENERATE_REPORTS,
    Permission.VIEW_QUEUE, Permission.MANAGE_QUEUE
  ],
  [UserRole.DOCTOR]: [
    Permission.VIEW_PATIENT, Permission.VIEW_APPOINTMENT, Permission.CREATE_APPOINTMENT, Permission.UPDATE_APPOINTMENT,
    Permission.VIEW_MEDICAL_RECORD, Permission.CREATE_MEDICAL_RECORD, Permission.UPDATE_MEDICAL_RECORD,
    Permission.VIEW_QUEUE
  ],
  [UserRole.NURSE]: [
    Permission.VIEW_PATIENT, Permission.VIEW_APPOINTMENT, Permission.VIEW_MEDICAL_RECORD, 
    Permission.UPDATE_MEDICAL_RECORD, Permission.VIEW_QUEUE, Permission.MANAGE_QUEUE
  ],
  [UserRole.PATIENT]: [
    Permission.VIEW_APPOINTMENT, Permission.CREATE_APPOINTMENT, Permission.VIEW_MEDICAL_RECORD, Permission.VIEW_BILL
  ],
  [UserRole.RECEPTIONIST]: [
    Permission.VIEW_PATIENT, Permission.CREATE_PATIENT, Permission.UPDATE_PATIENT,
    Permission.VIEW_APPOINTMENT, Permission.CREATE_APPOINTMENT, Permission.UPDATE_APPOINTMENT,
    Permission.VIEW_QUEUE, Permission.MANAGE_QUEUE
  ],
  [UserRole.PHARMACIST]: [
    Permission.VIEW_PATIENT, Permission.VIEW_MEDICAL_RECORD, Permission.VIEW_INVENTORY, 
    Permission.MANAGE_INVENTORY, Permission.VIEW_PHARMACY, Permission.MANAGE_PHARMACY
  ],
  [UserRole.LAB_TECHNICIAN]: [
    Permission.VIEW_PATIENT, Permission.VIEW_MEDICAL_RECORD, Permission.UPDATE_MEDICAL_RECORD, 
    Permission.VIEW_INVENTORY, Permission.VIEW_LAB, Permission.MANAGE_LAB
  ],
  [UserRole.LAB_SUPERVISOR]: [
    Permission.VIEW_PATIENT, Permission.VIEW_MEDICAL_RECORD, Permission.UPDATE_MEDICAL_RECORD, 
    Permission.VIEW_INVENTORY, Permission.VIEW_LAB, Permission.MANAGE_LAB, Permission.VIEW_REPORTS
  ],
  [UserRole.ACCOUNTANT]: [
    Permission.VIEW_BILL, Permission.CREATE_BILL, Permission.UPDATE_BILL, 
    Permission.VIEW_REPORTS, Permission.GENERATE_REPORTS
  ]
};

/**
 * Get normalized role string from user object
 */
export const getUserRole = (user: any): string => {
  return String(user?.role || '').toLowerCase();
};

/**
 * Check if user has a specific role or one of multiple roles
 */
export const hasRole = (user: any, roles: string | string[]): boolean => {
  const userRole = getUserRole(user);
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return allowedRoles.map(r => r.toLowerCase()).includes(userRole);
};

/**
 * Check if user is a super admin
 */
export const isSuperAdmin = (user: any): boolean => {
  return hasRole(user, UserRole.SUPER_ADMIN);
};

/**
 * Check if user is an admin (includes super_admin)
 */
export const isAdmin = (user: any): boolean => {
  return hasRole(user, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
};

/**
 * Check if user is a doctor
 */
export const isDoctor = (user: any): boolean => {
  return hasRole(user, UserRole.DOCTOR);
};

/**
 * Check if user is a nurse
 */
export const isNurse = (user: any): boolean => {
  return hasRole(user, UserRole.NURSE);
};

/**
 * Check if user is a receptionist
 */
export const isReceptionist = (user: any): boolean => {
  return hasRole(user, UserRole.RECEPTIONIST);
};

/**
 * Check if user is a pharmacist
 */
export const isPharmacist = (user: any): boolean => {
  return hasRole(user, UserRole.PHARMACIST);
};

/**
 * Check if user is a lab technician or supervisor
 */
export const isLabStaff = (user: any): boolean => {
  return hasRole(user, [UserRole.LAB_TECHNICIAN, UserRole.LAB_SUPERVISOR]);
};

/**
 * Check if user is an accountant
 */
export const isAccountant = (user: any): boolean => {
  return hasRole(user, UserRole.ACCOUNTANT);
};

/**
 * Check if user is a patient
 */
export const isPatient = (user: any): boolean => {
  return hasRole(user, UserRole.PATIENT);
};

/**
 * Check if user is clinical staff (doctor, nurse)
 */
export const isClinicalStaff = (user: any): boolean => {
  return hasRole(user, [UserRole.DOCTOR, UserRole.NURSE]);
};

/**
 * Check if user is front desk staff (receptionist, admin)
 */
export const isFrontDeskStaff = (user: any): boolean => {
  return hasRole(user, [UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.SUPER_ADMIN]);
};

/**
 * Check if user has a specific permission
 */
export const hasPermission = (user: any, permission: Permission): boolean => {
  const userRole = getUserRole(user) as UserRole;
  const permissions = rolePermissions[userRole] || [];
  return permissions.includes(permission);
};

/**
 * Check if user has all specified permissions
 */
export const hasAllPermissions = (user: any, permissions: Permission[]): boolean => {
  return permissions.every(p => hasPermission(user, p));
};

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyPermission = (user: any, permissions: Permission[]): boolean => {
  return permissions.some(p => hasPermission(user, p));
};

/**
 * Get user's permissions based on role
 */
export const getUserPermissions = (user: any): Permission[] => {
  const userRole = getUserRole(user) as UserRole;
  return rolePermissions[userRole] || [];
};

/**
 * Get display name for role
 */
export const getRoleDisplayName = (role: string): string => {
  const displayNames: Record<string, string> = {
    [UserRole.SUPER_ADMIN]: 'Platform Admin',
    [UserRole.ADMIN]: 'Administrator',
    [UserRole.DOCTOR]: 'Doctor',
    [UserRole.NURSE]: 'Nurse',
    [UserRole.PATIENT]: 'Patient',
    [UserRole.RECEPTIONIST]: 'Receptionist',
    [UserRole.PHARMACIST]: 'Pharmacist',
    [UserRole.LAB_TECHNICIAN]: 'Lab Technician',
    [UserRole.LAB_SUPERVISOR]: 'Lab Supervisor',
    [UserRole.ACCOUNTANT]: 'Accountant'
  };
  return displayNames[role.toLowerCase()] || role;
};

/**
 * Get role color for UI display
 */
export const getRoleColor = (role: string): string => {
  const colors: Record<string, string> = {
    [UserRole.SUPER_ADMIN]: '#722ED1',
    [UserRole.ADMIN]: '#1890FF',
    [UserRole.DOCTOR]: '#10B981',
    [UserRole.NURSE]: '#F59E0B',
    [UserRole.PATIENT]: '#6B7280',
    [UserRole.RECEPTIONIST]: '#3B82F6',
    [UserRole.PHARMACIST]: '#8B5CF6',
    [UserRole.LAB_TECHNICIAN]: '#EC4899',
    [UserRole.LAB_SUPERVISOR]: '#EC4899',
    [UserRole.ACCOUNTANT]: '#14B8A6'
  };
  return colors[role.toLowerCase()] || '#6B7280';
};

/**
 * Get default redirect path for role after login
 */
export const getDefaultRedirectPath = (role: string): string => {
  const paths: Record<string, string> = {
    [UserRole.SUPER_ADMIN]: '/',
    [UserRole.ADMIN]: '/',
    [UserRole.DOCTOR]: '/doctor/my-schedule',
    [UserRole.NURSE]: '/queue/triage',
    [UserRole.PATIENT]: '/portal',
    [UserRole.RECEPTIONIST]: '/queue/reception',
    [UserRole.PHARMACIST]: '/pharmacy',
    [UserRole.LAB_TECHNICIAN]: '/laboratory/dashboard',
    [UserRole.LAB_SUPERVISOR]: '/laboratory/dashboard',
    [UserRole.ACCOUNTANT]: '/billing/management'
  };
  return paths[role.toLowerCase()] || '/';
};
