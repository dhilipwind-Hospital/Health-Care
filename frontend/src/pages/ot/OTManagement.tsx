import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, DatePicker, TimePicker, Row, Col, Space, Tag, message, Tabs, Statistic, Calendar, List } from 'antd';
import { EditOutlined, DeleteOutlined, CheckOutlined, ClockCircleOutlined } from '@ant-design/icons';
import api from '../../services/api';
import dayjs, { Dayjs } from 'dayjs';

const { Option } = Select;

interface OTRoom {
  id: string; name: string; code: string;
  status: 'available' | 'in_use' | 'maintenance' | 'cleaning' | 'reserved';
  equipment?: { name: string; status: string }[];
}
interface Surgery {
  id: string; otRoomId: string; surgeryNumber?: string;
  patientId: string; patient?: { firstName: string; lastName: string };
  primarySurgeonId: string; primarySurgeon?: { firstName: string; lastName: string };
  procedureName: string;
  priority: 'emergency' | 'urgent' | 'elective';
  scheduledDate: string; scheduledStartTime: string; scheduledEndTime?: string;
  estimatedDuration: number;
  status: 'scheduled' | 'pre_op' | 'in_progress' | 'post_op' | 'completed' | 'cancelled' | 'postponed';
}
interface Equipment { id: string; otRoomId: string; roomName: string; name: string; status: string; }
interface Analytics { completed: number; scheduled: number; inProgress: number; avgDuration: number; total: number; }
interface Doctor { id: string; firstName: string; lastName: string; }
interface Patient { id: string; firstName: string; lastName: string; }

const getPatientName = (s: Surgery) => s.patient ? `${s.patient.firstName} ${s.patient.lastName}` : 'N/A';
const getDoctorName = (s: Surgery) => s.primarySurgeon ? `Dr. ${s.primarySurgeon.firstName} ${s.primarySurgeon.lastName}` : 'N/A';

const OTManagement: React.FC = () => {
  const [rooms, setRooms] = useState<OTRoom[]>([]);
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [queue, setQueue] = useState<Surgery[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSurgery, setEditingSurgery] = useState<Surgery | null>(null);
  const [form] = Form.useForm();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());

  const loadAll = async () => {
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        api.get('/ot/rooms'),
        api.get('/ot/surgeries'),
        api.get('/ot/queue'),
        api.get('/ot/analytics'),
        api.get('/users?role=doctor&limit=100'),
        api.get('/users?role=patient&limit=100'),
      ]);
      const val = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? r.value : null;
      setRooms(val(results[0])?.data?.data || []);
      setSurgeries(val(results[1])?.data?.data || []);
      setQueue(val(results[2])?.data?.data || []);
      setAnalytics(val(results[3])?.data?.data || null);
      const dr = val(results[4]);
      setDoctors(dr?.data?.data || dr?.data || []);
      const pr = val(results[5]);
      setPatients(pr?.data?.data || pr?.data || []);
    } catch (e: any) {
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: any) => {
    try {
      setLoading(true);
      const startTime = values.startTime.format('HH:mm:ss');
      const duration = Number(values.estimatedDuration) || 60;
      const endTime = values.startTime.add(duration, 'minute').format('HH:mm:ss');

      const payload = {
        otRoomId: values.otRoomId,
        patientId: values.patientId,
        primarySurgeonId: values.primarySurgeonId,
        procedureName: values.procedureName,
        priority: values.priority,
        scheduledDate: values.date.format('YYYY-MM-DD'),
        scheduledStartTime: startTime,
        scheduledEndTime: endTime,
        estimatedDuration: duration,
        surgeryType: values.priority === 'emergency' ? 'emergency' : 'elective',
      };
      if (editingSurgery) {
        await api.put(`/ot/surgeries/${editingSurgery.id}`, payload);
        message.success('Surgery updated');
      } else {
        await api.post('/ot/surgeries', payload);
        message.success('Surgery scheduled');
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditingSurgery(null);
      loadAll();
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Failed to save surgery');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (surgeryId: string, newStatus: string) => {
    try {
      await api.patch(`/ot/surgeries/${surgeryId}/status`, { status: newStatus });
      message.success(`Status updated to ${newStatus}`);
      loadAll();
    } catch (e: any) {
      message.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/ot/surgeries/${id}`);
      message.success('Surgery deleted');
      loadAll();
    } catch (e: any) {
      message.error('Failed to delete surgery');
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Derive equipment list from rooms' equipment JSONB
  const equipmentList: Equipment[] = rooms.flatMap(room =>
    (room.equipment || []).map((e, i) => ({
      id: `${room.id}-${i}`,
      otRoomId: room.id,
      roomName: room.name || room.code,
      name: e.name,
      status: e.status,
    }))
  );

  const priorityColor = (p: string) => p === 'emergency' ? 'red' : p === 'urgent' ? 'orange' : 'blue';
  const statusColor: Record<string, string> = {
    scheduled: 'gold', pre_op: 'cyan', in_progress: 'green',
    post_op: 'purple', completed: 'blue', cancelled: 'red', postponed: 'default',
  };

  const surgeryColumns = [
    { title: 'OT', dataIndex: 'otRoomId', key: 'otRoomId', render: (v: string) => rooms.find(r => r.id === v)?.name || v },
    { title: 'Patient', key: 'patient', render: (_: any, r: Surgery) => getPatientName(r) },
    { title: 'Surgeon', key: 'surgeon', render: (_: any, r: Surgery) => getDoctorName(r) },
    { title: 'Procedure', dataIndex: 'procedureName', key: 'procedureName' },
    { title: 'Priority', dataIndex: 'priority', key: 'priority', render: (p: string) => <Tag color={priorityColor(p)}>{p?.toUpperCase()}</Tag> },
    { title: 'Date/Time', key: 'datetime', render: (_: any, r: Surgery) => `${r.scheduledDate} ${r.scheduledStartTime || ''}` },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={statusColor[s] || 'default'}>{s?.replace('_', ' ').toUpperCase()}</Tag> },
    { title: 'Actions', key: 'actions', render: (_: any, r: Surgery) => (
      <Space size="small">
        <Button size="small" icon={<EditOutlined />} onClick={() => {
          setEditingSurgery(r);
          form.setFieldsValue({
            patientId: r.patientId,
            primarySurgeonId: r.primarySurgeonId,
            procedureName: r.procedureName,
            priority: r.priority,
            otRoomId: r.otRoomId,
            date: r.scheduledDate ? dayjs(r.scheduledDate) : undefined,
            startTime: r.scheduledStartTime ? dayjs(r.scheduledStartTime, 'HH:mm:ss') : undefined,
            estimatedDuration: r.estimatedDuration,
          });
          setIsModalOpen(true);
        }} />
        {r.status === 'scheduled' && <Button size="small" onClick={() => handleStatusUpdate(r.id, 'in_progress')}>Start</Button>}
        {r.status === 'in_progress' && <Button size="small" onClick={() => handleStatusUpdate(r.id, 'completed')}>Complete</Button>}
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.id)} />
      </Space>
    ) },
  ];

  const equipmentColumns = [
    { title: 'OT Room', dataIndex: 'roomName', key: 'roomName' },
    { title: 'Equipment', dataIndex: 'name', key: 'name' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => {
      const color = s === 'available' ? 'green' : s === 'in_use' ? 'blue' : 'red';
      return <Tag color={color}>{s}</Tag>;
    } },
  ];

  const calendarSurgeries = surgeries.filter(s => s.scheduledDate === selectedDate.format('YYYY-MM-DD'));

  return (
    <div style={{ padding: 16 }}>
      <Tabs items={[
        {
          key: '1',
          label: '📊 Dashboard',
          children: (
            <Row gutter={16}>
              <Col span={6}><Statistic title="Total Surgeries" value={analytics?.total || 0} /></Col>
              <Col span={6}><Statistic title="Scheduled" value={analytics?.scheduled || 0} prefix={<ClockCircleOutlined />} /></Col>
              <Col span={6}><Statistic title="In Progress" value={analytics?.inProgress || 0} prefix={<CheckOutlined />} /></Col>
              <Col span={6}><Statistic title="Avg Duration" value={`${analytics?.avgDuration || 0}m`} /></Col>
            </Row>
          ),
        },
        {
          key: '2',
          label: '📋 Schedule',
          children: (
            <Card extra={<Button type="primary" onClick={() => { setEditingSurgery(null); form.resetFields(); setIsModalOpen(true); }}>Schedule Surgery</Button>}>
              <Table rowKey="id" columns={surgeryColumns as any} dataSource={surgeries} loading={loading} pagination={{ pageSize: 10 }} />
            </Card>
          ),
        },
        {
          key: '3',
          label: '🚨 Emergency Queue',
          children: (
            <List dataSource={queue} renderItem={(s: Surgery) => (
              <List.Item>
                <List.Item.Meta
                  title={`${getPatientName(s)} - ${s.procedureName}`}
                  description={`Priority: ${s.priority} | Surgeon: ${getDoctorName(s)}`}
                />
                {s.status === 'scheduled' && <Button onClick={() => handleStatusUpdate(s.id, 'in_progress')}>Start Surgery</Button>}
              </List.Item>
            )} />
          ),
        },
        {
          key: '4',
          label: '📅 Calendar',
          children: (
            <Row gutter={16}>
              <Col span={12}>
                <Calendar value={selectedDate} onChange={setSelectedDate} />
              </Col>
              <Col span={12}>
                <Card title={`Surgeries on ${selectedDate.format('YYYY-MM-DD')}`}>
                  {calendarSurgeries.length > 0 ? (
                    calendarSurgeries.map(s => (
                      <div key={s.id} style={{ marginBottom: 12, padding: 8, border: '1px solid #f0f0f0', borderRadius: 4 }}>
                        <div><strong>{getPatientName(s)}</strong> - {s.procedureName}</div>
                        <div>{s.scheduledStartTime} ({s.estimatedDuration}m)</div>
                        <Tag color={priorityColor(s.priority)}>{s.priority}</Tag>
                      </div>
                    ))
                  ) : (
                    <p>No surgeries scheduled</p>
                  )}
                </Card>
              </Col>
            </Row>
          ),
        },
        {
          key: '5',
          label: '🔧 Equipment',
          children: (
            <Table rowKey="id" columns={equipmentColumns as any} dataSource={equipmentList} loading={loading} />
          ),
        },
      ]} />

      <Modal open={isModalOpen} title={editingSurgery ? 'Edit Surgery' : 'Schedule Surgery'} onCancel={() => { setIsModalOpen(false); setEditingSurgery(null); }} footer={null} destroyOnClose>
        <Form layout="vertical" form={form} onFinish={handleSave} initialValues={{ priority: 'elective', estimatedDuration: 60 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="patientId" label="Patient" rules={[{ required: true }]}>
                <Select showSearch placeholder="Select patient" optionFilterProp="children" filterOption={(input, option) => (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())}>
                  {patients.map(p => <Option key={p.id} value={p.id}>{p.firstName} {p.lastName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="primarySurgeonId" label="Surgeon" rules={[{ required: true }]}>
                <Select showSearch placeholder="Select surgeon" optionFilterProp="children" filterOption={(input, option) => (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())}>
                  {doctors.map(d => <Option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="procedureName" label="Procedure" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="Priority" rules={[{ required: true }]}>
                <Select>
                  <Option value="emergency">Emergency</Option>
                  <Option value="urgent">Urgent</Option>
                  <Option value="elective">Elective</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date" label="Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="startTime" label="Start Time" rules={[{ required: true }]}>
                <TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="estimatedDuration" label="Duration (min)" rules={[{ required: true }]}>
                <Input type="number" min={15} step={15} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="otRoomId" label="OT Room" rules={[{ required: true }]}>
                <Select>
                  {rooms.map(r => <Option key={r.id} value={r.id}>{r.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">Save</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default OTManagement;
