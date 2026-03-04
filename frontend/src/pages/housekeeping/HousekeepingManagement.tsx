import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Tag, Typography, Space, Input, Button, Modal, Form, Select, Statistic, Row, Col, Tabs, message } from 'antd';
import { ToolOutlined, SearchOutlined, ReloadOutlined, PlusOutlined, CheckCircleOutlined } from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface Task {
  id: string;
  taskNumber: string;
  locationName?: string;
  taskType: string;
  priority: string;
  status: string;
  assignedTo?: { firstName: string; lastName: string };
  scheduledTime?: string;
  startedAt?: string;
  completedAt?: string;
  turnaroundMinutes?: number;
  notes?: string;
}

const statusColor: Record<string, string> = { pending: 'default', assigned: 'blue', in_progress: 'orange', completed: 'green', verified: 'cyan' };
const priorityColor: Record<string, string> = { routine: 'default', urgent: 'orange', emergency: 'red' };

const HousekeepingManagement: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dashboard, setDashboard] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [form] = Form.useForm();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, dashRes] = await Promise.allSettled([
        api.get('/housekeeping', { params: { status: statusFilter } }),
        api.get('/housekeeping/dashboard'),
      ]);
      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value.data?.data || []);
      if (dashRes.status === 'fulfilled') setDashboard(dashRes.value.data?.data || {});
    } catch {}
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async (values: any) => {
    try {
      await api.post('/housekeeping', values);
      message.success('Task created'); setModalOpen(false); form.resetFields(); fetchAll();
    } catch { message.error('Failed to create task'); }
  };

  const handleAction = async (id: string, action: string) => {
    try {
      await api.patch(`/housekeeping/${id}/${action}`);
      message.success(`Task ${action}ed`); fetchAll();
    } catch { message.error(`Failed to ${action} task`); }
  };

  const filtered = tasks.filter(t => !search || t.taskNumber?.toLowerCase().includes(search.toLowerCase()) || t.locationName?.toLowerCase().includes(search.toLowerCase()));

  const columns = [
    { title: 'Task #', dataIndex: 'taskNumber', key: 'taskNumber', width: 160, render: (t: string) => <Text strong style={{ color: '#3B82F6' }}>{t}</Text> },
    { title: 'Location', dataIndex: 'locationName', key: 'location', width: 140 },
    { title: 'Type', dataIndex: 'taskType', key: 'type', width: 130, render: (t: string) => <Tag>{t?.replace(/_/g, ' ').toUpperCase()}</Tag> },
    { title: 'Priority', dataIndex: 'priority', key: 'priority', width: 100, render: (p: string) => <Tag color={priorityColor[p]}>{p?.toUpperCase()}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (s: string) => <Tag color={statusColor[s]}>{s?.replace(/_/g, ' ').toUpperCase()}</Tag> },
    { title: 'Assigned To', key: 'assigned', width: 140, render: (_: any, r: Task) => r.assignedTo ? `${r.assignedTo.firstName} ${r.assignedTo.lastName}` : '-' },
    { title: 'Turnaround', dataIndex: 'turnaroundMinutes', key: 'tat', width: 100, render: (m: number) => m ? `${m} min` : '-' },
    { title: 'Actions', key: 'actions', width: 200, render: (_: any, r: Task) => (
      <Space>
        {r.status === 'pending' && <Button size="small" onClick={() => handleAction(r.id, 'assign')}>Assign</Button>}
        {r.status === 'assigned' && <Button size="small" type="primary" onClick={() => handleAction(r.id, 'start')}>Start</Button>}
        {r.status === 'in_progress' && <Button size="small" style={{ background: '#10B981', color: '#fff' }} onClick={() => handleAction(r.id, 'complete')}>Complete</Button>}
        {r.status === 'completed' && <Button size="small" icon={<CheckCircleOutlined />} onClick={() => handleAction(r.id, 'verify')}>Verify</Button>}
      </Space>
    )},
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ color: '#3B82F6', marginBottom: 0 }}><ToolOutlined /> Housekeeping Management</Title>
          <Text type="secondary">Room cleaning, sanitization, and task management</Text>
        </div>
        <Space>
          <Select allowClear placeholder="Status" style={{ width: 140 }} value={statusFilter} onChange={setStatusFilter}
            options={[{ value: 'pending' }, { value: 'assigned' }, { value: 'in_progress' }, { value: 'completed' }, { value: 'verified' }]} />
          <Input placeholder="Search..." prefix={<SearchOutlined />} value={search} onChange={e => setSearch(e.target.value)} style={{ width: 180 }} />
          <Button icon={<ReloadOutlined />} onClick={fetchAll}>Refresh</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>New Task</Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}><Card><Statistic title="Pending" value={dashboard.pending || 0} valueStyle={{ color: '#6B7280' }} /></Card></Col>
        <Col span={4}><Card><Statistic title="Assigned" value={dashboard.assigned || 0} valueStyle={{ color: '#3B82F6' }} /></Card></Col>
        <Col span={4}><Card><Statistic title="In Progress" value={dashboard.inProgress || 0} valueStyle={{ color: '#F59E0B' }} /></Card></Col>
        <Col span={4}><Card><Statistic title="Completed" value={dashboard.completed || 0} valueStyle={{ color: '#10B981' }} /></Card></Col>
        <Col span={4}><Card><Statistic title="Verified" value={dashboard.verified || 0} valueStyle={{ color: '#06B6D4' }} /></Card></Col>
        <Col span={4}><Card><Statistic title="Total" value={dashboard.total || 0} /></Card></Col>
      </Row>

      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Table dataSource={filtered} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 15 }} size="middle" />
      </Card>

      <Modal title="New Housekeeping Task" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} okText="Create" width={500}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="locationName" label="Location" rules={[{ required: true }]}><Input placeholder="e.g. Ward A - Room 101" /></Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="taskType" label="Task Type" rules={[{ required: true }]}>
                <Select options={[{ value: 'cleaning' }, { value: 'sanitization' }, { value: 'linen_change' }, { value: 'waste_disposal' }, { value: 'deep_clean' }, { value: 'maintenance' }]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="Priority" rules={[{ required: true }]}>
                <Select options={[{ value: 'routine' }, { value: 'urgent' }, { value: 'emergency' }]} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HousekeepingManagement;
