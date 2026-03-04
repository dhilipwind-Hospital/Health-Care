import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Tag, Typography, Space, Button, Modal, Form, Input, Select, DatePicker, Tabs, Statistic, Row, Col, message } from 'antd';
import { SwapOutlined, ReloadOutlined, PlusOutlined, CheckCircleOutlined } from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Handover {
  id: string;
  shiftDate: string;
  shiftType: string;
  status: string;
  wardId?: string;
  departmentId?: string;
  patientUpdates?: any[];
  pendingTasks?: any[];
  criticalAlerts?: any[];
  medicationAlerts?: string;
  equipmentIssues?: string;
  generalNotes?: string;
  acknowledgedAt?: string;
  fromStaff?: { firstName: string; lastName: string };
  toStaff?: { firstName: string; lastName: string };
}

const statusColor: Record<string, string> = { draft: 'default', submitted: 'blue', acknowledged: 'green' };

const ShiftHandoverPage: React.FC = () => {
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState<Handover | null>(null);
  const [form] = Form.useForm();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/shift-handover');
      setHandovers(res.data?.data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async (values: any) => {
    try {
      const payload: any = {
        shiftDate: values.shiftDate?.format('YYYY-MM-DD'),
        shiftType: values.shiftType,
        wardId: values.wardId,
        generalNotes: values.generalNotes,
        medicationAlerts: values.medicationAlerts,
        equipmentIssues: values.equipmentIssues,
        status: values.status || 'submitted',
      };
      // Parse structured fields
      if (values.patientUpdates) {
        try { payload.patientUpdates = JSON.parse(values.patientUpdates); } catch { payload.patientUpdates = [{ note: values.patientUpdates }]; }
      }
      if (values.pendingTasks) {
        try { payload.pendingTasks = JSON.parse(values.pendingTasks); } catch { payload.pendingTasks = [{ task: values.pendingTasks }]; }
      }
      if (values.criticalAlerts) {
        try { payload.criticalAlerts = JSON.parse(values.criticalAlerts); } catch { payload.criticalAlerts = [{ alert: values.criticalAlerts }]; }
      }
      await api.post('/shift-handover', payload);
      message.success('Handover submitted'); setModalOpen(false); form.resetFields(); fetchAll();
    } catch { message.error('Failed to create handover'); }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await api.patch(`/shift-handover/${id}/acknowledge`);
      message.success('Handover acknowledged'); fetchAll(); setDetailModal(null);
    } catch { message.error('Failed to acknowledge'); }
  };

  const submitted = handovers.filter(h => h.status === 'submitted');
  const acknowledged = handovers.filter(h => h.status === 'acknowledged');

  const columns = [
    { title: 'Date', dataIndex: 'shiftDate', key: 'date', width: 120, render: (t: string) => t ? dayjs(t).format('DD/MM/YYYY') : '-' },
    { title: 'Shift', dataIndex: 'shiftType', key: 'shift', width: 100, render: (t: string) => <Tag>{t?.toUpperCase()}</Tag> },
    { title: 'From', key: 'from', width: 160, render: (_: any, r: Handover) => r.fromStaff ? `${r.fromStaff.firstName} ${r.fromStaff.lastName}` : '-' },
    { title: 'To', key: 'to', width: 160, render: (_: any, r: Handover) => r.toStaff ? `${r.toStaff.firstName} ${r.toStaff.lastName}` : 'Pending' },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (s: string) => <Tag color={statusColor[s]}>{s?.toUpperCase()}</Tag> },
    { title: 'Patient Updates', key: 'pu', width: 100, render: (_: any, r: Handover) => r.patientUpdates?.length || 0 },
    { title: 'Pending Tasks', key: 'pt', width: 100, render: (_: any, r: Handover) => r.pendingTasks?.length || 0 },
    { title: 'Critical Alerts', key: 'ca', width: 100, render: (_: any, r: Handover) => r.criticalAlerts?.length ? <Tag color="red">{r.criticalAlerts.length}</Tag> : 0 },
    { title: 'Actions', key: 'actions', width: 180, render: (_: any, r: Handover) => (
      <Space>
        <Button size="small" onClick={() => setDetailModal(r)}>View</Button>
        {r.status === 'submitted' && <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleAcknowledge(r.id)}>Acknowledge</Button>}
      </Space>
    )},
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ color: '#3B82F6', marginBottom: 0 }}><SwapOutlined /> Shift Handover</Title>
          <Text type="secondary">Manage shift handover notes and acknowledgments</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchAll}>Refresh</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>New Handover</Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}><Card><Statistic title="Total Handovers" value={handovers.length} valueStyle={{ color: '#3B82F6' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Pending Acknowledgment" value={submitted.length} valueStyle={{ color: '#F59E0B' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Acknowledged" value={acknowledged.length} valueStyle={{ color: '#10B981' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Drafts" value={handovers.filter(h => h.status === 'draft').length} /></Card></Col>
      </Row>

      <Tabs items={[
        { key: 'pending', label: `Pending (${submitted.length})`, children: (
          <Card bordered={false}><Table dataSource={submitted} columns={columns} rowKey="id" loading={loading} pagination={false} /></Card>
        )},
        { key: 'all', label: `All (${handovers.length})`, children: (
          <Card bordered={false}><Table dataSource={handovers} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 15 }} /></Card>
        )},
      ]} />

      {/* Create Modal */}
      <Modal title="Create Shift Handover" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} okText="Submit" width={700}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="shiftDate" label="Shift Date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="shiftType" label="Shift Type" rules={[{ required: true }]}>
              <Select options={[{ value: 'morning' }, { value: 'afternoon' }, { value: 'night' }, { value: 'general' }]} />
            </Form.Item></Col>
            <Col span={8}><Form.Item name="status" label="Status" initialValue="submitted">
              <Select options={[{ value: 'draft' }, { value: 'submitted' }]} />
            </Form.Item></Col>
          </Row>
          <Form.Item name="patientUpdates" label="Patient Updates (one per line or JSON array)"><TextArea rows={3} placeholder="Patient A - stable, vitals normal&#10;Patient B - fever reduced" /></Form.Item>
          <Form.Item name="pendingTasks" label="Pending Tasks"><TextArea rows={2} placeholder="Lab results awaited for Bed 5&#10;IV change due at 6 PM" /></Form.Item>
          <Form.Item name="criticalAlerts" label="Critical Alerts"><TextArea rows={2} placeholder="Patient C - allergic to penicillin" /></Form.Item>
          <Form.Item name="medicationAlerts" label="Medication Alerts"><TextArea rows={2} /></Form.Item>
          <Form.Item name="equipmentIssues" label="Equipment Issues"><TextArea rows={2} /></Form.Item>
          <Form.Item name="generalNotes" label="General Notes"><TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal title={`Handover Details — ${detailModal?.shiftDate}`} open={!!detailModal} onCancel={() => setDetailModal(null)} footer={
        detailModal?.status === 'submitted' ? [
          <Button key="close" onClick={() => setDetailModal(null)}>Close</Button>,
          <Button key="ack" type="primary" onClick={() => handleAcknowledge(detailModal!.id)}>Acknowledge</Button>,
        ] : [<Button key="close" onClick={() => setDetailModal(null)}>Close</Button>]
      } width={600}>
        {detailModal && (
          <div>
            <p><Text strong>From:</Text> {detailModal.fromStaff ? `${detailModal.fromStaff.firstName} ${detailModal.fromStaff.lastName}` : '-'}</p>
            <p><Text strong>Shift:</Text> {detailModal.shiftType?.toUpperCase()} | <Text strong>Status:</Text> <Tag color={statusColor[detailModal.status]}>{detailModal.status?.toUpperCase()}</Tag></p>
            {detailModal.patientUpdates?.length ? <><Text strong>Patient Updates:</Text><ul>{detailModal.patientUpdates.map((u: any, i: number) => <li key={i}>{typeof u === 'string' ? u : JSON.stringify(u)}</li>)}</ul></> : null}
            {detailModal.pendingTasks?.length ? <><Text strong>Pending Tasks:</Text><ul>{detailModal.pendingTasks.map((t: any, i: number) => <li key={i}>{typeof t === 'string' ? t : JSON.stringify(t)}</li>)}</ul></> : null}
            {detailModal.criticalAlerts?.length ? <><Text strong style={{ color: '#EF4444' }}>Critical Alerts:</Text><ul>{detailModal.criticalAlerts.map((a: any, i: number) => <li key={i} style={{ color: '#EF4444' }}>{typeof a === 'string' ? a : JSON.stringify(a)}</li>)}</ul></> : null}
            {detailModal.medicationAlerts && <p><Text strong>Medication Alerts:</Text> {detailModal.medicationAlerts}</p>}
            {detailModal.equipmentIssues && <p><Text strong>Equipment Issues:</Text> {detailModal.equipmentIssues}</p>}
            {detailModal.generalNotes && <p><Text strong>General Notes:</Text> {detailModal.generalNotes}</p>}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ShiftHandoverPage;
