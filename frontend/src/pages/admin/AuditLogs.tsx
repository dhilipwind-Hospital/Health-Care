import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Typography, DatePicker, Space, Input, Button } from 'antd';
import { SafetyOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const AuditLogs: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Mock data for immediate display until backend API is fully integrated
    const mockLogs = [
        { id: 1, action: 'LOGIN', user: 'admin@system.com', resource: 'Auth', status: 'SUCCESS', ip: '192.168.1.1', timestamp: new Date().toISOString() },
        { id: 2, action: 'CREATE_TENANT', user: 'superadmin@ayphen.com', resource: 'Organization', status: 'SUCCESS', ip: '10.0.0.1', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 3, action: 'DELETE_USER', user: 'admin@care.com', resource: 'User', status: 'DENIED', ip: '172.16.0.5', timestamp: new Date(Date.now() - 7200000).toISOString() },
        { id: 4, action: 'VIEW_RECORDS', user: 'doctor@care.com', resource: 'Patient Record: P-1002', status: 'SUCCESS', ip: '192.168.1.50', timestamp: new Date(Date.now() - 8640000).toISOString() },
    ];

    const fetchLogs = async () => {
        setLoading(true);
        try {
            // const res = await api.get('/audit-logs');
            // setLogs(res.data);

            // Simulate API delay
            setTimeout(() => {
                setLogs(mockLogs);
                setLoading(false);
            }, 800);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const columns = [
        {
            title: 'Timestamp',
            dataIndex: 'timestamp',
            key: 'timestamp',
            render: (text: string) => new Date(text).toLocaleString(),
            width: 200,
        },
        {
            title: 'Action',
            dataIndex: 'action',
            key: 'action',
            render: (text: string) => <Tag color="blue">{text}</Tag>
        },
        {
            title: 'User',
            dataIndex: 'user',
            key: 'user',
        },
        {
            title: 'Resource',
            dataIndex: 'resource',
            key: 'resource',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (text: string) => (
                <Tag color={text === 'SUCCESS' ? 'green' : 'red'}>
                    {text}
                </Tag>
            )
        },
        {
            title: 'IP Address',
            dataIndex: 'ip',
            key: 'ip',
            render: (text: string) => <Text type="secondary" code>{text}</Text>
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={2} style={{ color: '#10B981', marginBottom: 0 }}><SafetyOutlined /> Security Audit Logs</Title>
                    <Text type="secondary">Track all sensitive actions across the platform</Text>
                </div>
                <Space>
                    <RangePicker />
                    <Input placeholder="Search user or action" prefix={<SearchOutlined />} />
                    <Button icon={<ReloadOutlined />} onClick={fetchLogs}>Refresh</Button>
                </Space>
            </div>

            <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <Table
                    dataSource={logs}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>
        </div>
    );
};

export default AuditLogs;
