import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Button,
  Typography,
  Tag,
  Space,
  Skeleton,
  Upload,
  App,
  Alert,
  Table,
  Empty,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  Input,
  Select
} from 'antd';
import {
  EditOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  CalendarOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  HeartOutlined,
  ExperimentOutlined,
  AlertOutlined,
  ImportOutlined,
  UploadOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import dayjs from 'dayjs';
import { Patient } from '../../types/patient';
import patientService from '../../services/patientService';
import api from '../../services/api';
import PatientHistory from '../../components/patients/PatientHistory';
import quickActionService from '../../services/quickActionService';

const { Title, Text } = Typography;

const PatientDetailContainer = styled.div`
  .patient-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 16px;
  }
  
  .patient-actions {
    display: flex;
    gap: 8px;
  }

  .stat-card {
    transition: all 0.3s ease;
    cursor: pointer;
    
    &:hover {
      background-color: #fef2f7 !important;
      border-color: #10B981 !important;
    }
  }
`;

interface Appointment {
  id: string;
  startTime: string;
  status: string;
  reason?: string;
  doctor?: {
    firstName: string;
    lastName: string;
  };
  department?: string;
}

interface Prescription {
  id: string;
  createdAt: string;
  status: string;
  items?: Array<{
    medicine: string;
    dosage: string;
  }>;
  doctor?: {
    firstName: string;
    lastName: string;
  };
}

interface LabResult {
  id: string;
  testDate: string;
  testName: string;
  result: string;
  status: string;
}

const PatientDetailEnhanced: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const [loading, setLoading] = useState<boolean>(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Related Data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [loadingLabResults, setLoadingLabResults] = useState(false);

  // Modals
  const [isCallbackModalOpen, setIsCallbackModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const [callbackForm] = Form.useForm();
  const [emergencyForm] = Form.useForm();
  const [importForm] = Form.useForm();

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await patientService.getPatient(id);
        setPatient(data);
        setErrorMsg(null);
      } catch (error) {
        console.error('Error fetching patient:', error);
        setErrorMsg('Unable to load patient details.');
      } finally {
        setLoading(false);
      }
    };
    fetchPatientData();
  }, [id]);

  const handleImportSubmit = async (values: any) => {
    try {
      setModalLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      message.success('Medical records imported successfully');
      setIsImportModalOpen(false);
      importForm.resetFields();
    } catch (error) {
      message.error('Failed to import records');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCallbackSubmit = async (values: any) => {
    try {
      setModalLoading(true);
      await quickActionService.requestCallback({
        name: `${patient?.firstName} ${patient?.lastName}`,
        phone: patient?.phone || values.phone,
        department: values.department,
        preferredTime: values.preferredTime,
        message: values.message
      });
      message.success('Callback requested successfully');
      setIsCallbackModalOpen(false);
      callbackForm.resetFields();
    } catch (error) {
      message.error('Failed to request callback');
    } finally {
      setModalLoading(false);
    }
  };

  const handleEmergencySubmit = async (values: any) => {
    try {
      setModalLoading(true);
      await quickActionService.requestEmergency({
        name: `${patient?.firstName} ${patient?.lastName}`,
        phone: patient?.phone || values.phone,
        location: values.location,
        message: values.message,
        priority: 'high'
      });
      message.success('Emergency alert sent!');
      setIsEmergencyModalOpen(false);
      emergencyForm.resetFields();
    } catch (error) {
      message.error('Failed to send emergency alert');
    } finally {
      setModalLoading(false);
    }
  };

  const beforeUpload = async (file: File) => {
    if (!id) return false as any;
    try {
      setUploading(true);
      const { photoUrl } = await patientService.uploadPatientPhoto(id, file);
      setPatient(prev => prev ? { ...prev, profileImage: photoUrl } as any : prev);
      message.success('Photo uploaded');
    } catch (e: any) {
      message.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
    return false as any;
  };

  const fetchAppointments = async () => {
    if (!id) return;
    try {
      setLoadingAppointments(true);
      const res = await api.get(`/appointments`, { params: { patientId: id, limit: 10 } });
      setAppointments(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) { setAppointments([]); }
    finally { setLoadingAppointments(false); }
  };

  const fetchPrescriptions = async () => {
    if (!id) return;
    try {
      setLoadingPrescriptions(true);
      const res = await api.get(`/pharmacy/prescriptions`, { params: { patientId: id, limit: 10 } });
      setPrescriptions(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) { setPrescriptions([]); }
    finally { setLoadingPrescriptions(false); }
  };

  const fetchLabResults = async () => {
    if (!id) return;
    try {
      setLoadingLabResults(true);
      const res = await api.get(`/lab/orders`, { params: { patientId: id, limit: 10 } });
      setLabResults(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) { setLabResults([]); }
    finally { setLoadingLabResults(false); }
  };

  if (loading || !patient) return <Skeleton active />;

  const getAge = (dob: string) => dayjs().diff(dayjs(dob), 'year');

  const tabItems = [
    {
      key: 'overview',
      label: <span><UserOutlined /> Overview</span>,
      children: (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card className="stat-card">
                <Statistic title="Appointments" value={appointments.length} prefix={<CalendarOutlined />} valueStyle={{ color: '#1890ff' }} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="stat-card">
                <Statistic title="Prescriptions" value={prescriptions.length} prefix={<MedicineBoxOutlined />} valueStyle={{ color: '#52c41a' }} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="stat-card">
                <Statistic title="Lab Tests" value={labResults.length} prefix={<ExperimentOutlined />} valueStyle={{ color: '#722ed1' }} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="stat-card">
                <Statistic title="Age" value={getAge(patient.dateOfBirth)} suffix="years" valueStyle={{ color: '#fa8c16' }} />
              </Card>
            </Col>
          </Row>

          <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
            <Descriptions.Item label="Full Name">{patient.firstName} {patient.lastName}</Descriptions.Item>
            <Descriptions.Item label="DOB">{dayjs(patient.dateOfBirth).format('MMM D, YYYY')}</Descriptions.Item>
            <Descriptions.Item label="Gender">{patient.gender}</Descriptions.Item>
            <Descriptions.Item label="Blood Group"><Tag color="red">{patient.bloodGroup}</Tag></Descriptions.Item>
            <Descriptions.Item label="Email">{patient.email}</Descriptions.Item>
            <Descriptions.Item label="Phone">{patient.phone}</Descriptions.Item>
            <Descriptions.Item label="Address" span={2}>{patient.address}</Descriptions.Item>
          </Descriptions>

          <Card title="Medical Information" style={{ marginBottom: 24 }}>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Title level={5}>Allergies</Title>
                {patient.allergies?.map((a, i) => <Tag color="red" key={i}>{a}</Tag>) || <Text type="secondary">None</Text>}
              </Col>
              <Col span={8}>
                <Title level={5}>Conditions</Title>
                {patient.conditions?.map((c, i) => <Tag color="orange" key={i}>{c}</Tag>) || <Text type="secondary">None</Text>}
              </Col>
              <Col span={8}>
                <Title level={5}>Medications</Title>
                {patient.medications?.map((m, i) => <Tag color="blue" key={i}>{m}</Tag>) || <Text type="secondary">None</Text>}
              </Col>
            </Row>
          </Card>
        </>
      )
    },
    {
      key: 'history',
      label: <span><FileTextOutlined /> Medical History</span>,
      children: <PatientHistory patientId={id!} />
    },
    {
      key: 'appointments',
      label: <span><CalendarOutlined /> Appointments</span>,
      children: (
        <Card>
          <Button onClick={fetchAppointments} style={{ marginBottom: 16 }}>Refresh</Button>
          <Table
            dataSource={appointments}
            rowKey="id"
            loading={loadingAppointments}
            columns={[
              { title: 'Date', dataIndex: 'startTime', render: (d: string) => dayjs(d).format('MMM D, YYYY h:mm A') },
              { title: 'Doctor', dataIndex: 'doctor', render: (d: any) => d ? `Dr. ${d.firstName} ${d.lastName}` : 'N/A' },
              { title: 'Department', dataIndex: 'department' },
              { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag>{s}</Tag> }
            ]}
          />
        </Card>
      )
    },
    {
      key: 'prescriptions',
      label: <span><MedicineBoxOutlined /> Prescriptions</span>,
      children: (
        <Card>
          <Button onClick={fetchPrescriptions} style={{ marginBottom: 16 }}>Refresh</Button>
          <Table
            dataSource={prescriptions}
            rowKey="id"
            loading={loadingPrescriptions}
            columns={[
              { title: 'Date', dataIndex: 'createdAt', render: (d: string) => dayjs(d).format('MMM D, YYYY') },
              { title: 'Doctor', dataIndex: 'doctor', render: (d: any) => d ? `Dr. ${d.firstName} ${d.lastName}` : 'N/A' },
              { title: 'Items', dataIndex: 'items', render: (items: any[]) => items?.length || 0 },
              { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag>{s}</Tag> }
            ]}
          />
        </Card>
      )
    },
    {
      key: 'lab',
      label: <span><ExperimentOutlined /> Lab Results</span>,
      children: (
        <Card>
          <Button onClick={fetchLabResults} style={{ marginBottom: 16 }}>Refresh</Button>
          <Table
            dataSource={labResults}
            rowKey="id"
            loading={loadingLabResults}
            columns={[
              { title: 'Date', dataIndex: 'testDate', render: (d: string) => dayjs(d).format('MMM D, YYYY') },
              { title: 'Test', dataIndex: 'testName' },
              { title: 'Result', dataIndex: 'result' },
              { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag>{s}</Tag> }
            ]}
          />
        </Card>
      )
    }
  ];

  return (
    <PatientDetailContainer>
      {errorMsg && <Alert type="warning" message={errorMsg} showIcon style={{ marginBottom: 12 }} />}

      <div className="patient-header">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Back to Patients</Button>
        <div className="patient-actions">
          <Button icon={<ImportOutlined />} onClick={() => setIsImportModalOpen(true)} style={{ borderColor: '#722ed1', color: '#722ed1' }}>
            Import Records
          </Button>
          <Button icon={<PhoneOutlined />} onClick={() => setIsCallbackModalOpen(true)}>
            Request Callback
          </Button>
          <Button danger type="primary" icon={<AlertOutlined />} onClick={() => setIsEmergencyModalOpen(true)}>
            Emergency SOS
          </Button>
          <Upload showUploadList={false} beforeUpload={beforeUpload} accept="image/*">
            <Button loading={uploading}>Upload Photo</Button>
          </Upload>
          <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/patients/${id}/edit`)}>
            Edit Patient
          </Button>
        </div>
      </div>

      <Card bordered={false}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#eee', overflow: 'hidden', marginRight: 24 }}>
            {patient.profileImage ? <img src={patient.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserOutlined style={{ fontSize: 40, margin: 20, color: '#999' }} />}
          </div>
          <div>
            <Title level={2} style={{ margin: 0 }}>{patient.firstName} {patient.lastName}</Title>
            <Text type="secondary">ID: {patient.id} • {getAge(patient.dateOfBirth)} Years • {patient.gender}</Text>
            <div style={{ marginTop: 8 }}>
              <Tag color={patient.status === 'active' ? 'green' : 'red'}>{patient.status?.toUpperCase()}</Tag>
            </div>
          </div>
        </div>

        <Space style={{ marginBottom: 24 }}>
          {tabItems.map(item => (
            <Button
              key={item.key}
              type={activeTab === item.key ? 'primary' : 'default'}
              onClick={() => setActiveTab(item.key)}
              shape="round"
            >
              {item.label}
            </Button>
          ))}
        </Space>

        {tabItems.find(i => i.key === activeTab)?.children}
      </Card>

      {/* Import Modal */}
      <Modal title="Import Past Medical Records" open={isImportModalOpen} onCancel={() => setIsImportModalOpen(false)} footer={null}>
        <Form form={importForm} layout="vertical" onFinish={handleImportSubmit}>
          <Alert message="Upload previous history documents (PDF/Image) to digitize them." type="info" showIcon style={{ marginBottom: 16 }} />
          <Form.Item name="type" label="Record Type" rules={[{ required: true }]}>
            <Select placeholder="Select Type">
              <Select.Option value="prescription">Prescription</Select.Option>
              <Select.Option value="lab">Lab Report</Select.Option>
              <Select.Option value="discharge">Discharge Summary</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="date" label="Date" rules={[{ required: true }]}><Input type="date" /></Form.Item>
          <Form.Item label="File"><Upload.Dragger multiple={false}><p><UploadOutlined /></p><p>Click to Upload</p></Upload.Dragger></Form.Item>
          <Button type="primary" htmlType="submit" block loading={modalLoading}>Import</Button>
        </Form>
      </Modal>

      {/* Callback Modal */}
      <Modal title="Request Callback" open={isCallbackModalOpen} onCancel={() => setIsCallbackModalOpen(false)} footer={null}>
        <Form form={callbackForm} layout="vertical" onFinish={handleCallbackSubmit}>
          <Form.Item name="phone" label="Phone" initialValue={patient?.phone} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="department" label="Department"><Select><Select.Option value="General">General</Select.Option></Select></Form.Item>
          <Button type="primary" htmlType="submit" block loading={modalLoading}>Submit</Button>
        </Form>
      </Modal>

      {/* Emergency Modal */}
      <Modal title="Emergency SOS" open={isEmergencyModalOpen} onCancel={() => setIsEmergencyModalOpen(false)} footer={null}>
        <Form form={emergencyForm} layout="vertical" onFinish={handleEmergencySubmit}>
          <Alert message="This will trigger a high priority alert to hospital staff." type="error" showIcon style={{ marginBottom: 16 }} />
          <Form.Item name="location" label="Current Location" rules={[{ required: true }]}><Input placeholder="e.g. Ward 3, Room 102" /></Form.Item>
          <Form.Item name="message" label="Nature of Emergency"><Input.TextArea /></Form.Item>
          <Button type="primary" danger htmlType="submit" block loading={modalLoading}>SEND ALERT</Button>
        </Form>
      </Modal>

    </PatientDetailContainer>
  );
};

export default PatientDetailEnhanced;
