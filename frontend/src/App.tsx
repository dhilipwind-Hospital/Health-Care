import React, { useEffect } from 'react';
import './styles/darkTheme.css';
import './styles/settings.css';
import './styles/adminOverrides.css';
import './styles/pinkTheme.css';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalErrorHandler from './components/GlobalErrorHandler';
import { RouterProvider, createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { publicTheme, defaultTheme } from './themes/publicTheme';
import PublicLayout from './components/PublicLayout';
import HomeReference from './pages/public/HomeReference';
import About from './pages/public/About';
import Departments from './pages/public/Departments';
import DepartmentsNew from './pages/public/DepartmentsNew';
import Doctors from './pages/public/Doctors';
import Services from './pages/public/Services';
import ServicesNew from './pages/public/ServicesNew';
import RequestCallback from './pages/public/RequestCallback';
import HealthPackages from './pages/public/HealthPackages';
import Announcements from './pages/public/Announcements';
import BookAppointment from './pages/public/BookAppointment';
import BookAppointmentEnhanced from './pages/public/BookAppointmentEnhanced';
import BookAppointmentWizard from './pages/public/BookAppointmentWizard';
import Emergency from './pages/public/Emergency';
import EmergencyNew from './pages/public/EmergencyNew';
import FirstAid from './pages/public/FirstAid';
import Insurance from './pages/public/Insurance';
import Login from './pages/Login';
import LoginNew from './pages/LoginNew';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import RegisterPage from './pages/RegisterPage';
import RegisterStepper from './pages/RegisterStepper';
import Dashboard from './pages/Dashboard';
import PatientList from './pages/patients/PatientList';
import PatientForm from './pages/patients/PatientForm';
import PatientRegistration from './pages/patients/PatientRegistration';
import PatientDetailEnhanced from './pages/patients/PatientDetailEnhanced';
import SaaSLayout from './components/SaaSLayout';
import RequireRole from './components/RequireRole';
import ServicesAdmin from './pages/admin/ServicesAdmin';
import DoctorsAdmin from './pages/admin/DoctorsAdminEnhanced';
import DepartmentsAdmin from './pages/admin/DepartmentsAdmin';
import ReportsAdmin from './pages/admin/ReportsAdmin';
import AppointmentsAdmin from './pages/admin/AppointmentsAdmin';
import PrescriptionsAdmin from './pages/admin/PrescriptionsAdmin';
import LabOrdersAdmin from './pages/admin/LabOrdersAdmin';
import EmergencyRequestsAdmin from './pages/admin/EmergencyRequestsAdmin';
import CallbackRequestsAdmin from './pages/admin/CallbackRequestsAdmin';
import EmergencyDashboard from './pages/admin/EmergencyDashboard';
import CallbackQueue from './pages/admin/CallbackQueue';
import Notifications from './pages/Notifications';
import MyAppointments from './pages/appointments/MyAppointments';
import BookAppointmentAuth from './pages/appointments/BookAppointmentAuth';
import BookAppointmentStepper from './pages/appointments/BookAppointmentStepper';
import PatientDashboard from './pages/portal/PatientDashboard';
import MyInsurance from './pages/portal/MyInsurance';
import MedicalRecords from './pages/portal/MedicalRecords';
import MedicalHistory from './pages/portal/MedicalHistory';
import BillingHistory from './pages/portal/BillingHistory';
import SymptomChecker from './pages/portal/SymptomChecker';
import ViewDoctorAvailability from './pages/availability/ViewDoctorAvailability';
import Records from './pages/Records';
import Pharmacy from './pages/Pharmacy';
import PharmacyDashboard from './pages/PharmacyDashboard';
import MedicineList from './pages/pharmacy/MedicineList';
import InventoryDashboard from './pages/pharmacy/InventoryDashboard';
import StockAlerts from './pages/pharmacy/StockAlerts';
import SupplierManagement from './pages/pharmacy/SupplierManagement';
import PurchaseOrders from './pages/pharmacy/PurchaseOrders';
import InventoryReports from './pages/pharmacy/InventoryReports';
import PrescriptionsEnhanced from './pages/pharmacy/PrescriptionsEnhanced';
import Messaging from './pages/communication/Messaging';
import Reminders from './pages/communication/Reminders';
import HealthArticles from './pages/communication/HealthArticles';
import Feedback from './pages/communication/Feedback';
import PhoneAuthTest from './pages/PhoneAuthTest';

// Laboratory Management
import LabDashboard from './pages/laboratory/LabDashboard';
import TestCatalog from './pages/laboratory/TestCatalog';
import OrderLabTest from './pages/laboratory/OrderLabTest';
import SampleCollection from './pages/laboratory/SampleCollection';
import ResultsEntry from './pages/laboratory/ResultsEntry';
import PatientLabResults from './pages/laboratory/PatientLabResults';
import DoctorLabResults from './pages/laboratory/DoctorLabResults';

// Inpatient Management
import BedManagement from './pages/inpatient/BedManagement';
import WardOverview from './pages/inpatient/WardOverview';
import PatientAdmission from './pages/inpatient/PatientAdmission';
import NursingCare from './pages/inpatient/NursingCare';
import DoctorRounds from './pages/inpatient/DoctorRounds';
import DischargeSummary from './pages/inpatient/DischargeSummary';
import AdmissionDetails from './pages/inpatient/AdmissionDetails';
import WardManagement from './pages/admin/inpatient/WardManagement';
import RoomManagement from './pages/admin/inpatient/RoomManagement';

import Settings from './pages/settings/Settings';
import MyProfile from './pages/profile/MyProfile';
import MyProfileEnhanced from './pages/profile/MyProfileEnhanced';
import PharmacistDashboard from './pages/pharmacy/PharmacistDashboard';
import Forbidden from './pages/Forbidden';
import PatientRecordsDoctor from './pages/doctor/PatientRecords';
import MyPatients from './pages/doctor/MyPatients';
import DoctorPrescriptions from './pages/doctor/Prescriptions';
import WritePrescription from './pages/doctor/WritePrescription';
import DoctorMedicines from './pages/doctor/Medicines';
import ConsultationForm from './pages/doctor/ConsultationForm';
import MySchedule from './pages/doctor/MySchedule';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import { useAuth } from './contexts/AuthContext';
import SaaSLanding from './pages/SaaSLanding';
import OrganizationSignup from './pages/OrganizationSignup';
import OrganizationsManagement from './pages/saas/OrganizationsManagement';
import SubscriptionManagement from './pages/saas/SubscriptionManagement';
import OnboardingFlow from './pages/saas/OnboardingFlow';
import RolesPermissions from './pages/admin/RolesPermissions';
import LocationsManagement from './pages/admin/LocationsManagement';
import BillingManagement from './pages/billing/BillingManagement';
import BillingQueue from './pages/billing/BillingQueue';
import TelemedicineHub from './pages/telemedicine/TelemedicineHub';
import StaffManagement from './pages/hr/StaffManagement';
import HospitalOnboardingDashboard from './pages/onboarding/HospitalOnboardingDashboard';
import ChooseHospital from './pages/onboarding/ChooseHospital';
import SetupWizard from './pages/onboarding/SetupWizard';
import RoleSpecificOnboarding from './pages/onboarding/RoleSpecificOnboarding';
import TrainingCenter from './pages/training/TrainingCenter';
import LoginFixed from './pages/LoginFixed';
import RegisterFixed from './pages/RegisterFixed';
import ScheduleSession from './pages/admin/ScheduleSessionWorking';
import OTManagement from './pages/ot/OTManagement';
import AppointmentReminders from './pages/communication/AppointmentReminders';
import AmbulanceManagement from './pages/emergency/AmbulanceManagement';
import AmbulanceAdvanced from './pages/emergency/AmbulanceAdvanced';
import ManualDispatch from './pages/emergency/ManualDispatch';
import ReceptionQueue from './pages/queue/ReceptionQueue';
import ReceptionQueueEnhanced from './pages/queue/ReceptionQueueEnhanced';
import TriageStation from './pages/queue/TriageStation';
import TriageStationEnhanced from './pages/queue/TriageStationEnhanced';
import DoctorConsole from './pages/queue/DoctorConsole';
import TVDisplay from './pages/queue/TVDisplay';

// Cross-Location Patient Access
import CrossLocationAccess from './pages/doctor/CrossLocationAccess';
import PatientAccessManagement from './pages/portal/PatientAccessManagement';
import AccessGrantApproval from './pages/portal/AccessGrantApproval';
import SystemBroadcasts from './pages/admin/SystemBroadcasts';
import ModulePlaceholder from './pages/ModulePlaceholder';
import AuditLogs from './pages/admin/AuditLogs';
import SalesLeads from './pages/admin/SalesLeads';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

// New HMS Modules
import DeathCertificateManagement from './pages/death-certificate/DeathCertificateManagement';
import BirthRegisterManagement from './pages/birth-register/BirthRegisterManagement';
import BloodBankManagement from './pages/bloodbank/BloodBankManagement';
import DialysisManagement from './pages/dialysis/DialysisManagement';
import RadiologyManagement from './pages/radiology/RadiologyManagement';
import BillingEnhanced from './pages/billing/BillingEnhanced';
import ConsentManagement from './pages/consent/ConsentManagement';
import MlcManagement from './pages/emergency/MlcManagement';
import DrugRegister from './pages/pharmacy/DrugRegister';
import BiomedicalWasteManagement from './pages/compliance/BiomedicalWasteManagement';
import IncidentReportManagement from './pages/compliance/IncidentReportManagement';
import DietManagement from './pages/diet/DietManagement';
import AssetManagement from './pages/assets/AssetManagement';
import InfectionControlManagement from './pages/infection-control/InfectionControlManagement';
import DutyRosterManagement from './pages/hr/DutyRosterManagement';
import TelemedicineManagement from './pages/telemedicine/TelemedicineManagement';
import AbhaManagement from './pages/abha/AbhaManagement';
import PcpndtFormManagement from './pages/pcpndt/PcpndtFormManagement';
import InsuranceTpaManagement from './pages/insurance/InsuranceTpaManagement';
import PhysiotherapyManagement from './pages/physiotherapy/PhysiotherapyManagement';
import MedicalRecordsDigitization from './pages/medical-records/MedicalRecordsDigitization';

const App: React.FC = () => {
  // Check for user preferences on app load
  useEffect(() => {
    // Try to load theme preference from localStorage
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark') {
      document.documentElement.classList.add('dark-theme');
    }

    // Try to load font size preference from localStorage
    const storedFontSize = localStorage.getItem('fontSize');
    if (storedFontSize === 'large') {
      document.documentElement.style.fontSize = '18px';
    } else if (storedFontSize === 'small') {
      document.documentElement.style.fontSize = '14px';
    }

    // Try to load high contrast preference from localStorage
    const highContrast = localStorage.getItem('highContrast') === 'true';
    if (highContrast) {
      document.documentElement.classList.add('high-contrast-mode');
    }
  }, []);

  const RoleHome: React.FC = () => {
    const { user, loading } = useAuth();

    // Wait for auth bootstrap to complete before deciding
    if (loading) {
      return null;
    }

    // If not logged in, redirect to landing page
    if (!user) {
      return <Navigate to="/landing" replace />;
    }

    const role = String(user?.role || '').toLowerCase();

    if (role === 'pharmacist') {
      return <Navigate to="/pharmacy" replace />;
    }
    if (role === 'nurse') {
      return <Navigate to="/queue/triage" replace />;
    }
    if (role === 'receptionist') {
      return <Navigate to="/queue/reception" replace />;
    }
    if (role === 'lab_technician') {
      return <Navigate to="/laboratory/dashboard" replace />;
    }
    if (role === 'accountant') {
      return <Navigate to="/billing/management" replace />;
    }
    if (role === 'patient') {
      return <Navigate to="/portal" replace />;
    }
    if (role === 'super_admin') {
      return <Navigate to="/saas/dashboard" replace />;
    }
    return <Dashboard />;
  };
  const AdminAppointmentsRedirect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const role = String(user?.role || '').toLowerCase();
    if (role === 'admin' || role === 'super_admin') {
      return <Navigate to="/admin/appointments" replace />;
    }
    if (role === 'pharmacist') {
      return <Navigate to="/pharmacy" replace />;
    }
    return <>{children}</>;
  };
  // Theme wrapper component
  const ThemedOutlet: React.FC = () => {
    // Apply pink theme to ALL pages in the application
    return (
      <ConfigProvider theme={publicTheme}>
        <Outlet />
      </ConfigProvider>
    );
  };

  const router = createBrowserRouter([
    {
      element: (
        <AuthProvider>
          <ThemedOutlet />
        </AuthProvider>
      ),
      children: [
        // Public
        { path: '/landing', element: <SaaSLanding /> },
        { path: '/signup', element: <OrganizationSignup /> },
        { path: '/home', element: <PublicLayout><HomeReference /></PublicLayout> },
        { path: '/about', element: <PublicLayout><About /></PublicLayout> },
        { path: '/departments', element: <PublicLayout><DepartmentsNew /></PublicLayout> },
        { path: '/departments-old', element: <PublicLayout><Departments /></PublicLayout> },
        { path: '/doctors', element: <PublicLayout><Doctors /></PublicLayout> },
        { path: '/health-packages', element: <PublicLayout><HealthPackages /></PublicLayout> },
        { path: '/services', element: <PublicLayout><ServicesNew /></PublicLayout> },
        { path: '/services-old', element: <PublicLayout><Services /></PublicLayout> },
        { path: '/insurance', element: <PublicLayout><Insurance /></PublicLayout> },
        { path: '/appointments/book', element: <PublicLayout><BookAppointmentWizard /></PublicLayout> },
        { path: '/emergency', element: <PublicLayout><EmergencyNew /></PublicLayout> },
        { path: '/emergency-old', element: <PublicLayout><Emergency /></PublicLayout> },
        { path: '/first-aid', element: <PublicLayout><FirstAid /></PublicLayout> },
        { path: '/request-callback', element: <PublicLayout><RequestCallback /></PublicLayout> },
        { path: '/login', element: <LoginFixed /> },
        { path: '/login-old', element: <LoginNew /> },
        { path: '/forgot-password', element: <ForgotPassword /> },
        { path: '/reset-password', element: <ResetPassword /> },
        { path: '/register', element: <RegisterFixed /> },
        { path: '/register-old', element: <RegisterStepper /> },
        { path: '/test-phone-auth', element: <PhoneAuthTest /> },

        // Public access grant approval/rejection (email links)
        { path: '/access-grant/approve/:requestId/:token', element: <AccessGrantApproval /> },
        { path: '/access-grant/reject/:requestId/:token', element: <AccessGrantApproval /> },

        // App
        { path: '/dashboard', element: <SaaSLayout><RoleHome /></SaaSLayout> },
        { path: '/', element: <SaaSLayout><RoleHome /></SaaSLayout> },
        { path: '/onboarding', element: <SaaSLayout><HospitalOnboardingDashboard /></SaaSLayout> },
        { path: '/onboarding/setup', element: <SaaSLayout><SetupWizard /></SaaSLayout> },
        { path: '/onboarding/role-specific', element: <SaaSLayout><RoleSpecificOnboarding /></SaaSLayout> },
        { path: '/onboarding/choose-hospital', element: <SaaSLayout><ChooseHospital /></SaaSLayout> },
        { path: '/training', element: <SaaSLayout><TrainingCenter /></SaaSLayout> },
        { path: '/training/schedule', element: <SaaSLayout><TrainingCenter /></SaaSLayout> },
        { path: '/patients', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'doctor', 'nurse', 'receptionist']}><PatientList /></RequireRole></SaaSLayout> },
        { path: '/records', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'doctor', 'nurse', 'patient']}><Records /></RequireRole></SaaSLayout> },
        { path: '/pharmacy', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'pharmacist']}><PharmacistDashboard /></RequireRole></SaaSLayout> },
        { path: '/pharmacy/dashboard', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'pharmacist']}><PharmacistDashboard /></RequireRole></SaaSLayout> },
        { path: '/pharmacy/medicines', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'pharmacist', 'nurse']}><MedicineList /></RequireRole></SaaSLayout> },
        { path: '/pharmacy/inventory', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'pharmacist']}><InventoryDashboard /></RequireRole></SaaSLayout> },
        { path: '/pharmacy/inventory/alerts', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'pharmacist']}><StockAlerts /></RequireRole></SaaSLayout> },
        { path: '/pharmacy/suppliers', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'pharmacist']}><SupplierManagement /></RequireRole></SaaSLayout> },
        { path: '/pharmacy/purchase-orders', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'pharmacist']}><PurchaseOrders /></RequireRole></SaaSLayout> },
        { path: '/pharmacy/inventory/reports', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'pharmacist']}><InventoryReports /></RequireRole></SaaSLayout> },
        { path: '/pharmacy/prescriptions', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'pharmacist']}><PrescriptionsEnhanced /></RequireRole></SaaSLayout> },
        { path: '/pharmacy/dispense', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'pharmacist']}><PrescriptionsEnhanced /></RequireRole></SaaSLayout> },
        { path: '/communication/messages', element: <SaaSLayout><Messaging /></SaaSLayout> },
        { path: '/communication/reminders', element: <SaaSLayout><Reminders /></SaaSLayout> },
        { path: '/communication/appointment-reminders', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'receptionist', 'patient']}><AppointmentReminders /></RequireRole></SaaSLayout> },
        { path: '/communication/health-articles', element: <SaaSLayout><HealthArticles /></SaaSLayout> },
        { path: '/communication/feedback', element: <SaaSLayout><Feedback /></SaaSLayout> },

        // Laboratory Management routes
        { path: '/laboratory/dashboard', element: <SaaSLayout><LabDashboard /></SaaSLayout> },
        { path: '/laboratory/tests', element: <SaaSLayout><TestCatalog /></SaaSLayout> },
        { path: '/laboratory/order', element: <SaaSLayout><OrderLabTest /></SaaSLayout> },
        { path: '/laboratory/results', element: <SaaSLayout><DoctorLabResults /></SaaSLayout> },
        { path: '/laboratory/sample-collection', element: <SaaSLayout><SampleCollection /></SaaSLayout> },
        { path: '/laboratory/results-entry', element: <SaaSLayout><ResultsEntry /></SaaSLayout> },
        { path: '/laboratory/my-results', element: <SaaSLayout><PatientLabResults /></SaaSLayout> },

        // Inpatient Management routes
        { path: '/inpatient/beds', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'nurse']}><BedManagement /></RequireRole></SaaSLayout> },
        { path: '/inpatient/wards', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'nurse', 'doctor']}><WardOverview /></RequireRole></SaaSLayout> },
        { path: '/inpatient/admissions/new', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'doctor', 'nurse']}><PatientAdmission /></RequireRole></SaaSLayout> },
        { path: '/inpatient/admissions/:id', element: <SaaSLayout><RequireRole roles={['doctor', 'nurse', 'admin', 'super_admin']}><AdmissionDetails /></RequireRole></SaaSLayout> },
        { path: '/inpatient/nursing', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'nurse']}><NursingCare /></RequireRole></SaaSLayout> },
        { path: '/inpatient/rounds', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'doctor']}><DoctorRounds /></RequireRole></SaaSLayout> },
        { path: '/inpatient/discharge/:id', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'doctor']}><DischargeSummary /></RequireRole></SaaSLayout> },

        // Inpatient Admin routes
        { path: '/admin/inpatient/wards', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin']}><WardManagement /></RequireRole></SaaSLayout> },
        { path: '/admin/inpatient/rooms', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin']}><RoomManagement /></RequireRole></SaaSLayout> },

        { path: '/settings', element: <SaaSLayout><Settings /></SaaSLayout> },
        { path: '/profile', element: <SaaSLayout><MyProfileEnhanced /></SaaSLayout> },
        { path: '/appointments', element: <SaaSLayout><AdminAppointmentsRedirect><MyAppointments /></AdminAppointmentsRedirect></SaaSLayout> },
        { path: '/appointments/new', element: <SaaSLayout><BookAppointmentStepper /></SaaSLayout> },
        // Queue & Visit (feature-flagged via backend; UI available for roles)
        { path: '/queue/reception', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'receptionist']}><ReceptionQueueEnhanced /></RequireRole></SaaSLayout> },
        { path: '/queue/triage', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'nurse']}><TriageStationEnhanced /></RequireRole></SaaSLayout> },
        { path: '/queue/doctor', element: <SaaSLayout><RequireRole roles={['doctor']}><DoctorConsole /></RequireRole></SaaSLayout> },
        { path: '/queue/tv/:stage', element: <SaaSLayout><TVDisplay /></SaaSLayout> },
        { path: '/patients/new', element: <SaaSLayout><PatientRegistration /></SaaSLayout> },
        { path: '/patients/register', element: <SaaSLayout><PatientRegistration /></SaaSLayout> },
        { path: '/patients/:id/edit', element: <SaaSLayout><PatientForm /></SaaSLayout> },
        { path: '/patients/:id', element: <SaaSLayout><PatientDetailEnhanced /></SaaSLayout> },
        {
          path: '/portal', element: <SaaSLayout>
            <RequireRole roles={['patient']}>
              <PatientDashboard />
            </RequireRole>
          </SaaSLayout>
        },
        { path: '/portal/records', element: <SaaSLayout><RequireRole roles={['patient']}><MedicalRecords /></RequireRole></SaaSLayout> },
        { path: '/portal/medical-history', element: <SaaSLayout><RequireRole roles={['patient']}><MedicalHistory /></RequireRole></SaaSLayout> },
        { path: '/portal/bills', element: <SaaSLayout><RequireRole roles={['patient']}><BillingHistory /></RequireRole></SaaSLayout> },
        { path: '/portal/insurance', element: <SaaSLayout><RequireRole roles={['patient']}><MyInsurance /></RequireRole></SaaSLayout> },
        { path: '/portal/access-management', element: <SaaSLayout><RequireRole roles={['patient']}><PatientAccessManagement /></RequireRole></SaaSLayout> },
        { path: '/portal/symptom-checker', element: <SaaSLayout><RequireRole roles={['patient']}><SymptomChecker /></RequireRole></SaaSLayout> },

        { path: '/doctor/my-patients', element: <SaaSLayout><RequireRole roles={['doctor']}><MyPatients /></RequireRole></SaaSLayout> },
        { path: '/doctor/patients/:patientId/records', element: <SaaSLayout><RequireRole roles={['doctor']}><PatientRecordsDoctor /></RequireRole></SaaSLayout> },
        { path: '/doctor/prescriptions', element: <SaaSLayout><RequireRole roles={['doctor']}><DoctorPrescriptions /></RequireRole></SaaSLayout> },
        { path: '/doctor/prescriptions/new', element: <SaaSLayout><RequireRole roles={['doctor']}><WritePrescription /></RequireRole></SaaSLayout> },
        { path: '/doctor/patients/:patientId/prescriptions/new', element: <SaaSLayout><RequireRole roles={['doctor']}><WritePrescription /></RequireRole></SaaSLayout> },
        { path: '/doctor/prescriptions/:id/edit', element: <SaaSLayout><RequireRole roles={['doctor']}><WritePrescription /></RequireRole></SaaSLayout> },
        { path: '/doctor/medicines', element: <SaaSLayout><RequireRole roles={['doctor']}><DoctorMedicines /></RequireRole></SaaSLayout> },
        { path: '/doctor/my-schedule', element: <SaaSLayout><RequireRole roles={['doctor']}><MySchedule /></RequireRole></SaaSLayout> },
        { path: '/doctor/consultations/:appointmentId', element: <SaaSLayout><RequireRole roles={['doctor']}><ConsultationForm /></RequireRole></SaaSLayout> },
        { path: '/doctor/cross-location-access', element: <SaaSLayout><RequireRole roles={['doctor']}><CrossLocationAccess /></RequireRole></SaaSLayout> },
        { path: '/doctor/consultation', element: <SaaSLayout><RequireRole roles={['doctor']}><DoctorDashboard /></RequireRole></SaaSLayout> },
        { path: '/doctor/dashboard', element: <SaaSLayout><RequireRole roles={['doctor']}><DoctorDashboard /></RequireRole></SaaSLayout> },

        // Admin
        { path: '/admin/schedule-session', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin']}><ScheduleSession /></RequireRole></SaaSLayout> },
        { path: '/admin/users', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin']}><PatientList /></RequireRole></SaaSLayout> },
        { path: '/admin/roles', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin']}><RolesPermissions /></RequireRole></SaaSLayout> },
        { path: '/admin/roles-permissions', element: <SaaSLayout><RequireRole roles={['super_admin']}><RolesPermissions /></RequireRole></SaaSLayout> },
        { path: '/admin/staff', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin']}><StaffManagement /></RequireRole></SaaSLayout> },
        { path: '/admin/services', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin']}><ServicesAdmin /></RequireRole></SaaSLayout> },
        { path: '/admin/doctors', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin']}><DoctorsAdmin /></RequireRole></SaaSLayout> },
        { path: '/admin/departments', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin']}><DepartmentsAdmin /></RequireRole></SaaSLayout> },
        { path: '/admin/reports', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin']}><ReportsAdmin /></RequireRole></SaaSLayout> },
        { path: '/admin/appointments', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin']}><AppointmentsAdmin /></RequireRole></SaaSLayout> },
        { path: '/admin/prescriptions', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin']}><PrescriptionsAdmin /></RequireRole></SaaSLayout> },
        { path: '/admin/lab-orders', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin']}><LabOrdersAdmin /></RequireRole></SaaSLayout> },
        { path: '/admin/emergency-requests', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin']}><EmergencyRequestsAdmin /></RequireRole></SaaSLayout> },
        { path: '/admin/emergency-dashboard', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'doctor', 'nurse']}><EmergencyDashboard /></RequireRole></SaaSLayout> },
        { path: '/admin/ambulance', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin']}><AmbulanceManagement /></RequireRole></SaaSLayout> },
        { path: '/admin/ambulance-advanced', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin']}><AmbulanceAdvanced /></RequireRole></SaaSLayout> },
        { path: '/admin/manual-dispatch', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin']}><ManualDispatch /></RequireRole></SaaSLayout> },
        { path: '/admin/callback-requests', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin']}><CallbackRequestsAdmin /></RequireRole></SaaSLayout> },
        { path: '/admin/callback-queue', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'receptionist', 'nurse']}><CallbackQueue /></RequireRole></SaaSLayout> },
        { path: '/admin/ot', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'doctor']}><OTManagement /></RequireRole></SaaSLayout> },
        { path: '/admin/locations', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin']}><LocationsManagement /></RequireRole></SaaSLayout> },
        { path: '/admin/sales-leads', element: <SaaSLayout><RequireRole roles={['super_admin']}><SalesLeads /></RequireRole></SaaSLayout> },

        // SaaS Management (Super Admin only)
        { path: '/saas/dashboard', element: <SaaSLayout><RequireRole roles={['super_admin']}><SuperAdminDashboard /></RequireRole></SaaSLayout> },
        { path: '/saas/organizations', element: <SaaSLayout><RequireRole roles={['super_admin']}><OrganizationsManagement /></RequireRole></SaaSLayout> },
        { path: '/saas/subscriptions', element: <SaaSLayout><RequireRole roles={['super_admin']}><SubscriptionManagement /></RequireRole></SaaSLayout> },
        { path: '/saas/onboarding', element: <SaaSLayout><RequireRole roles={['super_admin']}><OrganizationsManagement /></RequireRole></SaaSLayout> },
        { path: '/saas/system-health', element: <SaaSLayout><RequireRole roles={['super_admin']}><SuperAdminDashboard /></RequireRole></SaaSLayout> },
        { path: '/saas/analytics', element: <SaaSLayout><RequireRole roles={['super_admin']}><ReportsAdmin /></RequireRole></SaaSLayout> },
        { path: '/saas/api', element: <SaaSLayout><RequireRole roles={['super_admin']}><Dashboard /></RequireRole></SaaSLayout> },
        { path: '/admin/logs', element: <SaaSLayout><RequireRole roles={['super_admin']}><AuditLogs /></RequireRole></SaaSLayout> },

        // Telemedicine
        { path: '/telemedicine', element: <SaaSLayout><RequireRole roles={['doctor', 'admin', 'super_admin', 'nurse']}><TelemedicineHub /></RequireRole></SaaSLayout> },

        // Broadcast System (Super Admin)
        { path: '/communication/broadcast', element: <SaaSLayout><RequireRole roles={['super_admin']}><SystemBroadcasts /></RequireRole></SaaSLayout> },

        // Billing & Reports
        { path: '/billing', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'accountant']}><Dashboard /></RequireRole></SaaSLayout> },
        { path: '/billing/management', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'accountant', 'receptionist']}><BillingManagement /></RequireRole></SaaSLayout> },
        { path: '/billing/analytics', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'accountant']}><ReportsAdmin /></RequireRole></SaaSLayout> },
        { path: '/billing/payments', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'accountant']}><BillingManagement /></RequireRole></SaaSLayout> },
        { path: '/billing/queue', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'accountant', 'receptionist']}><BillingQueue /></RequireRole></SaaSLayout> },
        { path: '/queue/billing', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'accountant', 'receptionist']}><BillingQueue /></RequireRole></SaaSLayout> },

        // New HMS Modules
        { path: '/death-certificates', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'doctor']}><DeathCertificateManagement /></RequireRole></SaaSLayout> },
        { path: '/birth-registers', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'doctor', 'nurse']}><BirthRegisterManagement /></RequireRole></SaaSLayout> },
        { path: '/blood-bank', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'doctor', 'nurse', 'lab_technician']}><BloodBankManagement /></RequireRole></SaaSLayout> },
        { path: '/dialysis', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'doctor', 'nurse']}><DialysisManagement /></RequireRole></SaaSLayout> },
        { path: '/radiology', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'doctor', 'nurse', 'lab_technician']}><RadiologyManagement /></RequireRole></SaaSLayout> },
        { path: '/billing/enhanced', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'accountant']}><BillingEnhanced /></RequireRole></SaaSLayout> },
        { path: '/consent', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'doctor', 'nurse', 'receptionist']}><ConsentManagement /></RequireRole></SaaSLayout> },
        { path: '/mlc', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'doctor', 'nurse']}><MlcManagement /></RequireRole></SaaSLayout> },
        { path: '/pharmacy/drug-register', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'pharmacist']}><DrugRegister /></RequireRole></SaaSLayout> },
        { path: '/biomedical-waste', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'nurse']}><BiomedicalWasteManagement /></RequireRole></SaaSLayout> },
        { path: '/incident-reports', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'doctor', 'nurse']}><IncidentReportManagement /></RequireRole></SaaSLayout> },
        { path: '/diet', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'doctor', 'nurse']}><DietManagement /></RequireRole></SaaSLayout> },
        { path: '/assets', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin']}><AssetManagement /></RequireRole></SaaSLayout> },
        { path: '/infection-control', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'doctor', 'nurse']}><InfectionControlManagement /></RequireRole></SaaSLayout> },
        { path: '/duty-roster', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin']}><DutyRosterManagement /></RequireRole></SaaSLayout> },
        { path: '/telemedicine', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'doctor', 'patient']}><TelemedicineManagement /></RequireRole></SaaSLayout> },
        { path: '/abha', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'receptionist']}><AbhaManagement /></RequireRole></SaaSLayout> },
        { path: '/pcpndt', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'doctor']}><PcpndtFormManagement /></RequireRole></SaaSLayout> },
        { path: '/insurance-tpa', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'accountant']}><InsuranceTpaManagement /></RequireRole></SaaSLayout> },
        { path: '/physiotherapy', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'doctor', 'nurse']}><PhysiotherapyManagement /></RequireRole></SaaSLayout> },
        { path: '/medical-records-digitization', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'receptionist']}><MedicalRecordsDigitization /></RequireRole></SaaSLayout> },

        // Future Modules (Placeholders)
        { path: '/insurance/claims', element: <SaaSLayout><ModulePlaceholder title="Insurance Claims Processing" /></SaaSLayout> },

        { path: '/reports', element: <SaaSLayout><RequireRole roles={['admin', 'super_admin', 'accountant']}><ReportsAdmin /></RequireRole></SaaSLayout> },

        // Notifications
        { path: '/notifications', element: <SaaSLayout><Notifications /></SaaSLayout> },

        // Public view of a doctor's availability
        { path: '/doctors/:doctorId/availability', element: <PublicLayout><ViewDoctorAvailability /></PublicLayout> },
        { path: '/403', element: <SaaSLayout><Forbidden /></SaaSLayout> },

        // Fallback
        { path: '*', element: <Navigate to="/landing" replace /> }
      ]
    }
  ]);

  return (
    <AntApp>
      <ErrorBoundary>
        <SettingsProvider>
          <RouterProvider router={router} />
          <GlobalErrorHandler />
        </SettingsProvider>
      </ErrorBoundary>
    </AntApp>
  );
};

export default App;
