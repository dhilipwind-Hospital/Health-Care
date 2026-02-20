import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, DatePicker, TimePicker, Row, Col, Space, Tag, message, Tabs, Statistic, Descriptions } from 'antd';
import { PlusOutlined, FileTextOutlined, CheckCircleOutlined, BarChartOutlined } from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const MODALITIES = [
  { value: 'xray', label: 'X-Ray' }, { value: 'ct', label: 'CT Scan' }, { value: 'mri', label: 'MRI' },
  { value: 'ultrasound', label: 'Ultrasound' }, { value: 'mammography', label: 'Mammography' },
  { value: 'ecg', label: 'ECG' }, { value: 'echo', label: 'Echo' }, { value: 'dexa', label: 'DEXA' },
];

const RadiologyManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalType, setModalType] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [form] = Form.useForm();
  const [reportForm] = Form.useForm();
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10 });

  const loadAll = async (page = 1) => {
    try {
      setLoading(true);
      const [ordersRes, templatesRes, analyticsRes, patientsRes, doctorsRes] = await Promise.all([
        api.get(`/radiology/orders?page=${page}&limit=${meta.limit}`),
        api.get('/radiology/templates'),
        api.get('/radiology/analytics'),
        api.get('/users?role=patient&limit=100'),
        api.get('/users?role=doctor&limit=100'),
      ]);
      setOrders(ordersRes.data?.data || []);
      setMeta(ordersRes.data?.meta || { total: 0, page: 1, limit: 10 });
      setTemplates(templatesRes.data?.data || []);
      setAnalytics(analyticsRes.data?.data || null);
      setPatients(patientsRes.data?.data || patientsRes.data || []);
      setDoctors(doctorsRes.data?.data || doctorsRes.data || []);
    } catch { message.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, []);

  const handleCreateOrder = async (values: any) => {
    try {
      const payload = {
        ...values,
        scheduledDate: values.scheduledDate?.format('YYYY-MM-DD'),
        scheduledTime: values.scheduledTime?.format('HH:mm'),
      };
      await api.post('/radiology/orders', payload);
      message.success('Order created');
      setModalType(null); form.resetFields(); loadAll();
    } catch (e: any) { message.error(e.response?.data?.message || 'Failed'); }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/radiology/orders/${id}/status`, { status });
      message.success('Status updated');
      loadAll();
    } catch { message.error('Failed to update status'); }
  };

  const handleCreateReport = async (values: any) => {
    try {
      await api.post(`/radiology/orders/${selectedOrder.id}/report`, values);
      message.success('Report created');
      setModalType(null); reportForm.resetFields(); setSelectedOrder(null); loadAll();
    } catch (e: any) { message.error(e.response?.data?.message || 'Failed'); }
  };

  const handleVerifyReport = async (orderId: string) => {
    try {
      await api.patch(`/radiology/orders/${orderId}/report/verify`, {});
      message.success('Report verified');
      loadAll();
    } catch { message.error('Failed to verify'); }
  };

  const handleViewOrder = async (id: string) => {
    try {
      const res = await api.get(`/radiology/orders/${id}`);
      setSelectedOrder(res.data?.data);
      setModalType('view');
    } catch { message.error('Failed to load order'); }
  };

  const handleCreateTemplate = async (values: any) => {
    try {
      await api.post('/radiology/templates', values);
      message.success('Template created');
      setModalType(null); form.resetFields(); loadAll();
    } catch (e: any) { message.error(e.response?.data?.message || 'Failed'); }
  };

  const statusColor: Record<string, string> = {
    ordered: 'blue', scheduled: 'cyan', in_progress: 'orange', completed: 'gold',
    reported: 'purple', verified: 'green', cancelled: 'red',
  };

  const priorityColor: Record<string, string> = { routine: 'blue', urgent: 'orange', stat: 'red' };

  const orderCols = [
    { title: 'Order #', dataIndex: 'orderNumber', key: 'on', width: 140 },
    { title: 'Patient', key: 'pt', render: (_: any, r: any) => r.patient ? `${r.patient.firstName} ${r.patient.lastName}` : '-' },
    { title: 'Modality', dataIndex: 'modalityType', key: 'mod', render: (v: string) => <Tag>{v?.toUpperCase()}</Tag> },
    { title: 'Body Part', dataIndex: 'bodyPart', key: 'bp' },
    { title: 'Study', dataIndex: 'studyDescription', key: 'sd', ellipsis: true },
    { title: 'Priority', dataIndex: 'priority', key: 'pri', render: (v: string) => <Tag color={priorityColor[v] || 'blue'}>{v?.toUpperCase()}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'st', render: (v: string) => <Tag color={statusColor[v] || 'default'}>{v?.replace(/_/g, ' ').toUpperCase()}</Tag> },
    { title: 'Date', dataIndex: 'createdAt', key: 'dt', render: (v: string) => dayjs(v).format('DD/MM/YY') },
    {
      title: 'Actions', key: 'actions', width: 260, render: (_: any, r: any) => (
        <Space size={4} wrap>
          <Button size="small" onClick={() => handleViewOrder(r.id)}>View</Button>
          {r.status === 'ordered' && <Button size="small" type="primary" onClick={() => handleUpdateStatus(r.id, 'in_progress')}>Start</Button>}
          {r.status === 'in_progress' && <Button size="small" style={{ background: '#faad14', color: '#fff' }} onClick={() => handleUpdateStatus(r.id, 'completed')}>Done</Button>}
          {r.status === 'completed' && <Button size="small" type="primary" icon={<FileTextOutlined />} onClick={() => { setSelectedOrder(r); reportForm.resetFields(); setModalType('report'); }}>Report</Button>}
          {r.status === 'reported' && <Button size="small" style={{ background: '#52c41a', color: '#fff' }} icon={<CheckCircleOutlined />} onClick={() => handleVerifyReport(r.id)}>Verify</Button>}
        </Space>
      ),
    },
  ];

  const templateCols = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Modality', dataIndex: 'modalityType', key: 'mod', render: (v: string) => <Tag>{v?.toUpperCase()}</Tag> },
    { title: 'Body Part', dataIndex: 'bodyPart', key: 'bp' },
    { title: 'Active', dataIndex: 'isActive', key: 'act', render: (v: boolean) => v ? <Tag color="green">Active</Tag> : <Tag>Inactive</Tag> },
  ];

  return (
    <div style={{ padding: 24 }}>
      {analytics && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}><Card><Statistic title="Total Orders" value={analytics.totalOrders} prefix={<BarChartOutlined />} /></Card></Col>
          <Col span={6}><Card><Statistic title="Pending Reports" value={analytics.pendingReports} valueStyle={{ color: '#faad14' }} /></Card></Col>
          <Col span={6}><Card><Statistic title="Completed Today" value={analytics.completedToday} valueStyle={{ color: '#3f8600' }} /></Card></Col>
          <Col span={6}>
            <Card title="Modality Breakdown" size="small" bodyStyle={{ padding: 8 }}>
              <Space wrap>{analytics.modalityBreakdown?.map((m: any, i: number) => <Tag key={i}>{m.modality?.toUpperCase()}: {m.count}</Tag>)}</Space>
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} tabBarExtraContent={
          <Space>
            {activeTab === 'orders' && <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalType('order'); }}>New Order</Button>}
            {activeTab === 'templates' && <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalType('template'); }}>New Template</Button>}
          </Space>
        } items={[
          { key: 'orders', label: 'Orders', children: <Table dataSource={orders} columns={orderCols} rowKey="id" loading={loading} size="small" pagination={{ current: meta.page, total: meta.total, pageSize: meta.limit, onChange: (p) => loadAll(p) }} /> },
          { key: 'templates', label: 'Report Templates', children: <Table dataSource={templates} columns={templateCols} rowKey="id" loading={loading} size="small" /> },
        ]} />
      </Card>

      {/* New Order Modal */}
      <Modal title="New Radiology Order" open={modalType === 'order'} onCancel={() => setModalType(null)} footer={null} width={750} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleCreateOrder}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="patientId" label="Patient" rules={[{ required: true }]}>
                <Select showSearch placeholder="Select patient" optionFilterProp="children" filterOption={(input, option) => (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())}>
                  {patients.map(p => <Option key={p.id} value={p.id}>{p.firstName} {p.lastName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="modalityType" label="Modality" rules={[{ required: true }]}><Select options={MODALITIES} /></Form.Item></Col>
            <Col span={12}><Form.Item name="bodyPart" label="Body Part" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="studyDescription" label="Study Description" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={6}><Form.Item name="laterality" label="Laterality" initialValue="na"><Select><Option value="na">N/A</Option><Option value="left">Left</Option><Option value="right">Right</Option><Option value="bilateral">Bilateral</Option></Select></Form.Item></Col>
            <Col span={6}><Form.Item name="priority" label="Priority" initialValue="routine"><Select><Option value="routine">Routine</Option><Option value="urgent">Urgent</Option><Option value="stat">STAT</Option></Select></Form.Item></Col>
            <Col span={6}><Form.Item name="scheduledDate" label="Date"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={6}><Form.Item name="scheduledTime" label="Time"><TimePicker format="HH:mm" style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={24}><Form.Item name="clinicalHistory" label="Clinical History"><TextArea rows={2} /></Form.Item></Col>
            <Col span={24}><Form.Item name="provisionalDiagnosis" label="Provisional Diagnosis"><Input /></Form.Item></Col>
          </Row>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}><Button onClick={() => setModalType(null)}>Cancel</Button><Button type="primary" htmlType="submit">Create Order</Button></div>
        </Form>
      </Modal>

      {/* Report Modal */}
      <Modal title={`Create Report - ${selectedOrder?.orderNumber || ''}`} open={modalType === 'report'} onCancel={() => { setModalType(null); setSelectedOrder(null); }} footer={null} width={750} destroyOnClose>
        <Form form={reportForm} layout="vertical" onFinish={handleCreateReport}>
          <Row gutter={16}>
            <Col span={24}><Form.Item name="findings" label="Findings" rules={[{ required: true }]}><TextArea rows={4} /></Form.Item></Col>
            <Col span={24}><Form.Item name="impression" label="Impression" rules={[{ required: true }]}><TextArea rows={3} /></Form.Item></Col>
            <Col span={24}><Form.Item name="recommendation" label="Recommendation"><TextArea rows={2} /></Form.Item></Col>
            <Col span={12}><Form.Item name="reportStatus" label="Status" initialValue="preliminary"><Select><Option value="draft">Draft</Option><Option value="preliminary">Preliminary</Option><Option value="final">Final</Option></Select></Form.Item></Col>
          </Row>
          <Space style={{ float: 'right' }}><Button onClick={() => setModalType(null)}>Cancel</Button><Button type="primary" htmlType="submit">Save Report</Button></Space>
        </Form>
      </Modal>

      {/* Template Modal */}
      <Modal title="New Report Template" open={modalType === 'template'} onCancel={() => setModalType(null)} footer={null} width={700} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleCreateTemplate}>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="name" label="Template Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="modalityType" label="Modality" rules={[{ required: true }]}><Select options={MODALITIES} /></Form.Item></Col>
            <Col span={8}><Form.Item name="bodyPart" label="Body Part" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={24}><Form.Item name="findingsTemplate" label="Findings Template" rules={[{ required: true }]}><TextArea rows={4} /></Form.Item></Col>
            <Col span={24}><Form.Item name="impressionTemplate" label="Impression Template" rules={[{ required: true }]}><TextArea rows={3} /></Form.Item></Col>
          </Row>
          <Space style={{ float: 'right' }}><Button onClick={() => setModalType(null)}>Cancel</Button><Button type="primary" htmlType="submit">Save Template</Button></Space>
        </Form>
      </Modal>

      {/* View Order Modal */}
      <Modal title={`Order Details - ${selectedOrder?.orderNumber || ''}`} open={modalType === 'view'} onCancel={() => { setModalType(null); setSelectedOrder(null); }} footer={null} width={800}>
        {selectedOrder && (
          <>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Order #">{selectedOrder.orderNumber}</Descriptions.Item>
              <Descriptions.Item label="Status"><Tag color={statusColor[selectedOrder.status]}>{selectedOrder.status?.replace(/_/g, ' ').toUpperCase()}</Tag></Descriptions.Item>
              <Descriptions.Item label="Patient">{selectedOrder.patient ? `${selectedOrder.patient.firstName} ${selectedOrder.patient.lastName}` : '-'}</Descriptions.Item>
              <Descriptions.Item label="Referring Doctor">{selectedOrder.referringDoctor ? `${selectedOrder.referringDoctor.firstName} ${selectedOrder.referringDoctor.lastName}` : '-'}</Descriptions.Item>
              <Descriptions.Item label="Modality">{selectedOrder.modalityType?.toUpperCase()}</Descriptions.Item>
              <Descriptions.Item label="Body Part">{selectedOrder.bodyPart}</Descriptions.Item>
              <Descriptions.Item label="Study">{selectedOrder.studyDescription}</Descriptions.Item>
              <Descriptions.Item label="Priority"><Tag color={priorityColor[selectedOrder.priority]}>{selectedOrder.priority?.toUpperCase()}</Tag></Descriptions.Item>
              <Descriptions.Item label="Clinical History" span={2}>{selectedOrder.clinicalHistory || '-'}</Descriptions.Item>
            </Descriptions>
            {selectedOrder.report && (
              <Card title="Report" size="small">
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="Findings">{selectedOrder.report.findings}</Descriptions.Item>
                  <Descriptions.Item label="Impression">{selectedOrder.report.impression}</Descriptions.Item>
                  <Descriptions.Item label="Recommendation">{selectedOrder.report.recommendation || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Report Status"><Tag>{selectedOrder.report.reportStatus?.toUpperCase()}</Tag></Descriptions.Item>
                </Descriptions>
              </Card>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default RadiologyManagement;
