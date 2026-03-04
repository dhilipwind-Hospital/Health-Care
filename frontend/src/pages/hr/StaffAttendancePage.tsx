import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Tag, Typography, Space, Button, Tabs, Statistic, Row, Col, message, Select, DatePicker, Modal, Form, Input } from 'antd';
import { ClockCircleOutlined, ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined, UserOutlined } from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface AttendanceRecord {
  id: string;
  staffId: string;
  date: string;
  clockInTime?: string;
  clockOutTime?: string;
  hoursWorked?: number;
  status: string;
  overtime?: number;
  notes?: string;
  staff?: { firstName: string; lastName: string; role: string };
}

const statusColor: Record<string, string> = {
  present: 'green',
  absent: 'red',
  late: 'orange',
  half_day: 'blue',
  leave: 'purple',
};

const StaffAttendancePage: React.FC = () => {
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [markModalOpen, setMarkModalOpen] = useState(false);
  const [markForm] = Form.useForm();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [todayRes, allRes, summaryRes] = await Promise.allSettled([
        api.get('/staff-attendance/today'),
        api.get('/staff-attendance'),
        api.get('/staff-attendance/summary'),
      ]);
      if (todayRes.status === 'fulfilled') setTodayRecords(todayRes.value.data?.data || []);
      if (allRes.status === 'fulfilled') setAllRecords(allRes.value.data?.data || []);
      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value.data?.data || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleClockIn = async () => {
    try { await api.post('/staff-attendance/clock-in'); message.success('Clocked in successfully'); fetchAll(); }
    catch (e: any) { message.error(e.response?.data?.message || 'Clock-in failed'); }
  };

  const handleClockOut = async () => {
    try { await api.post('/staff-attendance/clock-out'); message.success('Clocked out successfully'); fetchAll(); }
    catch (e: any) { message.error(e.response?.data?.message || 'Clock-out failed'); }
  };

  const handleMark = async (values: any) => {
    try {
      await api.post('/staff-attendance/mark', { ...values, date: values.date?.format('YYYY-MM-DD') });
      message.success('Attendance marked'); setMarkModalOpen(false); markForm.resetFields(); fetchAll();
    } catch { message.error('Failed to mark attendance'); }
  };

  const todayPresent = todayRecords.filter(r => r.status === 'present' || r.status === 'late').length;
  const todayAbsent = todayRecords.filter(r => r.status === 'absent').length;

  const todayColumns = [
    { title: 'Staff', key: 'staff', width: 180, render: (_: any, r: AttendanceRecord) => r.staff ? `${r.staff.firstName} ${r.staff.lastName}` : r.staffId },
    { title: 'Role', key: 'role', width: 120, render: (_: any, r: AttendanceRecord) => <Tag>{r.staff?.role || '-'}</Tag> },
    { title: 'Clock In', dataIndex: 'clockInTime', key: 'clockIn', width: 100, render: (t: string) => t ? dayjs(t).format('HH:mm') : '-' },
    { title: 'Clock Out', dataIndex: 'clockOutTime', key: 'clockOut', width: 100, render: (t: string) => t ? dayjs(t).format('HH:mm') : '-' },
    { title: 'Hours', dataIndex: 'hoursWorked', key: 'hours', width: 80, render: (h: number) => h ? `${h}h` : '-' },
    { title: 'Overtime', dataIndex: 'overtime', key: 'overtime', width: 80, render: (m: number) => m ? `${m}m` : '-' },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 100, render: (s: string) => <Tag color={statusColor[s] || 'default'}>{s?.toUpperCase()}</Tag> },
  ];

  const summaryColumns = [
    { title: 'Staff', key: 'staff', width: 180, render: (_: any, r: any) => r.staff ? `${r.staff.firstName} ${r.staff.lastName}` : r.staffId },
    { title: 'Present', dataIndex: 'present', key: 'present', width: 80, render: (v: number) => <Tag color="green">{v || 0}</Tag> },
    { title: 'Absent', dataIndex: 'absent', key: 'absent', width: 80, render: (v: number) => <Tag color="red">{v || 0}</Tag> },
    { title: 'Late', dataIndex: 'late', key: 'late', width: 80, render: (v: number) => <Tag color="orange">{v || 0}</Tag> },
    { title: 'Leave', dataIndex: 'leave', key: 'leave', width: 80, render: (v: number) => <Tag color="purple">{v || 0}</Tag> },
    { title: 'Total Hours', dataIndex: 'totalHours', key: 'totalHours', width: 100, render: (h: number) => `${(h || 0).toFixed(1)}h` },
    { title: 'Overtime', dataIndex: 'totalOvertime', key: 'totalOvertime', width: 100, render: (m: number) => `${m || 0}m` },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ color: '#3B82F6', marginBottom: 0 }}><ClockCircleOutlined /> Staff Attendance</Title>
          <Text type="secondary">Track staff clock-in/out and attendance records</Text>
        </div>
        <Space>
          <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleClockIn} style={{ background: '#10B981' }}>Clock In</Button>
          <Button danger icon={<CloseCircleOutlined />} onClick={handleClockOut}>Clock Out</Button>
          <Button icon={<UserOutlined />} onClick={() => setMarkModalOpen(true)}>Admin Mark</Button>
          <Button icon={<ReloadOutlined />} onClick={fetchAll}>Refresh</Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}><Card><Statistic title="Present Today" value={todayPresent} valueStyle={{ color: '#10B981' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Absent Today" value={todayAbsent} valueStyle={{ color: '#EF4444' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Today Total" value={todayRecords.length} valueStyle={{ color: '#3B82F6' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="All Records" value={allRecords.length} /></Card></Col>
      </Row>

      <Tabs items={[
        { key: 'today', label: `Today (${todayRecords.length})`, children: (
          <Card bordered={false}><Table dataSource={todayRecords} columns={todayColumns} rowKey="id" loading={loading} pagination={false} /></Card>
        )},
        { key: 'summary', label: 'Monthly Summary', children: (
          <Card bordered={false}><Table dataSource={summary} columns={summaryColumns} rowKey="staffId" loading={loading} pagination={false} /></Card>
        )},
        { key: 'history', label: `All Records (${allRecords.length})`, children: (
          <Card bordered={false}><Table dataSource={allRecords} columns={todayColumns} rowKey="id" loading={loading} pagination={{ pageSize: 20 }} /></Card>
        )},
      ]} />

      <Modal title="Admin: Mark Attendance" open={markModalOpen} onCancel={() => setMarkModalOpen(false)} onOk={() => markForm.submit()} okText="Mark">
        <Form form={markForm} layout="vertical" onFinish={handleMark}>
          <Form.Item name="staffId" label="Staff ID" rules={[{ required: true }]}><Input placeholder="Staff UUID" /></Form.Item>
          <Form.Item name="date" label="Date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select options={[{ value: 'present', label: 'Present' }, { value: 'absent', label: 'Absent' }, { value: 'late', label: 'Late' }, { value: 'half_day', label: 'Half Day' }, { value: 'leave', label: 'Leave' }]} />
          </Form.Item>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StaffAttendancePage;
