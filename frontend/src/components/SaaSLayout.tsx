import React, { useEffect, useState } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Space, Typography, theme, Breadcrumb, Badge, Divider, Select, message } from 'antd';
import api from '../services/api';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  DashboardOutlined,
  TeamOutlined,
  CalendarOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  SettingOutlined,
  LogoutOutlined,
  ExperimentOutlined,
  HomeOutlined,
  BankOutlined,
  CrownOutlined,
  SafetyOutlined,
  BarChartOutlined,
  UsergroupAddOutlined,
  AuditOutlined,
  DollarOutlined,
  HeartOutlined,
  PhoneOutlined,
  AlertOutlined,
  GlobalOutlined,
  ApiOutlined,
  SecurityScanOutlined,
  DatabaseOutlined,
  VideoCameraOutlined,
  MessageOutlined,
  RocketOutlined,
  AppstoreOutlined,
  ShopOutlined,
  ExperimentFilled,
  UserSwitchOutlined,
  ScheduleOutlined,
  UserAddOutlined,
  EnvironmentOutlined,
  DownOutlined,
  LayoutOutlined,
  ToolOutlined,
  CoffeeOutlined
} from '@ant-design/icons';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import styled from 'styled-components';
import ThemeToggle from './ThemeToggle';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import NotificationBell from './NotificationBell';
import { generateBreadcrumbs } from '../utils/breadcrumbs';
import ChooseHospital from '../pages/onboarding/ChooseHospital';
import { useOrganizationData } from '../hooks/useOrganizationData';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

// Types for permissions (matching backend)
enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  NURSE = 'nurse',
  PATIENT = 'patient',
  RECEPTIONIST = 'receptionist',
  PHARMACIST = 'pharmacist',
  LAB_TECHNICIAN = 'lab_technician',
  ACCOUNTANT = 'accountant'
}

enum Permission {
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
  GENERATE_REPORTS = 'generate_reports'
}

const rolePermissions = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission),
  [UserRole.ADMIN]: [
    Permission.VIEW_USER, Permission.CREATE_USER, Permission.UPDATE_USER, Permission.DELETE_USER,
    Permission.MANAGE_SETTINGS, Permission.MANAGE_ROLES, Permission.VIEW_PATIENT, Permission.CREATE_PATIENT, Permission.UPDATE_PATIENT,
    Permission.VIEW_APPOINTMENT, Permission.CREATE_APPOINTMENT, Permission.UPDATE_APPOINTMENT,
    Permission.VIEW_MEDICAL_RECORD, Permission.VIEW_BILL, Permission.CREATE_BILL,
    Permission.VIEW_INVENTORY, Permission.VIEW_REPORTS, Permission.GENERATE_REPORTS
  ],
  [UserRole.DOCTOR]: [
    Permission.VIEW_PATIENT, Permission.VIEW_APPOINTMENT, Permission.CREATE_APPOINTMENT, Permission.UPDATE_APPOINTMENT,
    Permission.VIEW_MEDICAL_RECORD, Permission.CREATE_MEDICAL_RECORD, Permission.UPDATE_MEDICAL_RECORD
  ],
  [UserRole.NURSE]: [
    Permission.VIEW_PATIENT, Permission.VIEW_APPOINTMENT, Permission.VIEW_MEDICAL_RECORD, Permission.UPDATE_MEDICAL_RECORD
  ],
  [UserRole.PATIENT]: [
    Permission.VIEW_APPOINTMENT, Permission.CREATE_APPOINTMENT, Permission.VIEW_MEDICAL_RECORD, Permission.VIEW_BILL
  ],
  [UserRole.RECEPTIONIST]: [
    Permission.VIEW_PATIENT, Permission.CREATE_PATIENT, Permission.UPDATE_PATIENT,
    Permission.VIEW_APPOINTMENT, Permission.CREATE_APPOINTMENT, Permission.UPDATE_APPOINTMENT
  ],
  [UserRole.PHARMACIST]: [
    Permission.VIEW_PATIENT, Permission.VIEW_MEDICAL_RECORD, Permission.VIEW_INVENTORY, Permission.MANAGE_INVENTORY
  ],
  [UserRole.LAB_TECHNICIAN]: [
    Permission.VIEW_PATIENT, Permission.VIEW_MEDICAL_RECORD, Permission.UPDATE_MEDICAL_RECORD, Permission.VIEW_INVENTORY
  ],
  [UserRole.ACCOUNTANT]: [
    Permission.VIEW_BILL, Permission.CREATE_BILL, Permission.UPDATE_BILL, Permission.VIEW_REPORTS, Permission.GENERATE_REPORTS
  ]
};

const StyledLayout = styled(Layout)`
  min-height: 100vh;
`;

const StyledHeader = styled(Header)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(30, 58, 95, 0.08);
  z-index: 1;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  height: 64px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  color: #ffffff;
`;

const OrganizationInfo = styled.div`
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: transparent;
`;

const StyledContent = styled(Content)`
  margin: 24px 16px;
  padding: 24px;
  min-height: 280px;
  background: #fff;
  border-radius: 12px;
`;

const hasPermission = (role: string, permission: Permission): boolean => {
  const userRole = role as UserRole;
  return rolePermissions[userRole]?.includes(permission) || false;
};

const SaaSLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem('hms_sider_collapsed') === '1'; } catch { return false; }
  });
  const { settings } = useSettings();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const location = useLocation();
  const { stats: orgStats, loading: orgLoading } = useOrganizationData();

  // State for selected branch/location
  const [selectedBranch, setSelectedBranch] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('hms_selected_branch');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  useKeyboardShortcuts();

  useEffect(() => {
    try { localStorage.setItem('hms_sider_collapsed', collapsed ? '1' : '0'); } catch { }
  }, [collapsed]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  const role = String(user?.role || '').toLowerCase();
  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'admin' || isSuperAdmin;
  const isDoctor = role === 'doctor';
  const isPharmacist = role === 'pharmacist';
  const isLabTech = role === 'lab_technician';
  const isAccountant = role === 'accountant';
  const isNurse = role === 'nurse';
  const isReceptionist = role === 'receptionist';
  const isPatient = role === 'patient';

  // Option B (flagged): require org selection before showing tenant UI
  const requireOrgSelection = String(process.env.REACT_APP_REQUIRE_ORG_SELECTION || 'false').toLowerCase() === 'true';
  const hasOrganization = Boolean((user as any)?.organization?.id);
  if (requireOrgSelection && user && !hasOrganization) {
    return (
      <StyledLayout className="app-layout">
        <Layout>
          <StyledHeader>
            <Title level={4} style={{ margin: 0, color: '#10B981' }}>Select Hospital</Title>
          </StyledHeader>
          <StyledContent>
            <ChooseHospital />
          </StyledContent>
        </Layout>
      </StyledLayout>
    );
  }

  // SaaS Organization Info - Dynamic from user's organization
  const organizationInfo = {
    name: (user as any)?.organization?.name || 'Organization',
    plan: (user as any)?.organization?.subscription?.plan || 'Basic',
    users: (user as any)?.organization?.userCount || 0,
    maxUsers: (user as any)?.organization?.maxUsers || 100
  };

  // Role-based branding display: Admins/Super Admins can see branding.displayName override
  const orgObj: any = (user as any)?.organization || {};
  const brandingDisplayName: string | undefined = orgObj?.settings?.branding?.displayName;
  const rawName: string | undefined = orgObj?.name;
  const subdomain: string | undefined = orgObj?.subdomain;
  const titleCase = (s?: string) => (s || '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c: string) => c.toUpperCase());
  const subdomainFallback = titleCase(subdomain) || 'Organization';

  // Super Admin gets special branding
  let displayOrgName;
  if (isSuperAdmin) {
    displayOrgName = 'Ayphen Care';
  } else {
    displayOrgName = (isAdmin || isSuperAdmin)
      ? (brandingDisplayName || rawName || subdomainFallback)
      : (rawName || subdomainFallback);
    displayOrgName = titleCase(displayOrgName);
    if ((isAdmin || isSuperAdmin) && String(subdomain).toLowerCase() === 'ayphen' && (!brandingDisplayName || displayOrgName.toLowerCase() === 'care')) {
      displayOrgName = 'Ayphen Care';
    }
  }

  const displayPlan = organizationInfo.plan !== 'Basic' ? organizationInfo.plan : 'Basic';
  const displayUsers = organizationInfo.users > 0 ? organizationInfo.users : 0;
  const displayMaxUsers = organizationInfo.maxUsers > 0 ? organizationInfo.maxUsers : 100;

  // Define menu items based on permissions and organization data
  const getMenuItems = () => {
    const items = [];
    const isNewOrg = orgStats.isNewOrganization;

    // =================================================================
    // SUPER ADMIN MENU (Platform Owner Structure)
    // =================================================================
    if (isSuperAdmin) {
      // 1. Platform Core
      // Dashboard removed as per user request


      items.push({
        key: 'saas-management',
        icon: <CrownOutlined />,
        label: 'SaaS Management',
        children: [
          { key: 'organizations', label: 'Organizations', path: '/saas/organizations' },
          { key: 'subscriptions', label: 'Subscriptions', path: '/saas/subscriptions' },
          { key: 'audit-logs', label: 'Audit Logs', path: '/admin/logs' },

          { key: 'global-analytics', label: 'Global Analytics', path: '/saas/analytics' },
          { key: 'sales-leads', label: 'Sales Leads', path: '/admin/sales-leads' },
        ],
      });

      items.push({
        key: 'communication',
        icon: <MessageOutlined />,
        label: 'Communications',
        children: [
          { key: 'broadcast', label: 'Broadcast Alerts', path: '/communication/broadcast' }, // New Placeholder
          { key: 'messages', label: 'Messages', path: '/communication/messages' },
          { key: 'feedback', label: 'System Feedback', path: '/communication/feedback' },
        ],
      });

      // 2. Global Administration
      items.push({
        key: 'administration',
        icon: <SettingOutlined />,
        label: 'Global Admin',
        children: [
          { key: 'manage-users', label: 'User Directory', path: '/admin/users' },
          { key: 'roles-permissions', label: 'Roles & Permissions', path: '/admin/roles' },
          { key: 'locations-management', label: 'Locations & Branches', path: '/admin/locations' },
          { key: 'staff-management', label: 'Staff HR', path: '/admin/staff' },
          { key: 'manage-departments', label: 'Departments', path: '/admin/departments' },
          { key: 'settings', label: 'Global Settings', path: '/settings' },
        ],
      });

      // 3. Clinical Suite
      items.push({
        key: 'clinical-suite',
        icon: <HeartOutlined />,
        label: 'Clinical Suite',
        children: [
          { key: 'manage-doctors', label: 'Doctors', path: '/admin/doctors' },
          { key: 'all-appointments', label: 'Appointments', path: '/admin/appointments' },
          { key: 'patients', label: 'Patients', path: '/patients' },
          { key: 'telemedicine', label: 'Telemedicine', path: '/telemedicine' },
          { key: 'manage-services', label: 'Service Catalog', path: '/admin/services' },
        ],
      });

      // 4. Operations Suite
      items.push({
        key: 'operations-suite',
        icon: <LayoutOutlined />,
        label: 'Operations Suite',
        children: [
          { key: 'inpatient-management', label: 'Inpatient (IPD)', path: '/admin/inpatient/wards' },
          { key: 'ot-management', label: 'Operation Theatre', path: '/admin/ot' },
          { key: 'dialysis-mgmt', label: 'Dialysis', path: '/dialysis' },
          { key: 'ambulance', label: 'Ambulance & EMS', path: '/admin/ambulance-advanced' },
          { key: 'queue', label: 'Queue Management', path: '/queue/reception' },
        ],
      });

      // 5. Diagnostics Suite
      items.push({
        key: 'diagnostic-suite',
        icon: <ExperimentOutlined />,
        label: 'Diagnostics',
        children: [
          { key: 'laboratory', label: 'Laboratory', path: '/laboratory/dashboard' },
          { key: 'pharmacy', label: 'Pharmacy', path: '/pharmacy' },
          { key: 'radiology-mgmt', label: 'Radiology', path: '/radiology' },
          { key: 'blood-bank-mgmt', label: 'Blood Bank', path: '/blood-bank' },
        ],
      });

      // 6. Finance Suite
      items.push({
        key: 'finance-suite',
        icon: <DollarOutlined />,
        label: 'Finance',
        children: [
          { key: 'billing', label: 'Billing & Invoices', path: '/billing/management' },
          { key: 'billing-enhanced', label: 'Packages & Deposits', path: '/billing/enhanced' },
          { key: 'insurance', label: 'Insurance Claims', path: '/insurance/claims' },
          { key: 'reports', label: 'Financial Reports', path: '/admin/reports' },
        ],
      });

      // 7. Records & Certificates
      items.push({
        key: 'records-suite',
        icon: <FileTextOutlined />,
        label: 'Records & Certificates',
        children: [
          { key: 'death-certificates', label: 'Death Certificates', path: '/death-certificates' },
          { key: 'birth-registers', label: 'Birth Register', path: '/birth-registers' },
          { key: 'consent', label: 'Consent Management', path: '/consent' },
          { key: 'mlc', label: 'MLC (Medico-Legal)', path: '/mlc' },
          { key: 'biomedical-waste', label: 'Biomedical Waste', path: '/biomedical-waste' },
          { key: 'incident-reports', label: 'Incident Reports', path: '/incident-reports' },
          { key: 'infection-control', label: 'Infection Control', path: '/infection-control' },
        ],
      });

      // 8. Telemedicine
      items.push({
        key: 'telemedicine',
        icon: <VideoCameraOutlined />,
        label: 'Telemedicine',
        path: '/telemedicine',
      });

      // 9. HR Management
      items.push({
        key: 'hr-management',
        icon: <TeamOutlined />,
        label: 'HR Management',
        children: [
          { key: 'duty-roster', label: 'Duty Roster', path: '/duty-roster' },
        ],
      });

      // 10. Asset Management
      items.push({
        key: 'asset-management',
        icon: <ToolOutlined />,
        label: 'Asset Management',
        path: '/assets',
      });

      // 11. Diet Management
      items.push({
        key: 'diet-management',
        icon: <CoffeeOutlined />,
        label: 'Diet Management',
        path: '/diet',
      });

      // 12. Drug Register (Pharmacy Compliance)
      items.push({
        key: 'drug-register',
        icon: <MedicineBoxOutlined />,
        label: 'Drug Register',
        path: '/pharmacy/drug-register',
      });

      // 13. ABHA/ABDM Integration
      items.push({
        key: 'abha',
        icon: <SafetyOutlined />,
        label: 'ABHA / ABDM',
        path: '/abha',
      });

      // 14. PCPNDT Form F
      items.push({
        key: 'pcpndt',
        icon: <FileTextOutlined />,
        label: 'PCPNDT Form F',
        path: '/pcpndt',
      });

      // 15. Insurance/TPA
      items.push({
        key: 'insurance-tpa',
        icon: <BankOutlined />,
        label: 'Insurance / TPA',
        path: '/insurance-tpa',
      });

      // 16. Physiotherapy
      items.push({
        key: 'physiotherapy',
        icon: <MedicineBoxOutlined />,
        label: 'Physiotherapy',
        path: '/physiotherapy',
      });

      // 17. Medical Records Digitization
      items.push({
        key: 'medical-records-digitization',
        icon: <FileTextOutlined />,
        label: 'Records Digitization',
        path: '/medical-records-digitization',
      });

      return items;
    }

    // =================================================================
    // PHARMACIST MENU (Per Screenshot Design)
    // =================================================================
    if (isPharmacist && !isAdmin) {
      items.push({
        key: 'pharmacy-dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
        path: '/pharmacy',
      });
      items.push({
        key: 'prescriptions',
        icon: <FileTextOutlined />,
        label: 'Prescriptions',
        path: '/pharmacy/prescriptions',
      });
      items.push({
        key: 'inventory',
        icon: <MedicineBoxOutlined />,
        label: 'Inventory',
        path: '/pharmacy/inventory',
      });
      items.push({
        key: 'stock-alerts',
        icon: <AlertOutlined />,
        label: 'Stock Alerts',
        path: '/pharmacy/inventory/alerts',
      });
      items.push({
        key: 'suppliers',
        icon: <TeamOutlined />,
        label: 'Suppliers',
        path: '/pharmacy/suppliers',
      });
      items.push({
        key: 'drug-register',
        icon: <SafetyOutlined />,
        label: 'Drug Register',
        path: '/pharmacy/drug-register',
      });
      items.push({
        key: 'settings',
        icon: <SettingOutlined />,
        label: 'Settings',
        path: '/settings',
      });
      return items;
    }

    // =================================================================
    // RECEPTIONIST MENU (Per Screenshot - Main Menu)
    // =================================================================
    if (isReceptionist && !isAdmin) {
      items.push({
        key: 'queue-dashboard',
        icon: <DashboardOutlined />,
        label: 'Queue Dashboard',
        path: '/queue/reception',
      });
      items.push({
        key: 'patient-registration',
        icon: <UserAddOutlined />,
        label: 'Patient Registration',
        path: '/patients/new',
      });
      items.push({
        key: 'appointments',
        icon: <CalendarOutlined />,
        label: 'Appointments',
        path: '/appointments',
      });
      items.push({
        key: 'billing',
        icon: <DollarOutlined />,
        label: 'Billing',
        path: '/billing/management',
      });
      items.push({
        key: 'settings',
        icon: <SettingOutlined />,
        label: 'Settings',
        path: '/settings',
      });
      return items;
    }

    // =================================================================
    // NURSE STATION MENU (Per Screenshot)
    // =================================================================
    if (isNurse && !isAdmin) {
      items.push({
        key: 'triage',
        icon: <AlertOutlined />,
        label: 'Triage',
        path: '/queue/triage',
      });
      items.push({
        key: 'vitals-recording',
        icon: <HeartOutlined />,
        label: 'Vitals Recording',
        path: '/inpatient/nursing',
      });
      items.push({
        key: 'ward-management',
        icon: <HomeOutlined />,
        label: 'Ward Management',
        path: '/inpatient/wards',
      });
      items.push({
        key: 'medication-admin',
        icon: <MedicineBoxOutlined />,
        label: 'Medication Admin',
        path: '/pharmacy/medicines',
      });
      items.push({
        key: 'settings',
        icon: <SettingOutlined />,
        label: 'Settings',
        path: '/settings',
      });
      return items;
    }

    // =================================================================
    // DOCTOR MENU (Per Screenshot)
    // =================================================================
    if (isDoctor && !isAdmin) {
      items.push({
        key: 'my-dashboard',
        icon: <DashboardOutlined />,
        label: 'My Dashboard',
        path: '/',
      });
      items.push({
        key: 'patient-queue',
        icon: <TeamOutlined />,
        label: 'Patient Queue',
        path: '/queue/doctor',
      });
      items.push({
        key: 'consultation',
        icon: <FileTextOutlined />,
        label: 'Consultation',
        path: '/doctor/consultation',
      });
      items.push({
        key: 'prescriptions',
        icon: <MedicineBoxOutlined />,
        label: 'Prescriptions',
        path: '/doctor/prescriptions',
      });
      items.push({
        key: 'lab-orders',
        icon: <ExperimentOutlined />,
        label: 'Lab Orders',
        path: '/laboratory/order',
      });
      items.push({
        key: 'settings',
        icon: <SettingOutlined />,
        label: 'Settings',
        path: '/settings',
      });
      return items;
    }

    // =================================================================
    // STANDARD USER MENU (Original Logic for non-SuperAdmin)
    // =================================================================

    // For established organizations or non-admin users, show full menu
    // Dashboard - show for doctors, nurses, and other staff
    if (isAdmin || isDoctor || isNurse || isReceptionist || isPharmacist || isLabTech || isAccountant) {
      items.push({
        key: 'dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
        path: '/',
      });
    }

    // Patient Management - Exclude Lab Technicians and Pharmacists (they only need specific access)
    if (hasPermission(role, Permission.VIEW_PATIENT) && !isLabTech && !isPharmacist) {
      items.push({
        key: 'patients',
        icon: <UserOutlined />,
        label: 'Patients',
        path: '/patients',
      });
    }

    // Appointments
    if (hasPermission(role, Permission.VIEW_APPOINTMENT)) {
      const appointmentChildren = [];

      // Only show Book Appointment in sidebar for non-patient roles (patients have button on page)
      if (hasPermission(role, Permission.CREATE_APPOINTMENT) && !isPatient) {
        appointmentChildren.push({
          key: 'book-appointment',
          label: 'Book Appointment',
          path: '/appointments/new',
        });
      }

      appointmentChildren.push({
        key: 'appointments-list',
        label: 'View Appointments',
        path: '/appointments',
      });

      if (isAdmin) {
        appointmentChildren.push({
          key: 'all-appointments',
          label: 'All Appointments',
          path: '/admin/appointments',
        });
      }

      // For patients, show Appointments as a single item (no submenu)
      if (isPatient) {
        items.push({
          key: 'appointments',
          icon: <CalendarOutlined />,
          label: 'Appointments',
          path: '/appointments',
        });
      } else {
        items.push({
          key: 'appointments',
          icon: <CalendarOutlined />,
          label: 'Appointments',
          children: appointmentChildren,
        });
      }
    }

    // Medical Records - Exclude Lab Technicians and Pharmacists (they access records through their workflow)
    if (hasPermission(role, Permission.VIEW_MEDICAL_RECORD) && !isLabTech && !isPharmacist) {
      items.push({
        key: 'medical-records',
        icon: <FileTextOutlined />,
        label: 'Medical Records',
        path: '/records',
      });
    }

    // Queue & Visit Operations
    {
      const queueChildren = [] as any[];
      if (isAdmin || isSuperAdmin || isReceptionist) {
        queueChildren.push({ key: 'queue-reception', label: 'Reception Queue', path: '/queue/reception' });
      }
      if (isAdmin || isSuperAdmin || isNurse) {
        queueChildren.push({ key: 'queue-triage', label: 'Triage Station', path: '/queue/triage' });
      }
      if (isDoctor) {
        queueChildren.push({ key: 'queue-doctor', label: 'Doctor Console', path: '/queue/doctor' });
      }
      if (queueChildren.length > 0) {
        items.push({ key: 'queue', icon: <AlertOutlined />, label: 'Queue', children: queueChildren });
      }
    }

    // Laboratory - Cleaned up for specific roles
    if (isLabTech) {
      // Lab technicians get focused lab menu
      items.push({
        key: 'laboratory',
        icon: <ExperimentOutlined />,
        label: 'Laboratory',
        children: [
          { key: 'lab-dashboard', label: 'Lab Dashboard', path: '/laboratory/dashboard' },
          { key: 'lab-sample-collection', label: 'Sample Collection', path: '/laboratory/sample-collection' },
          { key: 'lab-results-entry', label: 'Results Entry', path: '/laboratory/results-entry' },
          { key: 'lab-results', label: 'View Results', path: '/laboratory/results' }
        ],
      });
    } else if (isDoctor) {
      // Doctors get lab ordering capabilities
      items.push({
        key: 'laboratory',
        icon: <ExperimentOutlined />,
        label: 'Laboratory',
        children: [
          { key: 'lab-order', label: 'Order Lab Tests', path: '/laboratory/order' },
          { key: 'lab-results', label: 'View Results', path: '/laboratory/results' }
        ],
      });
    } else if (isAdmin) {
      // Admin gets full lab management
      items.push({
        key: 'laboratory',
        icon: <ExperimentOutlined />,
        label: 'Laboratory',
        children: [
          { key: 'lab-dashboard', label: 'Lab Dashboard', path: '/laboratory/dashboard' },
          { key: 'lab-test-catalog', label: 'Test Catalog', path: '/laboratory/tests' },
          { key: 'lab-sample-collection', label: 'Sample Collection', path: '/laboratory/sample-collection' },
          { key: 'lab-results-entry', label: 'Results Entry', path: '/laboratory/results-entry' },
          { key: 'lab-results', label: 'View Results', path: '/laboratory/results' }
        ],
      });
    }

    // Pharmacy - Cleaned up for specific roles
    if (isPharmacist) {
      // Pharmacists get focused pharmacy menu
      items.push({
        key: 'pharmacy',
        icon: <MedicineBoxOutlined />,
        label: 'Pharmacy',
        children: [
          { key: 'pharmacy-dashboard', label: 'Pharmacy Dashboard', path: '/pharmacy' },
          { key: 'pharmacy-medicines', label: 'Medicines', path: '/pharmacy/medicines' },
          { key: 'pharmacy-inventory', label: 'Inventory', path: '/pharmacy/inventory' },
          { key: 'pharmacy-suppliers', label: 'Suppliers', path: '/pharmacy/suppliers' },
          { key: 'pharmacy-orders', label: 'Purchase Orders', path: '/pharmacy/purchase-orders' },
          { key: 'pharmacy-drug-register', label: 'Drug Register (H/H1/NDPS)', path: '/pharmacy/drug-register' }
        ],
      });
    } else if (isAdmin) {
      // Admin gets full pharmacy management
      items.push({
        key: 'pharmacy',
        icon: <MedicineBoxOutlined />,
        label: 'Pharmacy',
        children: [
          { key: 'pharmacy-dashboard', label: 'Pharmacy Dashboard', path: '/pharmacy' },
          { key: 'pharmacy-medicines', label: 'Medicines', path: '/pharmacy/medicines' },
          { key: 'pharmacy-inventory', label: 'Inventory', path: '/pharmacy/inventory' },
          { key: 'pharmacy-suppliers', label: 'Suppliers', path: '/pharmacy/suppliers' },
          { key: 'pharmacy-orders', label: 'Purchase Orders', path: '/pharmacy/purchase-orders' },
          { key: 'pharmacy-drug-register', label: 'Drug Register (H/H1/NDPS)', path: '/pharmacy/drug-register' }
        ],
      });
    }

    // Inpatient Management - Remove for Lab Technicians
    if ((isAdmin || isDoctor || isNurse) && !isLabTech) {
      const inpatientChildren = [];

      if (isAdmin || isNurse || isDoctor) {
        inpatientChildren.push(
          {
            key: 'inpatient-wards',
            label: 'Ward Overview',
            path: '/inpatient/wards',
          },
          {
            key: 'inpatient-beds',
            label: 'Bed Management',
            path: '/inpatient/beds',
          }
        );
      }

      if (isAdmin || isDoctor || isNurse) {
        inpatientChildren.push(
          {
            key: 'inpatient-admissions',
            label: 'Patient Admissions',
            path: '/inpatient/admissions/new',
          },
          {
            key: 'inpatient-rounds',
            label: 'Doctor Rounds',
            path: '/inpatient/rounds',
          }
        );
      }

      if (isNurse) {
        inpatientChildren.push({
          key: 'inpatient-nursing',
          label: 'Nursing Care',
          path: '/inpatient/nursing',
        });
      }

      if (isAdmin) {
        inpatientChildren.push(
          {
            key: 'inpatient-ward-management',
            label: 'Ward Management',
            path: '/admin/inpatient/wards',
          },
          {
            key: 'inpatient-room-management',
            label: 'Room Management',
            path: '/admin/inpatient/rooms',
          }
        );
      }

      if (inpatientChildren.length > 0) {
        items.push({
          key: 'inpatient-management',
          icon: <HomeOutlined />,
          label: 'Inpatient Management',
          children: inpatientChildren,
        });
      }
    }

    // Cross-Location Access - Doctors Only (not Lab Techs)
    if (isDoctor && !isLabTech) {
      items.push({
        key: 'cross-location',
        icon: <GlobalOutlined />,
        label: 'Cross-Location Access',
        path: '/doctor/cross-location-access',
      });
    }

    // Dialysis - Doctors, Nurses, Admin
    if ((isAdmin || isDoctor || isNurse) && !isLabTech && !isPharmacist) {
      items.push({
        key: 'dialysis-mgmt',
        icon: <MedicineBoxOutlined />,
        label: 'Dialysis',
        path: '/dialysis',
      });
    }

    // Radiology - Doctors, Admin, Lab Tech
    if (isAdmin || isDoctor || isLabTech) {
      items.push({
        key: 'radiology-mgmt',
        icon: <ExperimentOutlined />,
        label: 'Radiology',
        path: '/radiology',
      });
    }

    // Blood Bank - Doctors, Nurses, Admin, Lab Tech
    if (isAdmin || isDoctor || isNurse || isLabTech) {
      items.push({
        key: 'blood-bank-mgmt',
        icon: <ExperimentOutlined />,
        label: 'Blood Bank',
        path: '/blood-bank',
      });
    }

    // Records & Certificates - Admin, Doctor, Nurse
    if (isAdmin || isDoctor || isNurse) {
      items.push({
        key: 'records-certificates',
        icon: <FileTextOutlined />,
        label: 'Records & Certificates',
        children: [
          { key: 'death-certificates', label: 'Death Certificates', path: '/death-certificates' },
          { key: 'birth-registers', label: 'Birth Register', path: '/birth-registers' },
          { key: 'consent', label: 'Consent Management', path: '/consent' },
          { key: 'mlc', label: 'MLC (Medico-Legal)', path: '/mlc' },
          { key: 'biomedical-waste', label: 'Biomedical Waste', path: '/biomedical-waste' },
          { key: 'incident-reports', label: 'Incident Reports', path: '/incident-reports' },
          { key: 'infection-control', label: 'Infection Control', path: '/infection-control' },
        ],
      });
    }

    // Telemedicine - for doctors and patients
    if (isDoctor || isPatient || isAdmin) {
      items.push({
        key: 'telemedicine',
        icon: <VideoCameraOutlined />,
        label: 'Telemedicine',
        path: '/telemedicine',
      });
    }

    // HR Management - for admin only
    if (isAdmin) {
      items.push({
        key: 'hr-management',
        icon: <TeamOutlined />,
        label: 'HR Management',
        children: [
          { key: 'duty-roster', label: 'Duty Roster', path: '/duty-roster' },
        ],
      });

      items.push({
        key: 'asset-management',
        icon: <ToolOutlined />,
        label: 'Asset Management',
        path: '/assets',
      });
    }

    // Diet Management - for doctors and nurses
    if (isDoctor || isNurse || isAdmin) {
      items.push({
        key: 'diet-management',
        icon: <CoffeeOutlined />,
        label: 'Diet Management',
        path: '/diet',
      });
    }

    // ABHA/ABDM - for admin and receptionist
    if (isAdmin || isReceptionist) {
      items.push({
        key: 'abha',
        icon: <SafetyOutlined />,
        label: 'ABHA / ABDM',
        path: '/abha',
      });
    }

    // PCPNDT Form F - for doctors
    if (isDoctor || isAdmin) {
      items.push({
        key: 'pcpndt',
        icon: <FileTextOutlined />,
        label: 'PCPNDT Form F',
        path: '/pcpndt',
      });
    }

    // Insurance/TPA - for admin and accountant
    if (isAdmin || isAccountant) {
      items.push({
        key: 'insurance-tpa',
        icon: <BankOutlined />,
        label: 'Insurance / TPA',
        path: '/insurance-tpa',
      });
    }

    // Physiotherapy - for doctors and nurses
    if (isDoctor || isNurse || isAdmin) {
      items.push({
        key: 'physiotherapy',
        icon: <MedicineBoxOutlined />,
        label: 'Physiotherapy',
        path: '/physiotherapy',
      });
    }

    // Medical Records Digitization - for admin and receptionist
    if (isAdmin || isReceptionist) {
      items.push({
        key: 'medical-records-digitization',
        icon: <FileTextOutlined />,
        label: 'Records Digitization',
        path: '/medical-records-digitization',
      });
    }

    // Billing & Finance - Remove for Lab Technicians
    if ((hasPermission(role, Permission.VIEW_BILL) || isAccountant || isAdmin) && !isLabTech) {
      const billingChildren = [];

      // For patients, show patient-friendly billing page
      if (isPatient) {
        billingChildren.push({
          key: 'billing-management',
          label: 'Billing Management',
          path: '/portal/bills',
        });
      } else {
        billingChildren.push({
          key: 'billing-management',
          label: 'Billing Management',
          path: '/billing/management',
        });
      }

      if (isAdmin || isAccountant) {
        billingChildren.push(
          {
            key: 'billing-enhanced',
            label: 'Packages & Deposits',
            path: '/billing/enhanced',
          },
          {
            key: 'revenue-analytics',
            label: 'Revenue Analytics',
            path: '/billing/analytics',
          },
          {
            key: 'payment-processing',
            label: 'Payment Processing',
            path: '/billing/payments',
          }
        );
      }

      items.push({
        key: 'billing',
        icon: <DollarOutlined />,
        label: 'Billing & Finance',
        children: billingChildren,
      });
    }

    // Reports & Analytics - Remove for Lab Technicians
    if (hasPermission(role, Permission.VIEW_REPORTS) && !isLabTech) {
      items.push({
        key: 'reports',
        icon: <BarChartOutlined />,
        label: 'Reports & Analytics',
        path: '/reports',
      });
    }

    // Admin Section
    if (isAdmin) {
      const adminChildren: any[] = [
        {
          key: 'schedule-session',
          label: 'Schedule Session',
          path: '/admin/schedule-session',
        },
        {
          key: 'ot-management',
          label: 'OT Management',
          path: '/admin/ot',
        },
        {
          key: 'ambulance-advanced',
          label: 'Ambulance Management',
          path: '/admin/ambulance-advanced',
        },
        {
          key: 'manual-dispatch',
          label: 'Manual Dispatch',
          path: '/admin/manual-dispatch',
        },
        {
          key: 'manage-users',
          label: 'Manage Users',
          path: '/admin/users',
        },
      ];

      // Add Roles & Permissions and Locations
      if (hasPermission(role, Permission.MANAGE_ROLES) || isSuperAdmin) {
        adminChildren.push({
          key: 'roles-permissions',
          label: 'Roles & Permissions',
          path: '/admin/roles',
        });
      }

      adminChildren.push({
        key: 'locations-management',
        label: 'Locations',
        path: '/admin/locations',
      });

      adminChildren.push(
        {
          key: 'staff-management',
          label: 'Staff Management',
          path: '/admin/staff',
        },
        {
          key: 'manage-doctors',
          label: 'Manage Doctors',
          path: '/admin/doctors',
        },
        {
          key: 'manage-departments',
          label: 'Departments',
          path: '/admin/departments',
        },
        {
          key: 'manage-services',
          label: 'Services',
          path: '/admin/services',
        },
        {
          key: 'pharmacy-admin-section',
          label: 'Pharmacy',
          children: [
            {
              key: 'pharmacy-dashboard-admin',
              label: 'Dashboard',
              path: '/pharmacy',
            },
            {
              key: 'pharmacy-medicines-admin',
              label: 'Medicines',
              path: '/pharmacy/medicines',
            },
            {
              key: 'pharmacy-inventory-admin',
              label: 'Inventory',
              path: '/pharmacy/inventory',
            },
            {
              key: 'pharmacy-suppliers-admin',
              label: 'Suppliers',
              path: '/pharmacy/suppliers',
            },
            {
              key: 'pharmacy-orders-admin',
              label: 'Purchase Orders',
              path: '/pharmacy/purchase-orders',
            },
          ],
        },
        {
          key: 'laboratory-management',
          label: 'Laboratory',
          path: '/laboratory/dashboard',
        },
        {
          key: 'prescriptions-admin',
          label: 'Prescriptions',
          path: '/admin/prescriptions',
        },
        {
          key: 'lab-orders-admin',
          label: 'Lab Orders',
          path: '/admin/lab-orders',
        },
        {
          key: 'schedule-appointment-admin',
          label: 'Schedule Appointment',
          path: '/appointments/new',
        },
        {
          key: 'emergency-requests',
          label: 'Emergency Requests',
          path: '/admin/emergency-requests',
        },
        {
          key: 'callback-requests',
          label: 'Callback Requests',
          path: '/admin/callback-requests',
        }
      );

      items.push({
        key: 'administration',
        icon: <TeamOutlined />,
        label: 'Administration',
        children: adminChildren,
      });
    }

    // Communication - Role-filtered menu items
    const communicationChildren: any[] = [];

    // Messages - available to all authenticated users
    communicationChildren.push({ key: 'messages', label: 'Messages', path: '/communication/messages' });

    // Reminders - available to all authenticated users
    communicationChildren.push({ key: 'reminders', label: 'Reminders', path: '/communication/reminders' });

    // Appointment Reminders - only for admin, super_admin, receptionist (backend only allows these roles)
    if (isAdmin || isSuperAdmin || isReceptionist) {
      communicationChildren.push({ key: 'appointment-reminders', label: 'Appointment Reminders', path: '/communication/appointment-reminders' });
    }

    // Health Articles - available to all authenticated users
    communicationChildren.push({ key: 'health-articles', label: 'Health Articles', path: '/communication/health-articles' });

    // Feedback - available to all authenticated users
    communicationChildren.push({ key: 'feedback', label: 'Feedback', path: '/communication/feedback' });

    items.push({
      key: 'communication',
      icon: <MessageOutlined />,
      label: 'Communication',
      children: communicationChildren,
    });

    // Super Admin - SaaS Management
    if (isSuperAdmin) {
      const saasChildren = [
        {
          key: 'organizations',
          label: 'Organizations',
          path: '/saas/organizations',
        },
        {
          key: 'subscriptions',
          label: 'Subscriptions',
          path: '/saas/subscriptions',
        },
        {
          key: 'audit-logs',
          label: 'Audit Logs',
          path: '/admin/logs', // New Audit Log Feature
        },
        {
          key: 'system-health',
          label: 'System Health',
          path: '/saas/system-health',
        },
        {
          key: 'global-analytics',
          label: 'Global Analytics',
          path: '/saas/analytics',
        },
        {
          key: 'api-management',
          label: 'API Management',
          path: '/saas/api',
        },
      ];

      items.push({
        key: 'saas-management',
        icon: <CrownOutlined />,
        label: 'SaaS Management',
        children: saasChildren,
      });
    }

    // Patient Portal
    if (isPatient) {
      items.push({
        key: 'portal',
        icon: <HeartOutlined />,
        label: 'My Portal',
        path: '/portal',
      });
    }

    // Settings - Everyone gets this
    items.push({
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      path: '/settings',
    });

    return items;
  };

  const menuItems = getMenuItems();

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: <Link to="/profile">Profile</Link> },
      { key: 'organization', icon: <BankOutlined />, label: <Link to="/organization">Organization</Link> },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', onClick: logout },
    ]
  };

  // Determine active key from current pathname
  const getActiveKey = () => {
    const p = location.pathname;
    if (p === '/' || p === '') return 'dashboard';
    if (p.startsWith('/patients')) return 'patients';
    if (p.startsWith('/appointments/new')) return 'book-appointment';
    if (p.startsWith('/appointments')) return 'appointments-list';
    if (p.startsWith('/admin/appointments')) return 'all-appointments';
    if (p.startsWith('/queue')) {
      if (p.includes('/reception')) return 'queue-reception';
      if (p.includes('/triage')) return 'queue-triage';
      if (p.includes('/doctor')) return 'queue-doctor';
      return 'queue';
    }
    if (p.startsWith('/records')) return 'medical-records';
    if (p.startsWith('/laboratory')) {
      if (p.includes('/order')) return 'lab-order';
      if (p.includes('/results')) return 'lab-results';
      if (p.includes('/dashboard')) return 'lab-dashboard';
      if (p.includes('/sample-collection')) return 'lab-sample-collection';
      if (p.includes('/results-entry')) return 'lab-results-entry';
      if (p.includes('/tests')) return 'lab-test-catalog';
      return 'laboratory';
    }
    if (p.startsWith('/pharmacy')) {
      if (p.includes('/medicines')) return 'pharmacy-medicines';
      if (p.includes('/inventory')) return 'pharmacy-inventory';
      if (p.includes('/suppliers')) return 'pharmacy-suppliers';
      if (p.includes('/purchase-orders')) return 'pharmacy-orders';
      return 'pharmacy-dashboard';
    }
    if (p.startsWith('/inpatient')) {
      if (p.includes('/wards')) return 'inpatient-wards';
      if (p.includes('/beds')) return 'inpatient-beds';
      if (p.includes('/admissions')) return 'inpatient-admissions';
      if (p.includes('/rounds')) return 'inpatient-rounds';
      if (p.includes('/nursing')) return 'inpatient-nursing';
      return 'inpatient-management';
    }
    if (p.startsWith('/admin/inpatient')) {
      if (p.includes('/wards')) return 'inpatient-ward-management';
      if (p.includes('/rooms')) return 'inpatient-room-management';
      return 'inpatient-management';
    }
    if (p.startsWith('/telemedicine')) return 'telemedicine';
    if (p.startsWith('/billing')) {
      if (p.includes('/enhanced')) return 'billing-enhanced';
      if (p.includes('/management')) return 'billing-management';
      if (p.includes('/analytics')) return 'revenue-analytics';
      if (p.includes('/payments')) return 'payment-processing';
      return 'billing';
    }
    if (p.startsWith('/death-certificates')) return 'death-certificates';
    if (p.startsWith('/birth-registers')) return 'birth-registers';
    if (p.startsWith('/blood-bank')) return 'blood-bank-mgmt';
    if (p.startsWith('/dialysis')) return 'dialysis-mgmt';
    if (p.startsWith('/radiology')) return 'radiology-mgmt';
    if (p.startsWith('/reports')) return 'reports';
    if (p.startsWith('/admin')) {
      if (p.includes('/schedule-session')) return 'schedule-session';
      if (p.includes('/users')) return 'manage-users';
      if (p.includes('/roles-permissions')) return 'roles-permissions';
      if (p.includes('/staff')) return 'staff-management';
      if (p.includes('/doctors')) return 'manage-doctors';
      if (p.includes('/departments')) return 'manage-departments';
      if (p.includes('/services')) return 'manage-services';
      if (p.includes('/prescriptions')) return 'admin-prescriptions';
      if (p.includes('/lab-orders')) return 'admin-lab-orders';
      if (p.includes('/emergency-requests')) return 'emergency-requests';
      if (p.includes('/callback-requests')) return 'callback-requests';
      return 'administration';
    }
    if (p.startsWith('/saas')) {
      if (p.includes('/organizations')) return 'organizations';
      if (p.includes('/subscriptions')) return 'subscriptions';
      if (p.includes('/system-health')) return 'system-health';
      if (p.includes('/analytics')) return 'global-analytics';
      if (p.includes('/api')) return 'api-management';
      return 'saas-management';
    }
    if (p.startsWith('/portal')) return 'portal';
    if (p.startsWith('/settings')) return 'settings';
    return undefined;
  };

  const activeKey = getActiveKey();

  return (
    <StyledLayout className="app-layout">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={280}
        theme="light"
        breakpoint="lg"
        collapsedWidth={60}
        onBreakpoint={(broken) => { if (broken) setCollapsed(true); }}
      >
        <style>{`
          .ant-layout-sider {
            background: #1E3A5F !important;
            border-right: none;
          }
          .ant-menu {
            background: transparent !important;
            border-inline-end: none !important;
          }
          /* Menu Item Default State */
          .ant-menu-light .ant-menu-item,
          .ant-menu-dark .ant-menu-item {
            margin: 4px 12px !important;
            border-radius: 8px !important;
            width: calc(100% - 24px) !important;
            transition: all 0.3s ease;
            color: rgba(255, 255, 255, 0.7) !important;
          }
          /* Submenu Title Default State */
          .ant-menu-light .ant-menu-submenu-title,
          .ant-menu-dark .ant-menu-submenu-title {
            margin: 4px 12px !important;
            border-radius: 8px !important;
            width: calc(100% - 24px) !important;
            color: rgba(255, 255, 255, 0.7) !important;
          }
          
          /* Active/Selected State - Blue highlight */
          .ant-menu-light .ant-menu-item-selected,
          .ant-menu-dark .ant-menu-item-selected {
            background: #3B82F6 !important;
            color: #fff !important;
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3) !important;
            font-weight: 500;
          }
          
          /* Force icon and text to white when selected */
          .ant-menu-light .ant-menu-item-selected .ant-menu-item-icon,
          .ant-menu-light .ant-menu-item-selected a,
          .ant-menu-light .ant-menu-item-selected span,
          .ant-menu-dark .ant-menu-item-selected .ant-menu-item-icon,
          .ant-menu-dark .ant-menu-item-selected a,
          .ant-menu-dark .ant-menu-item-selected span { 
            color: #fff !important; 
          }

          /* Hover State */
          .ant-menu-light .ant-menu-item:hover:not(.ant-menu-item-selected),
          .ant-menu-dark .ant-menu-item:hover:not(.ant-menu-item-selected) {
            color: #fff !important;
            background: rgba(255, 255, 255, 0.1) !important;
            transform: translateX(4px);
          }
          
          .ant-menu-light .ant-menu-submenu-title:hover,
          .ant-menu-dark .ant-menu-submenu-title:hover {
            color: #fff !important;
            background: rgba(255, 255, 255, 0.1) !important;
          }
          
          .ant-menu-sub {
            background: rgba(0, 0, 0, 0.2) !important;
          }
          
          /* Submenu arrow color */
          .ant-menu-submenu-arrow::before,
          .ant-menu-submenu-arrow::after {
            background: rgba(255, 255, 255, 0.7) !important;
          }
          
          /* Menu icons */
          .ant-menu-item .anticon,
          .ant-menu-submenu-title .anticon {
            color: rgba(255, 255, 255, 0.7) !important;
          }
          
          .ant-menu-item-selected .anticon {
            color: #fff !important;
          }
        `}</style>

        {/* Sidebar Header with Hamburger */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '16px 8px' : '16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {!collapsed && (
            <Title
              level={4}
              style={{ margin: 0, color: '#ffffff', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {displayOrgName}
            </Title>
          )}
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.8)',
              width: 32,
              height: 32,
            }}
          />
        </div>

        {!collapsed && (
          <OrganizationInfo>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>{displayUsers}/{displayMaxUsers} users</span>
              {(isSuperAdmin || isAdmin) && (
                <Badge
                  count={displayPlan}
                  style={{ backgroundColor: '#10B981', fontSize: '10px' }}
                />
              )}
            </div>
            <div style={{ fontSize: '12px', color: '#3B82F6', fontWeight: 500 }}>
              {role === 'super_admin' ? 'PLATFORM ADMIN' : role.toUpperCase()}
            </div>
          </OrganizationInfo>
        )}

        <Menu
          theme="light"
          mode="inline"
          selectedKeys={activeKey ? [activeKey] : []}
          onClick={(info) => {
            // Find item in menuItems or in children (including nested children)
            let targetItem: any = menuItems.find(mi => mi.key === info.key);
            if (!targetItem) {
              // Check in children
              for (const item of menuItems) {
                if ((item as any).children) {
                  targetItem = (item as any).children.find((child: any) => child.key === info.key);
                  if (targetItem) break;
                  // Check in nested children
                  for (const child of (item as any).children) {
                    if ((child as any).children) {
                      targetItem = (child as any).children.find((grandchild: any) => grandchild.key === info.key);
                      if (targetItem) break;
                    }
                  }
                  if (targetItem) break;
                }
              }
            }
            if (targetItem && targetItem.path) navigate(targetItem.path);
          }}
          items={menuItems.map(item => ({
            key: item.key,
            icon: item.icon,
            label: <span title={item.label}>{item.label}</span>,
            children: (item as any).children?.map((child: any) => ({
              key: child.key,
              label: <span title={child.label}>{child.label}</span>,
              children: (child as any).children?.map((grandchild: any) => ({
                key: grandchild.key,
                label: <span title={grandchild.label}>{grandchild.label}</span>,
              })),
            })),
          }))}
        />
      </Sider>

      <Layout>
        <StyledHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Breadcrumb placeholder - actual breadcrumb below */}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {((user as any)?.availableLocations?.length > 0 || (user as any)?.availableBranches?.length > 0) && (
              <Dropdown
                trigger={['click']}
                placement="bottomRight"
                menu={{
                  items: [
                    {
                      key: 'all',
                      label: (
                        <div style={{ display: 'flex', alignItems: 'center', padding: '4px 0' }}>
                          <div style={{ width: 36, height: 36, background: '#e6f7ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                            <GlobalOutlined style={{ fontSize: 18, color: '#1890ff' }} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>All Locations</div>
                            <div style={{ fontSize: 12, color: '#888' }}>View overall statistics</div>
                          </div>
                        </div>
                      ),
                      onClick: () => {
                        // Clear active location filter
                        console.log("Switching to All Locations");
                        setSelectedBranch(null);
                        try {
                          localStorage.removeItem('hms_selected_branch');
                        } catch { }
                        message.info('Switched to All Locations');
                      }
                    },
                    { type: 'divider' },
                    {
                      key: 'branches',
                      type: 'group',
                      label: <span style={{ fontSize: 10, letterSpacing: 1, color: '#999' }}>LOCATIONS</span>,
                      children: (
                        (user as any)?.availableBranches?.length > 0
                          ? (user as any).availableBranches
                          : ((user as any)?.availableLocations?.length > 0 ? (user as any).availableLocations : [])
                      ).map((loc: any) => ({
                        key: loc.id,
                        label: (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: 260 }}>
                            <div>
                              <div style={{ fontWeight: 500, color: loc.id === (user as any)?.currentBranchId ? '#10B981' : 'inherit' }}>{loc.name}</div>
                              <div style={{ fontSize: 11, color: '#888' }}>
                                {loc.organizationName ? `${loc.organizationName} · ` : ''}{loc.code || loc.city || loc.subdomain}
                              </div>
                            </div>
                            {loc.id === (user as any)?.currentBranchId && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />}
                          </div>
                        ),
                        icon: <Badge status="processing" color={loc.id === (user as any)?.currentBranchId ? '#10B981' : '#ddd'} />,
                        onClick: async () => {
                          if ((user as any)?.availableBranches?.length > 0) {
                            // Handle Branch Switch within Organization
                            console.log("Switching to Branch:", loc.name);
                            setSelectedBranch(loc);
                            try {
                              localStorage.setItem('hms_selected_branch', JSON.stringify(loc));
                            } catch { }
                            message.info(`Switched to ${loc.name}`);
                            // TODO: Implement actual data filtering via API or State
                          } else {
                            // Legacy: Handle Org Switch
                            try {
                              const res = await api.post('/auth/switch-org', { targetOrganizationId: loc.id });
                              const newToken = res.data.accessToken;
                              const targetUrl = `http://${loc.subdomain}.localhost:3000/dashboard?token=${newToken}`;
                              window.location.href = targetUrl;
                            } catch (error) {
                              console.error('Switch location failed:', error);
                              message.error('Failed to switch location');
                            }
                          }
                        }
                      }))
                    }
                  ]
                }}
              >
                <Button style={{ height: 40, borderRadius: 8, border: '1px solid #e5e7eb', padding: '0 12px', background: '#fff' }}>
                  <Space size={8}>
                    <EnvironmentOutlined style={{ color: '#3B82F6', fontSize: 16 }} />
                    <span style={{ fontWeight: 500, color: '#333' }}>{selectedBranch?.name || (user as any)?.organization?.name || 'All Locations'}</span>
                    <DownOutlined style={{ fontSize: 10, color: '#9CA3AF' }} />
                  </Space>
                </Button>
              </Dropdown>
            )}
            {/* Header Icons - Clean outlined style */}
            <NotificationBell />
            <Button
              type="text"
              icon={<SettingOutlined style={{ color: '#3B82F6' }} />}
              onClick={() => navigate('/settings')}
            />
            <Dropdown menu={userMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar src={(user as any)?.profileImage} icon={<UserOutlined />} />
                <span>{user?.firstName} {user?.lastName}</span>
              </Space>
            </Dropdown>
          </div>
        </StyledHeader>

        <div style={{ padding: '0 24px' }}>
          <Breadcrumb
            items={generateBreadcrumbs(location.pathname).map(item => ({
              title: item.path ? (
                <span 
                  style={{ cursor: 'pointer', color: '#3B82F6' }} 
                  onClick={() => item.path && navigate(item.path)}
                >
                  {item.title}
                </span>
              ) : item.title
            }))}
          />
        </div>

        <StyledContent>
          {children || <Outlet />}
        </StyledContent>
      </Layout>
    </StyledLayout>
  );
};

export default SaaSLayout;
