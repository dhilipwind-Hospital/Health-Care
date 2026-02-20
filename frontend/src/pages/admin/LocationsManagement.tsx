import React, { useState, useEffect } from 'react';
import {
    Card,
    Table,
    Button,
    Space,
    Tag,
    Typography,
    Input,
    Modal,
    Form,
    message,
    Spin,
    Row,
    Col,
    Statistic,
    Empty,
    Tooltip,
    Switch,
    Popconfirm,
    Checkbox,
    Divider
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EnvironmentOutlined,
    PhoneOutlined,
    MailOutlined,
    SearchOutlined,
    ReloadOutlined,
    HomeOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    UserAddOutlined,
    LockOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;
const { Search } = Input;

interface Location {
    id: string;
    name: string;
    code: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    phone?: string;
    email?: string;
    isMainBranch: boolean;
    isActive: boolean;
    settings?: any;
    createdAt: string;
    updatedAt: string;
    organizationId?: string;
    organization?: { id: string; name: string; subdomain: string };
}

const LocationsManagement: React.FC = () => {
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'super_admin';
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [createBranchAdmin, setCreateBranchAdmin] = useState(false);
    const [form] = Form.useForm();

    // Fetch locations on mount
    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            setLoading(true);
            // Super Admin: fetch ALL locations across all organizations
            // Regular Admin: fetch only their organization's locations
            const endpoint = isSuperAdmin ? '/locations/all' : '/locations';
            const response = await api.get(endpoint, {
                params: { includeInactive: 'true' }
            });
            if (response.data?.success) {
                setLocations(response.data.data || []);
            }
        } catch (error: any) {
            console.error('Failed to fetch locations:', error);
            message.error(error.response?.data?.message || 'Failed to load locations');
        } finally {
            setLoading(false);
        }
    };

    const handleAddNew = () => {
        setEditingLocation(null);
        setCreateBranchAdmin(false);
        form.resetFields();
        form.setFieldsValue({
            country: 'India',
            isMainBranch: false
        });
        setIsModalVisible(true);
    };

    const handleEdit = (location: Location) => {
        setEditingLocation(location);
        form.setFieldsValue({
            name: location.name,
            code: location.code,
            address: location.address,
            city: location.city,
            state: location.state,
            country: location.country || 'India',
            phone: location.phone,
            email: location.email,
            isMainBranch: location.isMainBranch
        });
        setIsModalVisible(true);
    };

    const handleDelete = async (location: Location) => {
        try {
            await api.delete(`/locations/${location.id}`);
            message.success('Location deactivated successfully');
            fetchLocations();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to delete location');
        }
    };

    const handleToggleActive = async (location: Location, isActive: boolean) => {
        try {
            await api.put(`/locations/${location.id}`, { isActive });
            message.success(`Location ${isActive ? 'activated' : 'deactivated'} successfully`);
            fetchLocations();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to update location');
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            if (editingLocation) {
                // Update existing — never send admin fields on edit
                const { adminEmail, adminPassword, adminFirstName, adminLastName, ...updateValues } = values;
                await api.put(`/locations/${editingLocation.id}`, updateValues);
                message.success('Location updated successfully');
            } else {
                // Create new — strip admin fields if checkbox is unchecked
                const payload = { ...values };
                if (!createBranchAdmin) {
                    delete payload.adminEmail;
                    delete payload.adminPassword;
                    delete payload.adminFirstName;
                    delete payload.adminLastName;
                }
                const response = await api.post('/locations', payload);
                if (response.data?.branchAdmin?.isNew) {
                    message.success(`Location created with new branch admin (${response.data.branchAdmin.email}). Credentials sent via email.`);
                } else if (response.data?.branchAdmin) {
                    message.success(`Location created. Existing user ${response.data.branchAdmin.email} assigned as branch admin.`);
                } else {
                    message.success('Location created successfully');
                }
            }

            setIsModalVisible(false);
            setCreateBranchAdmin(false);
            fetchLocations();
        } catch (error: any) {
            if (error.errorFields) {
                // Form validation error
                return;
            }
            message.error(error.response?.data?.message || 'Failed to save location');
        }
    };

    const filteredLocations = locations.filter(loc => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            loc.name.toLowerCase().includes(query) ||
            loc.code.toLowerCase().includes(query) ||
            loc.city?.toLowerCase().includes(query) ||
            loc.address?.toLowerCase().includes(query) ||
            (loc as any).organization?.name?.toLowerCase().includes(query) ||
            (loc as any).organization?.subdomain?.toLowerCase().includes(query)
        );
    });

    const activeCount = locations.filter(l => l.isActive).length;
    const mainBranch = locations.find(l => l.isMainBranch);

    const columns = [
        // Show Organization column only for Super Admin
        ...(isSuperAdmin ? [{
            title: 'Organization',
            key: 'organization',
            render: (_: any, record: Location) => (
                <div>
                    <Text strong>{(record as any).organization?.name || 'N/A'}</Text>
                    <div>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            {(record as any).organization?.subdomain || ''}
                        </Text>
                    </div>
                </div>
            ),
        }] : []),
        {
            title: 'Location',
            key: 'location',
            render: (_: any, record: Location) => (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text strong style={{ color: '#10B981' }}>{record.name}</Text>
                        {record.isMainBranch && (
                            <Tag color="gold" style={{ marginLeft: 8 }}>
                                <HomeOutlined /> Main Branch
                            </Tag>
                        )}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Code: {record.code}
                    </Text>
                </div>
            ),
        },
        {
            title: 'Address',
            key: 'address',
            render: (_: any, record: Location) => (
                <div>
                    <div style={{ fontSize: 13 }}>
                        <EnvironmentOutlined style={{ marginRight: 4, color: '#10B981' }} />
                        {record.city || 'N/A'}{record.state ? `, ${record.state}` : ''}
                    </div>
                    {record.address && (
                        <Text type="secondary" style={{ fontSize: 11 }}>{record.address}</Text>
                    )}
                </div>
            ),
        },
        {
            title: 'Contact',
            key: 'contact',
            render: (_: any, record: Location) => (
                <Space direction="vertical" size={0}>
                    {record.phone && (
                        <Text style={{ fontSize: 12 }}>
                            <PhoneOutlined style={{ marginRight: 4 }} />
                            {record.phone}
                        </Text>
                    )}
                    {record.email && (
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            <MailOutlined style={{ marginRight: 4 }} />
                            {record.email}
                        </Text>
                    )}
                    {!record.phone && !record.email && <Text type="secondary">-</Text>}
                </Space>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive: boolean, record: Location) => (
                <Tooltip title={isActive ? 'Active' : 'Inactive'}>
                    <Switch
                        checked={isActive}
                        onChange={(checked) => handleToggleActive(record, checked)}
                        checkedChildren={<CheckCircleOutlined />}
                        unCheckedChildren={<CloseCircleOutlined />}
                    />
                </Tooltip>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Location) => (
                <Space>
                    <Tooltip title="Edit">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    {!record.isMainBranch && (
                        <Popconfirm
                            title="Deactivate this location?"
                            description="The location will be marked as inactive."
                            onConfirm={() => handleDelete(record)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Tooltip title="Deactivate">
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                />
                            </Tooltip>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <Title level={2} style={{ color: '#10B981', marginBottom: '8px' }}>
                    <EnvironmentOutlined /> Location Management
                </Title>
                <Text type="secondary">
                    Manage your organization's branches and locations
                </Text>
            </div>

            {/* Statistics Cards */}
            <Row gutter={16} style={{ marginBottom: '24px' }}>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Total Locations"
                            value={locations.length}
                            prefix={<EnvironmentOutlined style={{ color: '#10B981' }} />}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Active Locations"
                            value={activeCount}
                            prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Main Branch"
                            value={mainBranch?.name || 'Not Set'}
                            prefix={<HomeOutlined style={{ color: '#faad14' }} />}
                            valueStyle={{ fontSize: 16 }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Inactive Locations"
                            value={locations.length - activeCount}
                            prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Controls */}
            <Card style={{ marginBottom: '16px' }}>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Space>
                            <Search
                                placeholder="Search locations..."
                                style={{ width: 300 }}
                                prefix={<SearchOutlined />}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                allowClear
                            />
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={fetchLocations}
                                loading={loading}
                            >
                                Refresh
                            </Button>
                        </Space>
                    </Col>
                    <Col>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAddNew}
                            style={{ background: '#10B981', borderColor: '#10B981' }}
                        >
                            Add Location
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* Locations Table */}
            <Card>
                <Spin spinning={loading}>
                    <Table
                        columns={columns}
                        dataSource={filteredLocations}
                        rowKey="id"
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) =>
                                `${range[0]}-${range[1]} of ${total} locations`,
                        }}
                        locale={{
                            emptyText: (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={
                                        <span>
                                            No locations found.{' '}
                                            <a onClick={handleAddNew}>Add your first location</a>
                                        </span>
                                    }
                                />
                            )
                        }}
                    />
                </Spin>
            </Card>

            {/* Add/Edit Modal */}
            <Modal
                title={
                    <Space>
                        <EnvironmentOutlined style={{ color: '#10B981' }} />
                        <span>{editingLocation ? 'Edit Location' : 'Add New Location'}</span>
                    </Space>
                }
                open={isModalVisible}
                onOk={handleSubmit}
                onCancel={() => setIsModalVisible(false)}
                width={600}
                okText={editingLocation ? 'Update' : 'Create'}
                okButtonProps={{ style: { background: '#10B981', borderColor: '#10B981' } }}
            >
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Row gutter={16}>
                        <Col span={16}>
                            <Form.Item
                                name="name"
                                label="Location Name"
                                rules={[{ required: true, message: 'Please enter location name' }]}
                            >
                                <Input placeholder="e.g., Chennai Branch" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="code"
                                label="Code"
                                rules={[
                                    { required: true, message: 'Please enter code' },
                                    { max: 10, message: 'Code must be max 10 characters' },
                                    { pattern: /^[A-Za-z0-9]+$/, message: 'Only alphanumeric characters' }
                                ]}
                            >
                                <Input
                                    placeholder="e.g., CHN"
                                    style={{ textTransform: 'uppercase' }}
                                    maxLength={10}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="address"
                        label="Address"
                    >
                        <Input.TextArea rows={2} placeholder="Full street address" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="city" label="City">
                                <Input placeholder="e.g., Chennai" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="state" label="State">
                                <Input placeholder="e.g., Tamil Nadu" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="country" label="Country">
                                <Input placeholder="e.g., India" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="phone"
                                label="Phone"
                            >
                                <Input placeholder="+91 44 1234 5678" prefix={<PhoneOutlined />} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="email"
                                label="Email"
                                rules={[{ type: 'email', message: 'Please enter a valid email' }]}
                            >
                                <Input placeholder="chennai@hospital.com" prefix={<MailOutlined />} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="isMainBranch"
                        valuePropName="checked"
                    >
                        <Switch checkedChildren="Main Branch" unCheckedChildren="Regular Branch" />
                        <Text type="secondary" style={{ marginLeft: 12 }}>
                            Set as the main/headquarters branch
                        </Text>
                    </Form.Item>

                    {/* Branch Admin Section - Only shown when creating a new location */}
                    {!editingLocation && (
                        <>
                            <Divider style={{ margin: '12px 0' }} />
                            <Checkbox
                                checked={createBranchAdmin}
                                onChange={(e) => setCreateBranchAdmin(e.target.checked)}
                                style={{ marginBottom: 16 }}
                            >
                                <Space>
                                    <UserAddOutlined style={{ color: '#10B981' }} />
                                    <Text strong>Create Branch Admin</Text>
                                </Space>
                            </Checkbox>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 16, marginTop: -8, paddingLeft: 24 }}>
                                A new admin user will be created and assigned to this location. They will receive login credentials via email.
                            </Text>

                            {createBranchAdmin && (
                                <div style={{ background: '#fafafa', padding: 16, borderRadius: 8, border: '1px solid #f0f0f0' }}>
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item
                                                name="adminFirstName"
                                                label="Admin First Name"
                                                rules={createBranchAdmin ? [{ required: true, message: 'Required' }] : []}
                                            >
                                                <Input placeholder="e.g., Rajesh" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item
                                                name="adminLastName"
                                                label="Admin Last Name"
                                                rules={createBranchAdmin ? [{ required: true, message: 'Required' }] : []}
                                            >
                                                <Input placeholder="e.g., Kumar" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Form.Item
                                        name="adminEmail"
                                        label="Admin Email"
                                        rules={createBranchAdmin ? [
                                            { required: true, message: 'Required' },
                                            { type: 'email', message: 'Please enter a valid email' }
                                        ] : []}
                                    >
                                        <Input placeholder="branchadmin@hospital.com" prefix={<MailOutlined />} />
                                    </Form.Item>
                                    <Form.Item
                                        name="adminPassword"
                                        label="Admin Password"
                                        rules={createBranchAdmin ? [
                                            { required: true, message: 'Required' },
                                            { min: 8, message: 'Min 8 characters' }
                                        ] : []}
                                    >
                                        <Input.Password placeholder="Minimum 8 characters" prefix={<LockOutlined />} />
                                    </Form.Item>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        The admin will receive an email with these credentials to log in and manage this branch.
                                    </Text>
                                </div>
                            )}
                        </>
                    )}
                </Form>
            </Modal>
        </div>
    );
};

export default LocationsManagement;
