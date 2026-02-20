import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Select, Input, Tag, message, Row, Col, Tabs, Statistic, InputNumber } from 'antd';
import { PlusOutlined, BankOutlined, FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const STATUS_COLORS: Record<string, string> = {
  draft: 'default', submitted: 'blue', under_review: 'orange', query_raised: 'volcano',
  approved: 'green', partially_approved: 'lime', rejected: 'red', settled: 'cyan'
};

const InsuranceTpaManagement: React.FC = () => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [claimTypes, setClaimTypes] = useState<any[]>([]);
  const [claimStatuses, setClaimStatuses] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [companyModal, setCompanyModal] = useState(false);
  const [claimModal, setClaimModal] = useState(false);
  const [statusModal, setStatusModal] = useState<any>(null);
  const [companyForm] = Form.useForm();
  const [claimForm] = Form.useForm();
  const [statusForm] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [companiesRes, claimsRes, patientsRes, typesRes, statusesRes, dashRes] = await Promise.all([
        api.get('/insurance-tpa/companies'),
        api.get('/insurance-tpa/claims'),
        api.get('/users?role=patient&limit=100'),
        api.get('/insurance-tpa/claim-types'),
        api.get('/insurance-tpa/claim-statuses'),
        api.get('/insurance-tpa/dashboard'),
      ]);
      setCompanies(companiesRes.data.data || []);
      setClaims(claimsRes.data.data || []);
      setPatients(patientsRes.data?.data || []);
      setClaimTypes(typesRes.data.data || []);
      setClaimStatuses(statusesRes.data.data || []);
      setDashboard(dashRes.data.data || null);
    } catch { message.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateCompany = async (values: any) => {
    try {
      await api.post('/insurance-tpa/companies', values);
      message.success('Insurance company added');
      setCompanyModal(false);
      companyForm.resetFields();
      fetchData();
    } catch { message.error('Failed to add company'); }
  };

  const handleCreateClaim = async (values: any) => {
    try {
      await api.post('/insurance-tpa/claims', values);
      message.success('Claim created');
      setClaimModal(false);
      claimForm.resetFields();
      fetchData();
    } catch { message.error('Failed to create claim'); }
  };

  const handleSubmitClaim = async (id: string) => {
    try {
      await api.post(`/insurance-tpa/claims/${id}/submit`);
      message.success('Claim submitted');
      fetchData();
    } catch { message.error('Failed to submit claim'); }
  };

  const handleUpdateStatus = async (values: any) => {
    if (!statusModal) return;
    try {
      await api.patch(`/insurance-tpa/claims/${statusModal.id}/status`, values);
      message.success('Status updated');
      setStatusModal(null);
      statusForm.resetFields();
      fetchData();
    } catch { message.error('Failed to update status'); }
  };

  const companyCols = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Short Code', dataIndex: 'shortCode' },
    { title: 'TPA', dataIndex: 'tpaName' },
    { title: 'Contact', dataIndex: 'contactPerson' },
    { title: 'Phone', dataIndex: 'phone' },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Active', dataIndex: 'isActive', render: (v: boolean) => v ? <Tag color="green">Yes</Tag> : <Tag color="red">No</Tag> },
  ];

  const claimCols = [
    { title: 'Claim #', dataIndex: 'claimNumber', width: 130 },
    { title: 'Patient', render: (_: any, r: any) => r.patient ? `${r.patient.firstName} ${r.patient.lastName}` : '-' },
    { title: 'Insurance', render: (_: any, r: any) => r.insuranceCompany?.name || '-' },
    { title: 'Type', dataIndex: 'claimType', render: (t: string) => t?.toUpperCase() },
    { title: 'Claimed (₹)', dataIndex: 'claimedAmount', render: (v: number) => v?.toLocaleString() },
    { title: 'Approved (₹)', dataIndex: 'approvedAmount', render: (v: number) => v?.toLocaleString() || '-' },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={STATUS_COLORS[s]}>{s?.replace(/_/g, ' ').toUpperCase()}</Tag> },
    {
      title: 'Actions', width: 180,
      render: (_: any, r: any) => (
        <div style={{ display: 'flex', gap: 4 }}>
          {r.status === 'draft' && <Button size="small" type="primary" onClick={() => handleSubmitClaim(r.id)}>Submit</Button>}
          <Button size="small" onClick={() => setStatusModal(r)}>Update</Button>
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
        <Col span={6}><Card><Statistic title="Total Claims" value={dashboard?.total || 0} prefix={<FileTextOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="Pending" value={getStatusCount('submitted') + getStatusCount('under_review')} valueStyle={{ color: '#faad14' }} prefix={<ClockCircleOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="Approved" value={getStatusCount('approved') + getStatusCount('partially_approved')} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="Settled" value={getStatusCount('settled')} valueStyle={{ color: '#13c2c2' }} /></Card></Col>
      </Row>

      <Card title={<><BankOutlined /> Insurance / TPA Management</>}>
        <Tabs defaultActiveKey="claims" items={[
          {
            key: 'claims', label: 'Claims',
            children: (
              <>
                <div style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />} onClick={() => setClaimModal(true)}>New Claim</Button></div>
                <Table columns={claimCols} dataSource={claims} rowKey="id" loading={loading} size="small" />
              </>
            )
          },
          {
            key: 'companies', label: 'Insurance Companies',
            children: (
              <>
                <div style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />} onClick={() => setCompanyModal(true)}>Add Company</Button></div>
                <Table columns={companyCols} dataSource={companies} rowKey="id" loading={loading} size="small" />
              </>
            )
          },
        ]} />
      </Card>

      <Modal title="Add Insurance Company" open={companyModal} onCancel={() => { setCompanyModal(false); companyForm.resetFields(); }} footer={null} width={600}>
        <Form form={companyForm} layout="vertical" onFinish={handleCreateCompany}>
          <Row gutter={16}>
            <Col span={16}><Form.Item name="name" label="Company Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="shortCode" label="Short Code"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="tpaName" label="TPA Name"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="contactPerson" label="Contact Person"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="phone" label="Phone"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="email" label="Email"><Input type="email" /></Form.Item></Col>
          </Row>
          <Form.Item name="address" label="Address"><TextArea rows={2} /></Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => { setCompanyModal(false); companyForm.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit">Add Company</Button>
          </div>
        </Form>
      </Modal>

      <Modal title="Create Insurance Claim" open={claimModal} onCancel={() => { setClaimModal(false); claimForm.resetFields(); }} footer={null} width={700}>
        <Form form={claimForm} layout="vertical" onFinish={handleCreateClaim}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="patientId" label="Patient" rules={[{ required: true }]}>
                <Select showSearch placeholder="Select patient" optionFilterProp="children" filterOption={(input, option) => (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())}>
                  {patients.map(p => <Option key={p.id} value={p.id}>{p.firstName} {p.lastName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="insuranceCompanyId" label="Insurance Company" rules={[{ required: true }]}>
                <Select placeholder="Select company">
                  {companies.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="policyNumber" label="Policy Number" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="memberId" label="Member ID"><Input /></Form.Item></Col>
            <Col span={8}>
              <Form.Item name="claimType" label="Claim Type" rules={[{ required: true }]}>
                <Select placeholder="Select type">{claimTypes.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}</Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="claimedAmount" label="Claimed Amount (₹)" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="preAuthNumber" label="Pre-Auth Number"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="preAuthAmount" label="Pre-Auth Amount (₹)"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Form.Item name="diagnosis" label="Diagnosis"><TextArea rows={2} /></Form.Item>
          <Form.Item name="treatment" label="Treatment"><TextArea rows={2} /></Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => { setClaimModal(false); claimForm.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit">Create Claim</Button>
          </div>
        </Form>
      </Modal>

      <Modal title={`Update Claim - ${statusModal?.claimNumber || ''}`} open={!!statusModal} onCancel={() => { setStatusModal(null); statusForm.resetFields(); }} footer={null} width={500}>
        <Form form={statusForm} layout="vertical" onFinish={handleUpdateStatus}>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select placeholder="Select status">{claimStatuses.map(s => <Option key={s.value} value={s.value}>{s.label}</Option>)}</Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="approvedAmount" label="Approved Amount (₹)"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="settledAmount" label="Settled Amount (₹)"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Form.Item name="patientResponsibility" label="Patient Responsibility (₹)"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="queryDetails" label="Query Details"><TextArea rows={2} /></Form.Item>
          <Form.Item name="remarks" label="Remarks"><TextArea rows={2} /></Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => { setStatusModal(null); statusForm.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit">Update</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default InsuranceTpaManagement;
