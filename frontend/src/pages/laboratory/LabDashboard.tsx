import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Tag, Button, Segmented, Space, Input, Typography } from 'antd';
import { 
  ExperimentOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined,
  WarningOutlined,
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EyeOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Text } = Typography;

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
  
  &.pending .stat-value { color: #F59E0B; }
  &.validated .stat-value { color: #10B981; }
  &.abnormal .stat-value { color: #F97316; }
  &.critical .stat-value { color: #EF4444; }
`;

const OrdersCard = styled(Card)`
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

const StatusBadge = styled(Tag)<{ $status?: string }>`
  border-radius: 12px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  
  ${({ $status }) => {
    switch ($status) {
      case 'completed':
        return 'background: #D1FAE5; color: #059669;';
      case 'in_progress':
        return 'background: #DBEAFE; color: #2563EB;';
      case 'critical':
        return 'background: #FEE2E2; color: #DC2626;';
      case 'pending':
      case 'ordered':
        return 'background: #FEF3C7; color: #D97706;';
      default:
        return 'background: #F3F4F6; color: #6B7280;';
    }
  }}
`;

const ResultBadge = styled(Tag)<{ $result?: string }>`
  border-radius: 12px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  
  ${({ $result }) => {
    switch ($result) {
      case 'normal':
        return 'background: #D1FAE5; color: #059669;';
      case 'abnormal':
        return 'background: #FEF3C7; color: #D97706;';
      case 'critical':
        return 'background: #FEE2E2; color: #DC2626;';
      default:
        return 'background: #F3F4F6; color: #6B7280;';
    }
  }}
`;

const ActionButton = styled(Button)`
  border-radius: 6px;
  border: 1px solid #00D4AA;
  color: #00D4AA;
  
  &:hover {
    background: #00D4AA;
    color: white;
    border-color: #00D4AA;
  }
`;

interface LabOrder {
  id: string;
  orderNumber: string;
  patient: { firstName: string; lastName: string };
  doctor: { firstName: string; lastName: string };
  status: string;
  isUrgent: boolean;
  createdAt: string;
  items: any[];
}

const LabDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<LabOrder[]>([]);
  const [completedOrders, setCompletedOrders] = useState<LabOrder[]>([]);
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0,
    urgent: 0
  });

  useEffect(() => {
    fetchPendingOrders();
    fetchCompletedOrders();
  }, []);

  const fetchPendingOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/lab/orders/pending');
      console.log('Pending orders response:', response.data);
      const orders = response.data || [];
      setPendingOrders(orders);

      // Calculate stats
      const stats = {
        pending: orders.filter((o: LabOrder) => o.status === 'ordered').length,
        inProgress: orders.filter((o: LabOrder) => o.status === 'in_progress').length,
        completed: orders.filter((o: LabOrder) => o.status === 'completed').length,
        urgent: orders.filter((o: LabOrder) => o.isUrgent).length
      };
      setStats(stats);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      setPendingOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedOrders = async () => {
    try {
      const response = await api.get('/lab/orders', {
        params: { status: 'completed', limit: 50 }
      });
      console.log('Completed orders response:', response.data);
      const orders = response.data.orders || [];
      setCompletedOrders(orders);
      
      // Update completed count in stats
      setStats(prev => ({ ...prev, completed: orders.length }));
    } catch (error) {
      console.error('Error fetching completed orders:', error);
      setCompletedOrders([]);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ordered: 'blue',
      sample_collected: 'cyan',
      in_progress: 'orange',
      completed: 'green',
      cancelled: 'red'
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: 'Order #',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text: string, record: LabOrder) => (
        <>
          {text}
          {record.isUrgent && <Tag color="red" style={{ marginLeft: 8 }}>URGENT</Tag>}
        </>
      )
    },
    {
      title: 'Patient',
      key: 'patient',
      render: (_: any, record: LabOrder) => 
        `${record.patient.firstName} ${record.patient.lastName}`
    },
    {
      title: 'Doctor',
      key: 'doctor',
      render: (_: any, record: LabOrder) => 
        `Dr. ${record.doctor.firstName} ${record.doctor.lastName}`
    },
    {
      title: 'Tests',
      dataIndex: 'items',
      key: 'items',
      render: (items: any[]) => items?.length || 0
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Ordered',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: LabOrder) => {
        if (record.status === 'completed') {
          return <Tag color="green">Completed</Tag>;
        } else if (record.status === 'ordered') {
          return (
            <Button type="primary" size="small" onClick={() => window.location.href = '/laboratory/sample-collection'}>
              Collect Sample
            </Button>
          );
        } else if (record.status === 'sample_collected') {
          return (
            <Button type="primary" size="small" onClick={() => window.location.href = '/laboratory/results-entry'}>
              Enter Results
            </Button>
          );
        }
        return <Tag color="orange">In Progress</Tag>;
      }
    }
  ];

  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>('All');

  const filteredOrders = React.useMemo(() => {
    const allOrders = [...pendingOrders, ...completedOrders];
    switch (filter) {
      case 'Pending':
        return pendingOrders.filter(o => o.status === 'ordered' || o.status === 'sample_collected');
      case 'Critical':
        return allOrders.filter(o => o.isUrgent);
      default:
        return allOrders;
    }
  }, [pendingOrders, completedOrders, filter]);

  return (
    <PageContainer>
      <PageHeader>
        <div className="title-section">
          <h2>Lab Orders</h2>
          <div className="subtitle">Track and manage laboratory test orders</div>
        </div>
        <Space>
          <Input 
            placeholder="Search lab orders..." 
            prefix={<SearchOutlined />} 
            style={{ width: 200, borderRadius: 8 }}
          />
          <Button icon={<ReloadOutlined />} onClick={() => { fetchPendingOrders(); fetchCompletedOrders(); }} loading={loading}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/laboratory/order')} style={{ background: '#00D4AA', borderColor: '#00D4AA' }}>
            New Lab Order
          </Button>
        </Space>
      </PageHeader>

      <StatsRow gutter={16}>
        <Col xs={24} sm={12} md={6}>
          <StatCard className="pending">
            <div className="stat-label">PENDING RESULTS</div>
            <div className="stat-value">{stats.pending + stats.inProgress}</div>
            <div className="stat-subtitle">Awaiting processing</div>
          </StatCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard className="validated">
            <div className="stat-label">COMPLETED TODAY</div>
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-subtitle">Results validated</div>
          </StatCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard className="abnormal">
            <div className="stat-label">IN PROGRESS</div>
            <div className="stat-value">{stats.inProgress}</div>
            <div className="stat-subtitle">Being processed</div>
          </StatCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard className="critical">
            <div className="stat-label">CRITICAL</div>
            <div className="stat-value">{stats.urgent}</div>
            <div className="stat-subtitle">Immediate action required</div>
          </StatCard>
        </Col>
      </StatsRow>

      <OrdersCard 
        title="Lab Orders"
        extra={
          <Segmented
            options={['All', 'Pending', 'Critical']}
            value={filter}
            onChange={(val) => setFilter(val as string)}
          />
        }
      >
        <Table
          columns={columns}
          dataSource={filteredOrders}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'No lab orders found' }}
        />
      </OrdersCard>
    </PageContainer>
  );
};

export default LabDashboard;
