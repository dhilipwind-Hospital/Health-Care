import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Tag, Typography, DatePicker, Space, Input, Button, message } from 'antd';
import { SafetyOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const AuditLogs: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

    const fetchLogs = useCallback(async (page = 1, action?: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('limit', '20');
            if (action) params.set('action', action);

            const res = await api.get(`/audit-logs?${params.toString()}`);
            setLogs(res.data?.data || []);
            const pg = res.data?.pagination;
            if (pg) {
                setPagination({ current: pg.current || page, pageSize: pg.pageSize || 20, total: pg.total || 0 });
            }
        } catch (error: any) {
            if (error.response?.status === 403) {
                message.error('Access denied: Admin role required');
            } else {
                message.error('Failed to fetch audit logs');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleSearch = () => {
        fetchLogs(1, searchText || undefined);
    };

    const actionColorMap: Record<string, string> = {
        LOGIN: 'green', LOGOUT: 'blue',
        CREATE_USER: 'cyan', UPDATE_USER: 'gold', DELETE_USER: 'red',
        CREATE_APPOINTMENT: 'purple', UPDATE_APPOINTMENT: 'orange', CANCEL_APPOINTMENT: 'volcano',
    };

    const columns = [
        {
            title: 'Timestamp',
            dataIndex: 'time',
            key: 'time',
            render: (text: string) => text ? new Date(text).toLocaleString() : '-',
            width: 200,
        },
        {
            title: 'Action',
            dataIndex: 'action',
            key: 'action',
            render: (text: string) => <Tag color={actionColorMap[text] || 'blue'}>{text}</Tag>,
        },
        {
            title: 'Actor',
            dataIndex: 'actor',
            key: 'actor',
        },
        {
            title: 'Entity',
            dataIndex: 'entity',
            key: 'entity',
        },
        {
            title: 'Organization',
            dataIndex: 'organization',
            key: 'organization',
        },
        {
            title: 'IP Address',
            dataIndex: 'ip',
            key: 'ip',
            render: (text: string) => text ? <Text type="secondary" code>{text}</Text> : '-',
        },
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
                    <Input
                        placeholder="Search action (e.g. LOGIN)"
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onPressEnter={handleSearch}
                    />
                    <Button icon={<ReloadOutlined />} onClick={() => fetchLogs()}>Refresh</Button>
                </Space>
            </div>

            <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <Table
                    dataSource={logs}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        showTotal: (total) => `Total ${total} logs`,
                        onChange: (page) => fetchLogs(page, searchText || undefined),
                    }}
                />
            </Card>
        </div>
    );
};

export default AuditLogs;
