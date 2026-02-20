import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Select, message, Tabs, Empty } from 'antd';
import { CheckOutlined, ReloadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

const StockAlerts: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [categorized, setCategorized] = useState<any>({});
  const [statusFilter, setStatusFilter] = useState('active');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAlerts();
  }, [statusFilter]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/inventory/alerts?status=${statusFilter}`);
      setAlerts(res.data.data || []);
      setCategorized(res.data.categorized || {});
    } catch (err: any) {
      console.error('Error loading alerts:', err);
      // Don't show error message for empty data - just show empty state
      if (err.response?.status === 404 || err.response?.status === 500) {
        setAlerts([]);
        setCategorized({});
        setError('No alerts found. Click "Generate Alerts" to scan inventory for issues.');
      } else {
        setError('Unable to load alerts. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAlerts = async () => {
    try {
      setGenerating(true);
      const res = await api.post('/inventory/alerts/generate');
      message.success(`Generated ${res.data.alertsCreated} alerts`);
      await loadAlerts();
    } catch (error) {
      console.error('Error generating alerts:', error);
      message.error('Failed to generate alerts');
    } finally {
      setGenerating(false);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await api.put(`/inventory/alerts/${id}/acknowledge`);
      message.success('Alert acknowledged');
      await loadAlerts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      message.error('Failed to acknowledge alert');
    }
  };

  const getAlertColor = (type: string) => {
    const colors: any = {
      out_of_stock: 'red',
      expired: 'red',
      low_stock: 'orange',
      near_expiry: 'gold',
      critical_low: 'red'
    };
    return colors[type] || 'default';
  };

  const columns = [
    {
      title: 'Medicine',
      dataIndex: ['medicine', 'name'],
      key: 'medicine',
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {record.medicine?.genericName}
          </div>
        </div>
      )
    },
    {
      title: 'Alert Type',
      dataIndex: 'alertType',
      key: 'alertType',
      render: (type: string) => (
        <Tag color={getAlertColor(type)}>
          {type.replace('_', ' ').toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message'
    },
    {
      title: 'Current Stock',
      dataIndex: 'currentStock',
      key: 'currentStock',
      render: (stock: number, record: any) => (
        <div>
          {stock !== null && stock !== undefined ? (
            <>
              <div>{stock}</div>
              {record.reorderLevel && (
                <div style={{ fontSize: 12, color: '#666' }}>
                  Reorder: {record.reorderLevel}
                </div>
              )}
            </>
          ) : '-'}
        </div>
      )
    },
    {
      title: 'Expiry Info',
      key: 'expiry',
      render: (record: any) => (
        <div>
          {record.expiryDate && (
            <>
              <div>{dayjs(record.expiryDate).format('MMM DD, YYYY')}</div>
              {record.daysUntilExpiry !== null && (
                <div style={{ fontSize: 12, color: record.daysUntilExpiry < 0 ? 'red' : '#666' }}>
                  {record.daysUntilExpiry < 0 
                    ? `Expired ${Math.abs(record.daysUntilExpiry)} days ago`
                    : `${record.daysUntilExpiry} days left`
                  }
                </div>
              )}
            </>
          )}
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'red' : status === 'acknowledged' ? 'orange' : 'green'}>
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY HH:mm')
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: any) => (
        <Space>
          {record.status === 'active' && (
            <Button
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleAcknowledge(record.id)}
            >
              Acknowledge
            </Button>
          )}
        </Space>
      )
    }
  ];

  const tabItems = [
    {
      key: 'all',
      label: `All Alerts (${alerts.length})`,
      children: (
        <Table
          columns={columns}
          dataSource={alerts}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      )
    },
    {
      key: 'critical',
      label: `Critical (${categorized.critical?.length || 0})`,
      children: (
        <Table
          columns={columns}
          dataSource={categorized.critical || []}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      )
    },
    {
      key: 'warning',
      label: `Warning (${categorized.warning?.length || 0})`,
      children: (
        <Table
          columns={columns}
          dataSource={categorized.warning || []}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/pharmacy')}
          style={{ marginRight: 8 }}
        >
          Back to Pharmacy
        </Button>
      </div>
      <Card
        title="Stock Alerts"
        extra={
          <Space>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
            >
              <Option value="active">Active</Option>
              <Option value="acknowledged">Acknowledged</Option>
              <Option value="resolved">Resolved</Option>
            </Select>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={handleGenerateAlerts}
              loading={generating}
            >
              Generate Alerts
            </Button>
          </Space>
        }
      >
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
};

export default StockAlerts;
