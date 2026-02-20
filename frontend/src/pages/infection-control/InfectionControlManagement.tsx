import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Select, Input, Tag, message, DatePicker, Row, Col, Tabs, Statistic, InputNumber } from 'antd';
import { PlusOutlined, BugOutlined, CheckCircleOutlined } from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const STATUS_COLORS: Record<string, string> = {
  suspected: 'orange', confirmed: 'red', resolved: 'green', monitoring: 'blue'
};

const InfectionControlManagement: React.FC = () => {
  const [infections, setInfections] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [infectionTypes, setInfectionTypes] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [infectionModal, setInfectionModal] = useState(false);
  const [auditModal, setAuditModal] = useState(false);
  const [form] = Form.useForm();
  const [auditForm] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [infRes, auditRes, typesRes, dashRes, patientsRes] = await Promise.all([
        api.get('/infection-control/infections'),
        api.get('/infection-control/audits'),
        api.get('/infection-control/types'),
        api.get('/infection-control/dashboard'),
        api.get('/users?role=patient&limit=100'),
      ]);
      setInfections(infRes.data.data || []);
      setAudits(auditRes.data.data || []);
      setInfectionTypes(typesRes.data.data || []);
      setDashboard(dashRes.data.data || null);
      setPatients(patientsRes.data?.data || []);
    } catch { message.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateInfection = async (values: any) => {
    try {
      await api.post('/infection-control/infections', {
        ...values,
        detectionDate: values.detectionDate?.format('YYYY-MM-DD'),
      });
      message.success('Infection case reported');
      setInfectionModal(false);
      form.resetFields();
      fetchData();
    } catch { message.error('Failed to report infection'); }
  };

  const handleCreateAudit = async (values: any) => {
    try {
      await api.post('/infection-control/audits', {
        ...values,
        auditDate: values.auditDate?.format('YYYY-MM-DD'),
      });
      message.success('Audit recorded');
      setAuditModal(false);
      auditForm.resetFields();
      fetchData();
    } catch { message.error('Failed to record audit'); }
  };

  const infectionCols = [
    { title: 'Patient', render: (_: any, r: any) => r.patient ? `${r.patient.firstName} ${r.patient.lastName}` : '-' },
    { title: 'Type', dataIndex: 'infectionType', render: (t: string) => t?.toUpperCase() },
    { title: 'Detection Date', dataIndex: 'detectionDate', render: (d: string) => d ? dayjs(d).format('DD/MM/YY') : '-' },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={STATUS_COLORS[s]}>{s?.toUpperCase()}</Tag> },
    { title: 'Organism', dataIndex: 'organism' },
    { title: 'Location', dataIndex: 'location' },
    { title: 'Isolation', dataIndex: 'isolationRequired', render: (v: boolean) => v ? <Tag color="red">Required</Tag> : '-' },
  ];

  const auditCols = [
    { title: 'Date', dataIndex: 'auditDate', render: (d: string) => d ? dayjs(d).format('DD/MM/YY') : '-' },
    { title: 'Department', dataIndex: 'department' },
    { title: 'Opportunities', dataIndex: 'opportunitiesObserved' },
    { title: 'Compliant', dataIndex: 'compliantActions' },
    { title: 'Compliance Rate', dataIndex: 'complianceRate', render: (v: number) => <Tag color={v >= 80 ? 'green' : v >= 60 ? 'orange' : 'red'}>{v?.toFixed(1)}%</Tag> },
    { title: 'Auditor', render: (_: any, r: any) => r.auditor ? `${r.auditor.firstName} ${r.auditor.lastName}` : '-' },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}><Card><Statistic title="Active Infections" value={dashboard?.activeInfections || 0} valueStyle={{ color: '#cf1322' }} prefix={<BugOutlined />} /></Card></Col>
        <Col span={8}><Card><Statistic title="Avg Hand Hygiene Compliance" value={dashboard?.avgHandHygieneCompliance || 0} suffix="%" valueStyle={{ color: '#3f8600' }} prefix={<CheckCircleOutlined />} /></Card></Col>
        <Col span={8}><Card><Statistic title="Total Audits" value={audits.length} /></Card></Col>
      </Row>

      <Card title={<><BugOutlined /> Infection Control</>}>
        <Tabs defaultActiveKey="infections" items={[
          {
            key: 'infections', label: 'HAI Surveillance',
            children: (
              <>
                <div style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />} onClick={() => setInfectionModal(true)}>Report Infection</Button></div>
                <Table columns={infectionCols} dataSource={infections} rowKey="id" loading={loading} size="small" />
              </>
            )
          },
          {
            key: 'audits', label: 'Hand Hygiene Audits',
            children: (
              <>
                <div style={{ marginBottom: 16 }}><Button type="primary" icon={<PlusOutlined />} onClick={() => setAuditModal(true)}>New Audit</Button></div>
                <Table columns={auditCols} dataSource={audits} rowKey="id" loading={loading} size="small" />
              </>
            )
          },
        ]} />
      </Card>

      <Modal title="Report Infection Case" open={infectionModal} onCancel={() => { setInfectionModal(false); form.resetFields(); }} footer={null} width={600}>
        <Form form={form} layout="vertical" onFinish={handleCreateInfection}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="patientId" label="Patient" rules={[{ required: true }]}>
                <Select showSearch placeholder="Select patient" optionFilterProp="children" filterOption={(input, option) => (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())}>
                  {patients.map(p => <Option key={p.id} value={p.id}>{p.firstName} {p.lastName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="infectionType" label="Infection Type" rules={[{ required: true }]}>
                <Select placeholder="Select type">{infectionTypes.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}</Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="detectionDate" label="Detection Date" rules={[{ required: true }]} initialValue={dayjs()}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="organism" label="Organism"><Input placeholder="e.g., MRSA, E.coli" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="location" label="Location"><Input placeholder="e.g., ICU, Ward A" /></Form.Item></Col>
            <Col span={12}><Form.Item name="isolationRequired" label="Isolation Required" initialValue={false}>
              <Select><Option value={false}>No</Option><Option value={true}>Yes</Option></Select>
            </Form.Item></Col>
          </Row>
          <Form.Item name="notes" label="Notes"><TextArea rows={2} /></Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => { setInfectionModal(false); form.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit">Report</Button>
          </div>
        </Form>
      </Modal>

      <Modal title="Hand Hygiene Audit" open={auditModal} onCancel={() => { setAuditModal(false); auditForm.resetFields(); }} footer={null} width={500}>
        <Form form={auditForm} layout="vertical" onFinish={handleCreateAudit}>
          <Form.Item name="auditDate" label="Audit Date" rules={[{ required: true }]} initialValue={dayjs()}><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="department" label="Department" rules={[{ required: true }]}><Input placeholder="e.g., ICU, OT, Ward A" /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="opportunitiesObserved" label="Opportunities Observed" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="compliantActions" label="Compliant Actions" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Form.Item name="observations" label="Observations"><TextArea rows={2} /></Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => { setAuditModal(false); auditForm.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit">Save Audit</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default InfectionControlManagement;
