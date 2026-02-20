import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, DatePicker, Row, Col, Space, Tag, message, Tabs, Statistic, InputNumber, Descriptions } from 'antd';
import { PlusOutlined, FileTextOutlined } from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const BillingEnhanced: React.FC = () => {
  const [activeTab, setActiveTab] = useState('deposits');
  const [packages, setPackages] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [gstSummary, setGstSummary] = useState<any>(null);
  const [outstanding, setOutstanding] = useState<any>({ data: [], meta: {} });
  const [loading, setLoading] = useState(false);
  const [modalType, setModalType] = useState<string | null>(null);
  const [form] = Form.useForm();

  const loadAll = async () => {
    try {
      setLoading(true);
      const [pkgRes, depRes, gstRes, outRes, patientsRes] = await Promise.all([
        api.get('/billing-enhanced/packages'),
        api.get('/billing-enhanced/deposits?limit=50'),
        api.get('/billing-enhanced/reports/gst-summary'),
        api.get('/billing-enhanced/reports/outstanding'),
        api.get('/users?role=patient&limit=100'),
      ]);
      setPackages(pkgRes.data?.data || []);
      setDeposits(depRes.data?.data || []);
      setGstSummary(gstRes.data?.data || null);
      setOutstanding(outRes.data || { data: [], meta: {} });
      setPatients(patientsRes.data?.data || []);
    } catch { message.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, []);

  const handleCreatePackage = async (values: any) => {
    try {
      const payload = {
        ...values,
        validFrom: values.validFrom?.format('YYYY-MM-DD'),
        validTo: values.validTo?.format('YYYY-MM-DD'),
        inclusions: values.inclusions ? values.inclusions.split('\n').filter((s: string) => s.trim()) : [],
        exclusions: values.exclusions ? values.exclusions.split('\n').filter((s: string) => s.trim()) : [],
      };
      await api.post('/billing-enhanced/packages', payload);
      message.success('Package created');
      setModalType(null); form.resetFields(); loadAll();
    } catch (e: any) { message.error(e.response?.data?.message || 'Failed'); }
  };

  const handleReceiveDeposit = async (values: any) => {
    try {
      await api.post('/billing-enhanced/deposits', values);
      message.success('Deposit received');
      setModalType(null); form.resetFields(); loadAll();
    } catch (e: any) { message.error(e.response?.data?.message || 'Failed'); }
  };

  const handleRefund = async (id: string) => {
    Modal.confirm({
      title: 'Process Refund',
      content: (
        <Form id="refund-inline" layout="vertical">
          <Form.Item label="Refund Amount" required><InputNumber id="refund-amount" min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="Reason"><Input id="refund-reason" /></Form.Item>
        </Form>
      ),
      onOk: async () => {
        const amount = (document.getElementById('refund-amount') as HTMLInputElement)?.value;
        const reason = (document.getElementById('refund-reason') as HTMLInputElement)?.value;
        if (!amount) { message.error('Amount required'); return; }
        try {
          await api.post(`/billing-enhanced/deposits/${id}/refund`, { amount: parseFloat(amount), reason });
          message.success('Refund processed');
          loadAll();
        } catch (e: any) { message.error(e.response?.data?.message || 'Failed'); }
      },
    });
  };

  const depositStatusColor: Record<string, string> = {
    received: 'green', adjusted: 'blue', partially_refunded: 'orange', refunded: 'red', forfeited: 'default',
  };

  const packageCols = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Category', dataIndex: 'category', key: 'cat', render: (v: string) => v?.replace(/_/g, ' ').toUpperCase() },
    { title: 'Total Amount', dataIndex: 'totalAmount', key: 'amt', render: (v: number) => `₹${Number(v || 0).toLocaleString('en-IN')}` },
    { title: 'GST', dataIndex: 'gstPercent', key: 'gst', render: (v: number) => v ? `${v}%` : '-' },
    { title: 'Valid From', dataIndex: 'validFrom', key: 'vf', render: (v: string) => v ? dayjs(v).format('DD/MM/YY') : '-' },
    { title: 'Valid To', dataIndex: 'validTo', key: 'vt', render: (v: string) => v ? dayjs(v).format('DD/MM/YY') : '-' },
    { title: 'Active', dataIndex: 'isActive', key: 'act', render: (v: boolean) => v ? <Tag color="green">Active</Tag> : <Tag>Inactive</Tag> },
  ];

  const depositCols = [
    { title: 'Receipt #', dataIndex: 'receiptNumber', key: 'rn', width: 140 },
    { title: 'Patient', key: 'pt', render: (_: any, r: any) => r.patient ? `${r.patient.firstName} ${r.patient.lastName}` : '-' },
    { title: 'Amount', dataIndex: 'amount', key: 'amt', render: (v: number) => `₹${Number(v || 0).toLocaleString('en-IN')}` },
    { title: 'Adjusted', dataIndex: 'adjustedAmount', key: 'adj', render: (v: number) => `₹${Number(v || 0).toLocaleString('en-IN')}` },
    { title: 'Refunded', dataIndex: 'refundedAmount', key: 'ref', render: (v: number) => `₹${Number(v || 0).toLocaleString('en-IN')}` },
    { title: 'Balance', key: 'bal', render: (_: any, r: any) => { const b = Number(r.amount || 0) - Number(r.adjustedAmount || 0) - Number(r.refundedAmount || 0); return `₹${b.toLocaleString('en-IN')}`; } },
    { title: 'Purpose', dataIndex: 'purpose', key: 'pur', render: (v: string) => v?.replace(/_/g, ' ') },
    { title: 'Method', dataIndex: 'paymentMethod', key: 'pm' },
    { title: 'Status', dataIndex: 'status', key: 'st', render: (v: string) => <Tag color={depositStatusColor[v] || 'default'}>{v?.replace(/_/g, ' ').toUpperCase()}</Tag> },
    { title: 'Date', dataIndex: 'receivedAt', key: 'dt', render: (v: string) => v ? dayjs(v).format('DD/MM/YY') : '-' },
    {
      title: 'Actions', key: 'actions', render: (_: any, r: any) => (
        <Space>
          {r.status === 'received' && <Button size="small" danger onClick={() => handleRefund(r.id)}>Refund</Button>}
        </Space>
      ),
    },
  ];

  const outstandingCols = [
    { title: 'Bill #', dataIndex: 'billNumber', key: 'bn' },
    { title: 'Patient', key: 'pt', render: (_: any, r: any) => r.patient ? `${r.patient.firstName} ${r.patient.lastName}` : '-' },
    { title: 'Total', dataIndex: 'amount', key: 'amt', render: (v: number) => `₹${Number(v || 0).toLocaleString('en-IN')}` },
    { title: 'Paid', dataIndex: 'paidAmount', key: 'paid', render: (v: number) => `₹${Number(v || 0).toLocaleString('en-IN')}` },
    { title: 'Due', key: 'due', render: (_: any, r: any) => { const d = Number(r.amount || 0) - Number(r.paidAmount || 0); return <span style={{ color: d > 0 ? '#cf1322' : '#3f8600', fontWeight: 600 }}>₹{d.toLocaleString('en-IN')}</span>; } },
    { title: 'Status', dataIndex: 'status', key: 'st', render: (v: string) => <Tag color={v === 'overdue' ? 'red' : 'orange'}>{v?.toUpperCase()}</Tag> },
    { title: 'Date', dataIndex: 'billDate', key: 'dt', render: (v: string) => v ? dayjs(v).format('DD/MM/YY') : '-' },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card><Statistic title="Total GST Collected" value={Number(gstSummary?.totalTax || 0)} prefix="₹" precision={2} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="Total Revenue" value={Number(gstSummary?.totalGrand || 0)} prefix="₹" precision={2} valueStyle={{ color: '#3f8600' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="Outstanding Amount" value={Number(outstanding.meta?.totalOutstanding || 0)} prefix="₹" precision={2} valueStyle={{ color: '#cf1322' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="Active Packages" value={packages.filter(p => p.isActive).length} prefix={<FileTextOutlined />} /></Card>
        </Col>
      </Row>

      {gstSummary && (
        <Card title="GST Summary" size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={4}><Statistic title="Invoices" value={gstSummary.invoiceCount || 0} /></Col>
            <Col span={5}><Statistic title="Subtotal" value={Number(gstSummary.totalSubtotal || 0)} prefix="₹" precision={2} /></Col>
            <Col span={5}><Statistic title="CGST" value={Number(gstSummary.totalCGST || 0)} prefix="₹" precision={2} /></Col>
            <Col span={5}><Statistic title="SGST" value={Number(gstSummary.totalSGST || 0)} prefix="₹" precision={2} /></Col>
            <Col span={5}><Statistic title="IGST" value={Number(gstSummary.totalIGST || 0)} prefix="₹" precision={2} /></Col>
          </Row>
        </Card>
      )}

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} tabBarExtraContent={
          <Space>
            {activeTab === 'packages' && <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalType('package'); }}>New Package</Button>}
            {activeTab === 'deposits' && <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalType('deposit'); }}>Receive Deposit</Button>}
          </Space>
        } items={[
          { key: 'deposits', label: 'Deposits', children: <Table dataSource={deposits} columns={depositCols} rowKey="id" loading={loading} size="small" /> },
          { key: 'packages', label: 'Billing Packages', children: <Table dataSource={packages} columns={packageCols} rowKey="id" loading={loading} size="small" /> },
          { key: 'outstanding', label: 'Outstanding Bills', children: <Table dataSource={outstanding.data || []} columns={outstandingCols} rowKey="id" loading={loading} size="small" /> },
        ]} />
      </Card>

      {/* Package Modal */}
      <Modal title="Create Billing Package" open={modalType === 'package'} onCancel={() => setModalType(null)} footer={null} width={750} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleCreatePackage}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="name" label="Package Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="category" label="Category" rules={[{ required: true }]}><Select><Option value="opd">OPD</Option><Option value="ipd">IPD</Option><Option value="surgery">Surgery</Option><Option value="maternity">Maternity</Option><Option value="health_checkup">Health Checkup</Option><Option value="dialysis">Dialysis</Option></Select></Form.Item></Col>
            <Col span={8}><Form.Item name="totalAmount" label="Total Amount (₹)" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={4}><Form.Item name="gstPercent" label="GST %"><InputNumber min={0} max={28} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={6}><Form.Item name="validFrom" label="Valid From"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={6}><Form.Item name="validTo" label="Valid To"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="inclusions" label="Inclusions (one per line)"><TextArea rows={4} placeholder="Consultation&#10;Room charges&#10;Nursing care" /></Form.Item></Col>
            <Col span={12}><Form.Item name="exclusions" label="Exclusions (one per line)"><TextArea rows={4} placeholder="Special medicines&#10;Blood products" /></Form.Item></Col>
            <Col span={24}><Form.Item name="description" label="Description"><TextArea rows={2} /></Form.Item></Col>
          </Row>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}><Button onClick={() => setModalType(null)}>Cancel</Button><Button type="primary" htmlType="submit">Create</Button></div>
        </Form>
      </Modal>

      {/* Deposit Modal */}
      <Modal title="Receive Deposit" open={modalType === 'deposit'} onCancel={() => setModalType(null)} footer={null} width={600} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleReceiveDeposit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="patientId" label="Patient" rules={[{ required: true }]}>
                <Select showSearch placeholder="Select patient" optionFilterProp="children" filterOption={(input, option) => (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())}>
                  {patients.map(p => <Option key={p.id} value={p.id}>{p.firstName} {p.lastName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="amount" label="Amount (₹)" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="purpose" label="Purpose" rules={[{ required: true }]}><Select><Option value="admission">Admission</Option><Option value="surgery">Surgery</Option><Option value="procedure">Procedure</Option><Option value="treatment">Treatment</Option><Option value="advance">Advance</Option></Select></Form.Item></Col>
            <Col span={12}><Form.Item name="paymentMethod" label="Payment Method" rules={[{ required: true }]}><Select><Option value="cash">Cash</Option><Option value="card">Card</Option><Option value="upi">UPI</Option><Option value="net_banking">Net Banking</Option><Option value="cheque">Cheque</Option></Select></Form.Item></Col>
            <Col span={24}><Form.Item name="notes" label="Notes"><TextArea rows={2} /></Form.Item></Col>
          </Row>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}><Button onClick={() => setModalType(null)}>Cancel</Button><Button type="primary" htmlType="submit">Receive</Button></div>
        </Form>
      </Modal>
    </div>
  );
};

export default BillingEnhanced;
