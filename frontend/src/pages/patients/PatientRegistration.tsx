import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Select,
  DatePicker,
  Row,
  Col,
  Typography,
  Space,
  message,
  Divider,
  Tag,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
  MedicineBoxOutlined,
  HeartOutlined,
  DollarOutlined,
  FileTextOutlined,
  IdcardOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styled from 'styled-components';
import dayjs from 'dayjs';
import patientService from '../../services/patientService';
import api from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const PageContainer = styled.div`
  background: linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 50%, #E0F2FE 100%);
  min-height: 100vh;
  padding: 24px;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  .title-section {
    display: flex;
    align-items: center;
    gap: 16px;
    
    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: #1E3A5F;
    }
    
    .subtitle {
      color: #666;
      font-size: 14px;
    }
  }
`;

const SectionCard = styled(Card)`
  border-radius: 12px;
  border: 1px solid rgba(30, 58, 95, 0.1);
  box-shadow: 0 2px 8px rgba(30, 58, 95, 0.06);
  margin-bottom: 16px;
  
  .ant-card-head {
    border-bottom: 1px solid rgba(30, 58, 95, 0.08);
    padding: 12px 20px;
    min-height: auto;
    
    .ant-card-head-title {
      font-size: 14px;
      font-weight: 600;
      color: #1E3A5F;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
  
  .ant-card-body {
    padding: 16px 20px;
  }
`;

const RegistrationCard = styled(Card)`
  border-radius: 12px;
  border: 1px solid rgba(30, 58, 95, 0.1);
  box-shadow: 0 2px 8px rgba(30, 58, 95, 0.06);
  background: #fff;
  
  .ant-card-head {
    border-bottom: 1px solid rgba(30, 58, 95, 0.08);
    padding: 12px 20px;
    min-height: auto;
    
    .ant-card-head-title {
      font-size: 14px;
      font-weight: 600;
      color: #1E3A5F;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
  
  .ant-card-body {
    padding: 20px;
  }
  
  .registration-info {
    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 13px;
      color: #666;
      
      .label {
        color: #0EA5E9;
      }
    }
  }
`;

const ActionButton = styled(Button)`
  height: 48px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 15px;
  
  &.primary-action {
    background: #10B981;
    border-color: #10B981;
    color: #fff;
    
    &:hover {
      background: #059669;
      border-color: #059669;
    }
  }
  
  &.secondary-action {
    background: #fff;
    border-color: #d9d9d9;
    color: #666;
    
    &:hover {
      border-color: #1E3A5F;
      color: #1E3A5F;
    }
  }
`;

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
];

const PatientRegistration: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      setIsEditMode(true);
      fetchPatient(id);
    }
    fetchDoctors();
    fetchDepartments();
  }, [id]);

  const fetchPatient = async (patientId: string) => {
    setLoading(true);
    try {
      const data = await patientService.getPatient(patientId);
      form.setFieldsValue({
        ...data,
        dateOfBirth: data.dateOfBirth ? dayjs(data.dateOfBirth, 'YYYY-MM-DD') : undefined,
      });
    } catch (error) {
      console.error('Error fetching patient:', error);
      message.error('Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/users?role=doctor&limit=100');
      setDoctors(res.data?.data || res.data || []);
    } catch (e) {
      console.error('Failed to fetch doctors:', e);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      setDepartments(res.data?.data || res.data || []);
    } catch (e) {
      console.error('Failed to fetch departments:', e);
    }
  };

  const onFinish = async (values: any) => {
    setSaving(true);
    try {
      const payload: any = {
        ...values,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : undefined,
        role: 'patient',
      };
      
      let patientId = id;
      
      if (isEditMode && id) {
        await patientService.updatePatient(id, payload);
        message.success('Patient updated successfully!');
      } else {
        const result = await patientService.createPatient(payload);
        patientId = result?.id || (result as any)?.data?.id;
        message.success('Patient registered successfully!');
        
        // If visit details are provided, create a visit/appointment
        if (values.visitType && patientId) {
          try {
            await api.post('/visits', {
              patientId,
              visitType: values.visitType,
              departmentId: values.departmentId,
              doctorId: values.preferredDoctorId,
              priority: values.priority || 'standard',
              chiefComplaint: values.chiefComplaint,
              paymentMode: values.paymentMode,
              insuranceProvider: values.insuranceProvider,
              policyNumber: values.policyNumber,
            });
          } catch (e) {
            console.error('Failed to create visit:', e);
          }
        }
      }
      
      const role = String(user?.role || '').toLowerCase();
      if (role === 'admin' || role === 'super_admin') {
        navigate('/patients');
      } else {
        navigate('/queue/reception');
      }
    } catch (error: any) {
      console.error('Error saving patient:', error);
      message.error(error?.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'register'} patient`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
  };

  return (
    <PageContainer>
      <PageHeader>
        <div className="title-section">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
          />
          <div>
            <h2>Patient Registration</h2>
            <div className="subtitle">Register new patient — OPD Walk-in</div>
          </div>
        </div>
        <Space>
          <Button onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="primary" onClick={() => form.submit()} loading={saving}>
            Save Draft
          </Button>
        </Space>
      </PageHeader>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          gender: undefined,
          bloodGroup: undefined,
          visitType: 'opd_walkin',
          priority: 'normal',
          paymentMode: 'cash',
        }}
      >
        <Row gutter={24}>
          {/* Left Column */}
          <Col xs={24} lg={12}>
            {/* Personal Information */}
            <SectionCard title={<><UserOutlined /> Personal Information</>}>
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item
                    name="firstName"
                    label="First Name"
                    rules={[{ required: true, message: 'Required' }]}
                  >
                    <Input placeholder="Enter first name" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="middleName" label="Middle Name">
                    <Input placeholder="Enter middle name" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="lastName"
                    label="Last Name"
                    rules={[{ required: true, message: 'Required' }]}
                  >
                    <Input placeholder="Enter last name" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item
                    name="dateOfBirth"
                    label="Date of Birth"
                    rules={[{ required: true, message: 'Required' }]}
                  >
                    <DatePicker
                      style={{ width: '100%' }}
                      format="DD/MM/YYYY"
                      placeholder="DD/MM/YYYY"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="gender"
                    label="Gender"
                    rules={[{ required: true, message: 'Required' }]}
                  >
                    <Select placeholder="Select gender">
                      <Option value="male">Male</Option>
                      <Option value="female">Female</Option>
                      <Option value="other">Other</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="bloodGroup" label="Blood Group">
                    <Select placeholder="Select blood group">
                      <Option value="A+">A+</Option>
                      <Option value="A-">A-</Option>
                      <Option value="B+">B+</Option>
                      <Option value="B-">B-</Option>
                      <Option value="AB+">AB+</Option>
                      <Option value="AB-">AB-</Option>
                      <Option value="O+">O+</Option>
                      <Option value="O-">O-</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item
                    name="phone"
                    label="Phone Number"
                    rules={[{ required: true, message: 'Required' }]}
                  >
                    <Input prefix={<PhoneOutlined />} placeholder="+91 XXXXX XXXXX" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="email"
                    label="Email Address"
                    rules={[{ type: 'email', message: 'Invalid email' }]}
                  >
                    <Input prefix={<MailOutlined />} placeholder="patient@email.com" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="maritalStatus" label="Marital Status">
                    <Select placeholder="Select status">
                      <Option value="single">Single</Option>
                      <Option value="married">Married</Option>
                      <Option value="divorced">Divorced</Option>
                      <Option value="widowed">Widowed</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </SectionCard>

            {/* Address & Identification */}
            <SectionCard title={<><HomeOutlined /> Address & Identification</>}>
              <Form.Item
                name="address"
                label="Address Line 1"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input placeholder="House/Flat No., Street Name" />
              </Form.Item>
              <Form.Item name="addressLine2" label="Address Line 2">
                <Input placeholder="Landmark, Area" />
              </Form.Item>
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item
                    name="city"
                    label="City"
                    rules={[{ required: true, message: 'Required' }]}
                  >
                    <Input placeholder="Enter city" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="state"
                    label="State"
                    rules={[{ required: true, message: 'Required' }]}
                  >
                    <Select placeholder="Select state" showSearch>
                      {indianStates.map((s) => (
                        <Option key={s} value={s}>{s}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="zipCode"
                    label="PIN Code"
                    rules={[{ required: true, message: 'Required' }]}
                  >
                    <Input placeholder="6-digit PIN" maxLength={6} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="idType" label="ID Type">
                    <Select placeholder="Select ID type">
                      <Option value="aadhaar">Aadhaar Card</Option>
                      <Option value="pan">PAN Card</Option>
                      <Option value="passport">Passport</Option>
                      <Option value="driving_license">Driving License</Option>
                      <Option value="voter_id">Voter ID</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="idNumber" label="ID Number">
                    <Input placeholder="XXXX XXXX XXXX" />
                  </Form.Item>
                </Col>
              </Row>
            </SectionCard>

            {/* Visit Details */}
            <SectionCard title={<><FileTextOutlined /> Visit Details</>}>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="visitType" label="Visit Type">
                    <Select placeholder="Select visit type">
                      <Option value="opd_walkin">OPD - Walk-in</Option>
                      <Option value="opd_appointment">OPD - Appointment</Option>
                      <Option value="emergency">Emergency</Option>
                      <Option value="follow_up">Follow-up</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="departmentId" label="Department">
                    <Select placeholder="Select department" showSearch optionFilterProp="children">
                      {departments.map((d: any) => (
                        <Option key={d.id} value={d.id}>{d.name}</Option>
                      ))}
                      <Option value="general">General Medicine</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="preferredDoctorId" label="Preferred Doctor">
                    <Select placeholder="Select doctor" showSearch optionFilterProp="children" allowClear>
                      {doctors.map((d: any) => (
                        <Option key={d.id} value={d.id}>
                          Dr. {d.firstName} {d.lastName}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="priority" label="Priority">
                    <Select placeholder="Select priority">
                      <Option value="normal">Normal</Option>
                      <Option value="urgent">Urgent</Option>
                      <Option value="emergency">Emergency</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="chiefComplaint" label="Chief Complaint">
                <TextArea rows={2} placeholder="Describe the reason for visit..." />
              </Form.Item>
            </SectionCard>
          </Col>

          {/* Right Column */}
          <Col xs={24} lg={12}>
            {/* Medical Information */}
            <SectionCard title={<><MedicineBoxOutlined /> Medical Information</>}>
              <Form.Item name="allergies" label="Known Allergies">
                <Input placeholder="e.g. Penicillin, Sulfa" />
              </Form.Item>
              <Form.Item name="preExistingConditions" label="Pre-existing Conditions">
                <Input placeholder="e.g. Diabetes, Hypertension" />
              </Form.Item>
              <Form.Item name="currentMedications" label="Current Medications">
                <Input placeholder="e.g. Metformin 500mg" />
              </Form.Item>
            </SectionCard>

            {/* Emergency Contact */}
            <SectionCard title={<><HeartOutlined style={{ color: '#EF4444' }} /> Emergency Contact</>}>
              <Form.Item
                name={['emergencyContact', 'name']}
                label="Contact Name"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input placeholder="Full name" />
              </Form.Item>
              <Form.Item
                name={['emergencyContact', 'relationship']}
                label="Relationship"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Select placeholder="Select relationship">
                  <Option value="spouse">Spouse</Option>
                  <Option value="parent">Parent</Option>
                  <Option value="child">Child</Option>
                  <Option value="sibling">Sibling</Option>
                  <Option value="friend">Friend</Option>
                  <Option value="other">Other</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name={['emergencyContact', 'phone']}
                label="Phone Number"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input prefix={<PhoneOutlined />} placeholder="+91 XXXXX XXXXX" />
              </Form.Item>
            </SectionCard>

            {/* Insurance & Payment */}
            <SectionCard title={<><DollarOutlined /> Insurance & Payment</>}>
              <Form.Item name="paymentMode" label="Payment Mode">
                <Select placeholder="Select payment mode">
                  <Option value="cash">Cash</Option>
                  <Option value="card">Card</Option>
                  <Option value="upi">UPI</Option>
                  <Option value="insurance">Insurance</Option>
                  <Option value="corporate">Corporate</Option>
                </Select>
              </Form.Item>
              <Form.Item name="insuranceProvider" label="Insurance Provider">
                <Input placeholder="e.g. Star Health" />
              </Form.Item>
              <Form.Item name="policyNumber" label="Policy Number">
                <Input placeholder="Enter policy number" />
              </Form.Item>
            </SectionCard>

            {/* Registration Summary */}
            <RegistrationCard title={<><IdcardOutlined /> Registration</>}>
              <div className="registration-info">
                <div className="info-item">
                  <span className="label">Registration Type:</span>
                  <Tag color="cyan">OPD Walk-in</Tag>
                </div>
                <div className="info-item">
                  <span>Token will be generated automatically</span>
                </div>
                <div className="info-item">
                  <span>Patient ID: Auto-assigned on save</span>
                </div>
              </div>
              <Divider style={{ margin: '16px 0' }} />
              <ActionButton
                className="primary-action"
                block
                onClick={() => form.submit()}
                loading={saving}
                icon={<SaveOutlined />}
              >
                Register Patient & Generate Token
              </ActionButton>
              <div style={{ marginTop: 12, textAlign: 'center' }}>
                <Button type="link" onClick={handleReset}>
                  Reset Form
                </Button>
              </div>
            </RegistrationCard>
          </Col>
        </Row>
      </Form>
    </PageContainer>
  );
};

export default PatientRegistration;
