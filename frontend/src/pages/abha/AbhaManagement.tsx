import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Select, Input, Tag, message, Row, Col, Statistic, Steps } from 'antd';
import { PlusOutlined, SafetyCertificateOutlined, CheckCircleOutlined, LinkOutlined } from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

const STATUS_COLORS: Record<string, string> = {
  pending: 'orange', verified: 'blue', linked: 'green', failed: 'red'
};

const AbhaManagement: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [verifyModal, setVerifyModal] = useState<any>(null);
  const [form] = Form.useForm();
  const [verifyForm] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recordsRes, dashRes, patientsRes] = await Promise.all([
        api.get('/abha'),
        api.get('/abha/dashboard'),
        api.get('/users?role=patient&limit=100'),
      ]);
      setRecords(recordsRes.data.data || []);
      setDashboard(dashRes.data.data || null);
      setPatients(patientsRes.data?.data || []);
    } catch { message.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (values: any) => {
    try {
      await api.post('/abha', values);
      message.success('ABHA registration initiated');
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch { message.error('Failed to create ABHA record'); }
  };

  const handleVerify = async (values: any) => {
    if (!verifyModal) return;
    try {
      await api.post(`/abha/${verifyModal.id}/verify`, values);
      message.success('ABHA verified successfully');
      setVerifyModal(null);
      verifyForm.resetFields();
      fetchData();
    } catch { message.error('Failed to verify ABHA'); }
  };

  const handleLink = async (id: string) => {
    try {
      await api.post(`/abha/${id}/link`);
      message.success('ABHA linked to patient record');
      fetchData();
    } catch { message.error('Failed to link ABHA'); }
  };

  const handleConsent = async (id: string) => {
    try {
      await api.post(`/abha/${id}/consent`);
      message.success('Consent recorded');
      fetchData();
    } catch { message.error('Failed to record consent'); }
  };

  const columns = [
    { title: 'Patient', render: (_: any, r: any) => r.patient ? `${r.patient.firstName} ${r.patient.lastName}` : '-' },
    { title: 'ABHA Number', dataIndex: 'abhaNumber', render: (v: string) => v || '-' },
    { title: 'ABHA Address', dataIndex: 'abhaAddress', render: (v: string) => v || '-' },
    { title: 'Mobile', dataIndex: 'mobileNumber' },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={STATUS_COLORS[s]}>{s?.toUpperCase()}</Tag> },
    { title: 'Consent', dataIndex: 'consentGiven', render: (v: boolean) => v ? <Tag color="green">Yes</Tag> : <Tag color="orange">Pending</Tag> },
    { title: 'Verified', dataIndex: 'verifiedAt', render: (d: string) => d ? dayjs(d).format('DD/MM/YY') : '-' },
    {
      title: 'Actions', width: 250,
      render: (_: any, r: any) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {r.status === 'pending' && <Button size="small" type="primary" onClick={() => setVerifyModal(r)}>Verify</Button>}
          {r.status === 'verified' && <Button size="small" icon={<LinkOutlined />} onClick={() => handleLink(r.id)}>Link</Button>}
          {!r.consentGiven && <Button size="small" onClick={() => handleConsent(r.id)}>Record Consent</Button>}
        </div>
      )
    },
  ];

  const getStatusCount = (status: string) => {
    const found = dashboard?.byStatus?.find((s: any) => s.status === status);
    return found ? parseInt(found.count) : 0;
  };

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="Total Records" value={dashboard?.total || 0} prefix={<SafetyCertificateOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="Pending" value={getStatusCount('pending')} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Verified" value={getStatusCount('verified')} valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Linked" value={getStatusCount('linked')} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} /></Card></Col>
      </Row>

      <Card
        title={<><SafetyCertificateOutlined /> ABHA / ABDM Integration</>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>Register ABHA</Button>}
      >
        <Table columns={columns} dataSource={records} rowKey="id" loading={loading} size="small" />
      </Card>

      <Modal title="Register ABHA" open={modalVisible} onCancel={() => { setModalVisible(false); form.resetFields(); }} footer={null} width={600}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="patientId" label="Patient" rules={[{ required: true }]}>
            <Select showSearch placeholder="Select patient" optionFilterProp="children" filterOption={(input, option) => (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())}>
              {patients.map(p => <Option key={p.id} value={p.id}>{p.firstName} {p.lastName}</Option>)}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="mobileNumber" label="Mobile Number" rules={[{ required: true }]}><Input placeholder="10-digit mobile" maxLength={10} /></Form.Item></Col>
            <Col span={12}><Form.Item name="aadhaarLastFour" label="Aadhaar Last 4 Digits"><Input placeholder="XXXX" maxLength={4} /></Form.Item></Col>
          </Row>
          <Form.Item name="abhaNumber" label="ABHA Number (if already exists)"><Input placeholder="14-digit ABHA number" /></Form.Item>
          <Form.Item name="abhaAddress" label="ABHA Address (if already exists)"><Input placeholder="username@abdm" /></Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => { setModalVisible(false); form.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit">Register</Button>
          </div>
        </Form>
      </Modal>

      <Modal title="Verify ABHA" open={!!verifyModal} onCancel={() => { setVerifyModal(null); verifyForm.resetFields(); }} footer={null} width={500}>
        <Steps current={1} size="small" style={{ marginBottom: 24 }} items={[
          { title: 'Registered' },
          { title: 'Verify' },
          { title: 'Link' },
        ]} />
        <Form form={verifyForm} layout="vertical" onFinish={handleVerify}>
          <Form.Item name="verificationMethod" label="Verification Method" initialValue="aadhaar_otp">
            <Select>
              <Option value="aadhaar_otp">Aadhaar OTP</Option>
              <Option value="mobile_otp">Mobile OTP</Option>
              <Option value="demographic">Demographic</Option>
            </Select>
          </Form.Item>
          <Form.Item name="abhaNumber" label="ABHA Number" rules={[{ required: true }]}><Input placeholder="14-digit ABHA number" /></Form.Item>
          <Form.Item name="abhaAddress" label="ABHA Address"><Input placeholder="username@abdm" /></Form.Item>
          <Form.Item name="healthId" label="Health ID"><Input /></Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => { setVerifyModal(null); verifyForm.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit">Verify</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AbhaManagement;
