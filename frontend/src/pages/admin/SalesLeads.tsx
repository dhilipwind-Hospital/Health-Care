import React, { useState, useEffect } from 'react';
import {
    Table,
    Card,
    Tag,
    Button,
    Space,
    Input,
    Select,
    Typography,
    Modal,
    Form,
    message,
    Tooltip,
    Badge,
    Descriptions,
    Row,
    Col,
    Statistic
} from 'antd';
import {
    SearchOutlined,
    ReloadOutlined,
    EyeOutlined,
    EditOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    MailOutlined,
    PhoneOutlined,
    GlobalOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface SalesInquiry {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    companyName?: string;
    companySize?: string;
    message: string;
    source: string;
    status: string;
    notes?: string;
    assignedTo?: {
        id: string;
        firstName: string;
        lastName: string;
    };
    interestedPlan?: string;
    country?: string;
    city?: string;
    createdAt: string;
    contactedAt?: string;
    convertedAt?: string;
}

const SalesLeads: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<SalesInquiry[]>([]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [filters, setFilters] = useState({ status: '', source: '', sortBy: 'createdAt', sortOrder: 'DESC' });
    const [stats, setStats] = useState<any>({});

    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [selectedInquiry, setSelectedInquiry] = useState<SalesInquiry | null>(null);
    const [notesForm] = Form.useForm();
    const [statusLoading, setStatusLoading] = useState(false);

    useEffect(() => {
        fetchInquiries();
    }, [pagination.current, pagination.pageSize, filters]);

    const fetchInquiries = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5001/api/sales-inquiry', {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page: pagination.current,
                    limit: pagination.pageSize,
                    ...filters
                }
            });

            setData(response.data.data);
            setPagination({
                ...pagination,
                total: response.data.pagination.total
            });
            setStats(response.data.statusCounts || {});
        } catch (error) {
            console.error('Failed to fetch inquiries:', error);
            message.error('Failed to load sales leads');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        setStatusLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`http://localhost:5001/api/sales-inquiry/${id}`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            message.success(`Status updated to ${status}`);

            // Update local state
            setData(data.map(item => item.id === id ? { ...item, status } : item));
            if (selectedInquiry && selectedInquiry.id === id) {
                setSelectedInquiry({ ...selectedInquiry, status });
            }

            // Re-fetch to update stats
            fetchInquiries();
        } catch (error) {
            console.error('Update error:', error);
            message.error('Failed to update status');
        } finally {
            setStatusLoading(false);
        }
    };

    const updateNotes = async (values: any) => {
        if (!selectedInquiry) return;

        setStatusLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`http://localhost:5001/api/sales-inquiry/${selectedInquiry.id}`,
                { notes: values.notes },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            message.success('Notes updated');

            // Update local state
            setData(data.map(item => item.id === selectedInquiry.id ? { ...item, notes: values.notes } : item));
            setSelectedInquiry({ ...selectedInquiry, notes: values.notes });
        } catch (error) {
            console.error('Update error:', error);
            message.error('Failed to update notes');
        } finally {
            setStatusLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'new': return 'blue';
            case 'contacted': return 'orange';
            case 'qualified': return 'purple';
            case 'proposal_sent': return 'geekblue';
            case 'won': return 'success';
            case 'lost': return 'error';
            default: return 'default';
        }
    };

    const columns = [
        {
            title: 'Customer',
            key: 'customer',
            render: (record: SalesInquiry) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{record.fullName}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{record.email}</Text>
                </Space>
            )
        },
        {
            title: 'Company / Size',
            key: 'company',
            render: (record: SalesInquiry) => (
                <Space direction="vertical" size={0}>
                    <Text>{record.companyName || '-'}</Text>
                    {record.companySize && <Tag>{record.companySize.toUpperCase()} Beds</Tag>}
                </Space>
            )
        },
        {
            title: 'Source',
            dataIndex: 'source',
            key: 'source',
            render: (source: string) => <Tag>{source.replace('_', ' ').toUpperCase()}</Tag>
        },
        {
            title: 'Message Preview',
            dataIndex: 'message',
            key: 'message',
            ellipsis: true,
            render: (text: string) => (
                <Tooltip title={text}>
                    <Text style={{ maxWidth: 200 }} ellipsis>{text}</Text>
                </Tooltip>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={getStatusColor(status)}>
                    {status.replace('_', ' ').toUpperCase()}
                </Tag>
            )
        },
        {
            title: 'Received',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => moment(date).fromNow()
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (record: SalesInquiry) => (
                <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => {
                        setSelectedInquiry(record);
                        notesForm.setFieldsValue({ notes: record.notes });
                        setViewModalVisible(true);
                    }}
                >
                    View
                </Button>
            )
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={2} style={{ marginBottom: 0 }}>Sales Leads</Title>
                    <Text type="secondary">Manage incoming sales inquiries and demo requests</Text>
                </div>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={fetchInquiries}>Refresh</Button>
                </Space>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col span={4}>
                    <Card bordered={false}>
                        <Statistic title="Total Inquiries" value={pagination.total} />
                    </Card>
                </Col>
                <Col span={4}>
                    <Card bordered={false}>
                        <Statistic
                            title="New Leads"
                            value={stats.new || 0}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col span={4}>
                    <Card bordered={false}>
                        <Statistic
                            title="Qualified"
                            value={stats.qualified || 0}
                            valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>
                <Col span={4}>
                    <Card bordered={false}>
                        <Statistic
                            title="Won Deals"
                            value={stats.won || 0}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card bordered={false} bodyStyle={{ padding: 12 }}>
                        <Text strong>Filter by Status:</Text>
                        <div style={{ marginTop: 8 }}>
                            <Select
                                style={{ width: 200 }}
                                placeholder="All Statuses"
                                allowClear
                                onChange={(val) => setFilters({ ...filters, status: val })}
                            >
                                <Option value="new">New</Option>
                                <Option value="contacted">Contacted</Option>
                                <Option value="qualified">Qualified</Option>
                                <Option value="proposal_sent">Proposal Sent</Option>
                                <Option value="won">Won</Option>
                                <Option value="lost">Lost</Option>
                            </Select>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Card bordered={false}>
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="id"
                    loading={loading}
                    pagination={{ ...pagination, onChange: (page, size) => setPagination({ ...pagination, current: page, pageSize: size || 10 }) }}
                />
            </Card>

            <Modal
                title="Lead Details"
                open={viewModalVisible}
                onCancel={() => setViewModalVisible(false)}
                width={800}
                footer={[
                    <Button key="close" onClick={() => setViewModalVisible(false)}>
                        Close
                    </Button>,
                    <Button
                        key="contacted"
                        onClick={() => updateStatus(selectedInquiry!.id, 'contacted')}
                        disabled={selectedInquiry?.status !== 'new'}
                    >
                        Mark Contacted
                    </Button>
                ]}
            >
                {selectedInquiry && (
                    <div>
                        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Space direction="vertical">
                                <Title level={4} style={{ marginBottom: 0 }}>{selectedInquiry.fullName}</Title>
                                <Space>
                                    <Tag color="blue">{selectedInquiry.email}</Tag>
                                    {selectedInquiry.phone && <Tag color="green">{selectedInquiry.phone}</Tag>}
                                </Space>
                            </Space>
                            <Select
                                defaultValue={selectedInquiry.status}
                                style={{ width: 150 }}
                                onChange={(val) => updateStatus(selectedInquiry.id, val)}
                                loading={statusLoading}
                            >
                                <Option value="new">New</Option>
                                <Option value="contacted">Contacted</Option>
                                <Option value="qualified">Qualified</Option>
                                <Option value="proposal_sent">Proposal Sent</Option>
                                <Option value="won">Won</Option>
                                <Option value="lost">Lost</Option>
                            </Select>
                        </div>

                        <Row gutter={24}>
                            <Col span={14}>
                                <Descriptions title="Inquiry Info" column={1} bordered size="small">
                                    <Descriptions.Item label="Company">{selectedInquiry.companyName || 'Not provided'}</Descriptions.Item>
                                    <Descriptions.Item label="Size">{selectedInquiry.companySize ? `${selectedInquiry.companySize.toUpperCase()} Beds` : 'Not provided'}</Descriptions.Item>
                                    <Descriptions.Item label="Received">{moment(selectedInquiry.createdAt).format('LLL')}</Descriptions.Item>
                                    <Descriptions.Item label="Source">{selectedInquiry.source}</Descriptions.Item>
                                </Descriptions>

                                <div style={{ marginTop: 24 }}>
                                    <Text strong>Message:</Text>
                                    <Card size="small" style={{ marginTop: 8, background: '#f5f5f5' }}>
                                        <Text>{selectedInquiry.message}</Text>
                                    </Card>
                                </div>
                            </Col>

                            <Col span={10}>
                                <Card size="small" title="Internal Notes">
                                    <Form form={notesForm} onFinish={updateNotes} layout="vertical">
                                        <Form.Item name="notes">
                                            <TextArea rows={6} placeholder="Add notes about this lead..." />
                                        </Form.Item>
                                        <Button type="primary" htmlType="submit" block loading={statusLoading} size="small">
                                            Save Notes
                                        </Button>
                                    </Form>
                                </Card>
                            </Col>
                        </Row>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default SalesLeads;
