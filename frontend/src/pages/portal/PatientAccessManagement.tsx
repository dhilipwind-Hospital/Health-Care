import React, { useState, useEffect } from 'react';
import {
    Card,
    Table,
    Tag,
    Button,
    Typography,
    Space,
    message,
    Modal,
    Empty,
    Alert,
    Badge,
    Tooltip,
    Statistic,
    Row,
    Col,
    Progress,
    Divider
} from 'antd';
import {
    LockOutlined,
    UnlockOutlined,
    UserOutlined,
    BankOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined,
    SafetyOutlined,
    HistoryOutlined,
    ReloadOutlined,
    EyeOutlined,
    StopOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text, Paragraph } = Typography;

interface AccessGrant {
    id: string;
    status: 'pending' | 'approved' | 'rejected' | 'expired' | 'revoked';
    doctor: {
        id: string;
        name: string;
        email: string;
        organization: string;
    };
    reason: string;
    urgencyLevel: 'emergency' | 'urgent' | 'normal';
    requestedDuration: string;
    requestedAt: string;
    grantedAt: string | null;
    expiresAt: string | null;
    isActive: boolean;
    remainingTime: string | null;
    accessCount: number;
    lastAccessedAt: string | null;
    canRevoke: boolean;
}

const PatientAccessManagement: React.FC = () => {
    const [grants, setGrants] = useState<AccessGrant[]>([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({ pending: 0, active: 0, total: 0 });
    const [revokeModalOpen, setRevokeModalOpen] = useState(false);
    const [selectedGrant, setSelectedGrant] = useState<AccessGrant | null>(null);
    const [revoking, setRevoking] = useState(false);

    useEffect(() => {
        fetchGrants();
    }, []);

    const fetchGrants = async () => {
        try {
            setLoading(true);
            const response = await api.get('/access-grants/who-has-access', {
                params: { includeExpired: 'true' }
            });
            setGrants(response.data.data || []);
            setSummary(response.data.summary || { pending: 0, active: 0, total: 0 });
        } catch (error) {
            console.error('Failed to fetch access grants:', error);
            message.error('Failed to load access information');
        } finally {
            setLoading(false);
        }
    };

    const handleRevokeClick = (grant: AccessGrant) => {
        setSelectedGrant(grant);
        setRevokeModalOpen(true);
    };

    const handleRevoke = async () => {
        if (!selectedGrant) return;

        try {
            setRevoking(true);
            await api.post(`/access-grants/${selectedGrant.id}/revoke`);
            message.success('Access has been revoked successfully');
            setRevokeModalOpen(false);
            fetchGrants();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to revoke access');
        } finally {
            setRevoking(false);
        }
    };

    const getStatusTag = (status: string) => {
        const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
            pending: { color: 'processing', icon: <ClockCircleOutlined />, label: 'Pending Approval' },
            approved: { color: 'success', icon: <UnlockOutlined />, label: 'Access Granted' },
            rejected: { color: 'error', icon: <CloseCircleOutlined />, label: 'Denied' },
            expired: { color: 'default', icon: <ClockCircleOutlined />, label: 'Expired' },
            revoked: { color: 'warning', icon: <LockOutlined />, label: 'Revoked' }
        };
        const config = statusConfig[status] || statusConfig.pending;
        return (
            <Tag color={config.color} icon={config.icon}>
                {config.label}
            </Tag>
        );
    };

    const getUrgencyBadge = (urgency: string) => {
        if (urgency === 'emergency') {
            return <Badge status="error" text="Emergency" />;
        }
        if (urgency === 'urgent') {
            return <Badge status="warning" text="Urgent" />;
        }
        return <Badge status="default" text="Normal" />;
    };

    const columns = [
        {
            title: 'Doctor',
            key: 'doctor',
            render: (_: any, record: AccessGrant) => (
                <Space direction="vertical" size={2}>
                    <Space>
                        <UserOutlined style={{ color: '#6366f1' }} />
                        <Text strong>{record.doctor.name}</Text>
                    </Space>
                    <Space>
                        <BankOutlined style={{ color: '#9ca3af' }} />
                        <Text type="secondary" style={{ fontSize: 12 }}>{record.doctor.organization}</Text>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 11 }}>{record.doctor.email}</Text>
                </Space>
            )
        },
        {
            title: 'Status',
            key: 'status',
            render: (_: any, record: AccessGrant) => (
                <Space direction="vertical" size={4}>
                    {getStatusTag(record.status)}
                    {record.isActive && record.remainingTime && (
                        <Tooltip title="Time remaining until access expires">
                            <Text type="success" style={{ fontSize: 11 }}>
                                <ClockCircleOutlined /> {record.remainingTime}
                            </Text>
                        </Tooltip>
                    )}
                </Space>
            )
        },
        {
            title: 'Duration',
            key: 'duration',
            render: (_: any, record: AccessGrant) => (
                <Space direction="vertical" size={2}>
                    <Text>{record.requestedDuration}</Text>
                    {getUrgencyBadge(record.urgencyLevel)}
                </Space>
            )
        },
        {
            title: 'Access Details',
            key: 'accessDetails',
            render: (_: any, record: AccessGrant) => {
                if (record.status !== 'approved' && record.status !== 'revoked' && record.status !== 'expired') {
                    return <Text type="secondary">-</Text>;
                }
                return (
                    <Space direction="vertical" size={2}>
                        <Tooltip title="Number of times records were accessed">
                            <Space>
                                <EyeOutlined />
                                <Text>{record.accessCount} view{record.accessCount !== 1 ? 's' : ''}</Text>
                            </Space>
                        </Tooltip>
                        {record.lastAccessedAt && (
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                Last: {new Date(record.lastAccessedAt).toLocaleString()}
                            </Text>
                        )}
                    </Space>
                );
            }
        },
        {
            title: 'Requested',
            dataIndex: 'requestedAt',
            key: 'requestedAt',
            render: (date: string) => (
                <Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(date).toLocaleDateString()}
                </Text>
            )
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: AccessGrant) => {
                if (record.canRevoke) {
                    return (
                        <Button
                            danger
                            type="primary"
                            icon={<StopOutlined />}
                            onClick={() => handleRevokeClick(record)}
                        >
                            Revoke
                        </Button>
                    );
                }
                return null;
            }
        }
    ];

    const activeGrants = grants.filter(g => g.isActive);
    const pendingGrants = grants.filter(g => g.status === 'pending');

    return (
        <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <Title level={2} style={{ marginBottom: 8 }}>
                    <SafetyOutlined style={{ marginRight: 12, color: '#6366f1' }} />
                    Who Has Access to My Records?
                </Title>
                <Paragraph type="secondary">
                    Manage and control which doctors from other hospitals can view your medical records.
                    You can revoke access at any time.
                </Paragraph>
            </div>

            {/* Statistics */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Pending Requests"
                            value={summary.pending}
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{ color: summary.pending > 0 ? '#f59e0b' : undefined }}
                        />
                        {summary.pending > 0 && (
                            <Alert
                                message={`${summary.pending} doctor(s) waiting for your approval`}
                                type="warning"
                                showIcon
                                style={{ marginTop: 12 }}
                            />
                        )}
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Active Access"
                            value={summary.active}
                            prefix={<UnlockOutlined />}
                            valueStyle={{ color: summary.active > 0 ? '#10b981' : undefined }}
                        />
                        {summary.active > 0 && (
                            <Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
                                Doctors currently able to view your records
                            </Text>
                        )}
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Total Requests"
                            value={summary.total}
                            prefix={<HistoryOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Pending Requests Alert */}
            {pendingGrants.length > 0 && (
                <Alert
                    message="Pending Access Requests"
                    description={
                        <div>
                            <Paragraph style={{ marginBottom: 8 }}>
                                The following doctors are requesting access to your medical records.
                                Check your email to approve or deny these requests.
                            </Paragraph>
                            {pendingGrants.map(g => (
                                <div key={g.id} style={{ marginBottom: 8 }}>
                                    <Text strong>{g.doctor.name}</Text>
                                    <Text type="secondary"> from {g.doctor.organization}</Text>
                                    {g.urgencyLevel !== 'normal' && (
                                        <Tag color={g.urgencyLevel === 'emergency' ? 'red' : 'orange'} style={{ marginLeft: 8 }}>
                                            {g.urgencyLevel === 'emergency' ? '🚨 Emergency' : '⚡ Urgent'}
                                        </Tag>
                                    )}
                                </div>
                            ))}
                        </div>
                    }
                    type="warning"
                    showIcon
                    icon={<ExclamationCircleOutlined />}
                    style={{ marginBottom: 24 }}
                />
            )}

            {/* Active Access */}
            {activeGrants.length > 0 && (
                <Card
                    title={
                        <Space>
                            <UnlockOutlined style={{ color: '#10b981' }} />
                            <span>Currently Active Access</span>
                        </Space>
                    }
                    style={{ marginBottom: 24 }}
                >
                    <Row gutter={16}>
                        {activeGrants.map(grant => (
                            <Col span={8} key={grant.id}>
                                <Card
                                    size="small"
                                    style={{
                                        borderLeft: '4px solid #10b981',
                                        background: '#f0fdf4'
                                    }}
                                    actions={[
                                        <Button
                                            danger
                                            size="small"
                                            icon={<StopOutlined />}
                                            onClick={() => handleRevokeClick(grant)}
                                        >
                                            Revoke Access
                                        </Button>
                                    ]}
                                >
                                    <Space direction="vertical" size={4}>
                                        <Text strong>{grant.doctor.name}</Text>
                                        <Text type="secondary" style={{ fontSize: 12 }}>{grant.doctor.organization}</Text>
                                        <Divider style={{ margin: '8px 0' }} />
                                        <Space>
                                            <ClockCircleOutlined />
                                            <Text type="success">{grant.remainingTime}</Text>
                                        </Space>
                                        <Space>
                                            <EyeOutlined />
                                            <Text>{grant.accessCount} views</Text>
                                        </Space>
                                    </Space>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Card>
            )}

            {/* All Requests Table */}
            <Card
                title={
                    <Space>
                        <HistoryOutlined />
                        <span>Access History</span>
                    </Space>
                }
                extra={
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={fetchGrants}
                        loading={loading}
                    >
                        Refresh
                    </Button>
                }
            >
                <Table
                    dataSource={grants}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    expandable={{
                        expandedRowRender: (record) => (
                            <div style={{ padding: '12px 24px', background: '#fafafa', borderRadius: 8 }}>
                                <Text strong>Reason for Access Request:</Text>
                                <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>{record.reason}</Paragraph>
                                {record.grantedAt && (
                                    <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                                        Access granted on: {new Date(record.grantedAt).toLocaleString()}
                                    </Text>
                                )}
                                {record.expiresAt && (
                                    <Text type="secondary" style={{ display: 'block' }}>
                                        Expires on: {new Date(record.expiresAt).toLocaleString()}
                                    </Text>
                                )}
                            </div>
                        )
                    }}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={
                                    <span>
                                        <LockOutlined style={{ marginRight: 8 }} />
                                        No one has requested access to your records
                                    </span>
                                }
                            />
                        )
                    }}
                />
            </Card>

            {/* Revoke Confirmation Modal */}
            <Modal
                title={
                    <Space>
                        <ExclamationCircleOutlined style={{ color: '#ef4444' }} />
                        <span>Revoke Access</span>
                    </Space>
                }
                open={revokeModalOpen}
                onCancel={() => setRevokeModalOpen(false)}
                footer={[
                    <Button key="cancel" onClick={() => setRevokeModalOpen(false)}>
                        Cancel
                    </Button>,
                    <Button
                        key="revoke"
                        danger
                        type="primary"
                        loading={revoking}
                        onClick={handleRevoke}
                    >
                        Yes, Revoke Access
                    </Button>
                ]}
            >
                {selectedGrant && (
                    <>
                        <Paragraph>
                            Are you sure you want to revoke <Text strong>{selectedGrant.doctor.name}</Text>'s
                            access to your medical records?
                        </Paragraph>
                        <Alert
                            message="This action is immediate"
                            description="The doctor will immediately lose access to your records and will be notified via email."
                            type="info"
                            showIcon
                        />
                    </>
                )}
            </Modal>
        </div>
    );
};

export default PatientAccessManagement;
