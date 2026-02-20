import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Badge, Button, Spin, Avatar, Progress, Space, Table, Tag } from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  AlertOutlined,
  FileTextOutlined,
  TeamOutlined,
  MedicineBoxOutlined,
  BellOutlined,
  ArrowRightOutlined,
  PlusOutlined,
  DashboardOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import patientService from '../services/patientService';
import styled, { keyframes } from 'styled-components';

// ============= ANIMATIONS =============
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ============= STYLED COMPONENTS =============
const DashboardWrapper = styled.div`
  min-height: 100vh;
  background: #F8FAFC;
  padding: 0 24px 24px 24px;
  color: #1a1a2e;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  animation: ${fadeInUp} 0.5s ease-out;
`;

const HeaderLeft = styled.div`
  .hospital-icon {
    width: 48px;
    height: 48px;
    background: #10B981;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
    font-size: 24px;
    box-shadow: 0 4px 15px rgba(30, 58, 95, 0.3);
  }
  
  h1 {
    color: #1a1a2e;
    font-size: 28px;
    font-weight: 700;
    margin: 0;
    
    span {
      color: #10B981;
      font-weight: 600;
    }
  }
  
  .subtitle {
    color: #666;
    font-size: 14px;
    margin-top: 4px;
  }
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PrimaryButton = styled(Button)`
  background: #10B981 !important;
  border: none !important;
  color: #fff !important;
  height: 44px !important;
  padding: 0 24px !important;
  border-radius: 12px !important;
  font-weight: 600 !important;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3) !important;
  
  &:hover {
    background: #059669 !important;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4) !important;
  }
`;

const SecondaryButton = styled(Button)`
  background: rgba(30, 58, 95, 0.08) !important;
  border: 1px solid rgba(30, 58, 95, 0.3) !important;
  color: #10B981 !important;
  height: 44px !important;
  padding: 0 24px !important;
  border-radius: 12px !important;
  font-weight: 500 !important;
  
  &:hover {
    background: rgba(30, 58, 95, 0.15) !important;
    border-color: #10B981 !important;
  }
`;

const NavTabs = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  animation: ${fadeInUp} 0.5s ease-out 0.1s both;
`;

const NavTab = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border-radius: 50px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid ${props => props.$active ? 'transparent' : '#eee'};
  
  background: ${props => props.$active ? '#10B981' : '#fff'};
  color: ${props => props.$active ? '#fff' : '#666'};
  box-shadow: ${props => props.$active ? '0 4px 12px rgba(16, 185, 129, 0.3)' : '0 2px 4px rgba(0,0,0,0.02)'};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.$active ? '0 6px 20px rgba(30, 58, 95, 0.4)' : '0 4px 12px rgba(0,0,0,0.05)'};
    border-color: ${props => props.$active ? 'transparent' : '#10B981'};
    color: ${props => props.$active ? '#fff' : '#10B981'};
  }
`;

const KPICard = styled.div<{ $color?: string }>`
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(30, 58, 95, 0.1);
  border-radius: 16px;
  padding: 20px;
  height: 140px;
  display: flex;
  flex-direction: column;
  animation: ${fadeInUp} 0.5s ease-out 0.2s both;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(30, 58, 95, 0.08);
  
  &:hover {
    transform: translateY(-4px);
    background: rgba(255, 255, 255, 1);
    border-color: rgba(30, 58, 95, 0.3);
    box-shadow: 0 8px 30px rgba(30, 58, 95, 0.15);
  }
  
  .kpi-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
    
    .kpi-title {
      color: #666;
      font-size: 13px;
      font-weight: 500;
    }
    
    .kpi-icon {
      width: 40px;
      height: 40px;
      background: ${props => props.$color || 'rgba(30, 58, 95, 0.15)'};
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }
  }
  
  .kpi-value {
    font-size: 32px;
    font-weight: 700;
    color: #1a1a2e;
    margin-bottom: 8px;
  }
  
  .kpi-change {
    font-size: 13px;
    color: ${props => props.$color || '#4ade80'};
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .kpi-progress {
    margin-top: 12px;
    
    .ant-progress-inner {
      background: rgba(30, 58, 95, 0.1) !important;
    }
    
    .ant-progress-bg {
      background: #10B981 !important;
    }
  }
`;

const GlassCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(30, 58, 95, 0.1);
  border-radius: 16px;
  overflow: hidden;
  animation: ${fadeInUp} 0.5s ease-out 0.3s both;
  box-shadow: 0 4px 20px rgba(30, 58, 95, 0.08);
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(30, 58, 95, 0.08);
    background: rgba(30, 58, 95, 0.03);
    
    .card-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 15px;
      font-weight: 600;
      color: #1a1a2e;
      
      .title-icon {
        font-size: 16px;
        color: #10B981;
      }
    }
    
    .view-all {
      color: #888;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      
      &:hover { color: #10B981; }
    }
  }
  
  .card-body {
    padding: 16px 20px;
  }
`;

const AppointmentItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid rgba(30, 58, 95, 0.08);
  
  &:last-child { border-bottom: none; }
  
  .patient-info {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #10B981;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 600;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(30, 58, 95, 0.25);
    }
    
    .details {
      .name {
        font-weight: 600;
        color: #1a1a2e;
        font-size: 14px;
      }
      .doctor {
        font-size: 12px;
        color: #888;
      }
    }
  }
  
  .time-info {
    text-align: right;
    
    .time {
      font-weight: 600;
      color: #10B981;
      font-size: 13px;
    }
    .department {
      font-size: 12px;
      color: #888;
    }
  }
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-left: 12px;
  
  ${props => {
    switch (props.$status.toLowerCase()) {
      case 'confirmed':
        return 'background: rgba(74, 222, 128, 0.2); color: #4ade80;';
      case 'waiting':
        return 'background: rgba(251, 191, 36, 0.2); color: #fbbf24;';
      case 'in-progress':
        return 'background: rgba(96, 165, 250, 0.2); color: #60a5fa;';
      case 'completed':
        return 'background: rgba(168, 85, 247, 0.2); color: #a855f7;';
      default:
        return 'background: rgba(30, 58, 95, 0.1); color: #888;';
    }
  }}
`;

const AlertItem = styled.div<{ $severity: string }>`
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 10px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  
  ${props => {
    switch (props.$severity) {
      case 'critical':
        return 'background: rgba(239, 68, 68, 0.15); border-left: 3px solid #ef4444;';
      case 'warning':
        return 'background: rgba(251, 191, 36, 0.15); border-left: 3px solid #fbbf24;';
      case 'info':
        return 'background: rgba(96, 165, 250, 0.15); border-left: 3px solid #60a5fa;';
      default:
        return 'background: rgba(30, 58, 95, 0.08); border-left: 3px solid rgba(30, 58, 95, 0.3);';
    }
  }}
  
  &:last-child { margin-bottom: 0; }
  
  .alert-content {
    flex: 1;
    
    .alert-title {
      font-weight: 600;
      color: #1a1a2e;
      font-size: 13px;
      margin-bottom: 2px;
    }
    
    .alert-time {
      font-size: 11px;
      color: #888;
    }
  }
`;

const DepartmentItem = styled.div`
  margin-bottom: 16px;
  
  &:last-child { margin-bottom: 0; }
  
  .dept-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    
    .dept-name {
      font-size: 13px;
      color: #1a1a2e;
    }
    
    .dept-count {
      font-size: 13px;
      color: #888;
    }
  }
  
  .ant-progress-inner {
    background: rgba(30, 58, 95, 0.1) !important;
    border-radius: 4px !important;
  }
  
  .ant-progress-bg {
    height: 6px !important;
    border-radius: 4px !important;
  }
`;

const DoctorItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid rgba(30, 58, 95, 0.08);
  
  &:last-child { border-bottom: none; }
  
  .doctor-info {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #10B981;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 12px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(30, 58, 95, 0.25);
    }
    
    .details {
      .name {
        font-weight: 600;
        color: #1a1a2e;
        font-size: 13px;
      }
      .specialty {
        font-size: 11px;
        color: #888;
      }
    }
  }
  
  .status-info {
    text-align: right;
    
    .status {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      
      &.available { color: #4ade80; }
      &.busy { color: #ef4444; }
      &.break { color: #fbbf24; }
      
      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
      }
    }
    
    .patients {
      font-size: 11px;
      color: #888;
      margin-top: 2px;
    }
  }
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(30, 58, 95, 0.08);
  
  &:last-child { border-bottom: none; }
  
  .activity-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    
    &.admission { background: rgba(96, 165, 250, 0.2); color: #60a5fa; }
    &.surgery { background: rgba(74, 222, 128, 0.2); color: #4ade80; }
    &.lab { background: rgba(251, 191, 36, 0.2); color: #fbbf24; }
    &.discharge { background: rgba(168, 85, 247, 0.2); color: #a855f7; }
  }
  
  .activity-content {
    flex: 1;
    
    .activity-title {
      font-weight: 600;
      color: #1a1a2e;
      font-size: 13px;
    }
    
    .activity-desc {
      font-size: 11px;
      color: #888;
    }
  }
  
  .activity-time {
    font-size: 11px;
    color: #888;
  }
`;

const BottomStats = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(30, 58, 95, 0.1);
  border-radius: 16px;
  padding: 20px;
  margin-top: 24px;
  animation: ${fadeInUp} 0.5s ease-out 0.5s both;
  box-shadow: 0 4px 20px rgba(30, 58, 95, 0.08);
  
  .stat-item {
    text-align: center;
    
    .stat-label {
      font-size: 12px;
      color: #888;
      margin-bottom: 4px;
    }
    
    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #10B981;
      
      &.revenue {
        color: #4ade80;
      }
    }
  }
`;

// ============= COMPONENT =============
interface DashboardData {
  totalPatients: number;
  totalDoctors: number;
  bedOccupancy: number;
  totalBeds: number;
  occupiedBeds: number;
  emergencyCases: number;
  pendingDischarges: number;
  todayAppointments: any[];
  doctors: any[];
  patients: any[]; // Added patients list
  departments: any[];
  departmentPerformance: any[];
  inpatients: number;
  outpatients: number;
  surgeriesToday: number;
  labTestsPending: number;
  revenueToday: number;
  alerts: any[];
  recentActivities: any[];
}

const PremiumDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [patientFilter, setPatientFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Get selected location from localStorage (shared with SaaSLayout)
  const [selectedLocation, setSelectedLocation] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('hms_selected_branch');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  // Listen for location changes with debounce check
  useEffect(() => {
    const checkLocation = () => {
      try {
        const saved = localStorage.getItem('hms_selected_branch');
        const parsed = saved ? JSON.parse(saved) : null;

        setSelectedLocation((prev: any) => {
          // Only update if ID changed to prevent infinite loop
          if (prev?.id === parsed?.id) return prev;
          return parsed;
        });
      } catch { }
    };

    window.addEventListener('storage', checkLocation);
    // Poll for changes
    const interval = setInterval(checkLocation, 500);

    return () => {
      window.removeEventListener('storage', checkLocation);
      clearInterval(interval);
    };
  }, []);

  const [rawData, setRawData] = useState<DashboardData>({
    totalPatients: 0,
    totalDoctors: 0,
    bedOccupancy: 0,
    totalBeds: 0,
    occupiedBeds: 0,
    emergencyCases: 0,
    pendingDischarges: 0,
    todayAppointments: [],
    doctors: [],
    patients: [],
    departments: [],
    departmentPerformance: [],
    inpatients: 0,
    outpatients: 0,
    surgeriesToday: 0,
    labTestsPending: 0,
    revenueToday: 0,
    alerts: [],
    recentActivities: [],
  });

  // Fetch filtered patients when filter changes
  useEffect(() => {
    const fetchFilteredPatients = async () => {
      if (activeTab !== 'patients') return;

      try {
        // Map frontend filter to backend expected values if needed
        const typeMap: Record<string, string | undefined> = {
          'all': undefined,
          'inpatient': 'inpatient',
          'outpatient': 'outpatient',
          'emergency': 'emergency',
          'discharged': 'discharged'
        };

        const res = await patientService.getPatients({
          patientType: typeMap[patientFilter],
          limit: 10,
          locationId: selectedLocation?.id
        });

        setRawData(prev => ({ ...prev, patients: res.data || [] }));
      } catch (error) {
        console.error('Error fetching filtered patients:', error);
      }
    };

    fetchFilteredPatients();
  }, [patientFilter, activeTab, selectedLocation?.id]);

  const orgName = (user as any)?.organization?.name || 'Hospital';

  // Fetch real data from APIs
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch all required data in parallel from real APIs
        const [
          dashboardStatsRes,
          departmentPerfRes,
          recentActivityRes,
          notificationsRes,
          appointmentsRes,
          doctorsRes,
          departmentsRes,
          bedsRes,
          admissionsRes,
          labOrdersRes,
          patientsRes,
        ] = await Promise.all([
          // Analytics Dashboard Stats
          api.get('/analytics/dashboard-stats', { params: { locationId: selectedLocation?.id } }).catch(() => ({ data: {} })),
          // Department Performance
          api.get('/analytics/department-performance', { params: { locationId: selectedLocation?.id } }).catch(() => ({ data: [] })),
          // Recent Activity
          api.get('/analytics/recent-activity', { params: { locationId: selectedLocation?.id } }).catch(() => ({ data: [] })),
          // Notifications for alerts
          api.get('/notifications', { params: { limit: 10, locationId: selectedLocation?.id } }).catch(() => ({ data: { data: [] } })),
          // Today's Appointments
          api.get('/appointments/admin', { params: { limit: 100, locationId: selectedLocation?.id } }).catch(() => ({ data: { data: [] } })),
          // Doctors list
          api.get('/users', { params: { role: 'doctor', limit: 50, locationId: selectedLocation?.id } }).catch(() => ({ data: { total: 0, data: [] } })),
          // Departments
          api.get('/departments', { params: { limit: 50, locationId: selectedLocation?.id } }).catch(() => ({ data: { total: 0, data: [] } })),
          // Beds for occupancy
          api.get('/inpatient/beds', { params: { locationId: selectedLocation?.id } }).catch(() => ({ data: [] })),
          // Current admissions
          api.get('/inpatient/admissions/current', { params: { locationId: selectedLocation?.id } }).catch(() => ({ data: [] })),
          // Lab orders for pending tests - fetch 'ordered' status as backend uses that
          api.get('/lab/orders', { params: { status: 'ordered', limit: 100, locationId: selectedLocation?.id } }).catch(() => ({ data: { data: [], total: 0 } })),
          // Patients list
          api.get('/users', { params: { role: 'patient', limit: 50, locationId: selectedLocation?.id } }).catch(() => ({ data: { total: 0, data: [] } })),
        ]);


        // Process analytics stats
        const stats = dashboardStatsRes.data || {};

        // Process today's appointments
        const today = new Date();
        const allAppts = (appointmentsRes.data?.data || []);
        const todayAppts = allAppts.filter((a: any) => {
          const apptDate = new Date(a.startTime);
          return apptDate.toDateString() === today.toDateString();
        });

        // Process beds for occupancy calculation
        // Backend returns: { success: true, beds: [...] }
        const allBeds = Array.isArray(bedsRes.data) ? bedsRes.data :
          (bedsRes.data?.beds || bedsRes.data?.data || []);
        const totalBeds = allBeds.length;
        const occupiedBeds = allBeds.filter((bed: any) => bed.status === 'occupied').length;
        const bedOccupancy = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

        // Process current admissions
        // Backend returns: { success: true, admissions: [...] }
        const currentAdmissions = Array.isArray(admissionsRes.data) ? admissionsRes.data :
          (admissionsRes.data?.admissions || admissionsRes.data?.data || []);

        // Calculate pending discharges from admission data (dischargeSummary is already joined)
        // Pending discharge = has a discharge summary but not yet discharged
        const calculatedPendingDischarges = currentAdmissions.filter((adm: any) =>
          adm.status === 'pending_discharge' ||
          adm.dischargeStatus === 'pending' ||
          (adm.dischargeSummary && adm.status !== 'discharged')
        ).length;

        // Process doctors data
        const doctorsList = (doctorsRes.data?.data || []).slice(0, 6);

        // Process departments data
        const departmentsList = (departmentsRes.data?.data || []).slice(0, 5);

        // Process department performance
        const deptPerformance = Array.isArray(departmentPerfRes.data) ? departmentPerfRes.data : [];

        // Process notifications as alerts
        const notifications = notificationsRes.data?.data || notificationsRes.data || [];
        const alertsFromNotifications = (Array.isArray(notifications) ? notifications : []).map((n: any) => ({
          id: n.id,
          title: n.title || n.message || 'Notification',
          time: n.createdAt ? formatTimeAgo(new Date(n.createdAt)) : 'Just now',
          severity: n.type === 'error' || n.type === 'urgent' ? 'critical' :
            n.type === 'warning' ? 'warning' : 'info'
        })).slice(0, 5);

        // Process recent activities
        const activities = Array.isArray(recentActivityRes.data) ? recentActivityRes.data : [];
        const recentActivities = activities.map((act: any) => {
          const patientName = act.patient?.firstName
            ? `${act.patient.firstName} ${act.patient.lastName || ''}`
            : (typeof act.patient === 'string' ? act.patient : 'Patient');

          return {
            id: act.id,
            type: act.status === 'completed' ? 'surgery' :
              act.status === 'cancelled' ? 'discharge' :
                act.status === 'in_progress' ? 'lab' : 'admission',
            title: act.status === 'completed' ? 'Completed' : 'Appointment',
            desc: patientName,
            time: act.createdAt ? formatTimeAgo(new Date(act.createdAt)) : (act.time || 'Recently')
          };
        }).slice(0, 4);

        // Calculate inpatients/outpatients
        const inpatientsCount = currentAdmissions.length || occupiedBeds;
        const outpatientsCount = todayAppts.length; // Outpatients for today are the people with appointments

        // Lab tests pending
        const labTestsPendingCount = labOrdersRes.data?.total ||
          (labOrdersRes.data?.data ? labOrdersRes.data.data.length : 0);

        // Estimate Revenue (e.g., $400 per appointment)
        const estimatedRevenue = todayAppts.length * 400;

        setRawData({
          totalPatients: stats.totalPatients || 0,
          totalDoctors: stats.activeDoctors || doctorsRes.data?.total || 0,
          bedOccupancy,
          totalBeds,
          occupiedBeds,
          emergencyCases: stats.emergencyRequests || 0,
          pendingDischarges: calculatedPendingDischarges || 0,
          todayAppointments: todayAppts.slice(0, 6),
          doctors: doctorsList,
          patients: (patientsRes.data?.data || []).slice(0, 10),
          departments: departmentsList,
          departmentPerformance: deptPerformance.slice(0, 5),
          inpatients: inpatientsCount,
          outpatients: outpatientsCount,
          surgeriesToday: todayAppts.filter((a: any) =>
            a.type === 'surgery' || a.service?.name?.toLowerCase().includes('surgery')
          ).length,
          labTestsPending: labTestsPendingCount,
          revenueToday: estimatedRevenue,
          alerts: alertsFromNotifications,
          recentActivities,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedLocation?.id]);

  // Filter data based on selected location
  const data = React.useMemo(() => {
    // If no rawData yet, return empty/initial structure to avoid crashes
    if (!rawData) return {
      totalPatients: 0, totalDoctors: 0, bedOccupancy: 0, totalBeds: 0, occupiedBeds: 0,
      emergencyCases: 0, pendingDischarges: 0, todayAppointments: [], doctors: [],
      patients: [], departments: [], departmentPerformance: [], inpatients: 0,
      outpatients: 0, surgeriesToday: 0, labTestsPending: 0, revenueToday: 0,
      alerts: [], recentActivities: []
    } as DashboardData;

    if (!selectedLocation?.id) {
      // All locations - show unfiltered data
      return rawData;
    }

    const locationId = selectedLocation.id;

    // Filter patients by locationId
    const filteredPatients = (rawData.patients || []).filter((p: any) =>
      p.locationId === locationId
    );

    // Filter doctors by locationId
    const filteredDoctors = (rawData.doctors || []).filter((d: any) =>
      d.locationId === locationId
    );

    // Filter departments - check if name contains location name or city
    const filteredDepartments = (rawData.departments || []).filter((d: any) => {
      // Check if department is assigned to this location (via name suffix or locationId if available)
      if (d.locationId) return d.locationId === locationId;

      // Fallback 1: check against city
      if (selectedLocation.city && d.name?.toLowerCase().includes(selectedLocation.city.toLowerCase())) {
        return true;
      }

      // Fallback 2: Check if department name contains location name parts
      const locationParts = selectedLocation.name?.toLowerCase().split(' ') || [];
      const deptName = d.name?.toLowerCase() || '';

      // If dept name explicitly contains another known location (e.g. "Austin"), exclude it
      // This is a heuristic to avoid "General Medicine" matching everything if it doesn't have a suffix
      // But for now, let's just match the current location keyword
      const keyword = locationParts.length > 0 ? locationParts[locationParts.length - 1] : '';
      if (keyword && deptName.includes(keyword)) return true;

      return false;
    });

    // Filter department performance - check if name contains location name or city
    const filteredDepartmentPerformance = (rawData.departmentPerformance || []).filter((d: any) => {
      const deptName = (d.department || d.name || '').toLowerCase();

      // Fallback 1: check against city
      if (selectedLocation.city && deptName.includes(selectedLocation.city.toLowerCase())) {
        return true;
      }

      // Fallback 2: Check if department name contains location name parts
      const locationParts = selectedLocation.name?.toLowerCase().split(' ') || [];
      const keyword = locationParts.length > 0 ? locationParts[locationParts.length - 1] : '';
      if (keyword && deptName.includes(keyword)) return true;

      return false;
    });

    // Filter appointments by doctor or patient location
    const filteredAppointments = (rawData.todayAppointments || []).filter((a: any) => {
      const doctorLocationMatch = a.doctor?.locationId === locationId;
      const patientLocationMatch = a.patient?.locationId === locationId;
      return doctorLocationMatch || patientLocationMatch;
    });

    return {
      ...rawData,
      totalPatients: filteredPatients.length,
      totalDoctors: filteredDoctors.length,
      doctors: filteredDoctors,
      patients: filteredPatients,
      departments: filteredDepartments,
      departmentPerformance: filteredDepartmentPerformance,
      todayAppointments: filteredAppointments,
    };
  }, [rawData, selectedLocation]);


  // Helper function to format time ago
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  // Format time
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get current date
  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardWrapper style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      {/* Header */}
      <Header>
        <HeaderLeft>
          <div className="hospital-icon">🏥</div>
          <h1>
            {orgName.split(' ')[0]} <span>{orgName.split(' ').slice(1).join(' ') || 'Hospital'}</span>
          </h1>
          <div className="subtitle">Dashboard Overview • {getCurrentDate()}</div>
        </HeaderLeft>
        <HeaderRight>
          <PrimaryButton icon={<PlusOutlined />} onClick={() => navigate('/patients/new')}>
            New Patient
          </PrimaryButton>
          <SecondaryButton icon={<FileTextOutlined />} onClick={() => navigate('/admin/reports')}>
            Reports
          </SecondaryButton>
        </HeaderRight>
      </Header>

      {/* Navigation Tabs */}
      <NavTabs>
        <NavTab $active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
          <DashboardOutlined /> Overview
        </NavTab>
        <NavTab $active={activeTab === 'patients'} onClick={() => setActiveTab('patients')}>
          <UserOutlined /> Patients
        </NavTab>
        <NavTab $active={activeTab === 'appointments'} onClick={() => setActiveTab('appointments')}>
          <CalendarOutlined /> Appointments
        </NavTab>
        <NavTab $active={activeTab === 'staff'} onClick={() => setActiveTab('staff')}>
          <TeamOutlined /> Staff
        </NavTab>
        <NavTab $active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')}>
          <MedicineBoxOutlined /> Inventory
        </NavTab>
      </NavTabs>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* KPI Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <KPICard $color="rgba(30, 58, 95, 0.2)">
                <div className="kpi-header">
                  <span className="kpi-title">Total Patients</span>
                  <div className="kpi-icon">👥</div>
                </div>
                <div className="kpi-value">{data.totalPatients.toLocaleString()}</div>
                <div className="kpi-change" style={{ color: '#888' }}>
                  Registered in system
                </div>
              </KPICard>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <KPICard>
                <div className="kpi-header">
                  <span className="kpi-title">Bed Occupancy</span>
                  <div className="kpi-icon" style={{ background: 'rgba(96, 165, 250, 0.2)' }}>🛏️</div>
                </div>
                <div className="kpi-value">{data.bedOccupancy}%</div>
                <Progress
                  percent={data.bedOccupancy}
                  showInfo={false}
                  strokeColor={{ from: '#10B981', to: '#1E3A5F' }}
                  className="kpi-progress"
                />
                <div className="kpi-change" style={{ color: '#888', marginTop: 4 }}>
                  {data.occupiedBeds}/{data.totalBeds} beds occupied
                </div>
              </KPICard>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <KPICard>
                <div className="kpi-header">
                  <span className="kpi-title">Emergency Cases</span>
                  <div className="kpi-icon" style={{ background: 'rgba(239, 68, 68, 0.2)' }}>🚨</div>
                </div>
                <div className="kpi-value">{data.emergencyCases}</div>
                <div className="kpi-change" style={{ color: '#888' }}>
                  Active requests
                </div>
              </KPICard>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <KPICard>
                <div className="kpi-header">
                  <span className="kpi-title">Pending Discharge</span>
                  <div className="kpi-icon" style={{ background: 'rgba(168, 85, 247, 0.2)' }}>📋</div>
                </div>
                <div className="kpi-value">{data.pendingDischarges}</div>
                <div className="kpi-change" style={{ color: '#888' }}>
                  Ready for checkout
                </div>
              </KPICard>
            </Col>
          </Row>

          {/* Main Content Grid */}
          <Row gutter={[16, 16]}>
            {/* Today's Appointments */}
            <Col xs={24} lg={12}>
              <GlassCard>
                <div className="card-header">
                  <div className="card-title">
                    <CalendarOutlined className="title-icon" />
                    Today's Appointments
                  </div>
                  <div className="view-all" onClick={() => navigate('/admin/appointments')}>
                    View All <ArrowRightOutlined />
                  </div>
                </div>
                <div className="card-body">
                  {data.todayAppointments.length > 0 ? (
                    data.todayAppointments.map((appt: any) => (
                      <AppointmentItem key={appt.id}>
                        <div className="patient-info">
                          <div className="avatar">
                            {(appt.patient?.firstName?.[0] || 'P').toUpperCase()}
                          </div>
                          <div className="details">
                            <div className="name">
                              {appt.patient?.firstName || 'Patient'} {appt.patient?.lastName || ''}
                            </div>
                            <div className="doctor">
                              Dr. {appt.doctor?.firstName || 'Doctor'} {appt.doctor?.lastName || ''}
                            </div>
                          </div>
                        </div>
                        <div className="time-info">
                          <div className="time">{formatTime(appt.startTime)}</div>
                          <div className="department">{appt.service?.name || 'General'}</div>
                        </div>
                        <StatusBadge $status={appt.status || 'pending'}>
                          {appt.status || 'Pending'}
                        </StatusBadge>
                      </AppointmentItem>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                      No appointments scheduled for today
                    </div>
                  )}
                </div>
              </GlassCard>
            </Col>

            {/* Alerts & Notifications */}
            <Col xs={24} lg={12}>
              <GlassCard>
                <div className="card-header">
                  <div className="card-title">
                    <BellOutlined className="title-icon" />
                    Alerts & Notifications
                  </div>
                </div>
                <div className="card-body">
                  {data.alerts.length > 0 ? data.alerts.map((alert: any) => (
                    <AlertItem key={alert.id} $severity={alert.severity}>
                      <AlertOutlined />
                      <div className="alert-content">
                        <div className="alert-title">{alert.title}</div>
                        <div className="alert-time">{alert.time}</div>
                      </div>
                    </AlertItem>
                  )) : (
                    <div style={{ textAlign: 'center', padding: 20, color: '#888' }}>
                      No alerts at this time
                    </div>
                  )}
                </div>
              </GlassCard>
            </Col>
          </Row>

          {/* Second Row */}
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            {/* Department Status */}
            <Col xs={24} lg={8}>
              <GlassCard>
                <div className="card-header">
                  <div className="card-title">
                    <MedicineBoxOutlined className="title-icon" />
                    Department Status
                  </div>
                </div>
                <div className="card-body">
                  {data.departmentPerformance.length > 0 ? (
                    data.departmentPerformance.map((dept: any, idx: number) => (
                      <DepartmentItem key={dept.id || idx}>
                        <div className="dept-header">
                          <span className="dept-name">{dept.department || dept.name}</span>
                          <span className="dept-count">{dept.appointments || 0}/{dept.patients || 0}</span>
                        </div>
                        <Progress
                          percent={dept.utilization || 0}
                          showInfo={false}
                          strokeColor={['#10B981', '#1E3A5F', '#fbbf24', '#60a5fa', '#4ade80'][idx % 5]}
                          size="small"
                        />
                      </DepartmentItem>
                    ))
                  ) : data.departments.length > 0 ? (
                    data.departments.map((dept: any, idx: number) => (
                      <DepartmentItem key={dept.id || idx}>
                        <div className="dept-header">
                          <span className="dept-name">{dept.name}</span>
                          <span className="dept-count">0/0</span>
                        </div>
                        <Progress
                          percent={0}
                          showInfo={false}
                          strokeColor={['#10B981', '#1E3A5F', '#fbbf24', '#60a5fa', '#4ade80'][idx % 5]}
                          size="small"
                        />
                      </DepartmentItem>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: 20, color: '#888' }}>
                      No departments configured
                    </div>
                  )}
                </div>
              </GlassCard>
            </Col>

            {/* Doctors on Duty */}
            <Col xs={24} lg={8}>
              <GlassCard>
                <div className="card-header">
                  <div className="card-title">
                    <TeamOutlined className="title-icon" />
                    Doctors on Duty
                  </div>
                </div>
                <div className="card-body">
                  {data.doctors.length > 0 ? (
                    data.doctors.slice(0, 4).map((doc: any, idx: number) => (
                      <DoctorItem key={doc.id || idx}>
                        <div className="doctor-info">
                          <div className="avatar">
                            {(doc.firstName?.[0] || 'D').toUpperCase()}
                          </div>
                          <div className="details">
                            <div className="name">Dr. {doc.firstName} {doc.lastName}</div>
                            <div className="specialty">{doc.specialization || doc.department?.name || 'General'}</div>
                          </div>
                        </div>
                        <div className="status-info">
                          <div className={`status ${doc.isActive === false ? 'break' : 'available'}`}>
                            <span className="status-dot"></span>
                            {doc.isActive === false ? 'Unavailable' : 'Available'}
                          </div>
                          <div className="patients">{doc.department?.name || 'General'}</div>
                        </div>
                      </DoctorItem>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                      No doctors data available
                    </div>
                  )}
                </div>
              </GlassCard>
            </Col>

            {/* Recent Activity */}
            <Col xs={24} lg={8}>
              <GlassCard>
                <div className="card-header">
                  <div className="card-title">
                    <FileTextOutlined className="title-icon" />
                    Recent Activity
                  </div>
                </div>
                <div className="card-body">
                  {data.recentActivities.length > 0 ? data.recentActivities.map((activity: any) => (
                    <ActivityItem key={activity.id}>
                      <div className={`activity-icon ${activity.type}`}>
                        {activity.type === 'admission' && '🏥'}
                        {activity.type === 'surgery' && '✅'}
                        {activity.type === 'lab' && '🧪'}
                        {activity.type === 'discharge' && '👋'}
                      </div>
                      <div className="activity-content">
                        <div className="activity-title">{activity.title}</div>
                        <div className="activity-desc">{activity.desc}</div>
                      </div>
                      <div className="activity-time">{activity.time}</div>
                    </ActivityItem>
                  )) : (
                    <div style={{ textAlign: 'center', padding: 20, color: '#888' }}>
                      No recent activity
                    </div>
                  )}
                </div>
              </GlassCard>
            </Col>
          </Row>

          {/* Bottom Stats */}
          <BottomStats>
            <div className="stat-item">
              <div className="stat-label">Inpatients</div>
              <div className="stat-value">{data.inpatients}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Outpatients</div>
              <div className="stat-value">{data.outpatients}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Surgeries Today</div>
              <div className="stat-value">{data.surgeriesToday}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Lab Tests Pending</div>
              <div className="stat-value">{data.labTestsPending}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Revenue Today</div>
              <div className="stat-value revenue">${(data.revenueToday / 1000).toFixed(1)}K</div>
            </div>
          </BottomStats>
        </>
      )}

      {/* Patients Tab Content */}
      {activeTab === 'patients' && (
        <>
          <GlassCard style={{ marginTop: 0 }}>
            <div className="card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <div className="card-title">
                <UserOutlined className="title-icon" />
                Patient Management
              </div>
            </div>

            {/* Integrated Toolbar */}
            <div style={{ padding: '0 20px 20px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <NavTabs style={{ margin: 0, width: '100%' }}>
                <NavTab $active={patientFilter === 'all'} onClick={() => setPatientFilter('all')}>
                  <TeamOutlined /> All Patients
                </NavTab>
                <NavTab $active={patientFilter === 'inpatient'} onClick={() => setPatientFilter('inpatient')}>
                  <MedicineBoxOutlined /> Inpatients (IPD)
                </NavTab>
                <NavTab $active={patientFilter === 'outpatient'} onClick={() => setPatientFilter('outpatient')}>
                  <UserOutlined /> Outpatients (OPD)
                </NavTab>
                <NavTab $active={patientFilter === 'emergency'} onClick={() => setPatientFilter('emergency')}>
                  <AlertOutlined /> Emergency
                </NavTab>
                <NavTab $active={patientFilter === 'discharged'} onClick={() => setPatientFilter('discharged')}>
                  <CheckCircleOutlined /> Discharged
                </NavTab>
              </NavTabs>
            </div>

            <div className="card-body" style={{ padding: 0 }}>
              <Table
                dataSource={data.patients}
                rowKey="id"
                pagination={false}
                columns={[
                  {
                    title: 'Name',
                    dataIndex: 'firstName',
                    render: (_, record: any) => (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar src={record.profilePicture} icon={<UserOutlined />} style={{ backgroundColor: '#fdedef', color: '#10B981' }} />
                        <Typography.Text strong>{record.firstName} {record.lastName}</Typography.Text>
                      </div>
                    )
                  },
                  {
                    title: 'Email',
                    dataIndex: 'email',
                    responsive: ['md'],
                  },
                  {
                    title: 'Phone',
                    dataIndex: 'phone',
                  },
                  {
                    title: 'Action',
                    key: 'action',
                    render: (_, record: any) => (
                      <Button type="link" size="small" style={{ color: '#10B981' }} onClick={() => navigate(`/patients/${record.id}`)}>
                        View Details
                      </Button>
                    ),
                  },
                ]}
                // Custom Empty State
                locale={{
                  emptyText: (
                    <div style={{ padding: '40px 0', textAlign: 'center' }}>
                      <div style={{
                        width: 80,
                        height: 80,
                        background: 'linear-gradient(135deg, #EFF6FF, #fff)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        boxShadow: '0 4px 15px rgba(30, 58, 95, 0.1)'
                      }}>
                        <TeamOutlined style={{ fontSize: 32, color: '#10B981' }} />
                      </div>
                      <Typography.Text strong style={{ fontSize: 16, display: 'block', color: '#1a1a2e' }}>
                        No patients found
                      </Typography.Text>
                      <Typography.Text type="secondary">
                        {patientFilter === 'all'
                          ? 'Get started by adding a new patient.'
                          : `No patients found in the "${patientFilter}" category.`}
                      </Typography.Text>
                      {patientFilter === 'all' && (
                        <div style={{ marginTop: 16 }}>
                          <PrimaryButton icon={<PlusOutlined />} onClick={() => navigate('/patients/new')}>
                            Add New Patient
                          </PrimaryButton>
                        </div>
                      )}
                    </div>
                  )
                }}
              />
              <div style={{ padding: 16, textAlign: 'center', borderTop: '1px solid #eee' }}>
                <Button type="link" style={{ color: '#10B981' }} onClick={() => navigate('/patients')}>View All Patients</Button>
              </div>
            </div>
          </GlassCard>
        </>
      )}

      {/* Appointments Tab Content */}
      {activeTab === 'appointments' && (
        <GlassCard style={{ marginTop: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <CalendarOutlined className="title-icon" />
              Today's Appointments
            </div>
            {/* Removed duplicate Book Appointment button here */}
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <Table
              dataSource={data.todayAppointments}
              rowKey="id"
              pagination={false}
              columns={[
                {
                  title: 'Time',
                  dataIndex: 'startTime',
                  render: (time) => formatTime(time),
                  width: 100
                },
                {
                  title: 'Patient',
                  dataIndex: ['patient', 'firstName'], // nested access
                  render: (_, record: any) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar icon={<UserOutlined />} size="small" style={{ backgroundColor: '#fdedef', color: '#10B981' }} />
                      <Typography.Text>{record.patient?.firstName} {record.patient?.lastName}</Typography.Text>
                    </div>
                  )
                },
                {
                  title: 'Doctor',
                  dataIndex: 'doctor',
                  responsive: ['md'],
                  render: (doc: any) => (
                    <Typography.Text type="secondary">Dr. {doc?.firstName} {doc?.lastName}</Typography.Text>
                  )
                },
                {
                  title: 'Type',
                  dataIndex: 'type',
                  render: (type, record: any) => (
                    <Tag color={type === 'surgery' || record.service?.name?.toLowerCase().includes('surgery') ? '#10B981' : 'magenta'}>
                      {type || 'General'}
                    </Tag>
                  )
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  render: (status) => (
                    <Badge status={status === 'confirmed' ? 'success' : 'processing'} text={status} />
                  )
                },
                {
                  title: 'Action',
                  key: 'action',
                  render: (_, record: any) => (
                    <Button type="link" size="small" style={{ color: '#10B981' }} onClick={() => navigate(`/admin/appointments`)}>
                      View
                    </Button>
                  ),
                },
              ]}
            />
            <div style={{ padding: 16, textAlign: 'center', borderTop: '1px solid #eee' }}>
              <Button type="link" style={{ color: '#10B981' }} onClick={() => navigate('/admin/appointments')}>View All Appointments</Button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Staff Tab Content */}
      {activeTab === 'staff' && (
        <GlassCard style={{ marginTop: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <TeamOutlined className="title-icon" />
              Staff Management
            </div>
            {/* Removed duplicate Add Staff button here */}
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <Table
              dataSource={data.doctors}
              rowKey="id"
              pagination={false}
              columns={[
                {
                  title: 'Name',
                  dataIndex: 'firstName',
                  render: (_, record: any) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar src={record.profilePicture} style={{ backgroundColor: '#fdedef', color: '#10B981' }}>{record.firstName[0]}</Avatar>
                      <div>
                        <Typography.Text strong style={{ display: 'block' }}>Dr. {record.firstName} {record.lastName}</Typography.Text>
                        <Typography.Text type="secondary" style={{ fontSize: 11 }}>{record.specialization || 'General'}</Typography.Text>
                      </div>
                    </div>
                  )
                },
                {
                  title: 'Department',
                  dataIndex: ['department', 'name'],
                  responsive: ['md'],
                },
                {
                  title: 'Status',
                  key: 'status',
                  render: (_, record: any) => (
                    <Badge status={record.isActive ? 'success' : 'default'} text={record.isActive ? 'Active' : 'Inactive'} />
                  )
                },
                {
                  title: 'Action',
                  key: 'action',
                  render: (_, record: any) => (
                    <Button type="link" size="small" style={{ color: '#10B981' }} onClick={() => navigate(`/admin/doctors`)}>
                      Profile
                    </Button>
                  ),
                },
              ]}
            />
            <div style={{ padding: 16, textAlign: 'center', borderTop: '1px solid #eee' }}>
              <Button type="link" style={{ color: '#10B981' }} onClick={() => navigate('/admin/doctors')}>View All Staff</Button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Inventory Tab Content */}
      {activeTab === 'inventory' && (
        <GlassCard style={{ marginTop: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <MedicineBoxOutlined className="title-icon" />
              Inventory & Pharmacy
            </div>
            <PrimaryButton icon={<PlusOutlined />} onClick={() => navigate('/pharmacy/medicines')}>
              Add Medicine
            </PrimaryButton>
          </div>
          <div className="card-body" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💊</div>
            <Typography.Title level={4} style={{ color: '#1a1a2e', marginBottom: 8 }}>
              Pharmacy & Inventory Management
            </Typography.Title>
            <Typography.Text style={{ color: '#888', display: 'block', marginBottom: 24 }}>
              Manage medicines, supplies, and inventory levels
            </Typography.Text>
            <Space>
              <PrimaryButton onClick={() => navigate('/pharmacy')}>Pharmacy Dashboard</PrimaryButton>
              <SecondaryButton onClick={() => navigate('/pharmacy/inventory')}>View Inventory</SecondaryButton>
            </Space>
          </div>
        </GlassCard>
      )}

    </DashboardWrapper>
  );
};

export default PremiumDashboard;
