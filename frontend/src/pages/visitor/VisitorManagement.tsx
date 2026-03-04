import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Tag, Typography, Space, Input, Button, Modal, Form, Select, DatePicker, Tabs, Statistic, Row, Col, message } from 'antd';
import { UserAddOutlined, SearchOutlined, ReloadOutlined, LoginOutlined, LogoutOutlined, TeamOutlined } from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface Visitor {
  id: string;
  passNumber: string;
  visitorName: string;
  phone?: string;
  relationship?: string;
  patientId: string;
  purpose?: string;
  visitDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: string;
  idType?: string;
  idNumber?: string;
  notes?: string;
  patient?: { firstName: string; lastName: string };
}

const statusColor: Record<string, string> = {
  scheduled: 'blue',
  checked_in: 'green',
  checked_out: 'default',
  denied: 'red',
};

const VisitorManagement: React.FC = () => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [activeVisitors, setActiveVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [form] = Form.useForm();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [allRes, activeRes] = await Promise.allSettled([
        api.get('/visitors'),
        api.get('/visitors/active'),
      ]);
      if (allRes.status === 'fulfilled') setVisitors(allRes.value.data?.data || []);
      if (activeRes.status === 'fulfilled') setActiveVisitors(activeRes.value.data?.data || []);
    } catch { message.error('Failed to load visitors'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async (values: any) => {
    try {
      await api.post('/visitors', { ...values, visitDate: values.visitDate?.format('YYYY-MM-DD') });
      message.success('Visitor pass created');
      setModalOpen(false);
      form.resetFields();
      fetchAll();
    } catch { message.error('Failed to create visitor'); }
  };

  const handleCheckIn = async (id: string) => {
    try { await api.patch(`/visitors/${id}/check-in`); message.success('Checked in'); fetchAll(); }
    catch { message.error('Check-in failed'); }
  };

  const handleCheckOut = async (id: string) => {
    try { await api.patch(`/visitors/${id}/check-out`); message.success('Checked out'); fetchAll(); }
    catch { message.error('Check-out failed'); }
  };

  const filtered = visitors.filter(v =>
    !search || v.visitorName?.toLowerCase().includes(search.toLowerCase()) ||
    v.passNumber?.toLowerCase().includes(search.toLowerCase()) ||
    v.patient?.firstName?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { title: 'Pass #', dataIndex: 'passNumber', key: 'passNumber', width: 160, render: (t: string) => <Text strong style={{ color: '#3B82F6' }}>{t}</Text> },
    { title: 'Visitor', dataIndex: 'visitorName', key: 'visitorName', width: 160 },
    { title: 'Patient', key: 'patient', width: 160, render: (_: any, r: Visitor) => r.patient ? `${r.patient.firstName} ${r.patient.lastName}` : '-' },
    { title: 'Relationship', dataIndex: 'relationship', key: 'relationship', width: 120 },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', width: 130 },
    { title: 'Visit Date', dataIndex: 'visitDate', key: 'visitDate', width: 120, render: (t: string) => t ? dayjs(t).format('DD/MM/YYYY') : '-' },
    { title: 'Check In', dataIndex: 'checkInTime', key: 'checkInTime', width: 100, render: (t: string) => t ? dayjs(t).format('HH:mm') : '-' },
    { title: 'Check Out', dataIndex: 'checkOutTime', key: 'checkOutTime', width: 100, render: (t: string) => t ? dayjs(t).format('HH:mm') : '-' },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 110, render: (s: string) => <Tag color={statusColor[s] || 'default'}>{s?.replace(/_/g, ' ').toUpperCase()}</Tag> },
    { title: 'Actions', key: 'actions', width: 180, render: (_: any, r: Visitor) => (
      <Space>
        {(r.status === 'scheduled') && <Button size="small" type="primary" icon={<LoginOutlined />} onClick={() => handleCheckIn(r.id)}>Check In</Button>}
        {(r.status === 'checked_in') && <Button size="small" danger icon={<LogoutOutlined />} onClick={() => handleCheckOut(r.id)}>Check Out</Button>}
      </Space>
    )},
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ color: '#3B82F6', marginBottom: 0 }}><TeamOutlined /> Visitor Management</Title>
          <Text type="secondary">Manage inpatient visitor passes and tracking</Text>
        </div>
        <Space>
          <Input placeholder="Search..." prefix={<SearchOutlined />} value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200 }} />
          <Button icon={<ReloadOutlined />} onClick={fetchAll}>Refresh</Button>
          <Button type="primary" icon={<UserAddOutlined />} onClick={() => setModalOpen(true)}>New Visitor Pass</Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}><Card><Statistic title="Active Visitors" value={activeVisitors.length} valueStyle={{ color: '#10B981' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Today's Visits" value={visitors.filter(v => v.visitDate === dayjs().format('YYYY-MM-DD')).length} valueStyle={{ color: '#3B82F6' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Checked Out Today" value={visitors.filter(v => v.status === 'checked_out' && v.visitDate === dayjs().format('YYYY-MM-DD')).length} /></Card></Col>
        <Col span={6}><Card><Statistic title="Total Records" value={visitors.length} /></Card></Col>
      </Row>

      <Tabs items={[
        { key: 'active', label: `Active (${activeVisitors.length})`, children: (
          <Card bordered={false}>
            <Table dataSource={activeVisitors} columns={columns} rowKey="id" loading={loading} pagination={false} size="middle" />
          </Card>
        )},
        { key: 'all', label: `All Visitors (${filtered.length})`, children: (
          <Card bordered={false}>
            <Table dataSource={filtered} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 15 }} size="middle" />
          </Card>
        )},
      ]} />

      <Modal title="New Visitor Pass" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} okText="Create Pass" width={600}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="visitorName" label="Visitor Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="phone" label="Phone"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="patientId" label="Patient ID" rules={[{ required: true }]}><Input placeholder="Patient UUID" /></Form.Item></Col>
            <Col span={12}><Form.Item name="relationship" label="Relationship"><Select options={[{ value: 'spouse' }, { value: 'parent' }, { value: 'child' }, { value: 'sibling' }, { value: 'friend' }, { value: 'other' }]} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="visitDate" label="Visit Date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="purpose" label="Purpose"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="idType" label="ID Type"><Select options={[{ value: 'aadhaar' }, { value: 'passport' }, { value: 'driving_license' }, { value: 'voter_id' }]} /></Form.Item></Col>
            <Col span={12}><Form.Item name="idNumber" label="ID Number"><Input /></Form.Item></Col>
          </Row>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VisitorManagement;
