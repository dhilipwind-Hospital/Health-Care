import React, { useState } from 'react';
import { Card, Form, Input, Select, Button, Table, Tag, Row, Col, Typography, message, Alert } from 'antd';
import { SendOutlined, SoundOutlined, CheckCircleOutlined, UsergroupAddOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const SystemBroadcasts: React.FC = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<any[]>([
        // Mock history for initial view
        { id: 1, title: 'System Maintenance', message: 'The system will be down for 10 mins tonight.', target: 'All Users', priority: 'high', date: '2025-02-15 10:00' },
        { id: 2, title: 'Welcome to Version 2.0', message: 'Check out the new dashboard features!', target: 'Admins', priority: 'medium', date: '2025-02-10 09:30' },
    ]);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            // In a real app, this would call the API
            // await api.post('/super-admin/broadcast', values);

            // For now, mock the success
            setTimeout(() => {
                const newBroadcast = {
                    id: Date.now(),
                    title: values.title,
                    message: values.message,
                    target: values.targetRole,
                    priority: values.priority,
                    date: new Date().toLocaleString()
                };
                setHistory([newBroadcast, ...history]);
                message.success('Broadcast sent successfully to ' + values.targetRole);
                form.resetFields();
                setLoading(false);
            }, 1000);

        } catch (error) {
            message.error('Failed to send broadcast');
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            width: 180,
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (text: string) => <strong>{text}</strong>
        },
        {
            title: 'Target Audience',
            dataIndex: 'target',
            key: 'target',
            render: (text: string) => <Tag color="blue">{text.toUpperCase()}</Tag>
        },
        {
            title: 'Priority',
            dataIndex: 'priority',
            key: 'priority',
            render: (text: string) => {
                const colors: Record<string, string> = { high: 'red', medium: 'orange', low: 'green' };
                return <Tag color={colors[text]}>{text.toUpperCase()}</Tag>;
            }
        },
        {
            title: 'Status',
            key: 'status',
            render: () => <Tag icon={<CheckCircleOutlined />} color="success">SENT</Tag>
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px' }}>
                <Title level={2} style={{ color: '#10B981' }}><SoundOutlined /> Broadcast Center</Title>
                <Text type="secondary">Send system-wide alerts and announcements to all hospital tenants.</Text>
            </div>

            <Row gutter={24}>
                <Col xs={24} lg={10}>
                    <Card title="Compose Broadcast" bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <Form form={form} layout="vertical" onFinish={onFinish}>
                            <Alert
                                message="Caution"
                                description="This message will be visible to all selected users across the entire platform."
                                type="warning"
                                showIcon
                                style={{ marginBottom: '24px' }}
                            />

                            <Form.Item name="title" label="Subject Line" rules={[{ required: true, message: 'Please enter a subject' }]}>
                                <Input prefix={<SoundOutlined />} placeholder="e.g. Scheduled Maintenance" />
                            </Form.Item>

                            <Form.Item name="targetRole" label="Target Audience" initialValue="all">
                                <Select>
                                    <Option value="all"><UsergroupAddOutlined /> All Users (Global)</Option>
                                    <Option value="admin">Admins Only</Option>
                                    <Option value="doctor">Doctors Only</Option>
                                    <Option value="nurse">Nurses Only</Option>
                                </Select>
                            </Form.Item>

                            <Form.Item name="priority" label="Priority Level" initialValue="medium">
                                <Select>
                                    <Option value="low">Low (Info)</Option>
                                    <Option value="medium">Medium (Standard)</Option>
                                    <Option value="high">High (Urgent Alert)</Option>
                                </Select>
                            </Form.Item>

                            <Form.Item name="message" label="Message Body" rules={[{ required: true, message: 'Please enter message content' }]}>
                                <TextArea rows={6} placeholder="Enter your announcement here..." />
                            </Form.Item>

                            <Form.Item>
                                <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={loading} block size="large" style={{ background: '#10B981', borderColor: '#10B981' }}>
                                    Send Broadcast
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>

                <Col xs={24} lg={14}>
                    <Card title="Broadcast History" bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <Table dataSource={history} columns={columns} rowKey="id" pagination={{ pageSize: 5 }} />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default SystemBroadcasts;
