
import React, { useEffect, useMemo, useState } from 'react';
import { Card, Row, Col, Typography, List, Tag, Statistic, Alert, Spin, Descriptions, Button, Empty, Table, message, Modal, Form, Input, Select, Space } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { PhoneOutlined, AlertOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import quickActionService from '../../services/quickActionService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

type Appointment = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  reason?: string;
  service?: { id: string; name: string; };
  doctor?: { id: string; firstName?: string; lastName?: string };
};

const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appts, setAppts] = useState<Appointment[]>([]);
  const navigate = useNavigate();
  const [msg, msgCtx] = message.useMessage();

  // Quick Action States
  const [callbackModalVisible, setCallbackModalVisible] = useState(false);
  const [emergencyModalVisible, setEmergencyModalVisible] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [callbackForm] = Form.useForm();
  const [emergencyForm] = Form.useForm();

  const userOrganization = (user as any)?.organization;
  const isOnDefaultOrg = userOrganization?.subdomain === 'default';
  const userIsPatient = user?.role === 'patient';
  const needsHospitalSelection = isOnDefaultOrg && userIsPatient;
  const needsOrganizationSelection = !userOrganization ||
    !userOrganization.id ||
    userOrganization.id === 'default' ||
    userOrganization.id === 'default-org-00000000-0000-0000-0000-000000000001' ||
    userOrganization.subdomain === 'default';

  const go = (path: string) => {
    if (needsOrganizationSelection) {
      msg.warning('Please choose a hospital first');
      return;
    }
    navigate(path);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/appointments', { params: { limit: 25 }, suppressErrorToast: true } as any);
        setAppts(res.data?.data || []);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load your appointments');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleRequestCallback = async (values: any) => {
    setSubmittingAction(true);
    try {
      const userName = user ? `${user.firstName} ${user.lastName}` : 'Patient';
      await quickActionService.requestCallback({
        name: userName,
        phone: values.phone || (user as any)?.phone,
        preferredTime: values.preferredTime,
        message: `Reason: ${values.reason}`
      });
      msg.success('Callback request sent successfully');
      setCallbackModalVisible(false);
      callbackForm.resetFields();
    } catch (err) {
      msg.error('Failed to request callback');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleEmergencyRequest = async (values: any) => {
    setSubmittingAction(true);
    try {
      const userName = user ? `${user.firstName} ${user.lastName}` : 'Patient';
      await quickActionService.requestEmergency({
        name: userName,
        phone: (user as any)?.phone || 'Unknown',
        location: values.location,
        message: `Type: ${values.type}. Description: ${values.description || 'No description provided'}`,
        priority: 'high'
      });
      Modal.success({
        title: 'Emergency Alert Sent',
        content: 'Help is on the way. An ambulance has been dispatched to your location.',
        okText: 'Acknowledge'
      });
      setEmergencyModalVisible(false);
      emergencyForm.resetFields();
    } catch (err) {
      msg.error('Failed to send emergency alert');
    } finally {
      setSubmittingAction(false);
    }
  };

  const upcoming = useMemo(() => {
    const now = Date.now();
    const future = appts.filter(a => dayjs(a.startTime).valueOf() >= now);
    future.sort((a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf());
    return future[0];
  }, [appts]);

  const recent = useMemo(() => appts.slice(0, 5), [appts]);
  const displayPid = useMemo(() => {
    const raw = String((user as any)?.id || '');
    const tail = raw.replace(/-/g, '').slice(-6).toUpperCase();
    const sub = String((user as any)?.organization?.subdomain || '').toUpperCase();
    return sub ? `PID-${sub}-${tail}` : `PID-${tail}`;
  }, [user]);

  if (loading) return <Spin size="large" />;
  if (error) return <Alert type="error" message={error} showIcon />;

  return (
    <div style={{ padding: '24px' }}>
      {msgCtx}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Patient Portal</Title>
        <Space>
          <Button
            icon={<MedicineBoxOutlined />}
            onClick={() => go('/portal/medical-history')}
          >
            My History
          </Button>
          <Button
            icon={<PhoneOutlined />}
            onClick={() => setCallbackModalVisible(true)}
          >
            Request Callback
          </Button>
          <Button
            type="primary"
            danger
            icon={<AlertOutlined />}
            onClick={() => setEmergencyModalVisible(true)}
          >
            Emergency SOS
          </Button>
        </Space>
      </div>

      {needsHospitalSelection && (
        <Alert
          type="warning"
          showIcon
          banner
          message="Choose Your Hospital *Required"
          description="You're currently connected to Ayphen Care (default). Please select your actual hospital to access doctors and services."
          action={<Button type="primary" size="small" onClick={() => navigate('/onboarding/choose-hospital')}>Choose Hospital</Button>}
          style={{ marginBottom: 16 }}
        />
      )}

      {needsOrganizationSelection && (
        <Alert
          type="warning"
          showIcon
          banner
          message="You're not connected to a hospital yet"
          description="Connect your account to your hospital to access appointments and records."
          action={<Button type="primary" size="small" onClick={() => navigate('/onboarding/choose-hospital')}>Choose Hospital</Button>}
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card title="Upcoming Appointment" extra={<Link to="/appointments">View all</Link>}>
            {upcoming ? (
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Date & Time">{dayjs(upcoming.startTime).format('MMM DD, YYYY h:mm A')}</Descriptions.Item>
                <Descriptions.Item label="Doctor">{upcoming.doctor ? `Dr. ${upcoming.doctor.firstName || ''} ${upcoming.doctor.lastName || ''}`.trim() : '—'}</Descriptions.Item>
                <Descriptions.Item label="Service">{upcoming.service?.name || '—'}</Descriptions.Item>
                <Descriptions.Item label="Status"><Tag color={String(upcoming.status).toLowerCase() === 'confirmed' ? 'green' : 'orange'}>{String(upcoming.status).toUpperCase()}</Tag></Descriptions.Item>
              </Descriptions>
            ) : (
              <Empty description="No upcoming appointments">
                <Button type="primary" onClick={() => go('/appointments/new')}>Book Appointment</Button>
              </Empty>
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Your Profile" extra={<Link to="/profile">Edit</Link>}>
            <Descriptions size="small" column={1}>
              <Descriptions.Item label="Patient ID">{displayPid}</Descriptions.Item>
              <Descriptions.Item label="Name">{user?.firstName} {user?.lastName}</Descriptions.Item>
              <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
              <Descriptions.Item label="Phone">{(user as any)?.phone || '—'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Recent Appointments" extra={<Link to="/appointments">View all</Link>}>
            {appts.length ? (
              <Table
                rowKey="id"
                size="small"
                pagination={{ pageSize: 5 }}
                dataSource={recent}
                columns={[
                  { title: 'Date', dataIndex: 'startTime', render: (v: string) => dayjs(v).format('MMM DD, YYYY h:mm A') },
                  { title: 'Doctor', dataIndex: ['doctor', 'firstName'], render: (_: any, r: Appointment) => r.doctor ? `Dr. ${r.doctor.firstName || ''} ${r.doctor.lastName || ''}`.trim() : '—' },
                  { title: 'Service', dataIndex: ['service', 'name'], render: (v: any) => v || '—' },
                  { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={String(s).toLowerCase() === 'confirmed' ? 'green' : String(s).toLowerCase() === 'cancelled' ? 'red' : 'orange'}>{String(s).toUpperCase()}</Tag> },
                ]}
              />
            ) : (
              <Empty description="No appointments yet">
                <Button type="primary" onClick={() => go('/appointments/new')}>Book your first appointment</Button>
              </Empty>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card title="Medical Records" extra={<Link to="/portal/records">View all</Link>}>
                <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>Access your lab results, prescriptions, and visit summaries.</Typography.Paragraph>
                <Button onClick={() => go('/portal/records')}>Open Records</Button>
              </Card>
            </Col>
            <Col span={24}>
              <Card title="Bills" extra={<Link to="/portal/bills">View all</Link>}>
                <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>Check outstanding balances and payment history.</Typography.Paragraph>
                <Button onClick={() => go('/portal/bills')}>Open Bills</Button>
              </Card>
            </Col>
            <Col span={24}>
              <Card title="Insurance" extra={<Link to="/portal/insurance">Open</Link>}>
                <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
                  Compare plans, calculate premiums, and view benefits.
                </Typography.Paragraph>
                <Button type="primary" onClick={() => go('/portal/insurance')}>Open My Insurance</Button>
              </Card>
            </Col>
            <Col span={24}>
              <Card
                title={<><MedicineBoxOutlined style={{ color: '#10B981', marginRight: 8 }} />AI Symptom Checker</>}
                extra={<Link to="/portal/symptom-checker">Open</Link>}
                style={{
                  background: 'linear-gradient(135deg, #EFF6FF 0%, #f8bbd9 100%)',
                  borderColor: '#10B981'
                }}
              >
                <Typography.Paragraph style={{ marginBottom: 8 }}>
                  Describe your symptoms and get AI-powered recommendations for the right specialist.
                </Typography.Paragraph>
                <Button
                  type="primary"
                  onClick={() => go('/portal/symptom-checker')}
                  style={{ backgroundColor: '#10B981', borderColor: '#10B981' }}
                >
                  Check Symptoms
                </Button>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Callback Modal */}
      <Modal
        title="Request a Callback"
        open={callbackModalVisible}
        onCancel={() => setCallbackModalVisible(false)}
        footer={null}
      >
        <Form form={callbackForm} layout="vertical" onFinish={handleRequestCallback}>
          <Form.Item name="reason" label="Reason for Call" rules={[{ required: true }]}>
            <Select placeholder="Select Reason">
              <Option value="appointment">Appointment Query</Option>
              <Option value="results">Lab Results Inquiry</Option>
              <Option value="prescription">Prescription Refill</Option>
              <Option value="symptoms">New Symptoms</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item name="phone" label="Phone Number" initialValue={(user as any)?.phone}>
            <Input />
          </Form.Item>
          <Form.Item name="preferredTime" label="Preferred Time">
            <Select placeholder="Select Time">
              <Option value="morning">Morning (9AM - 12PM)</Option>
              <Option value="afternoon">Afternoon (12PM - 4PM)</Option>
              <Option value="evening">Evening (4PM - 7PM)</Option>
            </Select>
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={submittingAction} block>
            Submit Request
          </Button>
        </Form>
      </Modal>

      {/* Emergency Modal */}
      <Modal
        title={<Space><AlertOutlined style={{ color: 'red' }} /> Emergency Assistance</Space>}
        open={emergencyModalVisible}
        onCancel={() => setEmergencyModalVisible(false)}
        footer={null}
      >
        <Alert
          message="For life-threatening emergencies, please call your local emergency number (e.g., 911) immediately."
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form form={emergencyForm} layout="vertical" onFinish={handleEmergencyRequest}>
          <Form.Item name="type" label="Emergency Type" rules={[{ required: true }]}>
            <Select placeholder="Select Emergency Type">
              <Option value="chset_pain">Chest Pain / Heart Attack</Option>
              <Option value="breathing">Difficulty Breathing</Option>
              <Option value="accident">Accident / Trauma</Option>
              <Option value="bleeding">Severe Bleeding</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item name="location" label="Current Location" rules={[{ required: true }]}>
            <Input placeholder="Enter your current address or location" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Describe the situation..." />
          </Form.Item>
          <Button type="primary" danger htmlType="submit" loading={submittingAction} block size="large">
            SEND SOS ALERT
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default PatientDashboard;
