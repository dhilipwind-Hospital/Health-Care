import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Button,
  Input,
  Select,
  Row,
  Col,
  Typography,
  Tag,
  Space,
  message,
  Modal,
  Form,
  DatePicker,
  Table,
  Avatar,
  Divider,
  Spin,
  Empty,
} from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
  ExperimentOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  PlusOutlined,
  EditOutlined,
  HistoryOutlined,
  HeartOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getQueue, callNext, getTriage, callQueueItem } from '../../services/queue.service';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import dayjs from 'dayjs';
import styled from 'styled-components';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Styled Components
const DashboardContainer = styled.div`
  background: #F8FAFC;
  min-height: 100vh;
  padding: 24px;
`;

const PatientHeader = styled.div`
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(30, 58, 95, 0.08);
`;

const PatientInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  
  .avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #E0F2FE;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1E3A5F;
    font-size: 24px;
  }
  
  .details {
    h3 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #1a1a2e;
      
      .patient-id {
        font-size: 12px;
        background: #E0F2FE;
        color: #1E3A5F;
        padding: 2px 8px;
        border-radius: 4px;
        margin-left: 8px;
        font-weight: 500;
      }
    }
    
    .meta {
      color: #666;
      font-size: 14px;
      margin-top: 4px;
    }
  }
`;

const AllergyBadge = styled.div`
  background: #FEF3C7;
  border: 1px solid #F59E0B;
  border-radius: 8px;
  padding: 12px 16px;
  
  .label {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #D97706;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 4px;
  }
  
  .value {
    color: #92400E;
    font-weight: 500;
  }
`;

const TabsContainer = styled.div`
  background: #fff;
  border-radius: 16px;
  padding: 8px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(30, 58, 95, 0.08);
  
  .ant-tabs-nav {
    margin-bottom: 0;
  }
  
  .ant-tabs-tab {
    padding: 12px 24px;
    font-weight: 500;
    
    &.ant-tabs-tab-active {
      background: #E0F2FE;
      border-radius: 8px;
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

const VitalsDisplay = styled.div`
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
  
  .vital-item {
    .label {
      font-size: 11px;
      color: #888;
      text-transform: uppercase;
    }
    
    .value {
      font-size: 18px;
      font-weight: 600;
      color: #10B981;
      
      &.warning {
        color: #F59E0B;
      }
      
      &.danger {
        color: #EF4444;
      }
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
  height: 44px;
  border-radius: 8px;
  font-weight: 500;
  width: 100%;
  margin-bottom: 12px;
  
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
    background: #E0F2FE;
    border-color: #BAE6FD;
    color: #0369A1;
    
    &:hover {
      background: #BAE6FD;
      border-color: #7DD3FC;
    }
  }
  
  &.complete-action {
    background: #10B981;
    border-color: #10B981;
    color: #fff;
    height: 48px;
    font-size: 15px;
    
    &:hover {
      background: #059669;
      border-color: #059669;
    }
  }
`;

// ICD-10 Diagnosis options (sample)
const diagnosisOptions = [
  { value: 'I20.0', label: 'Unstable Angina (I20.0)' },
  { value: 'I25.1', label: 'Atherosclerotic Heart Disease (I25.1)' },
  { value: 'J06.9', label: 'Acute Upper Respiratory Infection (J06.9)' },
  { value: 'J18.9', label: 'Pneumonia (J18.9)' },
  { value: 'E11.9', label: 'Type 2 Diabetes Mellitus (E11.9)' },
  { value: 'I10', label: 'Essential Hypertension (I10)' },
  { value: 'M54.5', label: 'Low Back Pain (M54.5)' },
  { value: 'K21.0', label: 'GERD with Esophagitis (K21.0)' },
  { value: 'N39.0', label: 'Urinary Tract Infection (N39.0)' },
  { value: 'R51', label: 'Headache (R51)' },
];

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup?: string;
  phone?: string;
  allergies?: string;
}

interface Vitals {
  temperature?: number;
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  spo2?: number;
  weight?: number;
  height?: number;
}

interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  vitals?: Vitals;
  diagnosis?: string;
}

interface LabOrder {
  id: string;
  testName: string;
  status: string;
  orderedAt: string;
  result?: string;
}

interface Prescription {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  status: string;
}

const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const patientIdParam = searchParams.get('patientId');
  const appointmentIdParam = searchParams.get('appointmentId');
  
  const [activeTab, setActiveTab] = useState('soap');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Patient data
  const [patient, setPatient] = useState<Patient | null>(null);
  const [vitals, setVitals] = useState<Vitals>({
    systolic: 140,
    diastolic: 90,
    heartRate: 110,
    temperature: 98.6,
  });
  
  // SOAP Note data
  const [soapNote, setSoapNote] = useState<SOAPNote>({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    diagnosis: '',
  });
  
  // Orders & History
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [consultationHistory, setConsultationHistory] = useState<any[]>([]);
  
  // Modals
  const [prescriptionModalVisible, setPrescriptionModalVisible] = useState(false);
  const [labOrderModalVisible, setLabOrderModalVisible] = useState(false);
  const [admitModalVisible, setAdmitModalVisible] = useState(false);
  const [followUpModalVisible, setFollowUpModalVisible] = useState(false);
  const [patientSelectModalVisible, setPatientSelectModalVisible] = useState(false);
  
  // Queue data
  const [queue, setQueue] = useState<any[]>([]);
  const [currentQueueItem, setCurrentQueueItem] = useState<any>(null);
  const [triageData, setTriageData] = useState<any>(null);
  const [patientSearchResults, setPatientSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const [prescriptionForm] = Form.useForm();
  const [labOrderForm] = Form.useForm();
  const [admitForm] = Form.useForm();
  const [followUpForm] = Form.useForm();

  const doctorId = (user as any)?.id;

  // Fetch queue on mount
  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (patientIdParam) {
      loadPatientData(patientIdParam);
    }
    if (appointmentIdParam) {
      loadAppointmentData(appointmentIdParam);
    }
  }, [patientIdParam, appointmentIdParam]);

  const fetchQueue = async () => {
    try {
      const items = await getQueue('doctor', doctorId);
      setQueue(items || []);
      
      // Auto-recover active session
      const active = items?.find((i: any) => i.status === 'called' && i.assignedDoctorId === doctorId);
      if (active && !patient) {
        setCurrentQueueItem(active);
        if (active.visit?.patient) {
          loadPatientData(active.visit.patient.id);
        }
        if (active.visitId) {
          const tri = await getTriage(active.visitId);
          setTriageData(tri);
          if (tri?.vitals) {
            setVitals(tri.vitals);
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch queue:', e);
    }
  };

  const handleCallNext = async () => {
    try {
      const item = await callNext('doctor', doctorId);
      if (!item) {
        message.info('No patients waiting in queue');
        return;
      }
      setCurrentQueueItem(item);
      if (item.visit?.patient) {
        await loadPatientData(item.visit.patient.id);
      }
      if (item.visitId) {
        const tri = await getTriage(item.visitId);
        setTriageData(tri);
        if (tri?.vitals) {
          setVitals(tri.vitals);
        }
        if (tri?.symptoms) {
          setSoapNote(prev => ({ ...prev, subjective: tri.symptoms }));
        }
        if (tri?.allergies) {
          setPatient(prev => prev ? { ...prev, allergies: tri.allergies } : prev);
        }
      }
      message.success(`Called patient: ${item.tokenNumber}`);
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to call next patient');
    }
  };

  const handleSelectFromQueue = async (queueItem: any) => {
    try {
      const item = await callQueueItem(queueItem.id);
      if (!item) {
        message.error('Patient not available');
        return;
      }
      setCurrentQueueItem(item);
      if (item.visit?.patient) {
        await loadPatientData(item.visit.patient.id);
      }
      if (item.visitId) {
        const tri = await getTriage(item.visitId);
        setTriageData(tri);
        if (tri?.vitals) {
          setVitals(tri.vitals);
        }
      }
      setPatientSelectModalVisible(false);
      message.success(`Selected patient: ${item.tokenNumber}`);
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to select patient');
    }
  };

  const handleSearchPatients = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setPatientSearchResults([]);
      return;
    }
    try {
      setSearchLoading(true);
      const res = await api.get(`/users?search=${searchTerm}&role=patient&limit=10`);
      setPatientSearchResults(res.data?.data || res.data || []);
    } catch (e) {
      console.error('Search failed:', e);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectSearchedPatient = async (patientData: any) => {
    setPatient(patientData);
    await loadPatientData(patientData.id);
    setPatientSelectModalVisible(false);
    message.success(`Selected patient: ${patientData.firstName} ${patientData.lastName}`);
  };

  const loadPatientData = async (patientId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/users/${patientId}`);
      setPatient(res.data);
      
      // Load patient history
      try {
        const historyRes = await api.get(`/consultations/patient/${patientId}`);
        setConsultationHistory(historyRes.data?.data || []);
      } catch (e) {
        // No history
      }
      
      // Load prescriptions
      try {
        const prescRes = await api.get(`/prescriptions?patientId=${patientId}`);
        setPrescriptions(prescRes.data?.data || []);
      } catch (e) {
        // No prescriptions
      }
      
      // Load lab orders
      try {
        const labRes = await api.get(`/laboratory/orders?patientId=${patientId}`);
        setLabOrders(labRes.data?.data || []);
      } catch (e) {
        // No lab orders
      }
    } catch (error) {
      message.error('Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  const loadAppointmentData = async (appointmentId: string) => {
    try {
      const res = await api.get(`/appointments/${appointmentId}`);
      const appointment = res.data;
      if (appointment.patient) {
        setPatient(appointment.patient);
        loadPatientData(appointment.patient.id);
      }
    } catch (error) {
      console.error('Failed to load appointment:', error);
    }
  };

  const handleSaveSOAP = async () => {
    if (!patient) {
      message.error('No patient selected');
      return;
    }
    
    try {
      setSaving(true);
      const data = {
        patientId: patient.id,
        appointmentId: appointmentIdParam,
        chiefComplaint: soapNote.subjective,
        physicalExamination: soapNote.objective,
        assessment: soapNote.assessment,
        plan: soapNote.plan,
        vitals: vitals,
      };
      
      await api.post('/consultations', data);
      message.success('SOAP notes saved successfully');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save SOAP notes');
    } finally {
      setSaving(false);
    }
  };

  const handleWritePrescription = async (values: any) => {
    if (!patient) {
      message.error('No patient selected');
      return;
    }
    
    try {
      const data = {
        patientId: patient.id,
        medications: [{
          name: values.medication,
          dosage: values.dosage,
          frequency: values.frequency,
          duration: values.duration,
          instructions: values.instructions,
        }],
        notes: values.notes,
      };
      
      await api.post('/prescriptions', data);
      message.success('Prescription created successfully');
      setPrescriptionModalVisible(false);
      prescriptionForm.resetFields();
      
      // Refresh prescriptions
      const prescRes = await api.get(`/prescriptions?patientId=${patient.id}`);
      setPrescriptions(prescRes.data?.data || []);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to create prescription');
    }
  };

  const handleOrderLabTest = async (values: any) => {
    if (!patient) {
      message.error('No patient selected');
      return;
    }
    
    try {
      const data = {
        patientId: patient.id,
        testType: values.testType,
        priority: values.priority || 'normal',
        notes: values.notes,
      };
      
      await api.post('/laboratory/orders', data);
      message.success('Lab test ordered successfully');
      setLabOrderModalVisible(false);
      labOrderForm.resetFields();
      
      // Refresh lab orders
      const labRes = await api.get(`/laboratory/orders?patientId=${patient.id}`);
      setLabOrders(labRes.data?.data || []);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to order lab test');
    }
  };

  const handleAdmitPatient = async (values: any) => {
    if (!patient) {
      message.error('No patient selected');
      return;
    }
    
    try {
      const data = {
        patientId: patient.id,
        admissionType: values.admissionType,
        wardType: values.wardType,
        reason: values.reason,
        notes: values.notes,
      };
      
      await api.post('/inpatient/admissions', data);
      message.success('Patient admitted successfully');
      setAdmitModalVisible(false);
      admitForm.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to admit patient');
    }
  };

  const handleScheduleFollowUp = async (values: any) => {
    if (!patient) {
      message.error('No patient selected');
      return;
    }
    
    try {
      const data = {
        patientId: patient.id,
        doctorId: user?.id,
        startTime: values.followUpDate.toISOString(),
        endTime: dayjs(values.followUpDate).add(30, 'minute').toISOString(),
        reason: values.reason || 'Follow-up consultation',
        notes: values.notes,
      };
      
      await api.post('/appointments', data);
      message.success('Follow-up scheduled successfully');
      setFollowUpModalVisible(false);
      followUpForm.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to schedule follow-up');
    }
  };

  const handleCompleteConsultation = async () => {
    if (!patient) {
      message.error('No patient selected');
      return;
    }
    
    // First save SOAP notes
    await handleSaveSOAP();
    
    // Update appointment status if exists
    if (appointmentIdParam) {
      try {
        await api.patch(`/appointments/${appointmentIdParam}`, { status: 'completed' });
      } catch (e) {
        // Ignore
      }
    }
    
    message.success('Consultation completed successfully');
    navigate('/queue/doctor');
  };

  const calculateAge = (dob: string) => {
    return dayjs().diff(dayjs(dob), 'year');
  };

  // Render Overview Tab
  const renderOverview = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={16}>
        <ContentCard title={<><UserOutlined /> Patient Summary</>}>
          {patient ? (
            <div>
              <Row gutter={16}>
                <Col span={12}>
                  <Text type="secondary">Full Name</Text>
                  <div style={{ fontWeight: 500 }}>{patient.firstName} {patient.lastName}</div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Date of Birth</Text>
                  <div style={{ fontWeight: 500 }}>{dayjs(patient.dateOfBirth).format('DD/MM/YYYY')}</div>
                </Col>
              </Row>
              <Divider style={{ margin: '12px 0' }} />
              <Row gutter={16}>
                <Col span={8}>
                  <Text type="secondary">Gender</Text>
                  <div style={{ fontWeight: 500 }}>{patient.gender}</div>
                </Col>
                <Col span={8}>
                  <Text type="secondary">Blood Group</Text>
                  <div style={{ fontWeight: 500 }}>{patient.bloodGroup || 'N/A'}</div>
                </Col>
                <Col span={8}>
                  <Text type="secondary">Phone</Text>
                  <div style={{ fontWeight: 500 }}>{patient.phone || 'N/A'}</div>
                </Col>
              </Row>
            </div>
          ) : (
            <Empty description="No patient selected" />
          )}
        </ContentCard>
        
        <ContentCard title={<><HeartOutlined /> Current Vitals</>}>
          <VitalsDisplay>
            <div className="vital-item">
              <div className="label">BP</div>
              <div className={`value ${vitals.systolic && vitals.systolic > 140 ? 'warning' : ''}`}>
                {vitals.systolic || '--'}/{vitals.diastolic || '--'}
              </div>
            </div>
            <div className="vital-item">
              <div className="label">HR</div>
              <div className={`value ${vitals.heartRate && vitals.heartRate > 100 ? 'warning' : ''}`}>
                {vitals.heartRate || '--'}
              </div>
            </div>
            <div className="vital-item">
              <div className="label">Temp</div>
              <div className="value">{vitals.temperature || '--'}°F</div>
            </div>
            <div className="vital-item">
              <div className="label">SpO2</div>
              <div className="value">{vitals.spo2 || '--'}%</div>
            </div>
          </VitalsDisplay>
        </ContentCard>
        
        <ContentCard title={<><HistoryOutlined /> Recent Consultations</>}>
          {consultationHistory.length > 0 ? (
            <Table
              dataSource={consultationHistory.slice(0, 5)}
              columns={[
                { title: 'Date', dataIndex: 'createdAt', render: (d: string) => dayjs(d).format('DD/MM/YYYY') },
                { title: 'Chief Complaint', dataIndex: 'chiefComplaint', ellipsis: true },
                { title: 'Assessment', dataIndex: 'assessment', ellipsis: true },
              ]}
              pagination={false}
              size="small"
              rowKey="id"
            />
          ) : (
            <Empty description="No consultation history" />
          )}
        </ContentCard>
      </Col>
      
      <Col xs={24} lg={8}>
        <QuickActionsCard title={<><span>⚡</span> QUICK ACTIONS</>}>
          <ActionButton
            className="primary-action"
            icon={<MedicineBoxOutlined />}
            onClick={() => setPrescriptionModalVisible(true)}
          >
            Write Prescription
          </ActionButton>
          <ActionButton
            className="secondary-action"
            icon={<ExperimentOutlined />}
            onClick={() => setLabOrderModalVisible(true)}
          >
            Order Lab Tests
          </ActionButton>
          <ActionButton
            className="secondary-action"
            icon={<PlusOutlined />}
            onClick={() => setAdmitModalVisible(true)}
          >
            Admit Patient
          </ActionButton>
          <ActionButton
            className="secondary-action"
            icon={<CalendarOutlined />}
            onClick={() => setFollowUpModalVisible(true)}
          >
            Schedule Follow-up
          </ActionButton>
          <Divider style={{ margin: '16px 0' }} />
          <ActionButton
            className="complete-action"
            icon={<CheckCircleOutlined />}
            onClick={handleCompleteConsultation}
          >
            Complete Consultation
          </ActionButton>
        </QuickActionsCard>
      </Col>
    </Row>
  );

  // Render SOAP Notes Tab
  const renderSOAPNotes = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={16}>
        <ContentCard title={<><FileTextOutlined /> SUBJECTIVE - Chief Complaint & History</>}>
          <TextArea
            rows={4}
            placeholder="Write your notes..."
            value={soapNote.subjective}
            onChange={(e) => setSoapNote({ ...soapNote, subjective: e.target.value })}
          />
        </ContentCard>
        
        <ContentCard title={<><HeartOutlined /> OBJECTIVE - Examination & Vitals</>}>
          <VitalsDisplay>
            <div className="vital-item">
              <div className="label">BP</div>
              <div className={`value ${vitals.systolic && vitals.systolic > 140 ? 'warning' : ''}`}>
                {vitals.systolic || '--'}/{vitals.diastolic || '--'}
              </div>
            </div>
            <div className="vital-item">
              <div className="label">HR</div>
              <div className={`value ${vitals.heartRate && vitals.heartRate > 100 ? 'warning' : ''}`}>
                {vitals.heartRate || '--'}
              </div>
            </div>
            <div className="vital-item">
              <div className="label">Temp</div>
              <div className="value">{vitals.temperature || '--'}°F</div>
            </div>
          </VitalsDisplay>
          <TextArea
            rows={3}
            placeholder="Write your notes..."
            value={soapNote.objective}
            onChange={(e) => setSoapNote({ ...soapNote, objective: e.target.value })}
          />
        </ContentCard>
      </Col>
      
      <Col xs={24} lg={8}>
        <ContentCard title={<><FileTextOutlined /> ASSESSMENT - Diagnosis</>}>
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Primary Diagnosis</Text>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>Primary</div>
            <Select
              style={{ width: '100%' }}
              placeholder="Select diagnosis"
              value={soapNote.diagnosis}
              onChange={(value) => setSoapNote({ ...soapNote, diagnosis: value })}
              showSearch
              optionFilterProp="label"
              options={diagnosisOptions}
            />
          </div>
        </ContentCard>
        
        <ContentCard title={<><EditOutlined /> PLAN - Treatment</>}>
          <TextArea
            rows={4}
            placeholder="Write your notes..."
            value={soapNote.plan}
            onChange={(e) => setSoapNote({ ...soapNote, plan: e.target.value })}
          />
        </ContentCard>
        
        <QuickActionsCard title={<><span>⚡</span> QUICK ACTIONS</>}>
          <ActionButton
            className="primary-action"
            icon={<MedicineBoxOutlined />}
            onClick={() => setPrescriptionModalVisible(true)}
          >
            Write Prescription
          </ActionButton>
          <ActionButton
            className="secondary-action"
            icon={<ExperimentOutlined />}
            onClick={() => setLabOrderModalVisible(true)}
          >
            Order Lab Tests
          </ActionButton>
          <ActionButton
            className="secondary-action"
            icon={<PlusOutlined />}
            onClick={() => setAdmitModalVisible(true)}
          >
            Admit Patient
          </ActionButton>
          <ActionButton
            className="secondary-action"
            icon={<CalendarOutlined />}
            onClick={() => setFollowUpModalVisible(true)}
          >
            Schedule Follow-up
          </ActionButton>
          <Divider style={{ margin: '16px 0' }} />
          <ActionButton
            className="complete-action"
            icon={<CheckCircleOutlined />}
            onClick={handleCompleteConsultation}
            loading={saving}
          >
            Complete Consultation
          </ActionButton>
        </QuickActionsCard>
      </Col>
    </Row>
  );

  // Render Orders Tab
  const renderOrders = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <ContentCard
          title={<><MedicineBoxOutlined /> Prescriptions</>}
          extra={
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setPrescriptionModalVisible(true)}>
              New
            </Button>
          }
        >
          {prescriptions.length > 0 ? (
            <Table
              dataSource={prescriptions}
              columns={[
                { title: 'Medication', dataIndex: ['medications', 0, 'name'], key: 'med' },
                { title: 'Dosage', dataIndex: ['medications', 0, 'dosage'], key: 'dosage' },
                { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={s === 'active' ? 'green' : 'default'}>{s}</Tag> },
              ]}
              pagination={false}
              size="small"
              rowKey="id"
            />
          ) : (
            <Empty description="No prescriptions" />
          )}
        </ContentCard>
      </Col>
      
      <Col xs={24} lg={12}>
        <ContentCard
          title={<><ExperimentOutlined /> Lab Orders & Results</>}
          extra={
            <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setLabOrderModalVisible(true)}>
              New
            </Button>
          }
        >
          {labOrders.length > 0 ? (
            <Table
              dataSource={labOrders}
              columns={[
                { title: 'Test', dataIndex: 'testType', key: 'test' },
                { title: 'Ordered', dataIndex: 'createdAt', render: (d: string) => dayjs(d).format('DD/MM/YYYY') },
                { 
                  title: 'Status', 
                  dataIndex: 'status', 
                  render: (s: string) => (
                    <Tag color={s === 'completed' ? 'green' : s === 'pending' ? 'orange' : s === 'in_progress' ? 'blue' : 'default'}>
                      {s === 'completed' ? 'Results Ready' : s}
                    </Tag>
                  )
                },
                {
                  title: 'Result',
                  key: 'result',
                  render: (_: any, record: any) => (
                    record.status === 'completed' && record.result ? (
                      <Button 
                        type="link" 
                        size="small"
                        onClick={() => {
                          Modal.info({
                            title: `Lab Results: ${record.testType}`,
                            width: 600,
                            content: (
                              <div style={{ marginTop: 16 }}>
                                <p><strong>Test:</strong> {record.testType}</p>
                                <p><strong>Date:</strong> {dayjs(record.completedAt || record.createdAt).format('DD/MM/YYYY HH:mm')}</p>
                                <Divider />
                                <p><strong>Results:</strong></p>
                                <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, whiteSpace: 'pre-wrap' }}>
                                  {typeof record.result === 'object' ? JSON.stringify(record.result, null, 2) : record.result}
                                </pre>
                                {record.notes && <p><strong>Notes:</strong> {record.notes}</p>}
                              </div>
                            ),
                          });
                        }}
                      >
                        View Results
                      </Button>
                    ) : record.status === 'completed' ? (
                      <Text type="secondary">No data</Text>
                    ) : (
                      <Text type="secondary">Pending</Text>
                    )
                  ),
                },
              ]}
              pagination={false}
              size="small"
              rowKey="id"
            />
          ) : (
            <Empty description="No lab orders" />
          )}
        </ContentCard>
      </Col>
    </Row>
  );

  // Render History Tab
  const renderHistory = () => (
    <ContentCard title={<><HistoryOutlined /> Consultation History</>}>
      {consultationHistory.length > 0 ? (
        <Table
          dataSource={consultationHistory}
          columns={[
            { title: 'Date', dataIndex: 'createdAt', render: (d: string) => dayjs(d).format('DD/MM/YYYY HH:mm') },
            { title: 'Chief Complaint', dataIndex: 'chiefComplaint', ellipsis: true },
            { title: 'Assessment', dataIndex: 'assessment', ellipsis: true },
            { title: 'Plan', dataIndex: 'plan', ellipsis: true },
            { title: 'Status', dataIndex: 'isSigned', render: (s: boolean) => <Tag color={s ? 'green' : 'orange'}>{s ? 'Signed' : 'Draft'}</Tag> },
          ]}
          pagination={{ pageSize: 10 }}
          rowKey="id"
        />
      ) : (
        <Empty description="No consultation history" />
      )}
    </ContentCard>
  );

  if (loading) {
    return (
      <DashboardContainer>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <Spin size="large" />
        </div>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      {/* Patient Header */}
      <PatientHeader>
        <PatientInfo 
          onClick={() => !patient && setPatientSelectModalVisible(true)}
          style={{ cursor: !patient ? 'pointer' : 'default' }}
        >
          <div className="avatar">
            <UserOutlined />
          </div>
          <div className="details">
            <h3>
              {patient ? `${patient.firstName} ${patient.lastName}` : 'Select Patient'}
              {patient && <span className="patient-id">PAT-{patient.id?.slice(-8).toUpperCase()}</span>}
              {currentQueueItem && <Tag color="cyan" style={{ marginLeft: 8 }}>Token: {currentQueueItem.tokenNumber}</Tag>}
            </h3>
            {patient ? (
              <div className="meta">
                {calculateAge(patient.dateOfBirth)} yrs • {patient.gender} • {patient.bloodGroup || 'N/A'}
                {patient.phone && <> &nbsp;📞 {patient.phone}</>}
              </div>
            ) : (
              <div className="meta" style={{ color: '#0EA5E9' }}>
                Click to select a patient or use the buttons below
              </div>
            )}
          </div>
        </PatientInfo>
        
        <Space>
          {!patient && (
            <>
              <Button type="primary" icon={<TeamOutlined />} onClick={handleCallNext}>
                Call Next
              </Button>
              <Button icon={<SearchOutlined />} onClick={() => setPatientSelectModalVisible(true)}>
                Select Patient
              </Button>
            </>
          )}
          {patient && (
            <Button onClick={() => { setPatient(null); setCurrentQueueItem(null); setTriageData(null); }}>
              Change Patient
            </Button>
          )}
        </Space>
        
        {patient?.allergies && (
          <AllergyBadge>
            <div className="label">
              <WarningOutlined /> ALLERGY
            </div>
            <div className="value">{patient.allergies}</div>
          </AllergyBadge>
        )}
      </PatientHeader>

      {/* Tabs */}
      <TabsContainer>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'overview', label: 'Overview' },
            { key: 'soap', label: 'SOAP Notes' },
            { key: 'orders', label: 'Orders' },
            { key: 'history', label: 'History' },
          ]}
        />
      </TabsContainer>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'soap' && renderSOAPNotes()}
      {activeTab === 'orders' && renderOrders()}
      {activeTab === 'history' && renderHistory()}

      {/* Prescription Modal */}
      <Modal
        title="Write Prescription"
        open={prescriptionModalVisible}
        onCancel={() => setPrescriptionModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={prescriptionForm} layout="vertical" onFinish={handleWritePrescription}>
          <Form.Item name="medication" label="Medication" rules={[{ required: true }]}>
            <Input placeholder="Enter medication name" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="dosage" label="Dosage" rules={[{ required: true }]}>
                <Input placeholder="e.g., 500mg" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="frequency" label="Frequency" rules={[{ required: true }]}>
                <Select placeholder="Select">
                  <Option value="once_daily">Once Daily</Option>
                  <Option value="twice_daily">Twice Daily</Option>
                  <Option value="thrice_daily">Thrice Daily</Option>
                  <Option value="four_times_daily">Four Times Daily</Option>
                  <Option value="as_needed">As Needed</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="duration" label="Duration" rules={[{ required: true }]}>
                <Input placeholder="e.g., 7 days" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="instructions" label="Instructions">
            <TextArea rows={2} placeholder="Special instructions..." />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <TextArea rows={2} placeholder="Additional notes..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">Create Prescription</Button>
              <Button onClick={() => setPrescriptionModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Lab Order Modal */}
      <Modal
        title="Order Lab Test"
        open={labOrderModalVisible}
        onCancel={() => setLabOrderModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={labOrderForm} layout="vertical" onFinish={handleOrderLabTest}>
          <Form.Item name="testType" label="Test Type" rules={[{ required: true }]}>
            <Select placeholder="Select test type">
              <Option value="CBC">Complete Blood Count (CBC)</Option>
              <Option value="LFT">Liver Function Test (LFT)</Option>
              <Option value="RFT">Renal Function Test (RFT)</Option>
              <Option value="Lipid Profile">Lipid Profile</Option>
              <Option value="Thyroid Panel">Thyroid Panel</Option>
              <Option value="HbA1c">HbA1c</Option>
              <Option value="Urinalysis">Urinalysis</Option>
              <Option value="X-Ray">X-Ray</Option>
              <Option value="ECG">ECG</Option>
              <Option value="MRI">MRI</Option>
              <Option value="CT Scan">CT Scan</Option>
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="Priority">
            <Select placeholder="Select priority" defaultValue="normal">
              <Option value="normal">Normal</Option>
              <Option value="urgent">Urgent</Option>
              <Option value="stat">STAT</Option>
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="Clinical Notes">
            <TextArea rows={3} placeholder="Clinical indication..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">Order Test</Button>
              <Button onClick={() => setLabOrderModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Admit Patient Modal */}
      <Modal
        title="Admit Patient"
        open={admitModalVisible}
        onCancel={() => setAdmitModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={admitForm} layout="vertical" onFinish={handleAdmitPatient}>
          <Form.Item name="admissionType" label="Admission Type" rules={[{ required: true }]}>
            <Select placeholder="Select type">
              <Option value="emergency">Emergency</Option>
              <Option value="elective">Elective</Option>
              <Option value="observation">Observation</Option>
            </Select>
          </Form.Item>
          <Form.Item name="wardType" label="Ward Type" rules={[{ required: true }]}>
            <Select placeholder="Select ward">
              <Option value="general">General Ward</Option>
              <Option value="semi_private">Semi-Private</Option>
              <Option value="private">Private Room</Option>
              <Option value="icu">ICU</Option>
              <Option value="ccu">CCU</Option>
            </Select>
          </Form.Item>
          <Form.Item name="reason" label="Reason for Admission" rules={[{ required: true }]}>
            <TextArea rows={2} placeholder="Reason for admission..." />
          </Form.Item>
          <Form.Item name="notes" label="Additional Notes">
            <TextArea rows={2} placeholder="Additional notes..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">Admit Patient</Button>
              <Button onClick={() => setAdmitModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Follow-up Modal */}
      <Modal
        title="Schedule Follow-up"
        open={followUpModalVisible}
        onCancel={() => setFollowUpModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={followUpForm} layout="vertical" onFinish={handleScheduleFollowUp}>
          <Form.Item name="followUpDate" label="Follow-up Date & Time" rules={[{ required: true }]}>
            <DatePicker
              showTime
              style={{ width: '100%' }}
              format="DD/MM/YYYY HH:mm"
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>
          <Form.Item name="reason" label="Reason">
            <Input placeholder="Follow-up consultation" />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <TextArea rows={2} placeholder="Additional notes..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">Schedule</Button>
              <Button onClick={() => setFollowUpModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Patient Selection Modal */}
      <Modal
        title="Select Patient"
        open={patientSelectModalVisible}
        onCancel={() => setPatientSelectModalVisible(false)}
        footer={null}
        width={700}
      >
        <Tabs
          items={[
            {
              key: 'queue',
              label: (
                <span>
                  <TeamOutlined /> From Queue ({queue.filter(q => q.status === 'waiting').length})
                </span>
              ),
              children: (
                <div>
                  {queue.filter(q => q.status === 'waiting').length > 0 ? (
                    <Table
                      dataSource={queue.filter(q => q.status === 'waiting')}
                      columns={[
                        { 
                          title: 'Token', 
                          dataIndex: 'tokenNumber', 
                          render: (t: string) => <Tag color="blue">{t}</Tag> 
                        },
                        { 
                          title: 'Patient', 
                          key: 'patient', 
                          render: (_: any, r: any) => {
                            const p = r?.visit?.patient || {};
                            return `${p.firstName || ''} ${p.lastName || ''}`.trim() || '-';
                          }
                        },
                        { 
                          title: 'Priority', 
                          dataIndex: 'priority', 
                          render: (p: string) => (
                            <Tag color={p === 'emergency' ? 'red' : p === 'urgent' ? 'orange' : 'green'}>
                              {p}
                            </Tag>
                          )
                        },
                        {
                          title: 'Action',
                          key: 'action',
                          render: (_: any, r: any) => (
                            <Button 
                              type="primary" 
                              size="small" 
                              onClick={() => handleSelectFromQueue(r)}
                            >
                              Select
                            </Button>
                          )
                        }
                      ]}
                      pagination={false}
                      size="small"
                      rowKey="id"
                    />
                  ) : (
                    <Empty description="No patients waiting in queue" />
                  )}
                </div>
              ),
            },
            {
              key: 'search',
              label: (
                <span>
                  <SearchOutlined /> Search Patient
                </span>
              ),
              children: (
                <div>
                  <Input.Search
                    placeholder="Search by name, phone, or ID..."
                    onSearch={handleSearchPatients}
                    onChange={(e) => handleSearchPatients(e.target.value)}
                    loading={searchLoading}
                    style={{ marginBottom: 16 }}
                    allowClear
                  />
                  {patientSearchResults.length > 0 ? (
                    <Table
                      dataSource={patientSearchResults}
                      columns={[
                        { 
                          title: 'Name', 
                          key: 'name', 
                          render: (_: any, r: any) => `${r.firstName || ''} ${r.lastName || ''}`.trim()
                        },
                        { title: 'Phone', dataIndex: 'phone' },
                        { title: 'Gender', dataIndex: 'gender' },
                        {
                          title: 'Action',
                          key: 'action',
                          render: (_: any, r: any) => (
                            <Button 
                              type="primary" 
                              size="small" 
                              onClick={() => handleSelectSearchedPatient(r)}
                            >
                              Select
                            </Button>
                          )
                        }
                      ]}
                      pagination={false}
                      size="small"
                      rowKey="id"
                    />
                  ) : (
                    <Empty description="Search for patients by name, phone, or ID" />
                  )}
                </div>
              ),
            },
          ]}
        />
      </Modal>
    </DashboardContainer>
  );
};

export default DoctorDashboard;
