import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Select, Input, Tag, message, DatePicker, Row, Col } from 'antd';
import { PlusOutlined, CoffeeOutlined } from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const STATUS_COLORS: Record<string, string> = {
  active: 'green', completed: 'default', cancelled: 'red', on_hold: 'orange'
};

const DietManagement: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [dietTypes, setDietTypes] = useState<any[]>([]);
  const [mealTypes, setMealTypes] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, typesRes, mealsRes, patientsRes] = await Promise.all([
        api.get('/diet'),
        api.get('/diet/types'),
        api.get('/diet/meal-types'),
        api.get('/users?role=patient&limit=100'),
      ]);
      setOrders(ordersRes.data.data || []);
      setDietTypes(typesRes.data.data || []);
      setMealTypes(mealsRes.data.data || []);
      setPatients(patientsRes.data?.data || []);
    } catch { message.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (values: any) => {
    try {
      await api.post('/diet', {
        ...values,
        startDate: values.startDate?.format('YYYY-MM-DD'),
        endDate: values.endDate?.format('YYYY-MM-DD'),
        allergies: values.allergies?.split(',').map((s: string) => s.trim()).filter(Boolean),
        restrictions: values.restrictions?.split(',').map((s: string) => s.trim()).filter(Boolean),
      });
      message.success('Diet order created');
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch { message.error('Failed to create diet order'); }
  };

  const columns = [
    { title: 'Patient', render: (_: any, r: any) => r.patient ? `${r.patient.firstName} ${r.patient.lastName}` : '-' },
    { title: 'Diet Type', dataIndex: 'dietType', render: (t: string) => t?.replace(/_/g, ' ').toUpperCase() },
    { title: 'Meal', dataIndex: 'mealType', render: (t: string) => t?.toUpperCase() },
    { title: 'Ward/Bed', dataIndex: 'wardBed' },
    { title: 'Start Date', dataIndex: 'startDate', render: (d: string) => d ? dayjs(d).format('DD/MM/YY') : '-' },
    { title: 'End Date', dataIndex: 'endDate', render: (d: string) => d ? dayjs(d).format('DD/MM/YY') : '-' },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={STATUS_COLORS[s]}>{s?.toUpperCase()}</Tag> },
    { title: 'Instructions', dataIndex: 'specialInstructions', ellipsis: true },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={<><CoffeeOutlined /> Diet Management</>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>New Diet Order</Button>}
      >
        <Table columns={columns} dataSource={orders} rowKey="id" loading={loading} size="small" />
      </Card>

      <Modal title="Create Diet Order" open={modalVisible} onCancel={() => { setModalVisible(false); form.resetFields(); }} footer={null} width={700}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="patientId" label="Patient" rules={[{ required: true }]}>
                <Select showSearch placeholder="Select patient" optionFilterProp="children" filterOption={(input, option) => (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())}>
                  {patients.map(p => <Option key={p.id} value={p.id}>{p.firstName} {p.lastName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dietType" label="Diet Type" rules={[{ required: true }]}>
                <Select placeholder="Select diet type">
                  {dietTypes.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="mealType" label="Meal Type" initialValue="all">
                <Select>
                  {mealTypes.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="startDate" label="Start Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="endDate" label="End Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="wardBed" label="Ward/Bed">
                <Input placeholder="e.g., Ward A - Bed 5" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="calorieTarget" label="Calorie Target">
                <Input type="number" placeholder="kcal" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="proteinTarget" label="Protein Target">
                <Input type="number" placeholder="grams" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="allergies" label="Allergies (comma separated)">
            <Input placeholder="e.g., peanuts, shellfish" />
          </Form.Item>
          <Form.Item name="restrictions" label="Restrictions (comma separated)">
            <Input placeholder="e.g., no salt, no sugar" />
          </Form.Item>
          <Form.Item name="specialInstructions" label="Special Instructions">
            <TextArea rows={2} />
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => { setModalVisible(false); form.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit">Create Order</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default DietManagement;
