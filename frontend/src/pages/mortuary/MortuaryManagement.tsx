import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Tag, Typography, Space, Input, Button, Modal, Form, Select, DatePicker, Statistic, Row, Col, Tabs, Switch, message } from 'antd';
import { SearchOutlined, ReloadOutlined, PlusOutlined, SafetyOutlined } from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface MortuaryRecord {
  id: string;
  recordNumber: string;
  deceasedName: string;
  dateOfDeath: string;
  timeOfDeath?: string;
  causeOfDeath?: string;
  chamberNumber?: string;
  preservationType: string;
  status: string;
  policeNotified: boolean;
  postMortemRequired: boolean;
  postMortemCompleted: boolean;
  releasedTo?: string;
  releasedAt?: string;
  notes?: string;
  patient?: { firstName: string; lastName: string };
}

const statusColor: Record<string, string> = { admitted: 'blue', stored: 'cyan', post_mortem: 'orange', ready_for_release: 'green', released: 'default' };

const MortuaryManagement: React.FC = () => {
  const [records, setRecords] = useState<MortuaryRecord[]>([]);
  const [occupancy, setOccupancy] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [admitModalOpen, setAdmitModalOpen] = useState(false);
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [search, setSearch] = useState('');
  const [admitForm] = Form.useForm();
  const [releaseForm] = Form.useForm();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [recRes, occRes] = await Promise.allSettled([
        api.get('/mortuary'),
        api.get('/mortuary/occupancy'),
      ]);
      if (recRes.status === 'fulfilled') setRecords(recRes.value.data?.data || []);
      if (occRes.status === 'fulfilled') setOccupancy(occRes.value.data?.data || {});
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAdmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        dateOfDeath: values.dateOfDeath?.format('YYYY-MM-DD'),
        policeNotified: values.policeNotified ?? false,
        postMortemRequired: values.postMortemRequired ?? false,
      };
      await api.post('/mortuary/admit', payload);
      message.success('Body admitted'); setAdmitModalOpen(false); admitForm.resetFields(); fetchAll();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to admit';
      message.error(msg);
    }
  };

  const handleRelease = async (values: any) => {
    try {
      await api.patch(`/mortuary/${selectedId}/release`, values);
      message.success('Body released'); setReleaseModalOpen(false); releaseForm.resetFields(); fetchAll();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to release';
      message.error(msg);
    }
  };

  const filtered = records.filter(r => !search || r.deceasedName?.toLowerCase().includes(search.toLowerCase()) || r.recordNumber?.toLowerCase().includes(search.toLowerCase()));
  const activeRecords = filtered.filter(r => r.status !== 'released');

  const columns = [
    { title: 'Record #', dataIndex: 'recordNumber', key: 'recordNumber', width: 160, render: (t: string) => <Text strong style={{ color: '#3B82F6' }}>{t}</Text> },
    { title: 'Deceased Name', dataIndex: 'deceasedName', key: 'name', width: 160 },
    { title: 'Date of Death', dataIndex: 'dateOfDeath', key: 'dod', width: 120, render: (t: string) => t ? dayjs(t).format('DD/MM/YYYY') : '-' },
    { title: 'Chamber', dataIndex: 'chamberNumber', key: 'chamber', width: 100 },
    { title: 'Preservation', dataIndex: 'preservationType', key: 'preservation', width: 120, render: (t: string) => <Tag>{t?.toUpperCase()}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 140, render: (s: string) => <Tag color={statusColor[s]}>{s?.replace(/_/g, ' ').toUpperCase()}</Tag> },
    { title: 'Police', dataIndex: 'policeNotified', key: 'police', width: 80, render: (v: boolean) => v ? <Tag color="red">Yes</Tag> : 'No' },
    { title: 'Post-Mortem', key: 'pm', width: 100, render: (_: any, r: MortuaryRecord) => r.postMortemRequired ? (r.postMortemCompleted ? <Tag color="green">Done</Tag> : <Tag color="orange">Pending</Tag>) : 'N/A' },
    { title: 'Released To', dataIndex: 'releasedTo', key: 'releasedTo', width: 140 },
    { title: 'Actions', key: 'actions', width: 120, render: (_: any, r: MortuaryRecord) => (
      r.status !== 'released' && <Button size="small" type="primary" onClick={() => { setSelectedId(r.id); setReleaseModalOpen(true); }}>Release</Button>
    )},
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ color: '#3B82F6', marginBottom: 0 }}><SafetyOutlined /> Mortuary Management</Title>
          <Text type="secondary">Body preservation, storage, and release management</Text>
        </div>
        <Space>
          <Input placeholder="Search..." prefix={<SearchOutlined />} value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200 }} />
          <Button icon={<ReloadOutlined />} onClick={fetchAll}>Refresh</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAdmitModalOpen(true)}>Admit Body</Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}><Card><Statistic title="Currently Occupied" value={occupancy.occupied || 0} valueStyle={{ color: '#EF4444' }} /></Card></Col>
        <Col span={8}><Card><Statistic title="Total Released" value={occupancy.released || 0} valueStyle={{ color: '#10B981' }} /></Card></Col>
        <Col span={8}><Card><Statistic title="Total Records" value={occupancy.total || 0} valueStyle={{ color: '#3B82F6' }} /></Card></Col>
      </Row>

      <Tabs items={[
        { key: 'active', label: `Active (${activeRecords.length})`, children: (
          <Card bordered={false}><Table dataSource={activeRecords} columns={columns} rowKey="id" loading={loading} pagination={false} /></Card>
        )},
        { key: 'all', label: `All Records (${filtered.length})`, children: (
          <Card bordered={false}><Table dataSource={filtered} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 15 }} /></Card>
        )},
      ]} />

      <Modal title="Admit Body" open={admitModalOpen} onCancel={() => setAdmitModalOpen(false)} onOk={() => admitForm.submit()} okText="Admit" width={600}>
        <Form form={admitForm} layout="vertical" onFinish={handleAdmit}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="deceasedName" label="Deceased Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="dateOfDeath" label="Date of Death" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="timeOfDeath" label="Time of Death"><Input placeholder="HH:MM" /></Form.Item></Col>
            <Col span={12}><Form.Item name="chamberNumber" label="Chamber Number"><Input /></Form.Item></Col>
          </Row>
          <Form.Item name="causeOfDeath" label="Cause of Death"><Input.TextArea rows={2} /></Form.Item>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="preservationType" label="Preservation" initialValue="refrigeration"><Select options={[{ value: 'refrigeration' }, { value: 'embalming' }, { value: 'none' }]} /></Form.Item></Col>
            <Col span={8}><Form.Item name="policeNotified" label="Police Notified" valuePropName="checked"><Switch /></Form.Item></Col>
            <Col span={8}><Form.Item name="postMortemRequired" label="Post-Mortem Required" valuePropName="checked"><Switch /></Form.Item></Col>
          </Row>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      <Modal title="Release Body" open={releaseModalOpen} onCancel={() => setReleaseModalOpen(false)} onOk={() => releaseForm.submit()} okText="Release">
        <Form form={releaseForm} layout="vertical" onFinish={handleRelease}>
          <Form.Item name="releasedTo" label="Released To" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="releasedToRelation" label="Relationship"><Input /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="releasedToIdType" label="ID Type"><Select options={[{ value: 'aadhaar' }, { value: 'passport' }, { value: 'driving_license' }, { value: 'voter_id' }]} /></Form.Item></Col>
            <Col span={12}><Form.Item name="releasedToIdNumber" label="ID Number"><Input /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default MortuaryManagement;
