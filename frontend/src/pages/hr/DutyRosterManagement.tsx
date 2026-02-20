import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Select, Input, Tag, message, DatePicker, Row, Col, Tabs, TimePicker } from 'antd';
import { PlusOutlined, CalendarOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'blue', completed: 'green', absent: 'red', leave: 'orange', swapped: 'purple',
  pending: 'orange', approved: 'green', rejected: 'red'
};

const DutyRosterManagement: React.FC = () => {
  const [duties, setDuties] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [shiftTypes, setShiftTypes] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dutyModal, setDutyModal] = useState(false);
  const [leaveModal, setLeaveModal] = useState(false);
  const [form] = Form.useForm();
  const [leaveForm] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dutiesRes, leavesRes, shiftsRes, staffRes] = await Promise.all([
        api.get('/duty-roster/duties'),
        api.get('/duty-roster/leaves'),
        api.get('/duty-roster/shifts'),
        api.get('/users?limit=100'),
      ]);
      setDuties(dutiesRes.data.data || []);
      setLeaves(leavesRes.data.data || []);
      setShiftTypes(shiftsRes.data.data || []);
      setStaff(staffRes.data?.data || []);
    } catch { message.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateDuty = async (values: any) => {
    try {
      await api.post('/duty-roster/duties', {
        ...values,
        dutyDate: values.dutyDate?.format('YYYY-MM-DD'),
        startTime: values.startTime?.format('HH:mm'),
        endTime: values.endTime?.format('HH:mm'),
      });
      message.success('Duty scheduled');
      setDutyModal(false);
      form.resetFields();
      fetchData();
    } catch { message.error('Failed to schedule duty'); }
  };

  const handleCreateLeave = async (values: any) => {
    try {
      await api.post('/duty-roster/leaves', {
        ...values,
        startDate: values.dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: values.dateRange?.[1]?.format('YYYY-MM-DD'),
      });
      message.success('Leave request submitted');
      setLeaveModal(false);
      leaveForm.resetFields();
      fetchData();
    } catch { message.error('Failed to submit leave'); }
  };

  const handleApproveLeave = async (id: string, approved: boolean) => {
    try {
      await api.patch(`/duty-roster/leaves/${id}/approve`, { approved });
      message.success(approved ? 'Leave approved' : 'Leave rejected');
      fetchData();
    } catch { message.error('Failed to process leave'); }
  };

  const dutyCols = [
    { title: 'Staff', render: (_: any, r: any) => r.staff ? `${r.staff.firstName} ${r.staff.lastName}` : '-' },
    { title: 'Date', dataIndex: 'dutyDate', render: (d: string) => d ? dayjs(d).format('DD/MM/YY') : '-' },
    { title: 'Shift', dataIndex: 'shiftType', render: (t: string) => t?.replace(/_/g, ' ').toUpperCase() },
    { title: 'Time', render: (_: any, r: any) => `${r.startTime || ''} - ${r.endTime || ''}` },
    { title: 'Location', dataIndex: 'location' },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={STATUS_COLORS[s]}>{s?.toUpperCase()}</Tag> },
  ];

  const leaveCols = [
    { title: 'Staff', render: (_: any, r: any) => r.staff ? `${r.staff.firstName} ${r.staff.lastName}` : '-' },
    { title: 'Type', dataIndex: 'leaveType' },
    { title: 'From', dataIndex: 'startDate', render: (d: string) => d ? dayjs(d).format('DD/MM/YY') : '-' },
    { title: 'To', dataIndex: 'endDate', render: (d: string) => d ? dayjs(d).format('DD/MM/YY') : '-' },
    { title: 'Reason', dataIndex: 'reason', ellipsis: true },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={STATUS_COLORS[s]}>{s?.toUpperCase()}</Tag> },
    {
      title: 'Actions', width: 150,
      render: (_: any, r: any) => r.status === 'pending' ? (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleApproveLeave(r.id, true)}>Approve</Button>
          <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => handleApproveLeave(r.id, false)}>Reject</Button>
        </div>
      ) : '-'
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card title={<><CalendarOutlined /> HR Management - Duty Roster</>}>
        <Tabs defaultActiveKey="duties" items={[
          {
            key: 'duties', label: 'Duty Roster',
            children: (
              <>
                <div style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />} onClick={() => setDutyModal(true)}>Schedule Duty</Button></div>
                <Table columns={dutyCols} dataSource={duties} rowKey="id" loading={loading} size="small" />
              </>
            )
          },
          {
            key: 'leaves', label: `Leave Requests (${leaves.filter(l => l.status === 'pending').length} pending)`,
            children: (
              <>
                <div style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />} onClick={() => setLeaveModal(true)}>Apply Leave</Button></div>
                <Table columns={leaveCols} dataSource={leaves} rowKey="id" loading={loading} size="small" />
              </>
            )
          },
        ]} />
      </Card>

      <Modal title="Schedule Duty" open={dutyModal} onCancel={() => { setDutyModal(false); form.resetFields(); }} footer={null} width={600}>
        <Form form={form} layout="vertical" onFinish={handleCreateDuty}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="staffId" label="Staff" rules={[{ required: true }]}>
                <Select showSearch placeholder="Select staff" optionFilterProp="children" filterOption={(input, option) => (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())}>
                  {staff.map(s => <Option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.role})</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dutyDate" label="Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="shiftType" label="Shift" rules={[{ required: true }]}>
                <Select placeholder="Select shift">{shiftTypes.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}</Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="startTime" label="Start Time" rules={[{ required: true }]}>
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="endTime" label="End Time" rules={[{ required: true }]}>
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="location" label="Location"><Input placeholder="e.g., ICU, Ward A" /></Form.Item>
          <Form.Item name="notes" label="Notes"><TextArea rows={2} /></Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => { setDutyModal(false); form.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit">Schedule</Button>
          </div>
        </Form>
      </Modal>

      <Modal title="Apply Leave" open={leaveModal} onCancel={() => { setLeaveModal(false); leaveForm.resetFields(); }} footer={null} width={500}>
        <Form form={leaveForm} layout="vertical" onFinish={handleCreateLeave}>
          <Form.Item name="staffId" label="Staff" rules={[{ required: true }]}>
            <Select showSearch placeholder="Select staff" optionFilterProp="children" filterOption={(input, option) => (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())}>
              {staff.map(s => <Option key={s.id} value={s.id}>{s.firstName} {s.lastName}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="leaveType" label="Leave Type" rules={[{ required: true }]}>
            <Select placeholder="Select type">
              <Option value="casual">Casual Leave</Option>
              <Option value="sick">Sick Leave</Option>
              <Option value="earned">Earned Leave</Option>
              <Option value="maternity">Maternity Leave</Option>
              <Option value="paternity">Paternity Leave</Option>
              <Option value="unpaid">Unpaid Leave</Option>
            </Select>
          </Form.Item>
          <Form.Item name="dateRange" label="Date Range" rules={[{ required: true }]}>
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reason" label="Reason"><TextArea rows={2} /></Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => { setLeaveModal(false); leaveForm.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit">Submit</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default DutyRosterManagement;
