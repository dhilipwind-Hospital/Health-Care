/**
 * Breadcrumb Utility Functions
 * Dynamic breadcrumb generation based on route paths
 */

export interface BreadcrumbItem {
  title: string;
  path?: string;
  icon?: React.ReactNode;
}

export interface BreadcrumbConfig {
  title: string;
  parent?: string;
  icon?: string;
}

// Breadcrumb configuration for all routes
export const breadcrumbConfig: Record<string, BreadcrumbConfig> = {
  // Dashboard
  '/': { title: 'Dashboard' },
  '/dashboard': { title: 'Dashboard' },
  
  // Patients
  '/patients': { title: 'Patients' },
  '/patients/register': { title: 'Register Patient', parent: '/patients' },
  '/patients/new': { title: 'New Patient', parent: '/patients' },
  
  // Appointments
  '/appointments': { title: 'Appointments' },
  '/appointments/new': { title: 'Book Appointment', parent: '/appointments' },
  '/appointments/list': { title: 'All Appointments', parent: '/appointments' },
  
  // Queue Management
  '/queue': { title: 'Queue Management' },
  '/queue/reception': { title: 'Reception Queue', parent: '/queue' },
  '/queue/triage': { title: 'Triage Queue', parent: '/queue' },
  '/queue/doctor': { title: 'Doctor Queue', parent: '/queue' },
  '/queue/billing': { title: 'Billing Queue', parent: '/queue' },
  '/queue/tv': { title: 'TV Display', parent: '/queue' },
  
  // Doctor
  '/doctor': { title: 'Doctor' },
  '/doctor/dashboard': { title: 'Dashboard', parent: '/doctor' },
  '/doctor/my-schedule': { title: 'My Schedule', parent: '/doctor' },
  '/doctor/consultation': { title: 'Consultation', parent: '/doctor' },
  
  // Laboratory
  '/laboratory': { title: 'Laboratory' },
  '/laboratory/dashboard': { title: 'Dashboard', parent: '/laboratory' },
  '/laboratory/orders': { title: 'Lab Orders', parent: '/laboratory' },
  '/laboratory/results': { title: 'Results', parent: '/laboratory' },
  '/laboratory/sample-collection': { title: 'Sample Collection', parent: '/laboratory' },
  '/laboratory/results-entry': { title: 'Results Entry', parent: '/laboratory' },
  '/laboratory/tests': { title: 'Test Catalog', parent: '/laboratory' },
  
  // Pharmacy
  '/pharmacy': { title: 'Pharmacy' },
  '/pharmacy/dashboard': { title: 'Dashboard', parent: '/pharmacy' },
  '/pharmacy/medicines': { title: 'Medicines', parent: '/pharmacy' },
  '/pharmacy/inventory': { title: 'Inventory', parent: '/pharmacy' },
  '/pharmacy/prescriptions': { title: 'Prescriptions', parent: '/pharmacy' },
  '/pharmacy/dispense': { title: 'Dispense', parent: '/pharmacy' },
  '/pharmacy/pos': { title: 'Point of Sale', parent: '/pharmacy' },
  
  // Billing
  '/billing': { title: 'Billing & Finance' },
  '/billing/management': { title: 'Management', parent: '/billing' },
  '/billing/queue': { title: 'Billing Queue', parent: '/billing' },
  '/billing/payments': { title: 'Payments', parent: '/billing' },
  '/billing/analytics': { title: 'Analytics', parent: '/billing' },
  '/billing/enhanced': { title: 'Enhanced Billing', parent: '/billing' },
  
  // Inpatient
  '/inpatient': { title: 'Inpatient' },
  '/inpatient/wards': { title: 'Wards', parent: '/inpatient' },
  '/inpatient/beds': { title: 'Beds', parent: '/inpatient' },
  '/inpatient/admissions': { title: 'Admissions', parent: '/inpatient' },
  
  // Reports
  '/reports': { title: 'Reports & Analytics' },
  '/admin/reports': { title: 'Admin Reports', parent: '/reports' },
  
  // Administration
  '/admin': { title: 'Administration' },
  '/admin/users': { title: 'User Management', parent: '/admin' },
  '/admin/roles': { title: 'Roles & Permissions', parent: '/admin' },
  '/admin/locations': { title: 'Locations', parent: '/admin' },
  '/admin/settings': { title: 'Settings', parent: '/admin' },
  '/admin/audit': { title: 'Audit Logs', parent: '/admin' },
  '/admin/appointments': { title: 'All Appointments', parent: '/admin' },
  
  // SaaS Management
  '/saas': { title: 'SaaS Management' },
  '/saas/organizations': { title: 'Organizations', parent: '/saas' },
  '/saas/subscriptions': { title: 'Subscriptions', parent: '/saas' },
  '/saas/system-health': { title: 'System Health', parent: '/saas' },
  '/saas/analytics': { title: 'Analytics', parent: '/saas' },
  '/saas/api': { title: 'API Management', parent: '/saas' },
  
  // Patient Portal
  '/portal': { title: 'Patient Portal' },
  '/portal/appointments': { title: 'My Appointments', parent: '/portal' },
  '/portal/records': { title: 'Medical Records', parent: '/portal' },
  '/portal/bills': { title: 'Bills', parent: '/portal' },
  '/portal/insurance': { title: 'Insurance', parent: '/portal' },
  
  // Settings
  '/settings': { title: 'Settings' },
  '/profile': { title: 'Profile' },
  '/organization': { title: 'Organization' },
  
  // Other Modules
  '/telemedicine': { title: 'Telemedicine' },
  '/death-certificates': { title: 'Death Certificates' },
  '/birth-registers': { title: 'Birth Registers' },
  '/blood-bank': { title: 'Blood Bank' },
  '/dialysis': { title: 'Dialysis' },
  '/radiology': { title: 'Radiology' },
  '/consent': { title: 'Consent Management' },
  '/mlc': { title: 'MLC Management' },
};

/**
 * Generate breadcrumb items for a given path
 */
export const generateBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const items: BreadcrumbItem[] = [];
  
  // Normalize pathname
  let currentPath = pathname.replace(/\/$/, '') || '/';
  
  // Handle dynamic routes (e.g., /patients/:id)
  const pathParts = currentPath.split('/').filter(Boolean);
  let matchedPath = currentPath;
  
  // Try exact match first
  if (!breadcrumbConfig[matchedPath]) {
    // Try pattern matching for dynamic routes
    for (const configPath of Object.keys(breadcrumbConfig)) {
      const configParts = configPath.split('/').filter(Boolean);
      if (configParts.length === pathParts.length) {
        let isMatch = true;
        for (let i = 0; i < configParts.length; i++) {
          if (configParts[i].startsWith(':')) continue;
          if (configParts[i] !== pathParts[i]) {
            isMatch = false;
            break;
          }
        }
        if (isMatch) {
          matchedPath = configPath;
          break;
        }
      }
    }
  }
  
  // Build breadcrumb chain
  const buildChain = (path: string): void => {
    const config = breadcrumbConfig[path];
    if (!config) {
      // Fallback: generate from path
      const parts = path.split('/').filter(Boolean);
      if (parts.length > 0) {
        items.unshift({
          title: parts[parts.length - 1].charAt(0).toUpperCase() + parts[parts.length - 1].slice(1).replace(/-/g, ' '),
          path: path
        });
      }
      return;
    }
    
    items.unshift({
      title: config.title,
      path: path
    });
    
    if (config.parent) {
      buildChain(config.parent);
    }
  };
  
  buildChain(matchedPath);
  
  // Remove path from last item (current page)
  if (items.length > 0) {
    delete items[items.length - 1].path;
  }
  
  return items;
};

/**
 * Get page title from pathname
 */
export const getPageTitle = (pathname: string): string => {
  const breadcrumbs = generateBreadcrumbs(pathname);
  if (breadcrumbs.length > 0) {
    return breadcrumbs[breadcrumbs.length - 1].title;
  }
  return 'Dashboard';
};

/**
 * Get parent path from pathname
 */
export const getParentPath = (pathname: string): string | null => {
  const config = breadcrumbConfig[pathname];
  return config?.parent || null;
};
