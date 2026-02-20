import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Select, Input, Tag, Space, message, Tabs, DatePicker, Row, Col, Statistic } from 'antd';
import { PlusOutlined, FileTextOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface DrugRegisterEntry {
  id: string;
  date: string;
  patientName: string;
  patientAddress?: string;
  patientAge?: string;
  doctorName: string;
  doctorLicenseNumber?: string;
  medicineName: string;
  medicineStrength?: string;
  quantity: number;
  batchNumber?: string;
  scheduleType: string;
  medicine?: { name: string };
}

interface NdpsEntry {
  id: string;
  date: string;
  transactionType: string;
  openingBalance: number;
  received: number;
  dispensed: number;
  closingBalance: number;
  patientName?: string;
  doctorName?: string;
  medicine?: { name: string; genericName: string };
}

const DrugRegister: React.FC = () => {
  const [drugEntries, setDrugEntries] = useState<DrugRegisterEntry[]>([]);
  const [ndpsEntries, setNdpsEntries] = useState<NdpsEntry[]>([]);
  const [ndpsBalances, setNdpsBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [ndpsModalVisible, setNdpsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [ndpsForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('schedule_h');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  const fetchDrugRegister = async (page = 1, scheduleType = 'schedule_h') => {
    setLoading(true);
    try {
      const res = await api.get('/drug-register', {
        params: { page, limit: pagination.pageSize, scheduleType }
      });
      setDrugEntries(res.data.data || []);
      setPagination(prev => ({ ...prev, current: page, total: res.data.meta?.total || 0 }));
    } catch {
      message.error('Failed to load drug register');
    } finally {
      setLoading(false);
    }
  };

  const fetchNdpsRegister = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/drug-register/ndps', { params: { page, limit: pagination.pageSize } });
      setNdpsEntries(res.data.data || []);
    } catch {
      message.error('Failed to load NDPS register');
    } finally {
      setLoading(false);
    }
  };

  const fetchNdpsBalances = async () => {
    try {
      const res = await api.get('/drug-register/ndps/daily-balance');
      setNdpsBalances(res.data.data || []);
    } catch {
      console.error('Failed to load NDPS balances');
    }
  };

  useEffect(() => {
    if (activeTab === 'ndps') {
      fetchNdpsRegister();
      fetchNdpsBalances();
    } else {
      fetchDrugRegister(1, activeTab);
    }
  }, [activeTab]);

  const handleCreateEntry = async (values: any) => {
    try {
      await api.post('/drug-register', {
        ...values,
        date: values.date?.format('YYYY-MM-DD') || new Date().toISOString().split('T')[0],
      });
      message.success('Entry recorded successfully');
      setModalVisible(false);
      form.resetFields();
      fetchDrugRegister(1, activeTab);
    } catch {
      message.error('Failed to record entry');
    }
  };

  const handleCreateNdpsEntry = async (values: any) => {
    try {
      await api.post('/drug-register/ndps', {
        ...values,
        date: values.date?.format('YYYY-MM-DD') || new Date().toISOString().split('T')[0],
      });
      message.success('NDPS entry recorded successfully');
      setNdpsModalVisible(false);
      ndpsForm.resetFields();
      fetchNdpsRegister();
      fetchNdpsBalances();
    } catch {
      message.error('Failed to record NDPS entry');
    }
  };

  const getScheduleTag = (type: string) => {
    const colors: Record<string, string> = {
      schedule_h: 'orange',
      schedule_h1: 'red',
      schedule_x: 'purple',
      ndps: 'volcano',
    };
    return <Tag color={colors[type] || 'default'}>{type.replace(/_/g, ' ').toUpperCase()}</Tag>;
  };

  const drugColumns = [
    { title: 'Date', dataIndex: 'date', render: (d: string) => new Date(d).toLocaleDateString(), width: 100 },
    { title: 'Patient Name', dataIndex: 'patientName', ellipsis: true },
    { title: 'Patient Address', dataIndex: 'patientAddress', ellipsis: true },
    { title: 'Age', dataIndex: 'patientAge', width: 60 },
    { title: 'Doctor Name', dataIndex: 'doctorName', ellipsis: true },
    { title: 'License No.', dataIndex: 'doctorLicenseNumber', width: 100 },
    { title: 'Medicine', dataIndex: 'medicineName', ellipsis: true },
    { title: 'Strength', dataIndex: 'medicineStrength', width: 80 },
    { title: 'Qty', dataIndex: 'quantity', width: 60 },
    { title: 'Batch', dataIndex: 'batchNumber', width: 80 },
    { title: 'Schedule', dataIndex: 'scheduleType', render: getScheduleTag, width: 100 },
  ];

  const ndpsColumns = [
    { title: 'Date', dataIndex: 'date', render: (d: string) => new Date(d).toLocaleDateString(), width: 100 },
    { title: 'Medicine', dataIndex: 'medicine', render: (m: any) => m?.name || '-' },
    {
      title: 'Transaction',
      dataIndex: 'transactionType',
      render: (t: string) => <Tag>{t?.replace(/_/g, ' ').toUpperCase()}</Tag>,
    },
    { title: 'Opening', dataIndex: 'openingBalance', width: 80 },
    { title: 'Received', dataIndex: 'received', width: 80 },
    { title: 'Dispensed', dataIndex: 'dispensed', width: 80 },
    { title: 'Closing', dataIndex: 'closingBalance', width: 80 },
    { title: 'Patient', dataIndex: 'patientName', ellipsis: true },
    { title: 'Doctor', dataIndex: 'doctorName', ellipsis: true },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={<><MedicineBoxOutlined /> Drug Register (Schedule H/H1/NDPS)</>}
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => activeTab === 'ndps' ? setNdpsModalVisible(true) : setModalVisible(true)}
            >
              Add Entry
            </Button>
          </Space>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'schedule_h',
              label: <span><Tag color="orange">H</Tag> Schedule H</span>,
              children: (
                <Table
                  columns={drugColumns}
                  dataSource={drugEntries}
                  rowKey="id"
                  loading={loading}
                  pagination={{ ...pagination, onChange: (p) => fetchDrugRegister(p, 'schedule_h') }}
                  scroll={{ x: 1200 }}
                  size="small"
                />
              ),
            },
            {
              key: 'schedule_h1',
              label: <span><Tag color="red">H1</Tag> Schedule H1</span>,
              children: (
                <Table
                  columns={drugColumns}
                  dataSource={drugEntries}
                  rowKey="id"
                  loading={loading}
                  pagination={{ ...pagination, onChange: (p) => fetchDrugRegister(p, 'schedule_h1') }}
                  scroll={{ x: 1200 }}
                  size="small"
                />
              ),
            },
            {
              key: 'ndps',
              label: <span><Tag color="volcano">NDPS</Tag> Narcotic Drugs</span>,
              children: (
                <>
                  <Card size="small" title="Current NDPS Stock Balance" style={{ marginBottom: 16 }}>
                    <Row gutter={16}>
                      {ndpsBalances.map(b => (
                        <Col span={6} key={b.medicineId}>
                          <Statistic
                            title={b.medicineName}
                            value={b.closingBalance}
                            suffix="units"
                            valueStyle={{ color: b.closingBalance < 10 ? '#f5222d' : '#52c41a' }}
                          />
                        </Col>
                      ))}
                      {ndpsBalances.length === 0 && <Col span={24}><p>No NDPS medicines registered</p></Col>}
                    </Row>
                  </Card>
                  <Table
                    columns={ndpsColumns}
                    dataSource={ndpsEntries}
                    rowKey="id"
                    loading={loading}
                    pagination={{ ...pagination, onChange: (p) => fetchNdpsRegister(p) }}
                    scroll={{ x: 1000 }}
                    size="small"
                  />
                </>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="Add Drug Register Entry"
        open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateEntry}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date" label="Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="scheduleType" label="Schedule Type" rules={[{ required: true }]}>
                <Select placeholder="Select schedule">
                  <Option value="schedule_h">Schedule H</Option>
                  <Option value="schedule_h1">Schedule H1</Option>
                  <Option value="schedule_x">Schedule X</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="patientName" label="Patient Name" rules={[{ required: true }]}>
                <Input placeholder="Full name of patient" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="patientAge" label="Patient Age">
                <Input placeholder="Age" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="patientAddress" label="Patient Address">
            <TextArea rows={2} placeholder="Full address" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="doctorName" label="Doctor Name" rules={[{ required: true }]}>
                <Input placeholder="Prescribing doctor's name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="doctorLicenseNumber" label="Doctor License/Registration No.">
                <Input placeholder="Medical registration number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="medicineName" label="Medicine Name" rules={[{ required: true }]}>
                <Input placeholder="Name of medicine" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="medicineStrength" label="Strength">
                <Input placeholder="e.g., 500mg" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="quantity" label="Quantity" rules={[{ required: true }]}>
                <Input type="number" placeholder="Qty dispensed" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="batchNumber" label="Batch Number">
                <Input placeholder="Batch no." />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="prescriptionDate" label="Prescription Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="remarks" label="Remarks">
            <TextArea rows={2} placeholder="Any additional remarks" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">Record Entry</Button>
              <Button onClick={() => { setModalVisible(false); form.resetFields(); }}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Add NDPS Register Entry"
        open={ndpsModalVisible}
        onCancel={() => { setNdpsModalVisible(false); ndpsForm.resetFields(); }}
        footer={null}
        width={600}
      >
        <Form form={ndpsForm} layout="vertical" onFinish={handleCreateNdpsEntry}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date" label="Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="transactionType" label="Transaction Type" rules={[{ required: true }]}>
                <Select placeholder="Select type">
                  <Option value="opening_balance">Opening Balance</Option>
                  <Option value="received">Received</Option>
                  <Option value="dispensed">Dispensed</Option>
                  <Option value="adjustment">Adjustment</Option>
                  <Option value="expired">Expired</Option>
                  <Option value="destroyed">Destroyed</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="medicineId" label="Medicine" rules={[{ required: true }]}>
            <Input placeholder="Medicine ID (NDPS drug)" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="openingBalance" label="Opening Balance">
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="received" label="Received">
                <Input type="number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="dispensed" label="Dispensed">
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="closingBalance" label="Closing Balance" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="patientName" label="Patient Name (if dispensed)">
                <Input placeholder="Patient name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="doctorName" label="Doctor Name">
                <Input placeholder="Prescribing doctor" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="remarks" label="Remarks">
            <TextArea rows={2} placeholder="Any remarks" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">Record Entry</Button>
              <Button onClick={() => { setNdpsModalVisible(false); ndpsForm.resetFields(); }}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DrugRegister;
