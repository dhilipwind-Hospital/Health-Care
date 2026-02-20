import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, DatePicker, Input, Space, Button, Modal, Typography, Row, Col } from 'antd';
import { SearchOutlined, ReloadOutlined, DatabaseOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Define Log Interface
interface LogEntry {
    id: string;
    action: string;
    entity: string;
    actor: string;
    organization: string;
    time: string;
    ip: string;
    details: any;
}

const SystemLogs: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
    const [detailsVisible, setDetailsVisible] = useState(false);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/audit-logs');
            if (response.data?.success) {
                setLogs(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch logs', error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Time',
            dataIndex: 'time',
            key: 'time',
            width: 180,
            render: (text: string) => new Date(text).toLocaleString(),
        },
        {
            title: 'Data Level Action',
            dataIndex: 'action',
            key: 'action',
            render: (action: string) => {
                let color = 'default';
                if (action.includes('CREATE')) color = 'green';
                if (action.includes('UPDATE')) color = 'blue';
                if (action.includes('DELETE')) color = 'red';
                if (action.includes('LOGIN')) color = 'purple';
                return <Tag color={color}>{action}</Tag>;
            }
        },
        {
            title: 'Actor',
            dataIndex: 'actor',
            key: 'actor',
        },
        {
            title: 'Organization',
            dataIndex: 'organization',
            key: 'organization',
            render: (text: string) => <Tag>{text}</Tag>
        },
        {
            title: 'Target Entity',
            dataIndex: 'entity',
            key: 'entity',
            render: (text: string) => <Text code>{text}</Text>
        },
        {
            title: 'Details',
            key: 'details',
            render: (record: LogEntry) => (
                <Button
                    type="link"
                    size="small"
                    onClick={() => {
                        setSelectedLog(record);
                        setDetailsVisible(true);
                    }}
                >
                    View Diff
                </Button>
            )
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px' }}>
                <Title level={2} style={{ color: '#10B981', marginBottom: '8px' }}>
                    <SafetyCertificateOutlined /> System Audit Logs
                </Title>
                <Text type="secondary">
                    Track all security events, data modifications, and access history across the platform.
                </Text>
            </div>

            <Card>
                <Row gutter={16} style={{ marginBottom: '16px' }}>
                    <Col span={8}>
                        <Input
                            placeholder="Search by User or Entity ID..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </Col>
                    <Col span={8}>
                        <RangePicker style={{ width: '100%' }} />
                    </Col>
                    <Col span={8} style={{ textAlign: 'right' }}>
                        <Button icon={<ReloadOutlined />} onClick={fetchLogs} loading={loading}>
                            Refresh Logs
                        </Button>
                    </Col>
                </Row>

                <Table
                    columns={columns}
                    dataSource={logs.filter(l =>
                        l.actor.toLowerCase().includes(searchText.toLowerCase()) ||
                        l.action.toLowerCase().includes(searchText.toLowerCase())
                    )}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 15 }}
                />
            </Card>

            <Modal
                title="Log Details"
                visible={detailsVisible}
                onCancel={() => setDetailsVisible(false)}
                footer={[<Button key="close" onClick={() => setDetailsVisible(false)}>Close</Button>]}
                width={700}
            >
                {selectedLog && (
                    <div style={{ fontFamily: 'monospace' }}>
                        <div style={{ marginBottom: 16 }}>
                            <strong>Metadata:</strong><br />
                            IP Address: {selectedLog.ip || 'Unknown'}<br />
                            Event ID: {selectedLog.id}
                        </div>
                        <strong>Change Payload:</strong>
                        <div style={{
                            background: '#f5f5f5',
                            padding: '12px',
                            borderRadius: '8px',
                            overflowX: 'auto'
                        }}>
                            <pre style={{ margin: 0 }}>
                                {JSON.stringify(selectedLog.details || {}, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default SystemLogs;
