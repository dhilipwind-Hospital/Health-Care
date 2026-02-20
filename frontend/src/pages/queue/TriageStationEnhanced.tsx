import React, { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Table,
  Space,
  Typography,
  Tag,
  Form,
  InputNumber,
  Input,
  Select,
  message,
  Row,
  Col,
  Divider,
  Empty,
  Spin,
  Radio,
} from 'antd';
import {
  UserOutlined,
  HeartOutlined,
  FileTextOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import {
  callNext,
  getQueue,
  getTriage,
  saveTriage,
  advanceVisit,
  serveQueueItem,
  skipQueueItem,
  getAvailableDoctors,
  callQueueItem,
} from '../../services/queue.service';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

// Styled Components
const PageContainer = styled.div`
  background: #F8FAFC;
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
  
  .subtitle {
    color: #666;
    font-size: 14px;
  }
`;

const CurrentTokenBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #E0F2FE;
  padding: 8px 16px;
  border-radius: 8px;
  
  .label {
    color: #0369A1;
    font-size: 14px;
  }
  
  .token {
    color: #0EA5E9;
    font-weight: 600;
    font-size: 16px;
  }
`;

const PatientCard = styled(Card)`
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(30, 58, 95, 0.08);
  
  .ant-card-body {
    padding: 20px;
  }
  
  .patient-info {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #E0F2FE;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #1E3A5F;
      font-size: 20px;
    }
    
    .details {
      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #1a1a2e;
      }
      
      .meta {
        color: #666;
        font-size: 13px;
      }
    }
  }
`;

const ContentCard = styled(Card)`
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

const VitalsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  
  .vital-item {
    .label {
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }
    
    .ant-input-number {
      width: 100%;
    }
  }
`;

const PriorityCard = styled(Card)`
  border-radius: 12px;
  border: 1px solid rgba(30, 58, 95, 0.1);
  box-shadow: 0 2px 8px rgba(30, 58, 95, 0.06);
  margin-bottom: 16px;
  
  .ant-card-head {
    border-bottom: 1px solid rgba(30, 58, 95, 0.08);
    padding: 12px 20px;
    min-height: auto;
    border-left: 4px solid #1E3A5F;
    
    .ant-card-head-title {
      font-size: 14px;
      font-weight: 600;
      color: #1E3A5F;
    }
  }
  
  .ant-card-body {
    padding: 16px 20px;
  }
`;

const PriorityOption = styled.div<{ $selected?: boolean; $color: string }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 8px;
  border: 2px solid ${props => props.$selected ? props.$color : 'transparent'};
  background: ${props => props.$selected ? `${props.$color}10` : '#fff'};
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => `${props.$color}10`};
  }
  
  .indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${props => props.$color};
  }
  
  .content {
    flex: 1;
    
    .title {
      font-weight: 600;
      color: ${props => props.$color};
      font-size: 14px;
    }
    
    .description {
      font-size: 12px;
      color: #666;
    }
  }
`;

const QuickActionsCard = styled(Card)`
  border-radius: 12px;
  border: 1px solid rgba(30, 58, 95, 0.1);
  box-shadow: 0 2px 8px rgba(30, 58, 95, 0.06);
  
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
`;

const ActionButton = styled(Button)`
  height: 40px;
  border-radius: 8px;
  font-weight: 500;
  
  &.primary-action {
    background: #0EA5E9;
    border-color: #0EA5E9;
    color: #fff;
    
    &:hover {
      background: #0284C7;
      border-color: #0284C7;
    }
  }
  
  &.secondary-action {
    background: #fff;
    border-color: #1E3A5F;
    color: #1E3A5F;
    
    &:hover {
      background: #E0F2FE;
      border-color: #1E3A5F;
    }
  }
  
  &.complete-action {
    background: #10B981;
    border-color: #10B981;
    color: #fff;
    height: 48px;
    font-size: 15px;
    width: 100%;
    
    &:hover {
      background: #059669;
      border-color: #059669;
    }
  }
`;

const WaitingListCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(30, 58, 95, 0.08);
  
  .ant-card-head {
    border-bottom: 1px solid rgba(30, 58, 95, 0.08);
  }
`;

const priorityOptions = [
  { value: 'emergency', label: 'Emergency', description: 'Life-threatening, immediate care', color: '#EF4444' },
  { value: 'critical', label: 'Critical', description: 'Severe condition, urgent attention', color: '#F97316' },
  { value: 'urgent', label: 'Urgent', description: 'Needs attention within 30 min', color: '#F59E0B' },
  { value: 'semi-urgent', label: 'Semi-Urgent', description: 'Can wait up to 60 min', color: '#EAB308' },
  { value: 'standard', label: 'Routine', description: 'Non-urgent, standard queue', color: '#10B981' },
];

const TriageStationEnhanced: React.FC = () => {
  const [queue, setQueue] = useState<any[]>([]);
  const [current, setCurrent] = useState<any | null>(null);
  const [patient, setPatient] = useState<any | null>(null);
  const [triage, setTriage] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedPriority, setSelectedPriority] = useState('standard');

  const fetchQueue = async () => {
    try {
      const items = await getQueue('triage');
      setQueue(items || []);
    } catch (_) {}
  };

  useEffect(() => {
    fetchQueue();
    getAvailableDoctors().then(setDoctors).catch(() => setDoctors([]));
    const t = setInterval(fetchQueue, 5000);
    return () => clearInterval(t);
  }, []);

  const onCallNext = async () => {
    try {
      setLoading(true);
      const item = await callNext('triage');
      if (!item) {
        message.info('No patients waiting');
        return;
      }
      setCurrent(item);
      
      // Load patient details
      if (item.visit?.patient) {
        setPatient(item.visit.patient);
      } else if (item.visit?.patientId) {
        try {
          const res = await api.get(`/users/${item.visit.patientId}`);
          setPatient(res.data);
        } catch (e) {
          console.error('Failed to load patient:', e);
        }
      }
      
      const tri = await getTriage(item.visitId);
      setTriage(tri);
      setSelectedPriority(tri?.priority || 'standard');
      form.setFieldsValue({
        systolic: tri?.vitals?.systolic,
        diastolic: tri?.vitals?.diastolic,
        heartRate: tri?.vitals?.heartRate,
        temperature: tri?.vitals?.temperature,
        spo2: tri?.vitals?.spo2,
        respiratoryRate: tri?.vitals?.respiratoryRate,
        weight: tri?.vitals?.weight,
        height: tri?.vitals?.height,
        painScale: tri?.painScale,
        chiefComplaint: tri?.symptoms,
        briefHistory: tri?.notes,
        allergies: tri?.allergies,
        currentMeds: tri?.currentMeds,
        nurseNotes: tri?.nurseNotes,
        doctorId: tri?.doctorId,
      });
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to call next');
    } finally {
      setLoading(false);
    }
  };

  const onCallThis = async (r: any) => {
    try {
      setLoading(true);
      const item = await callQueueItem(r.id);
      if (!item) {
        message.info('Item not available');
        return;
      }
      setCurrent(item);
      
      // Load patient details
      if (item.visit?.patient) {
        setPatient(item.visit.patient);
      } else if (item.visit?.patientId) {
        try {
          const res = await api.get(`/users/${item.visit.patientId}`);
          setPatient(res.data);
        } catch (e) {
          console.error('Failed to load patient:', e);
        }
      }
      
      const tri = await getTriage(item.visitId);
      setTriage(tri);
      setSelectedPriority(tri?.priority || 'standard');
      form.setFieldsValue({
        systolic: tri?.vitals?.systolic,
        diastolic: tri?.vitals?.diastolic,
        heartRate: tri?.vitals?.heartRate,
        temperature: tri?.vitals?.temperature,
        spo2: tri?.vitals?.spo2,
        respiratoryRate: tri?.vitals?.respiratoryRate,
        weight: tri?.vitals?.weight,
        height: tri?.vitals?.height,
        painScale: tri?.painScale,
        chiefComplaint: tri?.symptoms,
        briefHistory: tri?.notes,
        allergies: tri?.allergies,
        currentMeds: tri?.currentMeds,
        nurseNotes: tri?.nurseNotes,
        doctorId: tri?.doctorId,
      });
      fetchQueue();
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to call this patient');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVitals = async () => {
    if (!current?.visitId) return;
    try {
      setSaving(true);
      const vals = form.getFieldsValue();
      const payload = {
        vitals: {
          temperature: vals.temperature,
          systolic: vals.systolic,
          diastolic: vals.diastolic,
          heartRate: vals.heartRate,
          spo2: vals.spo2,
          respiratoryRate: vals.respiratoryRate,
          weight: vals.weight,
          height: vals.height,
        },
        symptoms: vals.chiefComplaint,
        allergies: vals.allergies,
        currentMeds: vals.currentMeds,
        painScale: vals.painScale,
        priority: selectedPriority,
        notes: vals.briefHistory,
        nurseNotes: vals.nurseNotes,
      };
      await saveTriage(current.visitId, payload);
      message.success('Vitals saved successfully');
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to save vitals');
    } finally {
      setSaving(false);
    }
  };

  const handleOrderLabTest = async () => {
    if (!patient?.id) {
      message.error('No patient selected');
      return;
    }
    message.info('Redirecting to lab order...');
    window.location.href = `/laboratory/order?patientId=${patient.id}`;
  };

  const handleSkip = async () => {
    if (!current?.id) return;
    try {
      await skipQueueItem(current.id);
      message.info('Skipped current patient');
      resetForm();
      fetchQueue();
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to skip');
    }
  };

  const handleCompleteAndSendToDoctor = async () => {
    if (!current?.visitId) return;
    try {
      setSaving(true);
      const vals = form.getFieldsValue();
      const payload = {
        vitals: {
          temperature: vals.temperature,
          systolic: vals.systolic,
          diastolic: vals.diastolic,
          heartRate: vals.heartRate,
          spo2: vals.spo2,
          respiratoryRate: vals.respiratoryRate,
          weight: vals.weight,
          height: vals.height,
        },
        symptoms: vals.chiefComplaint,
        allergies: vals.allergies,
        currentMeds: vals.currentMeds,
        painScale: vals.painScale,
        priority: selectedPriority,
        notes: vals.briefHistory,
        nurseNotes: vals.nurseNotes,
      };
      await saveTriage(current.visitId, payload);
      await advanceVisit(current.visitId, 'doctor', vals?.doctorId);
      try {
        await serveQueueItem(current.id);
      } catch {}
      message.success('Triage completed - Patient sent to Doctor');
      resetForm();
      fetchQueue();
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to complete triage');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setCurrent(null);
    setPatient(null);
    setTriage(null);
    setSelectedPriority('standard');
    form.resetFields();
  };

  const calculateAge = (dob: string) => {
    if (!dob) return 'N/A';
    return dayjs().diff(dayjs(dob), 'year');
  };

  const statusColor = (s: string) =>
    s === 'served' ? 'green' : s === 'called' ? 'gold' : s === 'skipped' ? 'volcano' : 'blue';

  const columns = [
    {
      title: 'Token',
      dataIndex: 'tokenNumber',
      key: 'token',
      render: (t: string) => <Tag color="blue">{t}</Tag>,
    },
    {
      title: 'Patient',
      key: 'patient',
      render: (_: any, r: any) => {
        const p = r?.visit?.patient || {};
        const name = `${p.firstName || ''} ${p.lastName || ''}`.trim();
        return name || '-';
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (p: string) => (
        <Tag color={p === 'emergency' ? 'red' : p === 'urgent' ? 'orange' : 'green'}>
          {p || 'standard'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Waiting', value: 'waiting' },
        { text: 'Called', value: 'called' },
        { text: 'Served', value: 'served' },
        { text: 'Skipped', value: 'skipped' },
      ],
      onFilter: (v: any, r: any) => r.status === v,
      render: (s: string) => <Tag color={statusColor(s)}>{s}</Tag>,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, r: any) => (
        <Button size="small" onClick={() => onCallThis(r)} disabled={r.status === 'called'}>
          Call This
        </Button>
      ),
    },
  ];

  // Show waiting list if no current patient
  if (!current) {
    return (
      <PageContainer>
        <PageHeader>
          <div>
            <h2>Triage Station</h2>
            <div className="subtitle">Vital Signs Recording & Priority Assessment</div>
          </div>
          <Button type="primary" onClick={onCallNext} loading={loading} size="large">
            Call Next
          </Button>
        </PageHeader>

        <WaitingListCard title="Waiting List">
          <Table
            rowKey="id"
            dataSource={queue}
            columns={columns}
            pagination={{ pageSize: 10 }}
            loading={loading}
          />
        </WaitingListCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        <div>
          <h2>Triage Station</h2>
          <div className="subtitle">Vital Signs Recording & Priority Assessment</div>
        </div>
        {current && (
          <CurrentTokenBadge>
            <UserOutlined />
            <span className="label">Current:</span>
            <span className="token">Token #{current.tokenNumber}</span>
          </CurrentTokenBadge>
        )}
      </PageHeader>

      {/* Patient Info Card */}
      <PatientCard>
        <div className="patient-info">
          <div className="avatar">
            <UserOutlined />
          </div>
          <div className="details">
            <h3>
              {patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient'}
            </h3>
            <div className="meta">
              {patient && (
                <>
                  {calculateAge(patient.dateOfBirth)} yrs • {patient.gender} • {patient.bloodGroup || 'N/A'} • PAT-{patient.id?.slice(-10).toUpperCase()}
                </>
              )}
            </div>
          </div>
        </div>
      </PatientCard>

      <Form form={form} layout="vertical">
        <Row gutter={24}>
          {/* Left Column - Vitals & History */}
          <Col xs={24} lg={16}>
            {/* Vital Signs Recording */}
            <ContentCard title={<><HeartOutlined /> Vital Signs Recording</>}>
              <VitalsGrid>
                <div className="vital-item">
                  <div className="label">BP Systolic (mmHg)</div>
                  <Form.Item name="systolic" noStyle>
                    <InputNumber min={60} max={250} placeholder="120" style={{ width: '100%' }} />
                  </Form.Item>
                </div>
                <div className="vital-item">
                  <div className="label">BP Diastolic (mmHg)</div>
                  <Form.Item name="diastolic" noStyle>
                    <InputNumber min={40} max={150} placeholder="80" style={{ width: '100%' }} />
                  </Form.Item>
                </div>
                <div className="vital-item">
                  <div className="label">Heart Rate (bpm)</div>
                  <Form.Item name="heartRate" noStyle>
                    <InputNumber min={30} max={220} placeholder="72" style={{ width: '100%' }} />
                  </Form.Item>
                </div>
                <div className="vital-item">
                  <div className="label">Temp (°F)</div>
                  <Form.Item name="temperature" noStyle>
                    <InputNumber min={90} max={110} step={0.1} placeholder="98.6" style={{ width: '100%' }} />
                  </Form.Item>
                </div>
                <div className="vital-item">
                  <div className="label">SpO2 (%)</div>
                  <Form.Item name="spo2" noStyle>
                    <InputNumber min={50} max={100} placeholder="98" style={{ width: '100%' }} />
                  </Form.Item>
                </div>
                <div className="vital-item">
                  <div className="label">Resp. Rate (/min)</div>
                  <Form.Item name="respiratoryRate" noStyle>
                    <InputNumber min={8} max={60} placeholder="16" style={{ width: '100%' }} />
                  </Form.Item>
                </div>
                <div className="vital-item">
                  <div className="label">Weight (kg)</div>
                  <Form.Item name="weight" noStyle>
                    <InputNumber min={1} max={500} placeholder="55" style={{ width: '100%' }} />
                  </Form.Item>
                </div>
                <div className="vital-item">
                  <div className="label">Height (cm)</div>
                  <Form.Item name="height" noStyle>
                    <InputNumber min={30} max={250} placeholder="162" style={{ width: '100%' }} />
                  </Form.Item>
                </div>
                <div className="vital-item">
                  <div className="label">Pain Scale (0-10)</div>
                  <Form.Item name="painScale" noStyle>
                    <InputNumber min={0} max={10} placeholder="4" style={{ width: '100%' }} />
                  </Form.Item>
                </div>
              </VitalsGrid>
            </ContentCard>

            {/* Chief Complaint & History */}
            <ContentCard title={<><FileTextOutlined /> Chief Complaint & History</>}>
              <Form.Item label="Chief Complaint" name="chiefComplaint">
                <TextArea rows={2} placeholder="Fever and body ache for 3 days" />
              </Form.Item>
              <Form.Item label="Brief History" name="briefHistory">
                <TextArea
                  rows={3}
                  placeholder="Patient reports high fever (102°F at home), body pain, and mild headache. No vomiting or diarrhea."
                />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Known Allergies" name="allergies">
                    <Input placeholder="Penicillin" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Current Medications" name="currentMeds">
                    <Input placeholder="Paracetamol 500mg" />
                  </Form.Item>
                </Col>
              </Row>
            </ContentCard>
          </Col>

          {/* Right Column - Priority & Actions */}
          <Col xs={24} lg={8}>
            {/* Triage Priority */}
            <PriorityCard title="Triage Priority">
              <div style={{ marginBottom: 8, color: '#666', fontSize: 12 }}>Select Priority Level</div>
              {priorityOptions.map((opt) => (
                <PriorityOption
                  key={opt.value}
                  $selected={selectedPriority === opt.value}
                  $color={opt.color}
                  onClick={() => setSelectedPriority(opt.value)}
                >
                  <div className="indicator" />
                  <div className="content">
                    <div className="title">{opt.label}</div>
                    <div className="description">{opt.description}</div>
                  </div>
                </PriorityOption>
              ))}
            </PriorityCard>

            {/* Nurse Notes */}
            <ContentCard title={<><EditOutlined /> Nurse Notes</>}>
              <Form.Item label="Triage Observations" name="nurseNotes">
                <TextArea
                  rows={4}
                  placeholder="Patient alert and oriented. Mild distress due to fever. No..."
                />
              </Form.Item>
            </ContentCard>

            {/* Quick Actions */}
            <QuickActionsCard title={<><span>⚡</span> Quick Actions</>}>
              <Space style={{ width: '100%', marginBottom: 12 }} wrap>
                <ActionButton className="primary-action" onClick={handleSaveVitals} loading={saving}>
                  Save Vitals
                </ActionButton>
                <ActionButton className="secondary-action" onClick={() => {}}>
                  Assign Doctor
                </ActionButton>
              </Space>
              <Space style={{ width: '100%', marginBottom: 16 }} wrap>
                <ActionButton className="secondary-action" onClick={handleOrderLabTest}>
                  Order Lab Tests
                </ActionButton>
                <ActionButton className="secondary-action" onClick={handleSkip}>
                  Skip Patient
                </ActionButton>
              </Space>
              
              <Form.Item label="Assign Doctor (optional)" name="doctorId" style={{ marginBottom: 16 }}>
                <Select
                  placeholder="Select doctor"
                  allowClear
                  options={(doctors || []).map((d: any) => ({
                    value: d.id,
                    label: `${d.firstName || ''} ${d.lastName || ''}${d.department ? ' — ' + d.department : ''}`.trim(),
                  }))}
                />
              </Form.Item>

              <ActionButton
                className="complete-action"
                onClick={handleCompleteAndSendToDoctor}
                loading={saving}
                icon={<CheckCircleOutlined />}
              >
                Complete Triage & Send to Doctor
              </ActionButton>
            </QuickActionsCard>
          </Col>
        </Row>
      </Form>
    </PageContainer>
  );
};

export default TriageStationEnhanced;
