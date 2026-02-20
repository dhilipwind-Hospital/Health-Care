import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Select, Input, Tag, Space, message, Tabs, DatePicker, Row, Col, Statistic, InputNumber } from 'antd';
import { PlusOutlined, DeleteOutlined, BarChartOutlined } from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

interface WasteEntry {
  id: string;
  date: string;
  category: string;
  quantityKg: number;
  sourceDepartment?: string;
  disposalMethod?: string;
  disposedAt?: string;
  manifestNumber?: string;
  recordedBy?: { firstName: string; lastName: string };
}

const CATEGORY_COLORS: Record<string, string> = {
  yellow: 'gold',
  red: 'red',
  white: 'default',
  blue: 'blue',
};

const BiomedicalWasteManagement: React.FC = () => {
  const [entries, setEntries] = useState<WasteEntry[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [disposalMethods, setDisposalMethods] = useState<any[]>([]);
  const [dailySummary, setDailySummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [disposeModalVisible, setDisposeModalVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<WasteEntry | null>(null);
  const [form] = Form.useForm();
  const [disposeForm] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  const fetchEntries = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/biomedical-waste', { params: { page, limit: pagination.pageSize } });
      setEntries(res.data.data || []);
      setPagination(prev => ({ ...prev, current: page, total: res.data.meta?.total || 0 }));
    } catch {
      message.error('Failed to load entries');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [catRes, dispRes, summaryRes] = await Promise.all([
        api.get('/biomedical-waste/categories'),
        api.get('/biomedical-waste/disposal-methods'),
        api.get('/biomedical-waste/daily-summary'),
      ]);
      setCategories(catRes.data.data || []);
      setDisposalMethods(dispRes.data.data || []);
      setDailySummary(summaryRes.data.data || []);
    } catch {
      console.error('Failed to load metadata');
    }
  };

  useEffect(() => {
    fetchEntries();
    fetchMetadata();
  }, []);

  const handleCreate = async (values: any) => {
    try {
      await api.post('/biomedical-waste', {
        ...values,
        date: values.date?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD'),
      });
      message.success('Entry recorded successfully');
      setModalVisible(false);
      form.resetFields();
      fetchEntries();
      fetchMetadata();
    } catch {
      message.error('Failed to record entry');
    }
  };

  const handleDispose = async (values: any) => {
    if (!selectedEntry) return;
    try {
      await api.post(`/biomedical-waste/${selectedEntry.id}/dispose`, values);
      message.success('Disposal recorded successfully');
      setDisposeModalVisible(false);
      disposeForm.resetFields();
      setSelectedEntry(null);
      fetchEntries();
    } catch {
      message.error('Failed to record disposal');
    }
  };

  const getCategoryTag = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return <Tag color={CATEGORY_COLORS[category] || 'default'}>{cat?.label || category.toUpperCase()}</Tag>;
  };

  const columns = [
    { title: 'Date', dataIndex: 'date', render: (d: string) => dayjs(d).format('DD/MM/YYYY'), width: 100 },
    { title: 'Category', dataIndex: 'category', render: getCategoryTag, width: 150 },
    { title: 'Quantity (kg)', dataIndex: 'quantityKg', width: 100 },
    { title: 'Source Dept', dataIndex: 'sourceDepartment', ellipsis: true },
    { title: 'Disposal Method', dataIndex: 'disposalMethod', render: (m: string) => m?.replace(/_/g, ' ').toUpperCase() || '-' },
    { title: 'Disposed At', dataIndex: 'disposedAt', render: (d: string) => d ? dayjs(d).format('DD/MM/YY HH:mm') : '-', width: 120 },
    { title: 'Manifest #', dataIndex: 'manifestNumber', width: 100 },
    {
      title: 'Actions',
      width: 100,
      render: (_: any, record: WasteEntry) => (
        <Space>
          {!record.disposedAt && (
            <Button
              size="small"
              type="primary"
              onClick={() => { setSelectedEntry(record); setDisposeModalVisible(true); }}
            >
              Dispose
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const totalToday = dailySummary.reduce((sum, s) => sum + parseFloat(s.totalKg || 0), 0);

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={<><DeleteOutlined /> Biomedical Waste Management (BMW Rules 2016)</>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            Record Waste
          </Button>
        }
      >
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic title="Today's Total" value={totalToday.toFixed(2)} suffix="kg" prefix={<BarChartOutlined />} />
          </Col>
          {dailySummary.map((s, i) => (
            <Col span={4} key={i}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Tag color={CATEGORY_COLORS[s.category] || 'default'}>{s.category?.toUpperCase()}</Tag>
                <div style={{ fontSize: 18, fontWeight: 'bold' }}>{parseFloat(s.totalKg || 0).toFixed(2)} kg</div>
                <div style={{ fontSize: 11, color: '#888' }}>{s.count} entries</div>
              </Card>
            </Col>
          ))}
        </Row>

        <Tabs defaultActiveKey="entries" items={[
          {
            key: 'entries',
            label: 'Waste Entries',
            children: (
              <Table
                columns={columns}
                dataSource={entries}
                rowKey="id"
                loading={loading}
                pagination={{ ...pagination, onChange: (page) => fetchEntries(page) }}
                size="small"
              />
            ),
          },
          {
            key: 'categories',
            label: 'Waste Categories',
            children: (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {categories.map(c => (
                  <Card key={c.value} size="small" title={<Tag color={CATEGORY_COLORS[c.value]}>{c.label}</Tag>}>
                    <p style={{ fontSize: 12, color: '#666' }}>{c.description}</p>
                  </Card>
                ))}
              </div>
            ),
          },
        ]} />
      </Card>

      <Modal
        title="Record Biomedical Waste"
        open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date" label="Date" initialValue={dayjs()}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="Waste Category" rules={[{ required: true }]}>
                <Select placeholder="Select category">
                  {categories.map(c => <Option key={c.value} value={c.value}>{c.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="quantityKg" label="Quantity (kg)" rules={[{ required: true }]}>
                <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sourceDepartment" label="Source Department">
                <Input placeholder="e.g., ICU, OT, Ward A" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="containerId" label="Container ID">
            <Input placeholder="Container/Bin ID" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={2} placeholder="Description of waste" />
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Button onClick={() => { setModalVisible(false); form.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit">Record</Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title="Record Disposal"
        open={disposeModalVisible}
        onCancel={() => { setDisposeModalVisible(false); disposeForm.resetFields(); setSelectedEntry(null); }}
        footer={null}
        width={600}
      >
        <Form form={disposeForm} layout="vertical" onFinish={handleDispose}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="disposalMethod" label="Disposal Method" rules={[{ required: true }]}>
                <Select placeholder="Select method">
                  {disposalMethods.map(m => <Option key={m.value} value={m.value}>{m.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="manifestNumber" label="Manifest Number" rules={[{ required: true }]}>
                <Input placeholder="BMW manifest number" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="transporterName" label="Transporter Name">
                <Input placeholder="Name of transporter" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="vehicleNumber" label="Vehicle Number">
                <Input placeholder="Vehicle registration" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="treatmentFacility" label="Treatment Facility">
            <Input placeholder="Name of treatment/disposal facility" />
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Button onClick={() => { setDisposeModalVisible(false); disposeForm.resetFields(); setSelectedEntry(null); }}>Cancel</Button>
            <Button type="primary" htmlType="submit">Record Disposal</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default BiomedicalWasteManagement;
