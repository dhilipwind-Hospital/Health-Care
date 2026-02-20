import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Select, Input, Tag, message, DatePicker, Row, Col, Tabs, Statistic, Space } from 'antd';
import { PlusOutlined, VideoCameraOutlined, PlayCircleOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'blue', waiting: 'orange', in_progress: 'green', completed: 'default', cancelled: 'red', no_show: 'volcano'
};

const TelemedicineManagement: React.FC = () => {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [consultTypes, setConsultTypes] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedConsult, setSelectedConsult] = useState<any>(null);
  const [form] = Form.useForm();
  const [endForm] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [consultRes, todayRes, typesRes, patientsRes, doctorsRes] = await Promise.all([
        api.get('/telemedicine'),
        api.get('/telemedicine/today'),
        api.get('/telemedicine/types'),
        api.get('/users?role=patient&limit=100'),
        api.get('/users?role=doctor&limit=100'),
      ]);
      setConsultations(consultRes.data.data || []);
      setTodaySchedule(todayRes.data.data || []);
      setConsultTypes(typesRes.data.data || []);
      setPatients(patientsRes.data?.data || []);
      setDoctors(doctorsRes.data?.data || []);
    } catch { message.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (values: any) => {
    try {
      await api.post('/telemedicine', {
        ...values,
        scheduledAt: values.scheduledAt?.toISOString(),
      });
      message.success('Consultation scheduled');
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch { message.error('Failed to schedule consultation'); }
  };

  const handleStart = async (id: string) => {
    try {
      await api.post(`/telemedicine/${id}/start`);
      message.success('Consultation started');
      fetchData();
    } catch { message.error('Failed to start consultation'); }
  };

  const handleEnd = async (values: any) => {
    if (!selectedConsult) return;
    try {
      await api.post(`/telemedicine/${selectedConsult.id}/end`, {
        ...values,
        followUpDate: values.followUpDate?.format('YYYY-MM-DD'),
      });
      message.success('Consultation ended');
      setSelectedConsult(null);
      endForm.resetFields();
      fetchData();
    } catch { message.error('Failed to end consultation'); }
  };

  const columns = [
    { title: 'Consultation #', dataIndex: 'consultationNumber', width: 130 },
    { title: 'Patient', render: (_: any, r: any) => r.patient ? `${r.patient.firstName} ${r.patient.lastName}` : '-' },
    { title: 'Doctor', render: (_: any, r: any) => r.doctor ? `Dr. ${r.doctor.firstName} ${r.doctor.lastName}` : '-' },
    { title: 'Type', dataIndex: 'consultationType', render: (t: string) => t?.toUpperCase() },
    { title: 'Scheduled', dataIndex: 'scheduledAt', render: (d: string) => d ? dayjs(d).format('DD/MM/YY HH:mm') : '-' },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={STATUS_COLORS[s]}>{s?.replace(/_/g, ' ').toUpperCase()}</Tag> },
    { title: 'Duration', dataIndex: 'durationMinutes', render: (d: number) => d ? `${d} min` : '-' },
    {
      title: 'Actions', width: 200,
      render: (_: any, r: any) => (
        <Space size={4}>
          {r.status === 'scheduled' && <Button size="small" type="primary" icon={<PlayCircleOutlined />} onClick={() => handleStart(r.id)}>Start</Button>}
          {r.status === 'in_progress' && <Button size="small" danger icon={<StopOutlined />} onClick={() => setSelectedConsult(r)}>End</Button>}
          {r.meetingLink && <Button size="small" onClick={() => window.open(r.meetingLink, '_blank')}>Join</Button>}
        </Space>
      )
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="Today's Schedule" value={todaySchedule.length} prefix={<VideoCameraOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="In Progress" value={consultations.filter(c => c.status === 'in_progress').length} valueStyle={{ color: '#3f8600' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Completed Today" value={consultations.filter(c => c.status === 'completed' && dayjs(c.endedAt).isSame(dayjs(), 'day')).length} /></Card></Col>
        <Col span={6}><Card><Statistic title="Total Consultations" value={consultations.length} /></Card></Col>
      </Row>

      <Card
        title={<><VideoCameraOutlined /> Telemedicine Consultations</>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>Schedule Consultation</Button>}
      >
        <Tabs defaultActiveKey="all" items={[
          { key: 'today', label: `Today (${todaySchedule.length})`, children: <Table columns={columns} dataSource={todaySchedule} rowKey="id" size="small" /> },
          { key: 'all', label: 'All Consultations', children: <Table columns={columns} dataSource={consultations} rowKey="id" loading={loading} size="small" /> },
        ]} />
      </Card>

      <Modal title="Schedule Telemedicine Consultation" open={modalVisible} onCancel={() => { setModalVisible(false); form.resetFields(); }} footer={null} width={600}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="patientId" label="Patient" rules={[{ required: true }]}>
                <Select showSearch placeholder="Select patient" optionFilterProp="children" filterOption={(input, option) => (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())}>
                  {patients.map(p => <Option key={p.id} value={p.id}>{p.firstName} {p.lastName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="doctorId" label="Doctor" rules={[{ required: true }]}>
                <Select showSearch placeholder="Select doctor" optionFilterProp="children" filterOption={(input, option) => (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())}>
                  {doctors.map(d => <Option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="consultationType" label="Type" initialValue="video">
                <Select>{consultTypes.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}</Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="scheduledAt" label="Schedule Date/Time" rules={[{ required: true }]}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="chiefComplaint" label="Chief Complaint"><TextArea rows={2} placeholder="Patient's main concern" /></Form.Item>
          <Form.Item name="fee" label="Consultation Fee (₹)"><Input type="number" /></Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => { setModalVisible(false); form.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit">Schedule</Button>
          </div>
        </Form>
      </Modal>

      <Modal title="End Consultation" open={!!selectedConsult} onCancel={() => { setSelectedConsult(null); endForm.resetFields(); }} footer={null} width={600}>
        <Form form={endForm} layout="vertical" onFinish={handleEnd}>
          <Form.Item name="diagnosis" label="Diagnosis"><TextArea rows={2} /></Form.Item>
          <Form.Item name="prescription" label="Prescription / Treatment"><TextArea rows={3} /></Form.Item>
          <Form.Item name="notes" label="Notes"><TextArea rows={2} /></Form.Item>
          <Form.Item name="followUpDate" label="Follow-up Date"><DatePicker style={{ width: '100%' }} /></Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => { setSelectedConsult(null); endForm.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit" icon={<CheckCircleOutlined />}>Complete Consultation</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default TelemedicineManagement;
