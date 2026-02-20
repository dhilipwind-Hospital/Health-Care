import React, { useState, useEffect } from 'react';
import {
    Card,
    Input,
    Button,
    Select,
    Table,
    Tag,
    Modal,
    Form,
    Radio,
    Spin,
    Empty,
    Typography,
    Space,
    message,
    Alert,
    Tooltip,
    Badge,
    Divider,
    Timeline,
    Statistic,
    Row,
    Col
} from 'antd';
import {
    SearchOutlined,
    LockOutlined,
    UnlockOutlined,
    SendOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    UserOutlined,
    BankOutlined,
    SafetyOutlined,
    HistoryOutlined,
    ExclamationCircleOutlined,
    ReloadOutlined,
    FileTextOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface PatientSearchResult {
    id: string;
    displayId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    organization: {
        id: string;
        name: string;
        subdomain: string;
    };
    isCrossLocation: boolean;
}

interface AccessRequest {
    id: string;
    status: 'pending' | 'approved' | 'rejected' | 'expired' | 'revoked';
    patient: {
        id: string;
        displayId: string;
        name: string;
        organization: string;
    };
    reason: string;
    requestedDuration: string;
    urgencyLevel: 'emergency' | 'urgent' | 'normal';
    requestedAt: string;
    grantedAt: string | null;
    expiresAt: string | null;
    isActive: boolean;
    remainingTime: string | null;
    accessCount: number;
}

const CrossLocationAccess: React.FC = () => {
    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState<'id' | 'name' | 'email' | 'phone'>('name');
    const [searchResults, setSearchResults] = useState<PatientSearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [myRequests, setMyRequests] = useState<AccessRequest[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(true);

    // Modal state
    const [requestModalOpen, setRequestModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<PatientSearchResult | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

    // Fetch doctor's access requests on mount
    useEffect(() => {
        fetchMyRequests();
    }, []);

    const fetchMyRequests = async () => {
        try {
            setLoadingRequests(true);
            const response = await api.get('/access-grants/my-requests');
            setMyRequests(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch access requests:', error);
            message.error('Failed to load your access requests');
        } finally {
            setLoadingRequests(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery || searchQuery.trim().length < 3) {
            message.warning('Please enter at least 3 characters to search');
            return;
        }

        try {
            setSearching(true);
            const response = await api.get('/access-grants/search-patient', {
                params: { searchQuery: searchQuery.trim(), searchType }
            });
            setSearchResults(response.data.data || []);

            if (response.data.data?.length === 0) {
                message.info('No patients found matching your search criteria');
            }
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to search patients');
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    const handleRequestAccess = (patient: PatientSearchResult) => {
        setSelectedPatient(patient);
        form.resetFields();
        setRequestModalOpen(true);
    };

    const handleSubmitRequest = async (values: any) => {
        if (!selectedPatient) return;

        try {
            setSubmitting(true);
            const response = await api.post('/access-grants/request', {
                patientId: selectedPatient.id,
                reason: values.reason,
                duration: values.duration,
                urgencyLevel: values.urgencyLevel
            });

            message.success(response.data.message || 'Access request sent successfully');
            setRequestModalOpen(false);
            setSearchResults([]);
            setSearchQuery('');
            fetchMyRequests();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to send access request');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusTag = (status: string) => {
        const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
            pending: { color: 'processing', icon: <ClockCircleOutlined /> },
            approved: { color: 'success', icon: <CheckCircleOutlined /> },
            rejected: { color: 'error', icon: <CloseCircleOutlined /> },
            expired: { color: 'default', icon: <ClockCircleOutlined /> },
            revoked: { color: 'warning', icon: <LockOutlined /> }
        };
        const config = statusConfig[status] || statusConfig.pending;
        return (
            <Tag color={config.color} icon={config.icon}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Tag>
        );
    };

    const getUrgencyTag = (urgency: string) => {
        const config: Record<string, { color: string; label: string }> = {
            emergency: { color: '#dc2626', label: '🚨 Emergency' },
            urgent: { color: '#f59e0b', label: '⚡ Urgent' },
            normal: { color: '#6b7280', label: 'Normal' }
        };
        const c = config[urgency] || config.normal;
        return <Tag color={c.color}>{c.label}</Tag>;
    };

    // Search results table columns
    const searchColumns = [
        {
            title: 'Patient ID',
            dataIndex: 'displayId',
            key: 'displayId',
            render: (id: string) => <Text code>{id}</Text>
        },
        {
            title: 'Name',
            key: 'name',
            render: (_: any, record: PatientSearchResult) => (
                <Space>
                    <UserOutlined />
                    <Text strong>{record.firstName} {record.lastName}</Text>
                </Space>
            )
        },
        {
            title: 'Hospital',
            key: 'organization',
            render: (_: any, record: PatientSearchResult) => (
                <Space>
                    <BankOutlined />
                    <Text>{record.organization.name}</Text>
                </Space>
            )
        },
        {
            title: 'Contact',
            key: 'contact',
            render: (_: any, record: PatientSearchResult) => (
                <Space direction="vertical" size={0}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Text>
                    {record.phone && <Text type="secondary" style={{ fontSize: 12 }}>{record.phone}</Text>}
                </Space>
            )
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: PatientSearchResult) => (
                <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={() => handleRequestAccess(record)}
                >
                    Request Access
                </Button>
            )
        }
    ];

    // My requests table columns
    const requestColumns = [
        {
            title: 'Patient',
            key: 'patient',
            render: (_: any, record: AccessRequest) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{record.patient.name}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.patient.displayId}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{record.patient.organization}</Text>
                </Space>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string, record: AccessRequest) => (
                <Space direction="vertical" size={4}>
                    {getStatusTag(status)}
                    {record.isActive && record.remainingTime && (
                        <Text type="success" style={{ fontSize: 11 }}>
                            <ClockCircleOutlined /> {record.remainingTime}
                        </Text>
                    )}
                </Space>
            )
        },
        {
            title: 'Duration',
            key: 'duration',
            render: (_: any, record: AccessRequest) => (
                <Space direction="vertical" size={0}>
                    <Text>{record.requestedDuration}</Text>
                    {getUrgencyTag(record.urgencyLevel)}
                </Space>
            )
        },
        {
            title: 'Requested',
            dataIndex: 'requestedAt',
            key: 'requestedAt',
            render: (date: string) => new Date(date).toLocaleString()
        },
        {
            title: 'Access Count',
            dataIndex: 'accessCount',
            key: 'accessCount',
            render: (count: number, record: AccessRequest) => (
                record.status === 'approved' ? (
                    <Badge count={count} showZero color={count > 0 ? '#52c41a' : '#d9d9d9'} />
                ) : '-'
            )
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: AccessRequest) => {
                if (record.status === 'approved' && record.isActive) {
                    return (
                        <Button
                            type="primary"
                            size="small"
                            icon={<FileTextOutlined />}
                            onClick={() => window.location.href = `/doctor/patients/${record.patient.id}/records`}
                        >
                            View Records
                        </Button>
                    );
                }
                return null;
            }
        }
    ];

    // Statistics
    const pendingCount = myRequests.filter(r => r.status === 'pending').length;
    const activeCount = myRequests.filter(r => r.isActive).length;

    return (
        <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <Title level={2} style={{ marginBottom: 8 }}>
                    <SafetyOutlined style={{ marginRight: 12, color: '#6366f1' }} />
                    Cross-Location Patient Access
                </Title>
                <Paragraph type="secondary">
                    Search for patients from other hospital locations and request temporary access to their medical records.
                    Patients will receive an email to approve or deny your request.
                </Paragraph>
            </div>

            {/* Statistics */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Pending Requests"
                            value={pendingCount}
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{ color: pendingCount > 0 ? '#1890ff' : undefined }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Active Access"
                            value={activeCount}
                            prefix={<UnlockOutlined />}
                            valueStyle={{ color: activeCount > 0 ? '#52c41a' : undefined }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Total Requests"
                            value={myRequests.length}
                            prefix={<HistoryOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Total Accesses"
                            value={myRequests.reduce((sum, r) => sum + r.accessCount, 0)}
                            prefix={<CheckCircleOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Search Section */}
            <Card
                title={
                    <Space>
                        <SearchOutlined />
                        <span>Search Patients Across Locations</span>
                    </Space>
                }
                style={{ marginBottom: 24 }}
            >
                <Alert
                    message="Cross-Location Search"
                    description="This search will find patients from OTHER hospital locations only. To view patients from your own location, use the regular patient search."
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                />

                <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
                    <Select
                        value={searchType}
                        onChange={setSearchType}
                        style={{ width: 120 }}
                    >
                        <Option value="name">Name</Option>
                        <Option value="id">Patient ID</Option>
                        <Option value="email">Email</Option>
                        <Option value="phone">Phone</Option>
                    </Select>
                    <Input
                        placeholder={`Search by ${searchType}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onPressEnter={handleSearch}
                        style={{ width: 'calc(100% - 220px)' }}
                    />
                    <Button
                        type="primary"
                        icon={<SearchOutlined />}
                        onClick={handleSearch}
                        loading={searching}
                    >
                        Search
                    </Button>
                </Space.Compact>

                {searchResults.length > 0 && (
                    <Table
                        dataSource={searchResults}
                        columns={searchColumns}
                        rowKey="id"
                        pagination={false}
                        size="middle"
                    />
                )}

                {!searching && searchResults.length === 0 && searchQuery.length >= 3 && (
                    <Empty description="No patients found from other locations" />
                )}
            </Card>

            {/* My Access Requests */}
            <Card
                title={
                    <Space>
                        <HistoryOutlined />
                        <span>My Access Requests</span>
                    </Space>
                }
                extra={
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={fetchMyRequests}
                        loading={loadingRequests}
                    >
                        Refresh
                    </Button>
                }
            >
                <Table
                    dataSource={myRequests}
                    columns={requestColumns}
                    rowKey="id"
                    loading={loadingRequests}
                    pagination={{ pageSize: 10 }}
                    expandable={{
                        expandedRowRender: (record) => (
                            <div style={{ padding: '12px 24px', background: '#fafafa', borderRadius: 8 }}>
                                <Text strong>Reason for Access:</Text>
                                <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>{record.reason}</Paragraph>
                                {record.grantedAt && (
                                    <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                                        Granted at: {new Date(record.grantedAt).toLocaleString()}
                                    </Text>
                                )}
                                {record.expiresAt && (
                                    <Text type="secondary" style={{ display: 'block' }}>
                                        Expires at: {new Date(record.expiresAt).toLocaleString()}
                                    </Text>
                                )}
                            </div>
                        )
                    }}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="You haven't made any cross-location access requests yet"
                            />
                        )
                    }}
                />
            </Card>

            {/* Request Access Modal */}
            <Modal
                title={
                    <Space>
                        <LockOutlined style={{ color: '#6366f1' }} />
                        <span>Request Patient Access</span>
                    </Space>
                }
                open={requestModalOpen}
                onCancel={() => setRequestModalOpen(false)}
                footer={null}
                width={600}
            >
                {selectedPatient && (
                    <>
                        <Card size="small" style={{ marginBottom: 16, background: '#f8fafc' }}>
                            <Space direction="vertical" size={4}>
                                <Text strong style={{ fontSize: 16 }}>
                                    {selectedPatient.firstName} {selectedPatient.lastName}
                                </Text>
                                <Text type="secondary">{selectedPatient.displayId}</Text>
                                <Space>
                                    <BankOutlined />
                                    <Text>{selectedPatient.organization.name}</Text>
                                </Space>
                            </Space>
                        </Card>

                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSubmitRequest}
                            initialValues={{
                                duration: '24_hours',
                                urgencyLevel: 'normal'
                            }}
                        >
                            <Form.Item
                                name="reason"
                                label="Reason for Access Request"
                                rules={[
                                    { required: true, message: 'Please provide a reason' },
                                    { min: 10, message: 'Reason must be at least 10 characters' }
                                ]}
                            >
                                <TextArea
                                    rows={4}
                                    placeholder="Please explain why you need access to this patient's medical records..."
                                    maxLength={500}
                                    showCount
                                />
                            </Form.Item>

                            <Form.Item
                                name="duration"
                                label="Access Duration"
                                rules={[{ required: true }]}
                            >
                                <Radio.Group buttonStyle="solid">
                                    <Radio.Button value="24_hours">
                                        <ClockCircleOutlined /> 24 Hours
                                    </Radio.Button>
                                    <Radio.Button value="3_days">
                                        <ClockCircleOutlined /> 3 Days
                                    </Radio.Button>
                                    <Radio.Button value="1_week">
                                        <ClockCircleOutlined /> 1 Week
                                    </Radio.Button>
                                </Radio.Group>
                            </Form.Item>

                            <Form.Item
                                name="urgencyLevel"
                                label="Urgency Level"
                                rules={[{ required: true }]}
                            >
                                <Radio.Group>
                                    <Radio value="normal">Normal</Radio>
                                    <Radio value="urgent">
                                        <Text style={{ color: '#f59e0b' }}>⚡ Urgent</Text>
                                    </Radio>
                                    <Radio value="emergency">
                                        <Text style={{ color: '#dc2626' }}>🚨 Emergency</Text>
                                    </Radio>
                                </Radio.Group>
                            </Form.Item>

                            <Alert
                                message="Patient Consent Required"
                                description="The patient will receive an email with your access request. They must approve it before you can view their records."
                                type="warning"
                                showIcon
                                icon={<ExclamationCircleOutlined />}
                                style={{ marginBottom: 24 }}
                            />

                            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                                <Space>
                                    <Button onClick={() => setRequestModalOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={submitting}
                                        icon={<SendOutlined />}
                                    >
                                        Send Request
                                    </Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </>
                )}
            </Modal>
        </div>
    );
};

export default CrossLocationAccess;
