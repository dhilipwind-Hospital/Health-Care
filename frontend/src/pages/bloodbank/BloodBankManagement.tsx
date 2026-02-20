import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, DatePicker, Row, Col, Space, Tag, message, Tabs, Statistic, InputNumber } from 'antd';
import { PlusOutlined, ExperimentOutlined, AlertOutlined, UserOutlined } from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const BloodBankManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [donors, setDonors] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [crossMatch, setCrossMatch] = useState<any[]>([]);
  const [transfusions, setTransfusions] = useState<any[]>([]);
  const [stockSummary, setStockSummary] = useState<any[]>([]);
  const [expiring, setExpiring] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalType, setModalType] = useState<string | null>(null);
  const [form] = Form.useForm();

  const loadAll = async () => {
    try {
      setLoading(true);
      const [donorsRes, invRes, cmRes, trRes, stockRes, expRes, patientsRes] = await Promise.all([
        api.get('/blood-bank/donors?limit=50'),
        api.get('/blood-bank/inventory?limit=50'),
        api.get('/blood-bank/cross-match?limit=50'),
        api.get('/blood-bank/transfusions?limit=50'),
        api.get('/blood-bank/inventory/stock-summary'),
        api.get('/blood-bank/inventory/expiring?days=7'),
        api.get('/users?role=patient&limit=100'),
      ]);
      setDonors(donorsRes.data?.data || []);
      setInventory(invRes.data?.data || []);
      setCrossMatch(cmRes.data?.data || []);
      setTransfusions(trRes.data?.data || []);
      setStockSummary(stockRes.data?.data || []);
      setExpiring(expRes.data?.data || []);
      setPatients(patientsRes.data?.data || []);
    } catch { message.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, []);

  const handleSaveDonor = async (values: any) => {
    try {
      const payload = { ...values, dateOfBirth: values.dateOfBirth?.format('YYYY-MM-DD') };
      await api.post('/blood-bank/donors', payload);
      message.success('Donor registered');
      setModalType(null); form.resetFields(); loadAll();
    } catch (e: any) { message.error(e.response?.data?.message || 'Failed'); }
  };

  const handleAddBag = async (values: any) => {
    try {
      const payload = { ...values, collectionDate: values.collectionDate?.format('YYYY-MM-DD'), expiryDate: values.expiryDate?.format('YYYY-MM-DD') };
      await api.post('/blood-bank/inventory', payload);
      message.success('Blood bag added');
      setModalType(null); form.resetFields(); loadAll();
    } catch (e: any) { message.error(e.response?.data?.message || 'Failed'); }
  };

  const handleCreateCrossMatch = async (values: any) => {
    try {
      await api.post('/blood-bank/cross-match', values);
      message.success('Cross match request created');
      setModalType(null); form.resetFields(); loadAll();
    } catch (e: any) { message.error(e.response?.data?.message || 'Failed'); }
  };

  const bagStatusColor: Record<string, string> = {
    available: 'green', reserved: 'blue', cross_matched: 'purple', issued: 'cyan',
    transfused: 'geekblue', expired: 'red', discarded: 'default', quarantine: 'orange',
  };

  const donorCols = [
    { title: 'Donor #', dataIndex: 'donorNumber', key: 'num', width: 130 },
    { title: 'Name', key: 'name', render: (_: any, r: any) => `${r.firstName} ${r.lastName}` },
    { title: 'Blood Group', dataIndex: 'bloodGroup', key: 'bg', render: (v: string) => <Tag color="red">{v}</Tag> },
    { title: 'Phone', dataIndex: 'phone', key: 'ph' },
    { title: 'Total Donations', dataIndex: 'totalDonations', key: 'td' },
    { title: 'Last Donation', dataIndex: 'lastDonationDate', key: 'ld', render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : 'Never' },
    { title: 'Status', key: 'status', render: (_: any, r: any) => r.isDeferral ? <Tag color="red">Deferred</Tag> : <Tag color="green">Active</Tag> },
  ];

  const inventoryCols = [
    { title: 'Bag #', dataIndex: 'bagNumber', key: 'bag', width: 140 },
    { title: 'Blood Group', dataIndex: 'bloodGroup', key: 'bg', render: (v: string) => <Tag color="red">{v}</Tag> },
    { title: 'Component', dataIndex: 'component', key: 'comp', render: (v: string) => v?.replace(/_/g, ' ').toUpperCase() },
    { title: 'Volume (ml)', dataIndex: 'volume', key: 'vol' },
    { title: 'Collection', dataIndex: 'collectionDate', key: 'cd', render: (v: string) => v ? dayjs(v).format('DD/MM/YY') : '-' },
    { title: 'Expiry', dataIndex: 'expiryDate', key: 'ed', render: (v: string) => v ? dayjs(v).format('DD/MM/YY') : '-' },
    { title: 'Status', dataIndex: 'status', key: 'st', render: (v: string) => <Tag color={bagStatusColor[v] || 'default'}>{v?.replace(/_/g, ' ').toUpperCase()}</Tag> },
  ];

  const crossMatchCols = [
    { title: 'Request #', dataIndex: 'requestNumber', key: 'rn', width: 140 },
    { title: 'Patient Blood Group', dataIndex: 'patientBloodGroup', key: 'bg', render: (v: string) => <Tag color="red">{v}</Tag> },
    { title: 'Component', dataIndex: 'componentRequired', key: 'comp' },
    { title: 'Units', dataIndex: 'unitsRequired', key: 'units' },
    { title: 'Priority', dataIndex: 'priority', key: 'pri', render: (v: string) => <Tag color={v === 'emergency' ? 'red' : v === 'urgent' ? 'orange' : 'blue'}>{v?.toUpperCase()}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'st', render: (v: string) => <Tag>{v?.replace(/_/g, ' ').toUpperCase()}</Tag> },
  ];

  const transfusionCols = [
    { title: 'Patient', key: 'pt', render: (_: any, r: any) => r.patient ? `${r.patient.firstName} ${r.patient.lastName}` : '-' },
    { title: 'Start Time', dataIndex: 'startTime', key: 'st', render: (v: string) => v ? dayjs(v).format('DD/MM/YY HH:mm') : '-' },
    { title: 'Volume (ml)', dataIndex: 'volumeTransfused', key: 'vol' },
    { title: 'Reaction', dataIndex: 'reaction', key: 'rx', render: (v: boolean) => v ? <Tag color="red">YES</Tag> : <Tag color="green">No</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (v: string) => <Tag>{v?.replace(/_/g, ' ').toUpperCase()}</Tag> },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="Total Blood Bags" value={inventory.length} prefix={<ExperimentOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="Available" value={inventory.filter(i => i.status === 'available').length} valueStyle={{ color: '#3f8600' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Expiring (7 days)" value={expiring.length} valueStyle={{ color: '#cf1322' }} prefix={<AlertOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="Registered Donors" value={donors.length} prefix={<UserOutlined />} /></Card></Col>
      </Row>

      {stockSummary.length > 0 && (
        <Card title="Stock Summary by Blood Group" style={{ marginBottom: 16 }} size="small">
          <Row gutter={8}>
            {stockSummary.map((s: any, i: number) => (
              <Col key={i} span={3}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <Tag color="red" style={{ fontSize: 14 }}>{s.bloodGroup}</Tag>
                  <div style={{ fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>{s.count}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{s.component?.replace(/_/g, ' ')}</div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} tabBarExtraContent={
          <Space>
            {activeTab === 'donors' && <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalType('donor'); }}>Register Donor</Button>}
            {activeTab === 'inventory' && <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalType('bag'); }}>Add Blood Bag</Button>}
            {activeTab === 'crossmatch' && <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalType('crossmatch'); }}>New Request</Button>}
          </Space>
        } items={[
          { key: 'inventory', label: 'Blood Inventory', children: <Table dataSource={inventory} columns={inventoryCols} rowKey="id" loading={loading} size="small" /> },
          { key: 'donors', label: 'Donors', children: <Table dataSource={donors} columns={donorCols} rowKey="id" loading={loading} size="small" /> },
          { key: 'crossmatch', label: 'Cross Match', children: <Table dataSource={crossMatch} columns={crossMatchCols} rowKey="id" loading={loading} size="small" /> },
          { key: 'transfusions', label: 'Transfusions', children: <Table dataSource={transfusions} columns={transfusionCols} rowKey="id" loading={loading} size="small" /> },
        ]} />
      </Card>

      {/* Donor Modal */}
      <Modal title="Register Blood Donor" open={modalType === 'donor'} onCancel={() => setModalType(null)} footer={null} width={700} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleSaveDonor}>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="firstName" label="First Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="bloodGroup" label="Blood Group" rules={[{ required: true }]}><Select>{BLOOD_GROUPS.map(bg => <Option key={bg} value={bg}>{bg}</Option>)}</Select></Form.Item></Col>
            <Col span={8}><Form.Item name="phone" label="Phone" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="gender" label="Gender" rules={[{ required: true }]}><Select><Option value="male">Male</Option><Option value="female">Female</Option></Select></Form.Item></Col>
            <Col span={8}><Form.Item name="dateOfBirth" label="DOB" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="weight" label="Weight (kg)"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="hemoglobin" label="Hemoglobin"><InputNumber min={0} step={0.1} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={24}><Form.Item name="address" label="Address"><TextArea rows={2} /></Form.Item></Col>
          </Row>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}><Button onClick={() => setModalType(null)}>Cancel</Button><Button type="primary" htmlType="submit">Register</Button></div>
        </Form>
      </Modal>

      {/* Blood Bag Modal */}
      <Modal title="Add Blood Bag" open={modalType === 'bag'} onCancel={() => setModalType(null)} footer={null} width={600} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleAddBag}>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="bloodGroup" label="Blood Group" rules={[{ required: true }]}><Select>{BLOOD_GROUPS.map(bg => <Option key={bg} value={bg}>{bg}</Option>)}</Select></Form.Item></Col>
            <Col span={8}><Form.Item name="component" label="Component" rules={[{ required: true }]} initialValue="whole_blood"><Select><Option value="whole_blood">Whole Blood</Option><Option value="prbc">PRBC</Option><Option value="ffp">FFP</Option><Option value="platelet_concentrate">Platelet Concentrate</Option><Option value="cryoprecipitate">Cryoprecipitate</Option></Select></Form.Item></Col>
            <Col span={8}><Form.Item name="volume" label="Volume (ml)" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="collectionDate" label="Collection Date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="expiryDate" label="Expiry Date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}><Button onClick={() => setModalType(null)}>Cancel</Button><Button type="primary" htmlType="submit">Add</Button></div>
        </Form>
      </Modal>

      {/* Cross Match Modal */}
      <Modal title="New Cross Match Request" open={modalType === 'crossmatch'} onCancel={() => setModalType(null)} footer={null} width={600} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleCreateCrossMatch}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="patientId" label="Patient" rules={[{ required: true }]}>
                <Select showSearch placeholder="Select patient" optionFilterProp="children" filterOption={(input, option) => (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())}>
                  {patients.map(p => <Option key={p.id} value={p.id}>{p.firstName} {p.lastName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}><Form.Item name="patientBloodGroup" label="Patient Blood Group" rules={[{ required: true }]}><Select>{BLOOD_GROUPS.map(bg => <Option key={bg} value={bg}>{bg}</Option>)}</Select></Form.Item></Col>
            <Col span={8}><Form.Item name="componentRequired" label="Component" rules={[{ required: true }]}><Select><Option value="whole_blood">Whole Blood</Option><Option value="prbc">PRBC</Option><Option value="ffp">FFP</Option><Option value="platelet_concentrate">Platelets</Option></Select></Form.Item></Col>
            <Col span={8}><Form.Item name="unitsRequired" label="Units" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="priority" label="Priority" initialValue="routine"><Select><Option value="routine">Routine</Option><Option value="urgent">Urgent</Option><Option value="emergency">Emergency</Option></Select></Form.Item></Col>
            <Col span={24}><Form.Item name="indication" label="Indication"><TextArea rows={2} /></Form.Item></Col>
          </Row>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}><Button onClick={() => setModalType(null)}>Cancel</Button><Button type="primary" htmlType="submit">Submit</Button></div>
        </Form>
      </Modal>
    </div>
  );
};

export default BloodBankManagement;
