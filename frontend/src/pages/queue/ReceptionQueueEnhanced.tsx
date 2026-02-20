import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Card, Form, Input, Button, Table, Space, Typography, Tag, message, Select, Row, Col, Statistic, Modal, AutoComplete, Divider, List, Avatar } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import { createVisit, getQueue, advanceVisit, serveQueueItem, callQueueItem } from '../../services/queue.service';
import patientService from '../../services/patientService';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

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
  
  .title-section {
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

const StatsRow = styled(Row)`
  margin-bottom: 24px;
`;

const StatCard = styled(Card)`
  border-radius: 12px;
  border: 1px solid rgba(30, 58, 95, 0.1);
  box-shadow: 0 2px 8px rgba(30, 58, 95, 0.06);
  
  .ant-card-body {
    padding: 20px;
  }
  
  .stat-value {
    font-size: 36px;
    font-weight: 700;
    line-height: 1.2;
  }
  
  .stat-label {
    font-size: 12px;
    text-transform: uppercase;
    color: #666;
    letter-spacing: 0.5px;
  }
  
  .stat-change {
    font-size: 12px;
    margin-top: 4px;
  }
  
  &.total .stat-value { color: #1E3A5F; }
  &.waiting .stat-value { color: #F59E0B; }
  &.in-progress .stat-value { color: #0EA5E9; }
  &.completed .stat-value { color: #10B981; }
`;

const QueueCard = styled(Card)`
  border-radius: 12px;
  border: 1px solid rgba(30, 58, 95, 0.1);
  box-shadow: 0 2px 8px rgba(30, 58, 95, 0.06);
  
  .ant-card-head {
    border-bottom: 1px solid rgba(30, 58, 95, 0.08);
    padding: 16px 20px;
    
    .ant-card-head-title {
      font-size: 16px;
      font-weight: 600;
      color: #1E3A5F;
    }
  }
  
  .ant-card-body {
    padding: 0;
  }
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(30, 58, 95, 0.08);
  background: #FAFBFC;
`;

const PatientRow = styled.div`
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(30, 58, 95, 0.06);
  transition: background 0.2s;
  
  &:hover {
    background: #F8FAFC;
  }
  
  &:last-child {
    border-bottom: none;
  }
  
  .token {
    font-size: 18px;
    font-weight: 700;
    color: #1E3A5F;
    width: 60px;
  }
  
  .patient-info {
    flex: 1;
    margin-left: 16px;
    
    .name {
      font-weight: 600;
      color: #1a1a2e;
      font-size: 15px;
    }
    
    .meta {
      font-size: 13px;
      color: #666;
    }
  }
  
  .doctor {
    width: 140px;
    font-size: 14px;
    color: #1E3A5F;
  }
  
  .status {
    width: 100px;
  }
  
  .wait-time {
    width: 80px;
    font-size: 13px;
    color: #666;
  }
  
  .actions {
    width: 80px;
    text-align: right;
  }
`;

const WalkInButton = styled(Button)`
  height: 40px;
  border-radius: 8px;
  font-weight: 600;
  background: #1E3A5F;
  border-color: #1E3A5F;
  
  &:hover {
    background: #2D4A6F !important;
    border-color: #2D4A6F !important;
  }
`;

const StatusLegend = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 12px 20px;
  background: #FAFBFC;
  border-top: 1px solid rgba(30, 58, 95, 0.08);
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #666;
    
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    
    &.checked-in .dot { background: #F59E0B; }
    &.triage .dot { background: #F97316; }
    &.waiting .dot { background: #10B981; }
    &.with-doctor .dot { background: #0EA5E9; }
  }
`;

const ReceptionQueueEnhanced: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [queue, setQueue] = useState<any[]>([]);
  const [lastToken, setLastToken] = useState<string | null>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const searchTimer = useRef<number | null>(null);
  const navigate = useNavigate();
  const [checkInModalVisible, setCheckInModalVisible] = useState(false);
  const [patientSearchText, setPatientSearchText] = useState('');
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const fetchQueue = async () => {
    try {
      const items = await getQueue('reception');
      setQueue(items || []);
    } catch (_) {}
  };

  const fetchTodayAppointments = async () => {
    try {
      setLoadingAppointments(true);
      const today = dayjs().format('YYYY-MM-DD');
      const res = await patientService.getPatients({ limit: 100 });
      // Also fetch today's appointments
      try {
        const apptRes = await import('../../services/api').then(m => m.default.get('/appointments', {
          params: { date: today, status: 'scheduled', limit: 50 }
        }));
        setTodayAppointments(apptRes.data?.data || []);
      } catch {
        setTodayAppointments([]);
      }
    } catch (_) {
      setTodayAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    fetchTodayAppointments();
    const t = setInterval(fetchQueue, 5000);
    return () => clearInterval(t);
  }, []);

  const doSearch = async (q: string) => {
    if (!q || q.length < 2) { setOptions([]); return; }
    try {
      setSearching(true);
      const { data } = await patientService.getPatients({ search: q, limit: 10 });
      const opts = (data || []).map((p: any) => ({
        label: `${p.firstName} ${p.lastName} — ${p.email || ''} — ${p.phone || ''}`.trim(),
        value: p.id,
        pid: p.displayPatientId || '',
      }));
      setOptions(opts);
    } catch (_) {
      setOptions([]);
    } finally {
      setSearching(false);
    }
  };

  const onSearch = (text: string) => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => doSearch(text), 250) as any;
  };

  const handleCreateVisit = async (patientId: string) => {
    try {
      setLoading(true);
      const res = await createVisit(patientId);
      const token = res?.queueItem?.tokenNumber;
      if (token) {
        setLastToken(token);
        message.success(`Token issued: ${token}`);
      }
      fetchQueue();
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to create visit');
    } finally {
      setLoading(false);
    }
  };

  const handleCallPatient = async (item: any) => {
    try {
      setLoading(true);
      // Call the patient first
      await callQueueItem(item.id);
      message.success(`Called patient: ${item?.visit?.patient?.firstName || ''} ${item?.visit?.patient?.lastName || ''} (Token: ${item.tokenNumber})`);
      fetchQueue();
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to call patient');
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceToTriage = async (item: any) => {
    try {
      setLoading(true);
      await advanceVisit(item.visitId, 'triage');
      await serveQueueItem(item.id);
      message.success('Sent to Triage');
      fetchQueue();
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to advance to triage');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckInPatient = async (patientId: string, patientName: string) => {
    try {
      setLoading(true);
      const res = await createVisit(patientId);
      const token = res?.queueItem?.tokenNumber;
      if (token) {
        setLastToken(token);
        message.success(`Check-in successful! Token: ${token} for ${patientName}`);
      }
      setCheckInModalVisible(false);
      setPatientSearchText('');
      setOptions([]);
      fetchQueue();
      fetchTodayAppointments();
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to check-in patient');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckInFromAppointment = async (appointment: any) => {
    const patientId = appointment.patientId || appointment.patient?.id;
    const patientName = appointment.patient ? `${appointment.patient.firstName} ${appointment.patient.lastName}` : 'Patient';
    if (patientId) {
      await handleCheckInPatient(patientId, patientName);
    } else {
      message.error('Patient ID not found in appointment');
    }
  };

  // Stats calculations
  const stats = useMemo(() => {
    const total = queue.length;
    const waiting = queue.filter(q => q.status === 'waiting').length;
    const inProgress = queue.filter(q => q.status === 'called' || q.stage === 'triage').length;
    const completed = queue.filter(q => q.status === 'served').length;
    return { total, waiting, inProgress, completed };
  }, [queue]);

  // Filter queue
  const filteredQueue = useMemo(() => {
    let filtered = queue;
    if (statusFilter !== 'all') {
      filtered = filtered.filter(q => q.status === statusFilter || q.stage === statusFilter);
    }
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(q => {
        const patient = q?.visit?.patient || {};
        const name = `${patient.firstName || ''} ${patient.lastName || ''}`.toLowerCase();
        return name.includes(search) || q.tokenNumber?.toLowerCase().includes(search);
      });
    }
    return filtered;
  }, [queue, statusFilter, searchText]);

  const getStatusTag = (item: any) => {
    const stage = item.stage;
    const status = item.status;
    
    if (stage === 'doctor' || status === 'with_doctor') {
      return <Tag color="cyan">With Doctor</Tag>;
    }
    if (stage === 'triage') {
      return <Tag color="orange">Triage</Tag>;
    }
    if (status === 'waiting') {
      return <Tag color="green">Waiting</Tag>;
    }
    if (status === 'called') {
      return <Tag color="gold">Called</Tag>;
    }
    if (status === 'served') {
      return <Tag color="default">Completed</Tag>;
    }
    return <Tag>{status}</Tag>;
  };

  const getWaitTime = (item: any) => {
    if (!item.createdAt) return '—';
    const mins = dayjs().diff(dayjs(item.createdAt), 'minute');
    return `${mins} min`;
  };

  const calculateAge = (dob: string) => {
    if (!dob) return '';
    return `${dayjs().diff(dayjs(dob), 'year')} yrs`;
  };

  return (
    <PageContainer>
      <PageHeader>
        <div className="title-section">
          <h2>Queue Management</h2>
          <div className="subtitle">Today's Patient Queue - Live Updates</div>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchQueue}>
            Refresh Queue
          </Button>
          <Button
            icon={<UserOutlined />}
            onClick={() => setCheckInModalVisible(true)}
            style={{ marginRight: 8 }}
          >
            Check-In Patient
          </Button>
          <WalkInButton
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/patients/register')}
          >
            Walk-in Registration
          </WalkInButton>
        </Space>
      </PageHeader>

      {/* Stats Row */}
      <StatsRow gutter={16}>
        <Col xs={12} sm={6}>
          <StatCard className="total">
            <div className="stat-label">TOTAL TODAY</div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-change" style={{ color: '#10B981' }}>+12% from yesterday</div>
          </StatCard>
        </Col>
        <Col xs={12} sm={6}>
          <StatCard className="waiting">
            <div className="stat-label">WAITING</div>
            <div className="stat-value">{stats.waiting}</div>
            <div className="stat-change">Avg. wait: 15 min</div>
          </StatCard>
        </Col>
        <Col xs={12} sm={6}>
          <StatCard className="in-progress">
            <div className="stat-label">IN PROGRESS</div>
            <div className="stat-value">{stats.inProgress}</div>
            <div className="stat-change">{queue.filter(q => q.stage === 'triage').length} in triage, {queue.filter(q => q.stage === 'doctor').length} with doctor</div>
          </StatCard>
        </Col>
        <Col xs={12} sm={6}>
          <StatCard className="completed">
            <div className="stat-label">COMPLETED</div>
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-change">Today's total</div>
          </StatCard>
        </Col>
      </StatsRow>

      {/* Patient Queue */}
      <QueueCard
        title="Patient Queue"
        extra={
          <Space>
            <Input
              placeholder="Search patient..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120 }}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'waiting', label: 'Waiting' },
                { value: 'triage', label: 'Triage' },
                { value: 'doctor', label: 'With Doctor' },
                { value: 'served', label: 'Completed' },
              ]}
            />
          </Space>
        }
      >
        {/* Header */}
        <div style={{ display: 'flex', padding: '12px 20px', background: '#F8FAFC', borderBottom: '1px solid rgba(30, 58, 95, 0.08)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', color: '#666' }}>
          <div style={{ width: 60 }}>Token</div>
          <div style={{ flex: 1, marginLeft: 16 }}>Patient</div>
          <div style={{ width: 140 }}>Doctor</div>
          <div style={{ width: 100 }}>Status</div>
          <div style={{ width: 80 }}>Wait Time</div>
          <div style={{ width: 80, textAlign: 'right' }}>Action</div>
        </div>

        {/* Queue Items */}
        {filteredQueue.length > 0 ? (
          filteredQueue.map((item) => {
            const patient = item?.visit?.patient || {};
            const doctor = item?.visit?.doctor || item?.assignedDoctor;
            return (
              <PatientRow key={item.id}>
                <div className="token">{item.tokenNumber}</div>
                <div className="patient-info">
                  <div className="name">{patient.firstName || ''} {patient.lastName || ''}</div>
                  <div className="meta">
                    {calculateAge(patient.dateOfBirth)} • {patient.gender || ''}
                  </div>
                </div>
                <div className="doctor">
                  {doctor ? `Dr. ${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() : '—'}
                </div>
                <div className="status">
                  {getStatusTag(item)}
                </div>
                <div className="wait-time">
                  {getWaitTime(item)}
                </div>
                <div className="actions">
                  {item.status === 'waiting' && item.stage === 'reception' && (
                    <Button
                      type="link"
                      size="small"
                      onClick={() => handleCallPatient(item)}
                    >
                      Call
                    </Button>
                  )}
                  {item.status === 'called' && item.stage === 'reception' && (
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => handleAdvanceToTriage(item)}
                    >
                      Send to Triage
                    </Button>
                  )}
                  {(item.stage === 'triage' || item.stage === 'doctor') && (
                    <Button type="link" size="small">View</Button>
                  )}
                </div>
              </PatientRow>
            );
          })
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
            No patients in queue
          </div>
        )}

        {/* Status Legend */}
        <StatusLegend>
          <span style={{ fontWeight: 600, color: '#1E3A5F' }}>Status:</span>
          <div className="legend-item checked-in">
            <div className="dot" />
            <span>Checked-in</span>
          </div>
          <div className="legend-item triage">
            <div className="dot" />
            <span>Triage</span>
          </div>
          <div className="legend-item waiting">
            <div className="dot" />
            <span>Waiting</span>
          </div>
        </StatusLegend>
      </QueueCard>

      {/* Last Token Display */}
      {lastToken && (
        <Card style={{ marginTop: 16, borderRadius: 12 }}>
          <Text type="success" style={{ fontSize: 16 }}>
            Last Token Issued: <Tag color="green" style={{ fontSize: 16 }}>{lastToken}</Tag>
          </Text>
        </Card>
      )}

      {/* Check-In Modal */}
      <Modal
        title="Patient Check-In"
        open={checkInModalVisible}
        onCancel={() => {
          setCheckInModalVisible(false);
          setPatientSearchText('');
          setOptions([]);
        }}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>Search Patient:</Text>
          <AutoComplete
            style={{ width: '100%', marginTop: 8 }}
            options={options.map(opt => ({
              value: opt.value,
              label: (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{opt.label}</span>
                  <Tag color="blue">{opt.pid}</Tag>
                </div>
              ),
            }))}
            onSearch={onSearch}
            onSelect={(value) => {
              const selected = options.find(o => o.value === value);
              if (selected) {
                handleCheckInPatient(value, selected.label.split(' — ')[0]);
              }
            }}
            placeholder="Search by name, phone, or patient ID..."
            notFoundContent={searching ? 'Searching...' : patientSearchText.length >= 2 ? 'No patients found' : 'Type at least 2 characters'}
          />
        </div>

        <Divider>Or Check-In from Today's Appointments</Divider>

        <List
          loading={loadingAppointments}
          dataSource={todayAppointments.slice(0, 10)}
          locale={{ emptyText: 'No appointments scheduled for today' }}
          renderItem={(appt: any) => (
            <List.Item
              actions={[
                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleCheckInFromAppointment(appt)}
                  loading={loading}
                >
                  Check-In
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1E3A5F' }} />}
                title={`${appt.patient?.firstName || ''} ${appt.patient?.lastName || ''}`}
                description={
                  <Space>
                    <Tag color="blue">{dayjs(appt.appointmentTime || appt.startTime).format('h:mm A')}</Tag>
                    <span>Dr. {appt.doctor?.firstName || ''} {appt.doctor?.lastName || ''}</span>
                  </Space>
                }
              />
            </List.Item>
          )}
        />

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Button onClick={() => navigate('/patients/register')}>
            <PlusOutlined /> Register New Patient
          </Button>
        </div>
      </Modal>
    </PageContainer>
  );
};

export default ReceptionQueueEnhanced;
