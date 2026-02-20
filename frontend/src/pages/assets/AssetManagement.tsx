import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Select, Input, Tag, message, DatePicker, Row, Col, Tabs, Statistic } from 'antd';
import { PlusOutlined, ToolOutlined, WarningOutlined } from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const STATUS_COLORS: Record<string, string> = {
  active: 'green', under_maintenance: 'orange', disposed: 'default', out_of_order: 'red'
};

const AssetManagement: React.FC = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [dueAssets, setDueAssets] = useState<any[]>([]);
  const [assetTypes, setAssetTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [maintenanceModal, setMaintenanceModal] = useState<any>(null);
  const [form] = Form.useForm();
  const [maintenanceForm] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assetsRes, typesRes, dueRes] = await Promise.all([
        api.get('/assets'),
        api.get('/assets/types'),
        api.get('/assets/due-maintenance'),
      ]);
      setAssets(assetsRes.data.data || []);
      setAssetTypes(typesRes.data.data || []);
      setDueAssets(dueRes.data.data || []);
    } catch { message.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (values: any) => {
    try {
      await api.post('/assets', {
        ...values,
        purchaseDate: values.purchaseDate?.format('YYYY-MM-DD'),
        warrantyExpiry: values.warrantyExpiry?.format('YYYY-MM-DD'),
        amcExpiry: values.amcExpiry?.format('YYYY-MM-DD'),
        nextMaintenanceDate: values.nextMaintenanceDate?.format('YYYY-MM-DD'),
      });
      message.success('Asset created');
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch { message.error('Failed to create asset'); }
  };

  const handleMaintenance = async (values: any) => {
    try {
      await api.post(`/assets/${maintenanceModal.id}/maintenance`, {
        ...values,
        maintenanceDate: values.maintenanceDate?.format('YYYY-MM-DD'),
        nextDueDate: values.nextDueDate?.format('YYYY-MM-DD'),
      });
      message.success('Maintenance logged');
      setMaintenanceModal(null);
      maintenanceForm.resetFields();
      fetchData();
    } catch { message.error('Failed to log maintenance'); }
  };

  const columns = [
    { title: 'Code', dataIndex: 'assetCode', width: 100 },
    { title: 'Name', dataIndex: 'name' },
    { title: 'Type', dataIndex: 'type', render: (t: string) => t?.replace(/_/g, ' ').toUpperCase() },
    { title: 'Location', dataIndex: 'location' },
    { title: 'Department', dataIndex: 'department' },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={STATUS_COLORS[s]}>{s?.replace(/_/g, ' ').toUpperCase()}</Tag> },
    { title: 'Last Maintenance', dataIndex: 'lastMaintenanceDate', render: (d: string) => d ? dayjs(d).format('DD/MM/YY') : '-' },
    { title: 'Next Due', dataIndex: 'nextMaintenanceDate', render: (d: string) => d ? dayjs(d).format('DD/MM/YY') : '-' },
    {
      title: 'Actions', width: 120,
      render: (_: any, r: any) => (
        <Button size="small" icon={<ToolOutlined />} onClick={() => setMaintenanceModal(r)}>Maintenance</Button>
      )
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="Total Assets" value={assets.length} /></Card></Col>
        <Col span={6}><Card><Statistic title="Active" value={assets.filter(a => a.status === 'active').length} valueStyle={{ color: '#3f8600' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Under Maintenance" value={assets.filter(a => a.status === 'under_maintenance').length} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Maintenance Due" value={dueAssets.length} valueStyle={{ color: '#cf1322' }} prefix={<WarningOutlined />} /></Card></Col>
      </Row>

      <Card
        title={<><ToolOutlined /> Asset Management</>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>Add Asset</Button>}
      >
        <Tabs defaultActiveKey="all" items={[
          { key: 'all', label: 'All Assets', children: <Table columns={columns} dataSource={assets} rowKey="id" loading={loading} size="small" /> },
          { key: 'due', label: `Due Maintenance (${dueAssets.length})`, children: <Table columns={columns} dataSource={dueAssets} rowKey="id" size="small" /> },
        ]} />
      </Card>

      <Modal title="Add Asset" open={modalVisible} onCancel={() => { setModalVisible(false); form.resetFields(); }} footer={null} width={700}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="name" label="Asset Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="type" label="Type" rules={[{ required: true }]}>
              <Select placeholder="Select type">{assetTypes.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}</Select>
            </Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="manufacturer" label="Manufacturer"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="model" label="Model"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="serialNumber" label="Serial Number"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="purchaseDate" label="Purchase Date"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="purchasePrice" label="Purchase Price (₹)"><Input type="number" /></Form.Item></Col>
            <Col span={8}><Form.Item name="warrantyExpiry" label="Warranty Expiry"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="location" label="Location"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="department" label="Department"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="maintenanceFrequencyDays" label="Maintenance Freq (days)"><Input type="number" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="amcVendor" label="AMC Vendor"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="amcExpiry" label="AMC Expiry"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Form.Item name="notes" label="Notes"><TextArea rows={2} /></Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => { setModalVisible(false); form.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit">Add Asset</Button>
          </div>
        </Form>
      </Modal>

      <Modal title={`Log Maintenance - ${maintenanceModal?.name || ''}`} open={!!maintenanceModal} onCancel={() => { setMaintenanceModal(null); maintenanceForm.resetFields(); }} footer={null} width={500}>
        <Form form={maintenanceForm} layout="vertical" onFinish={handleMaintenance}>
          <Form.Item name="maintenanceDate" label="Maintenance Date" rules={[{ required: true }]} initialValue={dayjs()}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="maintenanceType" label="Type" rules={[{ required: true }]}>
            <Select placeholder="Select type">
              <Option value="preventive">Preventive</Option>
              <Option value="corrective">Corrective</Option>
              <Option value="calibration">Calibration</Option>
              <Option value="inspection">Inspection</Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Description"><TextArea rows={2} /></Form.Item>
          <Form.Item name="performedBy" label="Performed By"><Input /></Form.Item>
          <Form.Item name="cost" label="Cost (₹)"><Input type="number" /></Form.Item>
          <Form.Item name="nextDueDate" label="Next Due Date"><DatePicker style={{ width: '100%' }} /></Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => { setMaintenanceModal(null); maintenanceForm.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit">Log Maintenance</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AssetManagement;
