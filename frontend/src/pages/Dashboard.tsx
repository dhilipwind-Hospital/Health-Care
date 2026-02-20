import React, { useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Table, Tag, Button, Empty, message } from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  MedicineBoxOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useSelectedBranch } from '../hooks/useSelectedBranch';
import styled from 'styled-components';
import { useOrganizationData } from '../hooks/useOrganizationData';

import PremiumDashboard from './PremiumDashboard';

const { Title } = Typography;

// Premium animated keyframes
const pulseAnimation = `
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.9; }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
  @keyframes gradientFlow {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`;

const DashboardContainer = styled.div`
  ${pulseAnimation}
  
  .dashboard-header {
    margin-bottom: 24px;
  }
  
  .stat-card {
    text-align: center;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    
    .ant-statistic-title {
      font-size: 16px;
      color: #666;
    }
    
    .ant-statistic-content {
      font-size: 24px;
      font-weight: 600;
    }
  }
`;

// Premium glassmorphism card
const GlassCard = styled(Card)`
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(30, 58, 95, 0.1) !important;
  border-radius: 20px !important;
  box-shadow: 0 8px 32px rgba(30, 58, 95, 0.08), 
              0 2px 8px rgba(0, 0, 0, 0.04) !important;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 48px rgba(30, 58, 95, 0.15), 
                0 4px 16px rgba(0, 0, 0, 0.08) !important;
    border-color: rgba(30, 58, 95, 0.2) !important;
  }
  
  .ant-card-head {
    border-bottom: 1px solid rgba(30, 58, 95, 0.08);
    background: linear-gradient(135deg, rgba(30, 58, 95, 0.03) 0%, transparent 100%);
  }
  
  .ant-card-head-title {
    font-weight: 600;
    color: #1a1a2e;
  }
`;

// Animated welcome hero section
const WelcomeHero = styled.div`
  position: relative;
  padding: 48px 32px;
  text-align: center;
  background: linear-gradient(135deg, #ffffff 0%, #F8FAFC 50%, #EFF6FF 100%);
  border-radius: 24px;
  margin-bottom: 32px;
  overflow: hidden;
  border: 1px solid rgba(30, 58, 95, 0.1);
  box-shadow: 0 12px 40px rgba(30, 58, 95, 0.1);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #10B981, #3B82F6, #10B981, #10B981);
    background-size: 300% 100%;
    animation: gradientFlow 4s ease infinite;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, rgba(30, 58, 95, 0.05) 0%, transparent 70%);
    pointer-events: none;
  }
`;

const FloatingIcon = styled.div`
  width: 80px;
  height: 80px;
  background: #10B981;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  box-shadow: 0 12px 32px rgba(30, 58, 95, 0.35);
  animation: float 4s ease-in-out infinite;
  
  span {
    font-size: 40px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  }
`;

// Premium action button
const ActionButton = styled(Button)`
  height: 56px !important;
  border-radius: 14px !important;
  font-weight: 600 !important;
  font-size: 15px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  
  &.ant-btn-primary {
    background: #10B981 !important;
    border: none !important;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3) !important;
    
    &:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4) !important;
      background: #059669 !important;
    }
  }
  
  &:not(.ant-btn-primary) {
    border: 2px solid rgba(30, 58, 95, 0.3) !important;
    color: #10B981 !important;
    background: rgba(30, 58, 95, 0.04) !important;
    
    &:hover {
      background: rgba(30, 58, 95, 0.1) !important;
      border-color: #10B981 !important;
      transform: translateY(-2px);
    }
  }
`;

// Progress ring component
const ProgressRing = styled.div<{ progress: number }>`
  position: relative;
  width: 140px;
  height: 140px;
  margin: 0 auto 24px;
  
  svg {
    transform: rotate(-90deg);
  }
  
  .progress-bg {
    fill: none;
    stroke: #f5f5f5;
    stroke-width: 12;
  }
  
  .progress-bar {
    fill: none;
    stroke: url(#progressGradient);
    stroke-width: 12;
    stroke-linecap: round;
    stroke-dasharray: 377;
    stroke-dashoffset: ${props => 377 - (377 * props.progress) / 100};
    transition: stroke-dashoffset 1s ease;
  }
  
  .progress-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
  }
`;

// Stat card with animated number
const StatBox = styled.div`
  text-align: center;
  padding: 24px 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(30, 58, 95, 0.04) 0%, rgba(16, 185, 129, 0.02) 100%);
  border: 1px solid rgba(30, 58, 95, 0.08);
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(135deg, rgba(30, 58, 95, 0.08) 0%, rgba(16, 185, 129, 0.04) 100%);
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(30, 58, 95, 0.1);
  }
  
  .stat-value {
    font-size: 36px;
    font-weight: 700;
    color: #10B981;
    line-height: 1.2;
  }
  
  .stat-label {
    font-size: 14px;
    color: #8c8c8c;
    margin-top: 8px;
    font-weight: 500;
  }
`;

// Step item with left border accent
const StepItem = styled.div<{ color?: string }>`
  padding: 20px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(30, 58, 95, 0.08);
  border-radius: 12px;
  border-left: 4px solid ${props => props.color || '#10B981'};
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(30, 58, 95, 0.04);
    transform: translateX(8px);
    box-shadow: 0 4px 16px rgba(30, 58, 95, 0.08);
  }
`;

// Quick tip banner
const TipBanner = styled.div`
  padding: 16px 20px;
  background: linear-gradient(135deg, #EFF6FF 0%, #D1FAE5 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  border: 1px solid rgba(16, 185, 129, 0.15);
  
  .tip-icon {
    font-size: 24px;
    animation: pulse 2s ease-in-out infinite;
  }
  
  .tip-text {
    color: #047857;
    font-weight: 500;
    font-size: 14px;
  }
`;

// Resource link with icon
const ResourceLink = styled.div`
  padding: 14px 16px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #10B981;
  font-weight: 500;
  
  &:hover {
    background: rgba(30, 58, 95, 0.08);
    transform: translateX(4px);
  }
  
  .resource-icon {
    font-size: 20px;
  }
`;

const SpaceWrap = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
`;

type Appt = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  reason?: string;
  patient?: { id: string; firstName?: string; lastName?: string };
  service?: { id: string; name: string };
  doctor?: { id: string; firstName?: string; lastName?: string };
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { selectedBranchId } = useSelectedBranch();
  const navigate = useNavigate();
  const [msg, msgCtx] = message.useMessage();
  const role = String(user?.role || '').toLowerCase();
  const isDoctor = role === 'doctor';
  const isAdmin = role === 'admin' || role === 'super_admin';
  const { stats: orgStats, loading: orgLoading } = useOrganizationData();

  const [loading, setLoading] = React.useState(false);
  const [appts, setAppts] = React.useState<Appt[]>([]);
  const [adminStats, setAdminStats] = React.useState({ totalPatients: 0, todayAppointments: 0, pendingAppointments: 0, monthlyRevenue: 0, activeStaff: 0, departments: 0, bedOccupancy: 0, satisfaction: 0 });

  React.useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      try {
        if (isDoctor) {
          const params: any = { limit: 50 };
          if (selectedBranchId) {
            params.locationId = selectedBranchId;
          }
          const res = await api.get('/appointments/doctor/me', { params, suppressErrorToast: true } as any);
          if (!mounted) return;
          setAppts((res.data?.data as Appt[]) || []);
        } else {
          // Fetch admin statistics
          try {
            const commonParams = selectedBranchId ? { locationId: selectedBranchId } : {};
            
            const patientsRes = await api.get('/users', { params: { ...commonParams, role: 'patient', limit: 1 }, suppressErrorToast: true } as any);
            const appointmentsRes = await api.get('/appointments/admin', { params: { ...commonParams, limit: 100 }, suppressErrorToast: true } as any);
            const staffRes = await api.get('/users', { params: { ...commonParams, role: 'doctor,nurse,pharmacist,lab_technician,receptionist', status: 'active', limit: 1 }, suppressErrorToast: true } as any);
            const departmentsRes = await api.get('/departments', { params: { limit: 1 }, suppressErrorToast: true } as any);

            if (!mounted) return;

            console.log('Dashboard Data Debug:', {
              patients: patientsRes.data,
              appointments: appointmentsRes.data,
              staff: staffRes.data,
              departments: departmentsRes.data
            });

            const today = new Date();
            const allAppts = (appointmentsRes.data?.data as Appt[]) || [];
            const todayAppts = allAppts.filter(a => {
              const isSameDayCheck = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
              return isSameDayCheck(new Date(a.startTime), today);
            }).length;
            const pendingAppts = allAppts.filter(a => String(a.status).toLowerCase() === 'pending').length;

            setAdminStats({
              totalPatients: patientsRes.data?.pagination?.total || patientsRes.data?.total || 0,
              todayAppointments: todayAppts,
              pendingAppointments: pendingAppts,
              monthlyRevenue: 0,
              activeStaff: staffRes.data?.pagination?.total || staffRes.data?.total || 0,
              departments: departmentsRes.data?.pagination?.total || departmentsRes.data?.total || 0,
              bedOccupancy: 0,
              satisfaction: 0
            });
          } catch (e) {
            console.error('Failed to fetch admin stats:', e);
            setAdminStats({ totalPatients: 0, todayAppointments: 0, pendingAppointments: 0, monthlyRevenue: 0, activeStaff: 0, departments: 0, bedOccupancy: 0, satisfaction: 0 });
          }
        }
      } catch (_e) {
        if (mounted) msg.warning('Could not load dashboard data');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, [isDoctor, msg, selectedBranchId]); // Reload when branch changes

  const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const todayAppointments = appts.filter(a => isSameDay(new Date(a.startTime), new Date())).length;
  const pendingAppointments = appts.filter(a => String(a.status).toLowerCase() === 'pending').length;
  const totalPatients = Array.from(new Set(appts.map(a => a.patient?.id).filter(Boolean))).length;

  // Use real data for admin, calculated data for doctor
  const dashboardData = isAdmin ? adminStats : {
    totalPatients,
    todayAppointments,
    pendingAppointments,
    monthlyRevenue: null
  };

  // Super Admin Dashboard removed as per user request. 
  // Super Admins redirected to saas/organizations.


  // Show Premium Dashboard for all admins (including super_admin fallback if header not caught)
  // Super Admins will see data from the first active organization (set by tenant middleware)
  if (isAdmin && !orgLoading) {
    return <PremiumDashboard />;
  }

  // For doctors and other roles, show the original dashboard
  return (
    <DashboardContainer>
      {msgCtx}
      <div className="dashboard-header">
        <Title level={3}>Welcome back, {user?.firstName}!</Title>
        <Typography.Text type="secondary">
          Here's what's happening with your hospital today.
        </Typography.Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="Total Patients"
              value={dashboardData.totalPatients}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#10B981' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="Today's Appointments"
              value={dashboardData.todayAppointments}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="Pending Appointments"
              value={dashboardData.pendingAppointments}
              prefix={<MedicineBoxOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="Monthly Revenue"
              value={dashboardData.monthlyRevenue || 0}
              prefix={<DollarOutlined />}
              precision={0}
              valueStyle={{ color: '#10B981' }}
              suffix="USD"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={16}>
          <Card title="Recent Appointments" style={{ height: '100%' }} loading={loading}>
            {isDoctor ? (
              appts.length ? (
                <Table
                  size="small"
                  rowKey="id"
                  pagination={{ pageSize: 5 }}
                  dataSource={appts.slice(0, 10)}
                  columns={[
                    { title: 'Patient', dataIndex: ['patient', 'firstName'], key: 'patient', render: (_: any, r: Appt) => `${r.patient?.firstName || ''} ${r.patient?.lastName || ''}`.trim() || '-' },
                    { title: 'Service', dataIndex: ['service', 'name'], key: 'service', render: (v: any) => v || '-' },
                    { title: 'Start', dataIndex: 'startTime', key: 'start', render: (v: string) => new Date(v).toLocaleString() },
                    {
                      title: 'Status', dataIndex: 'status', key: 'status', render: (v: string) => {
                        const s = String(v).toLowerCase();
                        const color = s === 'pending' ? 'orange' : s === 'confirmed' ? 'green' : s === 'cancelled' ? 'red' : 'default';
                        return <Tag color={color}>{s.toUpperCase()}</Tag>;
                      }
                    },
                  ]}
                />
              ) : (
                <Empty description="No recent appointments">
                  <SpaceWrap>
                    <Button type="primary" onClick={() => navigate('/doctor/my-schedule')}>Add Availability</Button>
                    <Button onClick={() => navigate('/appointments/new')}>Create Appointment</Button>
                  </SpaceWrap>
                </Empty>
              )
            ) : (
              // Admin dashboard content
              <div>
                <Title level={5} style={{ color: '#10B981', marginBottom: 16 }}>Hospital Overview</Title>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <Statistic
                        title="Active Staff"
                        value={adminStats.activeStaff}
                        valueStyle={{ color: '#52c41a', fontSize: 18 }}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <Statistic
                        title="Departments"
                        value={adminStats.departments}
                        valueStyle={{ color: '#1890ff', fontSize: 18 }}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <Statistic
                        title="Bed Occupancy"
                        value={adminStats.bedOccupancy}
                        suffix="%"
                        valueStyle={{ color: '#faad14', fontSize: 18 }}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <Statistic
                        title="Satisfaction"
                        value={adminStats.satisfaction}
                        suffix="/5"
                        valueStyle={{ color: '#10B981', fontSize: 18 }}
                      />
                    </Card>
                  </Col>
                </Row>
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Quick Actions" style={{ height: '100%' }}>
            {isDoctor ? (
              <div style={{ display: 'grid', gap: 8 }}>
                <Button type="primary" onClick={() => navigate('/doctor/my-schedule')}>Add Availability</Button>
                <Button onClick={() => navigate('/appointments')}>View My Appointments</Button>
                <Button onClick={() => navigate('/doctor/my-patients')}>My Patients</Button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                <Button
                  type="primary"
                  onClick={() => navigate('/admin/appointments')}
                  style={{ background: '#10B981', borderColor: '#10B981' }}
                >
                  Manage Appointments
                </Button>
                <Button onClick={() => navigate('/patients')}>
                  View Patients
                </Button>
                <Button onClick={() => navigate('/admin/doctors')}>
                  Manage Staff
                </Button>
                <Button onClick={() => navigate('/admin/departments')}>
                  Departments
                </Button>
                <Button onClick={() => navigate('/admin/reports')}>
                  View Reports
                </Button>
                {role === 'super_admin' && (
                  <Button
                    onClick={() => navigate('/saas/organizations')}
                    style={{ borderColor: '#10B981', color: '#10B981' }}
                  >
                    SaaS Management
                  </Button>
                )}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </DashboardContainer>
  );
};

export default Dashboard;
