import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Select, Input, Tag, message, Row, Col, Statistic, Upload } from 'antd';
import { PlusOutlined, FileTextOutlined, ScanOutlined, CheckCircleOutlined, ClockCircleOutlined, UploadOutlined, EyeOutlined } from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const STATUS_COLORS: Record<string, string> = {
  pending: 'orange', scanned: 'blue', indexed: 'green', archived: 'default'
};

const MedicalRecordsDigitization: React.FC = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [fileTypes, setFileTypes] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  const [viewModal, setViewModal] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [filesRes, patientsRes, typesRes, dashRes] = await Promise.all([
        api.get('/medical-record-files'),
        api.get('/users?role=patient&limit=100'),
        api.get('/medical-record-files/file-types'),
        api.get('/medical-record-files/dashboard'),
      ]);
      setFiles(filesRes.data.data || []);
      setPatients(patientsRes.data?.data || []);
      setFileTypes(typesRes.data.data || []);
      setDashboard(dashRes.data.data || null);
    } catch { message.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpload = async (values: any) => {
    try {
      await api.post('/medical-record-files', {
        ...values,
        documentDate: values.documentDate?.format('YYYY-MM-DD'),
      });
      message.success('Record file created');
      setUploadModal(false);
      form.resetFields();
      fetchData();
    } catch { message.error('Failed to create record'); }
  };

  const handleMarkScanned = async (id: string) => {
    try {
      await api.post(`/medical-record-files/${id}/scanned`, {});
      message.success('Marked as scanned');
      fetchData();
    } catch { message.error('Failed to update'); }
  };

  const handleMarkIndexed = async (id: string) => {
    try {
      await api.post(`/medical-record-files/${id}/indexed`, {});
      message.success('Marked as indexed');
      fetchData();
    } catch { message.error('Failed to update'); }
  };

  const columns = [
    { title: 'File #', dataIndex: 'fileNumber', width: 130 },
    { title: 'Patient', render: (_: any, r: any) => r.patient ? `${r.patient.firstName} ${r.patient.lastName}` : '-' },
    { title: 'File Name', dataIndex: 'fileName', ellipsis: true },
    { title: 'Type', dataIndex: 'fileType', render: (t: string) => <Tag>{t?.replace(/_/g, ' ').toUpperCase()}</Tag> },
    { title: 'Document Date', dataIndex: 'documentDate', render: (d: string) => d ? dayjs(d).format('DD/MM/YY') : '-' },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={STATUS_COLORS[s]}>{s?.toUpperCase()}</Tag> },
    { title: 'Uploaded By', render: (_: any, r: any) => r.uploadedBy ? `${r.uploadedBy.firstName} ${r.uploadedBy.lastName}` : '-' },
    {
      title: 'Actions', width: 200,
      render: (_: any, r: any) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setViewModal(r)}>View</Button>
          {r.status === 'pending' && <Button size="small" icon={<ScanOutlined />} onClick={() => handleMarkScanned(r.id)}>Scanned</Button>}
          {r.status === 'scanned' && <Button size="small" type="primary" onClick={() => handleMarkIndexed(r.id)}>Index</Button>}
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
        <Col span={6}><Card><Statistic title="Total Files" value={dashboard?.total || 0} prefix={<FileTextOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="Pending Scan" value={getStatusCount('pending')} valueStyle={{ color: '#faad14' }} prefix={<ClockCircleOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="Scanned" value={getStatusCount('scanned')} valueStyle={{ color: '#1890ff' }} prefix={<ScanOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="Indexed" value={getStatusCount('indexed')} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} /></Card></Col>
      </Row>

      <Card
        title={<><FileTextOutlined /> Medical Records Digitization</>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setUploadModal(true)}>Add Record</Button>}
      >
        <Table columns={columns} dataSource={files} rowKey="id" loading={loading} size="small" />
      </Card>

      <Modal title="Add Medical Record File" open={uploadModal} onCancel={() => { setUploadModal(false); form.resetFields(); }} footer={null} width={600}>
        <Form form={form} layout="vertical" onFinish={handleUpload}>
          <Form.Item name="patientId" label="Patient" rules={[{ required: true }]}>
            <Select showSearch placeholder="Select patient" optionFilterProp="children" filterOption={(input, option) => (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())}>
              {patients.map(p => <Option key={p.id} value={p.id}>{p.firstName} {p.lastName}</Option>)}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fileName" label="File Name" rules={[{ required: true }]}><Input placeholder="e.g., Lab Report - CBC" /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="fileType" label="File Type" rules={[{ required: true }]}>
                <Select placeholder="Select type">{fileTypes.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}</Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="documentDate" label="Document Date"><Input type="date" /></Form.Item></Col>
            <Col span={12}><Form.Item name="storageLocation" label="Physical Storage Location"><Input placeholder="e.g., Cabinet A, Shelf 3" /></Form.Item></Col>
          </Row>
          <Form.Item name="description" label="Description"><TextArea rows={2} placeholder="Brief description of the document" /></Form.Item>
          <Form.Item name="isConfidential" label="Confidential" initialValue={false}>
            <Select><Option value={false}>No</Option><Option value={true}>Yes</Option></Select>
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => { setUploadModal(false); form.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit">Add Record</Button>
          </div>
        </Form>
      </Modal>

      <Modal title={`Record - ${viewModal?.fileNumber || ''}`} open={!!viewModal} onCancel={() => setViewModal(null)} footer={null} width={600}>
        {viewModal && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}><strong>Patient:</strong> {viewModal.patient ? `${viewModal.patient.firstName} ${viewModal.patient.lastName}` : '-'}</Col>
              <Col span={12}><strong>File Type:</strong> {viewModal.fileType?.replace(/_/g, ' ')}</Col>
            </Row>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}><strong>File Name:</strong> {viewModal.fileName}</Col>
              <Col span={12}><strong>Document Date:</strong> {viewModal.documentDate ? dayjs(viewModal.documentDate).format('DD/MM/YYYY') : '-'}</Col>
            </Row>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}><strong>Status:</strong> <Tag color={STATUS_COLORS[viewModal.status]}>{viewModal.status?.toUpperCase()}</Tag></Col>
              <Col span={12}><strong>Storage:</strong> {viewModal.storageLocation || '-'}</Col>
            </Row>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}><strong>Confidential:</strong> {viewModal.isConfidential ? <Tag color="red">Yes</Tag> : 'No'}</Col>
              <Col span={12}><strong>Uploaded:</strong> {dayjs(viewModal.createdAt).format('DD/MM/YYYY HH:mm')}</Col>
            </Row>
            {viewModal.description && (
              <div style={{ marginBottom: 16 }}><strong>Description:</strong><p>{viewModal.description}</p></div>
            )}
            {viewModal.scannedAt && (
              <div style={{ marginBottom: 8 }}><strong>Scanned:</strong> {dayjs(viewModal.scannedAt).format('DD/MM/YYYY HH:mm')}</div>
            )}
            {viewModal.indexedAt && (
              <div style={{ marginBottom: 8 }}><strong>Indexed:</strong> {dayjs(viewModal.indexedAt).format('DD/MM/YYYY HH:mm')}</div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MedicalRecordsDigitization;
