import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Select,
  DatePicker,
  Typography,
  Space,
  message,
  Upload,
  Avatar,
  Row,
  Col,
  Divider,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  SaveOutlined,
  UploadOutlined,
  MedicineBoxOutlined,
  HeartOutlined,
  DollarOutlined,
  IdcardOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import dayjs from 'dayjs';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

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
  
  h2 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: #1E3A5F;
  }
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  
  .avatar-section {
    position: relative;
    
    .upload-overlay {
      position: absolute;
      bottom: 0;
      right: 0;
      background: #1E3A5F;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #fff;
      
      &:hover {
        background: #2D4A6F;
      }
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

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
];

const MyProfileEnhanced: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatar, setAvatar] = useState<string | undefined>();
  const { user } = useAuth();

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/me');
      const me = res.data || {};
      setAvatar(me.profileImage);
      form.setFieldsValue({
        ...me,
        dateOfBirth: me.dateOfBirth ? dayjs(me.dateOfBirth, 'YYYY-MM-DD') : undefined,
      });
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onFinish = async (values: any) => {
    try {
      setSaving(true);
      const payload = {
        ...values,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : undefined,
      };
      await api.patch('/users/me', payload);
      message.success('Profile updated successfully');
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const beforeUpload = async (file: File) => {
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('photo', file);
      const res = await api.post('/users/me/photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } } as any);
      setAvatar(res.data?.photoUrl);
      message.success('Photo uploaded');
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
    return false as any;
  };

  const displayPid = () => {
    const raw = String((user as any)?.id || '');
    const tail = raw.replace(/-/g, '').slice(-6).toUpperCase();
    const sub = String((user as any)?.organization?.subdomain || 'AYPHEN').toUpperCase();
    return `PID-${sub}-${tail}`;
  };

  return (
    <PageContainer>
      <PageHeader>
        <h2>My Profile</h2>
        <Space>
          <Upload showUploadList={false} beforeUpload={beforeUpload} accept="image/*">
            <Button icon={<UploadOutlined />} loading={uploading}>Upload Photo</Button>
          </Upload>
          <Avatar size={48} src={avatar} icon={<UserOutlined />} />
        </Space>
      </PageHeader>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ gender: undefined }}
      >
        <Row gutter={24}>
          {/* Left Column */}
          <Col xs={24} lg={12}>
            {/* Personal Information */}
            <SectionCard title={<><UserOutlined /> Personal Information</>} loading={loading}>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="firstName"
                    label="First Name"
                    rules={[{ required: true, message: 'Required' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="First name" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="lastName"
                    label="Last Name"
                    rules={[{ required: true, message: 'Required' }]}
                  >
                    <Input placeholder="Last name" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="email" label="Email">
                    <Input prefix={<MailOutlined />} placeholder="Email" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="phone"
                    label="Phone"
                    rules={[{ required: true, message: 'Required' }]}
                  >
                    <Input prefix={<PhoneOutlined />} placeholder="+91 XXXXX XXXXX" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item name="dateOfBirth" label="Date of Birth">
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="gender" label="Gender">
                    <Select placeholder="Select">
                      <Option value="male">Male</Option>
                      <Option value="female">Female</Option>
                      <Option value="other">Other</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="bloodGroup" label="Blood Group">
                    <Select placeholder="Select">
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
              <Form.Item name="maritalStatus" label="Marital Status">
                <Select placeholder="Select" style={{ maxWidth: 200 }}>
                  <Option value="single">Single</Option>
                  <Option value="married">Married</Option>
                  <Option value="divorced">Divorced</Option>
                  <Option value="widowed">Widowed</Option>
                </Select>
              </Form.Item>
            </SectionCard>

            {/* Address */}
            <SectionCard title={<><HomeOutlined /> Address</>} loading={loading}>
              <Form.Item name="address" label="Address Line 1">
                <Input placeholder="House/Flat No., Street Name" />
              </Form.Item>
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item name="city" label="City">
                    <Input placeholder="City" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="state" label="State">
                    <Select placeholder="Select" showSearch>
                      {indianStates.map((s) => (
                        <Option key={s} value={s}>{s}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="postalCode" label="PIN Code">
                    <Input placeholder="6-digit PIN" maxLength={6} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="country" label="Country">
                <Select placeholder="Select" style={{ maxWidth: 200 }}>
                  <Option value="India">India</Option>
                  <Option value="USA">United States</Option>
                  <Option value="UK">United Kingdom</Option>
                  <Option value="UAE">UAE</Option>
                </Select>
              </Form.Item>
            </SectionCard>

            {/* Identification */}
            <SectionCard title={<><IdcardOutlined /> Identification</>} loading={loading}>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="aadhaarNumber" label="Aadhaar Number">
                    <Input placeholder="12-digit Aadhaar" maxLength={12} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="abhaId" label="ABHA ID">
                    <Input placeholder="ABHA Health ID" />
                  </Form.Item>
                </Col>
              </Row>
            </SectionCard>
          </Col>

          {/* Right Column */}
          <Col xs={24} lg={12}>
            {/* Medical Information */}
            <SectionCard title={<><MedicineBoxOutlined /> Medical Information</>} loading={loading}>
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
            <SectionCard title={<><HeartOutlined style={{ color: '#EF4444' }} /> Emergency Contact</>} loading={loading}>
              <Form.Item name={['emergencyContact', 'name']} label="Contact Name">
                <Input placeholder="Full name" />
              </Form.Item>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name={['emergencyContact', 'relationship']} label="Relationship">
                    <Select placeholder="Select">
                      <Option value="spouse">Spouse</Option>
                      <Option value="parent">Parent</Option>
                      <Option value="child">Child</Option>
                      <Option value="sibling">Sibling</Option>
                      <Option value="friend">Friend</Option>
                      <Option value="other">Other</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name={['emergencyContact', 'phone']} label="Phone Number">
                    <Input prefix={<PhoneOutlined />} placeholder="+91 XXXXX XXXXX" />
                  </Form.Item>
                </Col>
              </Row>
            </SectionCard>

            {/* Insurance */}
            <SectionCard title={<><DollarOutlined /> Insurance Information</>} loading={loading}>
              <Form.Item name="insuranceProvider" label="Insurance Provider">
                <Input placeholder="e.g. Star Health" />
              </Form.Item>
              <Form.Item name="policyNumber" label="Policy Number">
                <Input placeholder="Enter policy number" />
              </Form.Item>
            </SectionCard>

            {/* Patient ID Display */}
            <SectionCard>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text type="secondary">Patient ID</Text>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#1E3A5F' }}>
                    {displayPid()}
                  </div>
                </div>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={() => form.submit()}
                  loading={saving}
                  size="large"
                  style={{ background: '#10B981', borderColor: '#10B981' }}
                >
                  Save
                </Button>
              </div>
            </SectionCard>
          </Col>
        </Row>
      </Form>
    </PageContainer>
  );
};

export default MyProfileEnhanced;
