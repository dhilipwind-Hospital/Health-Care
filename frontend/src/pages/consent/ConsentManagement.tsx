import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Select, Input, Tag, Space, message, Tabs, DatePicker, Descriptions } from 'antd';
import { PlusOutlined, EyeOutlined, StopOutlined, FileTextOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { TextArea } = Input;
const { Option } = Select;

interface ConsentRecord {
  id: string;
  patientId: string;
  consentType: string;
  purpose: string;
  consentText: string;
  status: string;
  isGranted: boolean;
  grantedAt: string;
  withdrawnAt?: string;
  withdrawalReason?: string;
  patient?: { firstName: string; lastName: string };
  createdAt: string;
}

interface ConsentTemplate {
  type: string;
  title: string;
  text: string;
}

const ConsentManagement: React.FC = () => {
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [templates, setTemplates] = useState<ConsentTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [selectedConsent, setSelectedConsent] = useState<ConsentRecord | null>(null);
  const [form] = Form.useForm();
  const [withdrawForm] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchConsents = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/consent', { params: { page, limit: pagination.pageSize } });
      setConsents(res.data.data || []);
      setPagination(prev => ({ ...prev, current: page, total: res.data.meta?.total || 0 }));
    } catch {
      message.error('Failed to load consents');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/consent/templates');
      setTemplates(res.data.data || []);
    } catch {
      console.error('Failed to load templates');
    }
  };

  useEffect(() => {
    fetchConsents();
    fetchTemplates();
  }, []);

  const handleCreate = async (values: any) => {
    try {
      await api.post('/consent', values);
      message.success('Consent recorded successfully');
      setModalVisible(false);
      form.resetFields();
      fetchConsents();
    } catch {
      message.error('Failed to record consent');
    }
  };

  const handleWithdraw = async (values: any) => {
    if (!selectedConsent) return;
    try {
      await api.put(`/consent/${selectedConsent.id}/withdraw`, { reason: values.reason });
      message.success('Consent withdrawn successfully');
      setWithdrawModalVisible(false);
      withdrawForm.resetFields();
      fetchConsents();
    } catch {
      message.error('Failed to withdraw consent');
    }
  };

  const handleTemplateSelect = (type: string) => {
    const template = templates.find(t => t.type === type);
    if (template) {
      form.setFieldsValue({
        consentType: type,
        purpose: template.title,
        consentText: template.text,
      });
    }
  };

  const getStatusTag = (status: string) => {
    const colors: Record<string, string> = {
      granted: 'green',
      withdrawn: 'red',
      expired: 'orange',
      pending: 'blue',
    };
    return <Tag color={colors[status] || 'default'}>{status.toUpperCase()}</Tag>;
  };

  const columns = [
    {
      title: 'Patient',
      dataIndex: 'patient',
      render: (patient: any) => patient ? `${patient.firstName} ${patient.lastName}` : 'N/A',
    },
    {
      title: 'Consent Type',
      dataIndex: 'consentType',
      render: (type: string) => type?.replace(/_/g, ' ').toUpperCase(),
    },
    {
      title: 'Purpose',
      dataIndex: 'purpose',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: getStatusTag,
    },
    {
      title: 'Granted At',
      dataIndex: 'grantedAt',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: 'Actions',
      render: (_: any, record: ConsentRecord) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => { setSelectedConsent(record); setViewModalVisible(true); }}
          />
          {record.status === 'granted' && (
            <Button
              icon={<StopOutlined />}
              size="small"
              danger
              onClick={() => { setSelectedConsent(record); setWithdrawModalVisible(true); }}
            >
              Withdraw
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={<><FileTextOutlined /> Consent Management (DPDP Act 2023)</>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            Record Consent
          </Button>
        }
      >
        <Tabs defaultActiveKey="all" items={[
          {
            key: 'all',
            label: 'All Consents',
            children: (
              <Table
                columns={columns}
                dataSource={consents}
                rowKey="id"
                loading={loading}
                pagination={{
                  ...pagination,
                  onChange: (page) => fetchConsents(page),
                }}
              />
            ),
          },
          {
            key: 'templates',
            label: 'Consent Templates',
            children: (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {templates.map(t => (
                  <Card key={t.type} size="small" title={t.title}>
                    <p style={{ fontSize: 12, color: '#666' }}>{t.text.substring(0, 150)}...</p>
                    <Tag>{t.type.replace(/_/g, ' ')}</Tag>
                  </Card>
                ))}
              </div>
            ),
          },
        ]} />
      </Card>

      <Modal
        title="Record New Consent"
        open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="patientId" label="Patient ID" rules={[{ required: true }]}>
            <Input placeholder="Enter patient ID" />
          </Form.Item>
          <Form.Item label="Select Template">
            <Select placeholder="Choose a consent template" onChange={handleTemplateSelect} allowClear>
              {templates.map(t => (
                <Option key={t.type} value={t.type}>{t.title}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="consentType" label="Consent Type" rules={[{ required: true }]}>
            <Select placeholder="Select consent type">
              <Option value="data_processing">Data Processing</Option>
              <Option value="treatment">Treatment</Option>
              <Option value="telemedicine">Telemedicine</Option>
              <Option value="data_sharing">Data Sharing</Option>
              <Option value="research">Research</Option>
              <Option value="abdm_health_records">ABDM Health Records</Option>
              <Option value="photo_video">Photo/Video</Option>
              <Option value="emergency_contact">Emergency Contact</Option>
            </Select>
          </Form.Item>
          <Form.Item name="purpose" label="Purpose" rules={[{ required: true }]}>
            <Input placeholder="Purpose of consent" />
          </Form.Item>
          <Form.Item name="consentText" label="Consent Text" rules={[{ required: true }]}>
            <TextArea rows={6} placeholder="Full consent text shown to patient" />
          </Form.Item>
          <Form.Item name="expiresAt" label="Expiry Date (Optional)">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">Record Consent</Button>
              <Button onClick={() => { setModalVisible(false); form.resetFields(); }}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Consent Details"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={<Button onClick={() => setViewModalVisible(false)}>Close</Button>}
        width={600}
      >
        {selectedConsent && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Patient">
              {selectedConsent.patient ? `${selectedConsent.patient.firstName} ${selectedConsent.patient.lastName}` : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Consent Type">
              {selectedConsent.consentType?.replace(/_/g, ' ').toUpperCase()}
            </Descriptions.Item>
            <Descriptions.Item label="Purpose">{selectedConsent.purpose}</Descriptions.Item>
            <Descriptions.Item label="Status">{getStatusTag(selectedConsent.status)}</Descriptions.Item>
            <Descriptions.Item label="Granted At">
              {selectedConsent.grantedAt ? new Date(selectedConsent.grantedAt).toLocaleString() : '-'}
            </Descriptions.Item>
            {selectedConsent.withdrawnAt && (
              <>
                <Descriptions.Item label="Withdrawn At">
                  {new Date(selectedConsent.withdrawnAt).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Withdrawal Reason">
                  {selectedConsent.withdrawalReason || '-'}
                </Descriptions.Item>
              </>
            )}
            <Descriptions.Item label="Consent Text">
              <div style={{ whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}>
                {selectedConsent.consentText}
              </div>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal
        title="Withdraw Consent"
        open={withdrawModalVisible}
        onCancel={() => { setWithdrawModalVisible(false); withdrawForm.resetFields(); }}
        footer={null}
      >
        <Form form={withdrawForm} layout="vertical" onFinish={handleWithdraw}>
          <p>Are you sure you want to withdraw this consent?</p>
          <Form.Item name="reason" label="Reason for Withdrawal" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="Enter reason for withdrawal" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" danger htmlType="submit">Withdraw Consent</Button>
              <Button onClick={() => { setWithdrawModalVisible(false); withdrawForm.resetFields(); }}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ConsentManagement;
