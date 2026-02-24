import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Table, Space, Typography, Tag, message, Descriptions, Row, Col, Segmented } from 'antd';
import { UserOutlined, ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined, PhoneOutlined, ReloadOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { callNext, getQueue, getTriage, advanceVisit, serveQueueItem, skipQueueItem } from '../../services/queue.service';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

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
  
  .stat-label {
    font-size: 12px;
    text-transform: uppercase;
    color: #666;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }
  
  .stat-value {
    font-size: 36px;
    font-weight: 700;
    line-height: 1.2;
  }
  
  .stat-subtitle {
    font-size: 12px;
    color: #888;
    margin-top: 4px;
  }
  
  &.in-queue .stat-value { color: #F59E0B; }
  &.consulting .stat-value { color: #0EA5E9; }
  &.seen-today .stat-value { color: #10B981; }
  &.priority .stat-value { color: #EF4444; }
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
`;

const PriorityBadge = styled(Tag)<{ $priority?: string }>`
  border-radius: 12px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  
  ${({ $priority }) => {
    switch ($priority) {
      case 'emergency':
        return 'background: #FEE2E2; color: #DC2626;';
      case 'urgent':
        return 'background: #FEF3C7; color: #D97706;';
      default:
        return 'background: #D1FAE5; color: #059669;';
    }
  }}
`;

const CallInButton = styled(Button)`
  border-radius: 6px;
  border: 1px solid #00D4AA;
  color: #00D4AA;
  
  &:hover {
    background: #00D4AA;
    color: white;
    border-color: #00D4AA;
  }
`;

const DoctorConsole: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const doctorId = (user as any)?.id as string | undefined;
  const [queue, setQueue] = useState<any[]>([]);
  const [current, setCurrent] = useState<any | null>(null);
  const [triage, setTriage] = useState<any | null>(null);
  const [filter, setFilter] = useState<string>('All');
  const [loading, setLoading] = useState(false);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const items = await getQueue('doctor', doctorId);
      setQueue(items || []);

      const active = items?.find((i: any) => i.status === 'called' && i.assignedDoctorId === doctorId);
      if (active && (!current || current.id !== active.id)) {
        setCurrent(active);
        getTriage(active.visitId).then(setTriage).catch(() => { });
      }
    } catch (_) { } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const t = setInterval(fetchQueue, 5000);
    return () => clearInterval(t);
  }, []);

  const stats = useMemo(() => {
    const waiting = queue.filter(q => q.status === 'waiting');
    const consulting = queue.filter(q => q.status === 'called');
    const completed = queue.filter(q => q.status === 'served');
    const urgent = waiting.filter(q => q.priority === 'emergency' || q.priority === 'urgent');
    const avgWait = waiting.length > 0 
      ? Math.round(waiting.reduce((acc, q) => acc + (dayjs().diff(dayjs(q.createdAt), 'minute')), 0) / waiting.length)
      : 0;
    
    return {
      inQueue: waiting.length,
      avgWait,
      consulting: consulting.length,
      seenToday: completed.length,
      priority: urgent.length
    };
  }, [queue]);

  const filteredQueue = useMemo(() => {
    const waiting = queue.filter(q => q.status === 'waiting');
    if (filter === 'Priority') {
      return waiting.filter(q => q.priority === 'emergency' || q.priority === 'urgent');
    }
    return waiting;
  }, [queue, filter]);

  const onCallNext = async () => {
    try {
      const item = await callNext('doctor', doctorId);
      if (!item) {
        message.info('No patients waiting');
        return;
      }
      setCurrent(item);
      const tri = await getTriage(item.visitId);
      setTriage(tri);
      fetchQueue();
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to call next');
    }
  };

  const onCallIn = async (item: any) => {
    try {
      setCurrent(item);
      const tri = await getTriage(item.visitId);
      setTriage(tri);
      message.success(`Called in ${item.tokenNumber}`);
    } catch (e: any) {
      message.error('Failed to call patient');
    }
  };

  const onSendToBilling = async () => {
    if (!current?.visitId) return;
    try {
      await advanceVisit(current.visitId, 'billing');
      try { await serveQueueItem(current.id); } catch { }
      message.success('Sent to Billing');
      setCurrent(null);
      setTriage(null);
      fetchQueue();
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to advance');
    }
  };

  const onSkip = async () => {
    if (!current?.id) return;
    try {
      await skipQueueItem(current.id);
      message.info('Skipped current token');
      setCurrent(null);
      setTriage(null);
      fetchQueue();
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to skip');
    }
  };

  const columns = useMemo(() => [
    { 
      title: '#', 
      key: 'index',
      width: 50,
      render: (_: any, __: any, index: number) => index + 1
    },
    { 
      title: 'PATIENT', 
      key: 'patient',
      render: (record: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.patient?.firstName} {record.patient?.lastName}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.patient?.gender?.[0]?.toUpperCase() || '-'}, {record.patient?.age || '-'} yrs • {record.patient?.displayPatientId || record.patientId?.slice(-8)}
          </Text>
        </div>
      )
    },
    { 
      title: 'TOKEN', 
      dataIndex: 'tokenNumber', 
      key: 'token', 
      render: (t: string) => <Tag color="cyan">{t}</Tag> 
    },
    { 
      title: 'TYPE', 
      key: 'type',
      render: (record: any) => record.visitType || 'Consultation'
    },
    { 
      title: 'WAIT TIME', 
      key: 'waitTime',
      render: (record: any) => {
        const mins = dayjs().diff(dayjs(record.createdAt), 'minute');
        return <Text style={{ color: mins > 30 ? '#EF4444' : '#666' }}>{mins} min</Text>;
      }
    },
    { 
      title: 'PRIORITY', 
      dataIndex: 'priority', 
      key: 'priority', 
      render: (p: string) => <PriorityBadge $priority={p}>{p?.charAt(0).toUpperCase() + p?.slice(1) || 'Normal'}</PriorityBadge>
    },
    { 
      title: 'ACTION', 
      key: 'action',
      render: (record: any) => (
        <CallInButton size="small" onClick={() => onCallIn(record)}>
          Call In
        </CallInButton>
      )
    },
  ], []);

  return (
    <PageContainer>
      <PageHeader>
        <div className="title-section">
          <h2>Patient Queue</h2>
          <div className="subtitle">Patients waiting for consultation</div>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchQueue} loading={loading}>Refresh</Button>
          <Button type="primary" icon={<PhoneOutlined />} onClick={onCallNext} style={{ background: '#00D4AA', borderColor: '#00D4AA' }}>
            Call Next Patient
          </Button>
        </Space>
      </PageHeader>

      <StatsRow gutter={16}>
        <Col xs={24} sm={12} md={6}>
          <StatCard className="in-queue">
            <div className="stat-label">IN QUEUE</div>
            <div className="stat-value">{stats.inQueue}</div>
            <div className="stat-subtitle">Avg. wait: {stats.avgWait} min</div>
          </StatCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard className="consulting">
            <div className="stat-label">CONSULTING</div>
            <div className="stat-value">{stats.consulting}</div>
            <div className="stat-subtitle">Currently in room</div>
          </StatCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard className="seen-today">
            <div className="stat-label">SEEN TODAY</div>
            <div className="stat-value">{stats.seenToday}</div>
            <div className="stat-subtitle">Completed consultations</div>
          </StatCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard className="priority">
            <div className="stat-label">PRIORITY</div>
            <div className="stat-value">{stats.priority}</div>
            <div className="stat-subtitle">Urgent cases</div>
          </StatCard>
        </Col>
      </StatsRow>

      <QueueCard 
        title="Queue List"
        extra={
          <Segmented
            options={['Priority', 'All']}
            value={filter}
            onChange={(val) => setFilter(val as string)}
          />
        }
      >
        <Table 
          rowKey="id" 
          dataSource={filteredQueue} 
          columns={columns} 
          pagination={{ pageSize: 8 }}
          loading={loading}
          locale={{ emptyText: 'No patients in queue' }}
        />
      </QueueCard>

      {current && (
        <QueueCard
          title={`Current Patient: ${current.tokenNumber}`}
          style={{ marginTop: 24 }}
          extra={
            <Space>
              {current.appointment && (
                <Button
                  onClick={() => navigate(`/doctor/consultations/${current.appointment.id}`)}
                  style={{ borderColor: '#10B981', color: '#10B981' }}
                >
                  Start Consultation
                </Button>
              )}
              <Button onClick={onSkip}>Skip</Button>
              <Button onClick={onSendToBilling} type="primary">Send to Billing</Button>
            </Space>
          }
        >
          <Row gutter={24}>
            <Col span={12}>
              <Descriptions bordered size="small" column={1} title="Patient Info">
                <Descriptions.Item label="Token">{current.tokenNumber}</Descriptions.Item>
                <Descriptions.Item label="Name">{current.patient?.firstName} {current.patient?.lastName}</Descriptions.Item>
                <Descriptions.Item label="Priority">
                  <PriorityBadge $priority={current.priority}>{current.priority}</PriorityBadge>
                </Descriptions.Item>
              </Descriptions>
            </Col>
            <Col span={12}>
              {triage ? (
                <Descriptions bordered size="small" column={1} title="Vitals">
                  <Descriptions.Item label="Temp">{triage?.vitals?.temperature ?? '-'}°F</Descriptions.Item>
                  <Descriptions.Item label="BP">{triage?.vitals?.systolic ?? '-'}/{triage?.vitals?.diastolic ?? '-'} mmHg</Descriptions.Item>
                  <Descriptions.Item label="Heart Rate">{triage?.vitals?.heartRate ?? '-'} bpm</Descriptions.Item>
                  <Descriptions.Item label="SpO2">{triage?.vitals?.spo2 ?? '-'}%</Descriptions.Item>
                </Descriptions>
              ) : (
                <Card size="small" title="Vitals">
                  <Text type="secondary">No triage data available</Text>
                </Card>
              )}
            </Col>
          </Row>
          {triage && (
            <Descriptions bordered size="small" column={2} style={{ marginTop: 16 }} title="Clinical Notes">
              <Descriptions.Item label="Symptoms" span={2}>{triage?.symptoms || '-'}</Descriptions.Item>
              <Descriptions.Item label="Allergies">{triage?.allergies || '-'}</Descriptions.Item>
              <Descriptions.Item label="Pain Scale">{triage?.painScale ?? '-'}/10</Descriptions.Item>
              <Descriptions.Item label="Current Medications" span={2}>{triage?.currentMeds || '-'}</Descriptions.Item>
              <Descriptions.Item label="Notes" span={2}>{triage?.notes || '-'}</Descriptions.Item>
            </Descriptions>
          )}
        </QueueCard>
      )}
    </PageContainer>
  );
};

export default DoctorConsole;
