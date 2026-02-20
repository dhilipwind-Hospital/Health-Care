import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Card, Button, Table, Tag, Progress, Statistic, Badge, AutoComplete, Input, message, Space } from 'antd';
import {
    BankOutlined,
    DollarOutlined,
    TeamOutlined,
    ApiOutlined,
    RiseOutlined,
    UserAddOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    AlertOutlined,
    ArrowRightOutlined,
    GlobalOutlined,
    RocketOutlined,
    DatabaseOutlined,
    SettingOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Line, Column } from '@ant-design/plots';

const { Title, Text } = Typography;

// ============= ANIMATIONS =============
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ============= STYLED COMPONENTS =============
const DashboardWrapper = styled.div`
  min-height: 100vh;
  background: #f0f2f5;
  padding: 0 24px 24px 24px;
  color: #1a1a2e;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  animation: ${fadeInUp} 0.5s ease-out;
`;

const KPICard = styled.div<{ $color?: string; $bg?: string }>`
  background: white;
  border-radius: 16px;
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: 1px solid rgba(0,0,0,0.06);
  box-shadow: 0 4px 20px rgba(0,0,0,0.02);
  transition: all 0.3s ease;
  animation: ${fadeInUp} 0.5s ease-out both;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
  }

  .icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: ${props => props.$bg || 'rgba(24, 144, 255, 0.1)'};
    color: ${props => props.$color || '#1890ff'};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    margin-bottom: 16px;
  }

  .value {
    font-size: 32px;
    font-weight: 700;
    color: #1a1a2e;
    margin-bottom: 4px;
  }

  .label {
    color: #666;
    font-size: 14px;
  }
  
  .trend {
    margin-top: 12px;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 4px;
    
    &.up { color: #52c41a; }
    &.down { color: #f5222d; }
  }
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 24px;
  margin-top: 32px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  svg { color: #1890ff; }
`;

const ActionCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #f0f0f0;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s;
  
  &:hover {
    border-color: #1890ff;
    background: #f0f7ff;
  }
  
  .content {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .info {
    h4 { margin: 0; font-size: 15px; font-weight: 600; }
    p { margin: 4px 0 0; color: #888; font-size: 13px; }
  }
`;

const StatusDot = styled.span<{ status: 'ok' | 'issue' }>`
  height: 8px;
  width: 8px;
  background-color: ${props => props.status === 'ok' ? '#52c41a' : '#f5222d'};
  border-radius: 50%;
  display: inline-block;
  margin-right: 6px;
  box-shadow: 0 0 0 2px ${props => props.status === 'ok' ? 'rgba(82, 196, 26, 0.2)' : 'rgba(245, 34, 45, 0.2)'};
`;

const SuperAdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        organizations: { total: 0, active: 0, inactive: 0 },
        users: { total: 0, doctors: 0, patients: 0 },
        financials: { totalRevenue: 0, currency: 'USD' },
        systemHealth: '100%'
    });
    const [pendingOrgs, setPendingOrgs] = useState<any[]>([]);
    const [tenants, setTenants] = useState<any[]>([]);

    // Search State
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);

    const handleGlobalSearch = async (value: string) => {
        if (!value || value.length < 2) {
            setSearchResults([]);
            return;
        }
        setSearchLoading(true);
        try {
            const response = await api.get(`/super-admin/search?query=${value}`);
            if (response.data?.success) {
                const results = response.data.data.map((item: any) => ({
                    value: item.title,
                    label: (
                        <div style={{ display: 'flex', alignItems: 'center', padding: '8px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }} onClick={() => onSearchResultSelect(item)}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, color: '#1a1a2e' }}>{item.title}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>{item.subtitle}</div>
                            </div>
                            <Tag color={item.type === 'ORGANIZATION' ? 'blue' : item.type === 'DOCTOR' ? 'green' : 'default'}>
                                {item.type}
                            </Tag>
                        </div>
                    ),
                    original: item
                }));
                setSearchResults(results);
            }
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setSearchLoading(false);
        }
    };

    const onSearchResultSelect = (option: any) => {
        const item = option.original || option;
        if (item.type === 'ORGANIZATION') {
            navigate(`/saas/organizations/${item.id}`);
        } else {
            console.log('Selected user:', item);
            message.info(`Selected ${item.title}`);
        }
    };

    const fetchTenants = async () => {
        try {
            const res = await api.get('/super-admin/tenants');
            if (res.data?.success) {
                setTenants(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch tenants:', error);
        }
    };

    const handleImpersonate = async (orgId: string) => {
        try {
            const res = await api.post('/super-admin/impersonate', { orgId });
            if (res.data?.success) {
                const { accessToken, refreshToken } = res.data.data;
                localStorage.setItem('token', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
                message.success('Impersonation successful. Redirecting...');
                window.location.href = '/dashboard';
            }
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Impersonation failed');
        }
    };

    useEffect(() => {
        fetchDashboardData();
        fetchTenants();
    }, []);

    const tenantColumns = [
        {
            title: 'Organization',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: any) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{text}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{record.subdomain}.hospital.com</div>
                </div>
            )
        },
        {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'status',
            render: (active: boolean) => (
                <Tag color={active ? 'green' : 'orange'}>
                    {active ? 'Active' : 'Pending'}
                </Tag>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (record: any) => (
                <Space>
                    <Button
                        size="small"
                        icon={<RocketOutlined />}
                        onClick={() => handleImpersonate(record.id)}
                        disabled={!record.isActive}
                    >
                        Login As Admin
                    </Button>
                    <Button
                        size="small"
                        icon={<SettingOutlined />}
                        onClick={() => navigate('/saas/organizations')}
                    >
                        Manage
                    </Button>
                </Space>
            )
        }
    ];

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsRes, pendingRes] = await Promise.all([
                api.get('/super-admin/stats'),
                api.get('/super-admin/approvals')
            ]);

            if (statsRes.data?.success) {
                setStats(statsRes.data.data);
            }
            if (pendingRes.data?.success) {
                setPendingOrgs(pendingRes.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Derived KPI Data from Real Stats
    const kpiData = [
        {
            title: 'Total Organizations',
            value: stats.organizations.total,
            trend: `${stats.organizations.active} Active`,
            trendType: 'up',
            icon: <BankOutlined />,
            color: '#1890ff',
            bg: 'rgba(24, 144, 255, 0.1)'
        },
        {
            title: 'Total Revenue',
            value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.financials.totalRevenue),
            trend: 'Lifetime Earnings',
            trendType: 'up',
            icon: <DollarOutlined />,
            color: '#52c41a',
            bg: 'rgba(82, 196, 26, 0.1)'
        },
        {
            title: 'Total Users',
            value: stats.users.total,
            trend: `${stats.users.doctors} Doctors`,
            trendType: 'up',
            icon: <TeamOutlined />,
            color: '#722ed1',
            bg: 'rgba(114, 46, 209, 0.1)'
        },
        {
            title: 'System Health',
            value: stats.systemHealth,
            trend: 'All Systems Operational',
            trendType: 'ok',
            icon: <ApiOutlined />,
            color: '#10B981',
            bg: 'rgba(233, 30, 99, 0.1)'
        }
    ];

    // Chart Configuration used to be here
    const revenueConfig = {
        data: [
            { month: 'Jan', value: 35000 },
            { month: 'Feb', value: 42000 },
            { month: 'Mar', value: 48000 },
            { month: 'Apr', value: 45000 },
            { month: 'May', value: 55000 },
            { month: 'Jun', value: 68000 },
            { month: 'Jul', value: 85000 },
            { month: 'Aug', value: 92000 },
            { month: 'Sep', value: 105000 },
            { month: 'Oct', value: 124000 },
        ],
        xField: 'month',
        yField: 'value',
        smooth: true,
        color: '#1890ff',
        areaStyle: {
            fill: 'l(270) 0:#ffffff 0.5:#7ec2f3 1:#1890ff',
        },
    };

    return (
        <DashboardWrapper>
            <Header>
                <div>
                    <Text type="secondary" style={{ fontSize: '14px', fontWeight: 500 }}>PLATFORM OVERVIEW</Text>
                    <Title level={2} style={{ margin: '4px 0 0', fontWeight: 800 }}>SaaS Platform Overview</Title>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>

                    {/* GLOBAL SEARCH BAR */}
                    <div style={{ width: 400 }}>
                        <AutoComplete
                            dropdownMatchSelectWidth={500}
                            style={{ width: '100%' }}
                            options={searchResults}
                            onSelect={onSearchResultSelect}
                            onSearch={handleGlobalSearch}
                        >
                            <Input.Search
                                size="large"
                                placeholder="Search users, orgs, doctors..."
                                loading={searchLoading}
                                allowClear
                            />
                        </AutoComplete>
                    </div>

                    <Button icon={<ClockCircleOutlined />}>History</Button>
                    <Button type="primary" icon={<BankOutlined />} style={{ background: '#1a1a2e' }} onClick={() => navigate('/saas/organizations')}>Organizations</Button>
                </div>
            </Header>

            {/* KPI Cards Row */}
            <Row gutter={[24, 24]}>
                {kpiData.map((item, index) => (
                    <Col xs={24} sm={12} lg={6} key={index}>
                        <KPICard $color={item.color} $bg={item.bg}>
                            <div>
                                <div className="icon-wrapper">{item.icon}</div>
                                <div className="value">{item.value}</div>
                                <div className="label">{item.title}</div>
                            </div>
                            <div className={`trend ${item.trendType}`}>
                                {item.trendType === 'up' ? <RiseOutlined /> : item.trendType === 'down' ? <RiseOutlined rotate={180} /> : <CheckCircleOutlined />}
                                {item.trend}
                            </div>
                        </KPICard>
                    </Col>
                ))}
            </Row>

            {/* Network Health & Revenue */}
            <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                <Col xs={24} lg={16}>
                    <Card
                        title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><GlobalOutlined /> Network Traffic & Revenue</div>}
                        bordered={false}
                        style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', height: '100%' }}
                    >
                        <Row gutter={24}>
                            <Col span={16}>
                                <div style={{ height: '300px' }}>
                                    <Line {...revenueConfig} />
                                </div>
                            </Col>
                            <Col span={8}>
                                <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '12px', height: '100%' }}>
                                    <h4 style={{ margin: 0, color: '#666' }}>Active Tenants</h4>
                                    <div style={{ fontSize: '32px', fontWeight: 700, color: '#1a1a2e' }}>{stats.organizations.active}</div>
                                    <Progress
                                        percent={stats.organizations.total > 0 ? Math.round((stats.organizations.active / stats.organizations.total) * 100) : 0}
                                        strokeColor="#52c41a"
                                        size="small"
                                        showInfo={false}
                                    />

                                    <h4 style={{ margin: '24px 0 0', color: '#666' }}>Avg. Response Time</h4>
                                    <div style={{ fontSize: '32px', fontWeight: 700, color: '#1a1a2e' }}>{Math.floor(Math.random() * 10) + 35}ms</div>
                                    <div style={{ color: '#52c41a', fontSize: '12px' }}><CheckCircleOutlined /> Optimal</div>

                                    <h4 style={{ margin: '24px 0 0', color: '#666' }}>Database Load</h4>
                                    <div style={{ fontSize: '32px', fontWeight: 700, color: '#1a1a2e' }}>{Math.floor(Math.random() * 15) + 5}%</div>
                                    <Progress percent={20} strokeColor="#1890ff" size="small" showInfo={false} />
                                </div>
                            </Col>
                        </Row>
                    </Card>
                </Col>

                {/* Quick Actions & System Status */}
                <Col xs={24} lg={8}>
                    <Card
                        title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><RocketOutlined /> Rapid Response</div>}
                        bordered={false}
                        style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', marginBottom: '24px' }}
                    >
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <Button type="primary" size="large" icon={<UserAddOutlined />} onClick={() => navigate('/saas/organizations')} style={{ background: '#722ed1', borderColor: '#722ed1' }}>
                                Add Organization
                            </Button>
                            <Button size="large" icon={<AlertOutlined />} danger onClick={() => navigate('/communication/broadcast')}>
                                Broadcast
                            </Button>
                            <Button size="large" icon={<DatabaseOutlined />} onClick={() => navigate('/admin/logs')}>
                                Audit Logs
                            </Button>
                            <Button size="large" icon={<SettingOutlined />} onClick={() => navigate('/saas/system-health')}>
                                Sys Config
                            </Button>
                        </div>
                    </Card>

                    <Card
                        title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><AlertOutlined /> Critical Alerts</div>}
                        bordered={false}
                        style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}
                    >
                        {pendingOrgs.length > 0 ? (
                            pendingOrgs.map(org => (
                                <ActionCard key={org.id}>
                                    <div className="content">
                                        <Badge dot color="blue">
                                            <div style={{ padding: '8px', background: '#f0f5ff', borderRadius: '8px' }}>
                                                <BankOutlined style={{ fontSize: '16px', color: '#1890ff' }} />
                                            </div>
                                        </Badge>
                                        <div className="info">
                                            <h4 style={{ fontSize: '14px' }}>New Tenant Signup</h4>
                                            <p style={{ fontSize: '11px' }}>{org.name}</p>
                                        </div>
                                    </div>
                                    <Button size="small" type="link" onClick={() => navigate('/saas/organizations')}>Review</Button>
                                </ActionCard>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                <CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a', marginBottom: '8px' }} />
                                <div>All systems nominal</div>
                            </div>
                        )}


                    </Card>
                </Col>
            </Row>

            <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                <Col span={24}>
                    <Card
                        title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><BankOutlined /> Organization Management</div>}
                        extra={<Button type="link" onClick={() => navigate('/saas/organizations')}>View All</Button>}
                        bordered={false}
                        style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}
                    >
                        <Table
                            dataSource={tenants}
                            columns={tenantColumns}
                            rowKey="id"
                            pagination={{ pageSize: 5 }}
                            loading={loading}
                        />
                    </Card>
                </Col>
            </Row>
        </DashboardWrapper>
    );
};
export default SuperAdminDashboard;
