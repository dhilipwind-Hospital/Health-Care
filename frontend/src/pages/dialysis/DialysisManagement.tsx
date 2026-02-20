import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, DatePicker, TimePicker, Row, Col, Space, Tag, message, Tabs, Statistic, InputNumber, Descriptions } from 'antd';
import { PlusOutlined, PlayCircleOutlined, CheckCircleOutlined, ToolOutlined, UserOutlined } from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

const DialysisManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('sessions');
  const [machines, setMachines] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalType, setModalType] = useState<string | null>(null);
  const [viewSession, setViewSession] = useState<any>(null);
  const [form] = Form.useForm();

  const loadAll = async () => {
    try {
      setLoading(true);
      const [mRes, sRes, pRes, patRes, docRes] = await Promise.all([
        api.get('/dialysis/machines'),
        api.get('/dialysis/sessions?limit=50'),
        api.get('/dialysis/profiles'),
        api.get('/users?role=patient&limit=100'),
        api.get('/users?role=doctor&limit=100'),
      ]);
      setMachines(mRes.data?.data || []);
      setSessions(sRes.data?.data || []);
      setProfiles(pRes.data?.data || []);
      setPatients(patRes.data?.data || patRes.data || []);
      setDoctors(docRes.data?.data || docRes.data || []);
    } catch { message.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, []);

  const handleSaveMachine = async (values: any) => {
    try {
      await api.post('/dialysis/machines', values);
      message.success('Machine added');
      setModalType(null); form.resetFields(); loadAll();
    } catch (e: any) { message.error(e.response?.data?.message || 'Failed'); }
  };

  const handleCreateSession = async (values: any) => {
    try {
      const payload = { ...values, scheduledDate: values.scheduledDate?.format('YYYY-MM-DD'), scheduledTime: values.scheduledTime?.format('HH:mm') };
      await api.post('/dialysis/sessions', payload);
      message.success('Session scheduled');
      setModalType(null); form.resetFields(); loadAll();
    } catch (e: any) { message.error(e.response?.data?.message || 'Failed'); }
  };

  const handleStartSession = async (id: string) => {
    try {
      await api.patch(`/dialysis/sessions/${id}/start`, {});
      message.success('Session started');
      loadAll();
    } catch { message.error('Failed to start'); }
  };

  const handleCompleteSession = async (id: string) => {
    try {
      await api.patch(`/dialysis/sessions/${id}/complete`, {});
      message.success('Session completed');
      loadAll();
    } catch { message.error('Failed to complete'); }
  };

  const handleCreateProfile = async (values: any) => {
    try {
      const payload = { ...values, dialysisStartDate: values.dialysisStartDate?.format('YYYY-MM-DD') };
      await api.post('/dialysis/profiles', payload);
      message.success('Profile created');
      setModalType(null); form.resetFields(); loadAll();
    } catch (e: any) { message.error(e.response?.data?.message || 'Failed'); }
  };

  const machineStatusColor: Record<string, string> = { available: 'green', in_use: 'blue', maintenance: 'orange', out_of_order: 'red' };
  const sessionStatusColor: Record<string, string> = { scheduled: 'blue', in_progress: 'orange', completed: 'green', cancelled: 'red', missed: 'default' };

  const machineCols = [
    { title: 'Machine #', dataIndex: 'machineNumber', key: 'num' },
    { title: 'Brand', dataIndex: 'brand', key: 'brand' },
    { title: 'Model', dataIndex: 'model', key: 'model' },
    { title: 'Total Sessions', dataIndex: 'totalSessions', key: 'ts' },
    { title: 'Status', dataIndex: 'status', key: 'st', render: (v: string) => <Tag color={machineStatusColor[v] || 'default'}>{v?.replace(/_/g, ' ').toUpperCase()}</Tag> },
  ];

  const sessionCols = [
    { title: 'Session #', dataIndex: 'sessionNumber', key: 'sn', width: 130 },
    { title: 'Patient', key: 'pt', render: (_: any, r: any) => r.patient ? `${r.patient.firstName} ${r.patient.lastName}` : '-' },
    { title: 'Date', dataIndex: 'scheduledDate', key: 'sd', render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '-' },
    { title: 'Time', dataIndex: 'scheduledTime', key: 'st' },
    { title: 'Type', dataIndex: 'sessionType', key: 'type', render: (v: string) => v?.replace(/_/g, ' ').toUpperCase() },
    { title: 'Machine', key: 'mc', render: (_: any, r: any) => r.machine?.machineNumber || '-' },
    { title: 'Duration', dataIndex: 'durationMinutes', key: 'dur', render: (v: number) => v ? `${v} min` : '-' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={sessionStatusColor[v] || 'default'}>{v?.replace(/_/g, ' ').toUpperCase()}</Tag> },
    {
      title: 'Actions', key: 'actions', width: 200, render: (_: any, r: any) => (
        <Space>
          <Button size="small" onClick={() => setViewSession(r)}>View</Button>
          {r.status === 'scheduled' && <Button size="small" type="primary" icon={<PlayCircleOutlined />} onClick={() => handleStartSession(r.id)}>Start</Button>}
          {r.status === 'in_progress' && <Button size="small" style={{ background: '#52c41a', color: '#fff' }} icon={<CheckCircleOutlined />} onClick={() => handleCompleteSession(r.id)}>Complete</Button>}
        </Space>
      ),
    },
  ];

  const profileCols = [
    { title: 'Patient', key: 'pt', render: (_: any, r: any) => r.patient ? `${r.patient.firstName} ${r.patient.lastName}` : '-' },
    { title: 'Diagnosis', dataIndex: 'primaryDiagnosis', key: 'dx' },
    { title: 'Start Date', dataIndex: 'dialysisStartDate', key: 'sd', render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '-' },
    { title: 'Access Type', dataIndex: 'accessType', key: 'at' },
    { title: 'Frequency', dataIndex: 'prescribedFrequency', key: 'freq' },
    { title: 'Sessions', dataIndex: 'totalSessions', key: 'ts' },
    { title: 'Active', dataIndex: 'isActive', key: 'act', render: (v: boolean) => v ? <Tag color="green">Active</Tag> : <Tag>Inactive</Tag> },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="Machines" value={machines.length} prefix={<ToolOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="Available Machines" value={machines.filter(m => m.status === 'available').length} valueStyle={{ color: '#3f8600' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Today's Sessions" value={sessions.filter(s => s.scheduledDate === dayjs().format('YYYY-MM-DD')).length} /></Card></Col>
        <Col span={6}><Card><Statistic title="Active Patients" value={profiles.filter(p => p.isActive).length} prefix={<UserOutlined />} /></Card></Col>
      </Row>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} tabBarExtraContent={
          <Space>
            {activeTab === 'machines' && <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalType('machine'); }}>Add Machine</Button>}
            {activeTab === 'sessions' && <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalType('session'); }}>Schedule Session</Button>}
            {activeTab === 'profiles' && <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalType('profile'); }}>Add Patient Profile</Button>}
          </Space>
        } items={[
          { key: 'sessions', label: 'Sessions', children: <Table dataSource={sessions} columns={sessionCols} rowKey="id" loading={loading} size="small" /> },
          { key: 'machines', label: 'Machines', children: <Table dataSource={machines} columns={machineCols} rowKey="id" loading={loading} size="small" /> },
          { key: 'profiles', label: 'Patient Profiles', children: <Table dataSource={profiles} columns={profileCols} rowKey="id" loading={loading} size="small" /> },
        ]} />
      </Card>

      {/* Machine Modal */}
      <Modal title="Add Dialysis Machine" open={modalType === 'machine'} onCancel={() => setModalType(null)} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleSaveMachine}>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="machineNumber" label="Machine #" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="brand" label="Brand"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="model" label="Model"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="serialNumber" label="Serial Number"><Input /></Form.Item></Col>
          </Row>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}><Button onClick={() => setModalType(null)}>Cancel</Button><Button type="primary" htmlType="submit">Add</Button></div>
        </Form>
      </Modal>

      {/* Session Modal */}
      <Modal title="Schedule Dialysis Session" open={modalType === 'session'} onCancel={() => setModalType(null)} footer={null} width={700} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleCreateSession}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="patientId" label="Patient" rules={[{ required: true }]}>
                <Select showSearch placeholder="Select patient" optionFilterProp="children" filterOption={(input, option) => (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())}>
                  {patients.map(p => <Option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.email})</Option>)}
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
            <Col span={12}>
              <Form.Item name="machineId" label="Machine" rules={[{ required: true }]}>
                <Select placeholder="Select machine">
                  {machines.filter(m => m.status === 'available').map(m => <Option key={m.id} value={m.id}>{m.machineNumber} - {m.brand}</Option>)}
                  {machines.filter(m => m.status === 'available').length === 0 && <Option disabled value="">No available machines</Option>}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="sessionType" label="Type" initialValue="hemodialysis"><Select><Option value="hemodialysis">Hemodialysis</Option><Option value="peritoneal">Peritoneal</Option><Option value="crrt">CRRT</Option><Option value="hemodiafiltration">Hemodiafiltration</Option></Select></Form.Item></Col>
            <Col span={8}><Form.Item name="scheduledDate" label="Date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="scheduledTime" label="Time" rules={[{ required: true }]}><TimePicker format="HH:mm" style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="targetUF" label="Target UF (ml)"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}><Button onClick={() => setModalType(null)}>Cancel</Button><Button type="primary" htmlType="submit">Schedule</Button></div>
        </Form>
      </Modal>

      {/* Profile Modal */}
      <Modal title="Add Dialysis Patient Profile" open={modalType === 'profile'} onCancel={() => setModalType(null)} footer={null} width={600} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleCreateProfile}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="patientId" label="Patient" rules={[{ required: true }]}>
                <Select showSearch placeholder="Select patient" optionFilterProp="children" filterOption={(input, option) => (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())}>
                  {patients.map(p => <Option key={p.id} value={p.id}>{p.firstName} {p.lastName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="primaryDiagnosis" label="Primary Diagnosis" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="dialysisStartDate" label="Dialysis Start Date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="accessType" label="Access Type" rules={[{ required: true }]}><Select><Option value="avf">AVF</Option><Option value="avg">AVG</Option><Option value="catheter_tunneled">Catheter (Tunneled)</Option><Option value="catheter_temporary">Catheter (Temporary)</Option></Select></Form.Item></Col>
            <Col span={8}><Form.Item name="dryWeight" label="Dry Weight (kg)"><InputNumber min={0} step={0.1} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="prescribedFrequency" label="Frequency"><Input placeholder="e.g. 3x/week" /></Form.Item></Col>
            <Col span={8}><Form.Item name="prescribedDuration" label="Duration (min)"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}><Button onClick={() => setModalType(null)}>Cancel</Button><Button type="primary" htmlType="submit">Create</Button></div>
        </Form>
      </Modal>

      {/* Session Detail Modal */}
      <Modal title="Session Details" open={!!viewSession} onCancel={() => setViewSession(null)} footer={null} width={700}>
        {viewSession && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Session #">{viewSession.sessionNumber}</Descriptions.Item>
            <Descriptions.Item label="Status"><Tag color={sessionStatusColor[viewSession.status]}>{viewSession.status?.replace(/_/g, ' ').toUpperCase()}</Tag></Descriptions.Item>
            <Descriptions.Item label="Patient">{viewSession.patient ? `${viewSession.patient.firstName} ${viewSession.patient.lastName}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="Doctor">{viewSession.doctor ? `${viewSession.doctor.firstName} ${viewSession.doctor.lastName}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="Date">{viewSession.scheduledDate ? dayjs(viewSession.scheduledDate).format('DD/MM/YYYY') : '-'}</Descriptions.Item>
            <Descriptions.Item label="Machine">{viewSession.machine?.machineNumber || '-'}</Descriptions.Item>
            <Descriptions.Item label="Type">{viewSession.sessionType?.replace(/_/g, ' ')}</Descriptions.Item>
            <Descriptions.Item label="Duration">{viewSession.durationMinutes ? `${viewSession.durationMinutes} min` : '-'}</Descriptions.Item>
            <Descriptions.Item label="Pre Weight">{viewSession.preWeight || '-'} kg</Descriptions.Item>
            <Descriptions.Item label="Post Weight">{viewSession.postWeight || '-'} kg</Descriptions.Item>
            <Descriptions.Item label="Pre BP">{viewSession.preBP || '-'}</Descriptions.Item>
            <Descriptions.Item label="Post BP">{viewSession.postBP || '-'}</Descriptions.Item>
            <Descriptions.Item label="Actual UF">{viewSession.actualUF || '-'} ml</Descriptions.Item>
            <Descriptions.Item label="Kt/V">{viewSession.ktv || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default DialysisManagement;
