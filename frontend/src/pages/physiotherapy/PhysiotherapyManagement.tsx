import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Select, Input, Tag, message, Row, Col, Statistic, Progress, DatePicker, TimePicker } from 'antd';
import { PlusOutlined, MedicineBoxOutlined, CheckCircleOutlined, ClockCircleOutlined, EyeOutlined } from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const STATUS_COLORS: Record<string, string> = {
  ordered: 'blue', scheduled: 'orange', in_progress: 'processing', completed: 'green', cancelled: 'red'
};

const PhysiotherapyManagement: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [treatmentTypes, setTreatmentTypes] = useState<any[]>([]);
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderModal, setOrderModal] = useState(false);
  const [sessionsModal, setSessionsModal] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [sessionForm] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, patientsRes, doctorsRes, typesRes, todayRes] = await Promise.all([
        api.get('/physiotherapy'),
        api.get('/users?role=patient&limit=100'),
        api.get('/users?role=doctor&limit=100'),
        api.get('/physiotherapy/treatment-types'),
        api.get('/physiotherapy/today-sessions'),
      ]);
      setOrders(ordersRes.data.data || []);
      setPatients(patientsRes.data?.data || []);
      setDoctors(doctorsRes.data?.data || []);
      setTreatmentTypes(typesRes.data.data || []);
      setTodaySessions(todayRes.data.data || []);
    } catch { message.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateOrder = async (values: any) => {
    try {
      await api.post('/physiotherapy', {
        ...values,
        startDate: values.startDate?.format('YYYY-MM-DD'),
      });
      message.success('Physiotherapy order created');
      setOrderModal(false);
      form.resetFields();
      fetchData();
    } catch { message.error('Failed to create order'); }
  };

  const handleViewSessions = async (order: any) => {
    setSessionsModal(order);
    try {
      const res = await api.get(`/physiotherapy/${order.id}/sessions`);
      setSessions(res.data.data || []);
    } catch { message.error('Failed to load sessions'); }
  };

  const handleAddSession = async (values: any) => {
    if (!sessionsModal) return;
    try {
      await api.post(`/physiotherapy/${sessionsModal.id}/sessions`, {
        scheduledDate: values.scheduledDate?.format('YYYY-MM-DD'),
        scheduledTime: values.scheduledTime?.format('HH:mm'),
        therapistId: values.therapistId,
      });
      message.success('Session scheduled');
      sessionForm.resetFields();
      const res = await api.get(`/physiotherapy/${sessionsModal.id}/sessions`);
      setSessions(res.data.data || []);
      fetchData();
    } catch { message.error('Failed to schedule session'); }
  };

  const handleCompleteSession = async (sessionId: string) => {
    try {
      await api.post(`/physiotherapy/sessions/${sessionId}/complete`, {});
      message.success('Session completed');
      if (sessionsModal) {
        const res = await api.get(`/physiotherapy/${sessionsModal.id}/sessions`);
        setSessions(res.data.data || []);
      }
      fetchData();
    } catch { message.error('Failed to complete session'); }
  };

  const columns = [
    { title: 'Order #', dataIndex: 'orderNumber', width: 130 },
    { title: 'Patient', render: (_: any, r: any) => r.patient ? `${r.patient.firstName} ${r.patient.lastName}` : '-' },
    { title: 'Diagnosis', dataIndex: 'diagnosis', ellipsis: true },
    { title: 'Treatment', dataIndex: 'treatmentType', render: (t: string) => t?.replace(/_/g, ' ') },
    { title: 'Sessions', render: (_: any, r: any) => (
      <div>
        <Progress percent={Math.round((r.completedSessions / r.totalSessions) * 100)} size="small" />
        <span style={{ fontSize: 12 }}>{r.completedSessions}/{r.totalSessions}</span>
      </div>
    ), width: 120 },
    { title: 'Doctor', render: (_: any, r: any) => r.doctor ? `Dr. ${r.doctor.firstName}` : '-' },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={STATUS_COLORS[s]}>{s?.replace(/_/g, ' ').toUpperCase()}</Tag> },
    {
      title: 'Actions', width: 120,
      render: (_: any, r: any) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewSessions(r)}>Sessions</Button>
      )
    },
  ];

  const sessionColumns = [
    { title: '#', dataIndex: 'sessionNumber', width: 50 },
    { title: 'Date', dataIndex: 'scheduledDate', render: (d: string) => d ? dayjs(d).format('DD/MM/YY') : '-' },
    { title: 'Time', dataIndex: 'scheduledTime' },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={s === 'completed' ? 'green' : s === 'scheduled' ? 'blue' : 'red'}>{s?.toUpperCase()}</Tag> },
    {
      title: 'Action', width: 100,
      render: (_: any, r: any) => r.status === 'scheduled' && (
        <Button size="small" type="primary" onClick={() => handleCompleteSession(r.id)}>Complete</Button>
      )
    },
  ];

  const totalOrders = orders.length;
  const activeOrders = orders.filter(o => o.status === 'in_progress' || o.status === 'scheduled').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="Total Orders" value={totalOrders} prefix={<MedicineBoxOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="Active" value={activeOrders} valueStyle={{ color: '#1890ff' }} prefix={<ClockCircleOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="Completed" value={completedOrders} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="Today's Sessions" value={todaySessions.length} valueStyle={{ color: '#faad14' }} /></Card></Col>
      </Row>

      <Card
        title={<><MedicineBoxOutlined /> Physiotherapy Orders</>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOrderModal(true)}>New Order</Button>}
      >
        <Table columns={columns} dataSource={orders} rowKey="id" loading={loading} size="small" />
      </Card>

      <Modal title="Create Physiotherapy Order" open={orderModal} onCancel={() => { setOrderModal(false); form.resetFields(); }} footer={null} width={700}>
        <Form form={form} layout="vertical" onFinish={handleCreateOrder}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="patientId" label="Patient" rules={[{ required: true }]}>
                <Select showSearch placeholder="Select patient" optionFilterProp="children" filterOption={(input, option) => (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())}>
                  {patients.map(p => <Option key={p.id} value={p.id}>{p.firstName} {p.lastName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="doctorId" label="Referring Doctor" rules={[{ required: true }]}>
                <Select showSearch placeholder="Select doctor" optionFilterProp="children" filterOption={(input, option) => (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())}>
                  {doctors.map(d => <Option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="diagnosis" label="Diagnosis" rules={[{ required: true }]}><Input placeholder="e.g., Lower back pain, Frozen shoulder" /></Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="treatmentType" label="Treatment Type" rules={[{ required: true }]}>
                <Select placeholder="Select treatment">{treatmentTypes.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}</Select>
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="bodyPart" label="Body Part"><Input placeholder="e.g., Lumbar spine, Right shoulder" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="totalSessions" label="Total Sessions" rules={[{ required: true }]}><Input type="number" min={1} placeholder="10" /></Form.Item></Col>
            <Col span={8}><Form.Item name="sessionDurationMinutes" label="Duration (mins)" initialValue={30}><Input type="number" min={15} /></Form.Item></Col>
            <Col span={8}><Form.Item name="frequency" label="Frequency"><Input placeholder="e.g., 3x per week" /></Form.Item></Col>
          </Row>
          <Form.Item name="startDate" label="Start Date"><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="instructions" label="Instructions"><TextArea rows={2} placeholder="Special instructions for therapist" /></Form.Item>
          <Form.Item name="goals" label="Treatment Goals"><TextArea rows={2} placeholder="Expected outcomes" /></Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => { setOrderModal(false); form.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit">Create Order</Button>
          </div>
        </Form>
      </Modal>

      <Modal title={`Sessions - ${sessionsModal?.orderNumber || ''}`} open={!!sessionsModal} onCancel={() => { setSessionsModal(null); setSessions([]); }} footer={null} width={700}>
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}><strong>Patient:</strong> {sessionsModal?.patient ? `${sessionsModal.patient.firstName} ${sessionsModal.patient.lastName}` : '-'}</Col>
            <Col span={8}><strong>Treatment:</strong> {sessionsModal?.treatmentType?.replace(/_/g, ' ')}</Col>
            <Col span={8}><strong>Progress:</strong> {sessionsModal?.completedSessions}/{sessionsModal?.totalSessions} sessions</Col>
          </Row>
        </Card>

        <Form form={sessionForm} layout="inline" onFinish={handleAddSession} style={{ marginBottom: 16 }}>
          <Form.Item name="scheduledDate" rules={[{ required: true }]}><DatePicker placeholder="Date" /></Form.Item>
          <Form.Item name="scheduledTime"><TimePicker format="HH:mm" placeholder="Time" /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit" icon={<PlusOutlined />}>Add Session</Button></Form.Item>
        </Form>

        <Table columns={sessionColumns} dataSource={sessions} rowKey="id" size="small" pagination={false} />
      </Modal>
    </div>
  );
};

export default PhysiotherapyManagement;
