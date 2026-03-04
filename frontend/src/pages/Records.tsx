import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Tag, Typography, Space, Input, Button, Select, message } from 'antd';
import { FileTextOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Title, Text } = Typography;

interface MedicalRecord {
  id: string;
  type: string;
  title: string;
  description: string;
  diagnosis: string;
  treatment: string;
  medications: string;
  fileUrl: string | null;
  recordDate: string;
  createdAt: string;
  patient?: { firstName: string; lastName: string; id: string };
  doctor?: { firstName: string; lastName: string; id: string };
}

const typeColorMap: Record<string, string> = {
  consultation: 'blue',
  lab_report: 'green',
  prescription: 'purple',
  imaging: 'orange',
  discharge_summary: 'cyan',
  surgical_note: 'red',
};

const Records: React.FC = () => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>();

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/medical-records');
      setRecords(res.data?.data || res.data || []);
    } catch (error: any) {
      if (error.response?.status === 403) {
        message.error('Access denied');
      } else {
        message.error('Failed to fetch medical records');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const filtered = records.filter((r) => {
    const matchSearch = !searchText ||
      r.title?.toLowerCase().includes(searchText.toLowerCase()) ||
      r.diagnosis?.toLowerCase().includes(searchText.toLowerCase()) ||
      r.patient?.firstName?.toLowerCase().includes(searchText.toLowerCase()) ||
      r.patient?.lastName?.toLowerCase().includes(searchText.toLowerCase());
    const matchType = !typeFilter || r.type === typeFilter;
    return matchSearch && matchType;
  });

  const columns = [
    {
      title: 'Date',
      dataIndex: 'recordDate',
      key: 'recordDate',
      width: 120,
      render: (text: string) => text ? new Date(text).toLocaleDateString() : '-',
      sorter: (a: MedicalRecord, b: MedicalRecord) =>
        new Date(a.recordDate).getTime() - new Date(b.recordDate).getTime(),
      defaultSortOrder: 'descend' as const,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (text: string) => (
        <Tag color={typeColorMap[text] || 'default'}>
          {text?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
        </Tag>
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Patient',
      key: 'patient',
      width: 160,
      render: (_: any, record: MedicalRecord) =>
        record.patient ? `${record.patient.firstName} ${record.patient.lastName}` : '-',
    },
    {
      title: 'Doctor',
      key: 'doctor',
      width: 160,
      render: (_: any, record: MedicalRecord) =>
        record.doctor ? `Dr. ${record.doctor.firstName} ${record.doctor.lastName}` : '-',
    },
    {
      title: 'Diagnosis',
      dataIndex: 'diagnosis',
      key: 'diagnosis',
      ellipsis: true,
    },
    {
      title: 'Treatment',
      dataIndex: 'treatment',
      key: 'treatment',
      ellipsis: true,
    },
  ];

  const uniqueTypes = [...new Set(records.map(r => r.type).filter(Boolean))];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ color: '#3B82F6', marginBottom: 0 }}>
            <FileTextOutlined /> Medical Records
          </Title>
          <Text type="secondary">View and manage patient medical records</Text>
        </div>
        <Space>
          <Select
            allowClear
            placeholder="Filter by type"
            style={{ width: 180 }}
            value={typeFilter}
            onChange={setTypeFilter}
          >
            {uniqueTypes.map(t => (
              <Select.Option key={t} value={t}>
                {t?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </Select.Option>
            ))}
          </Select>
          <Input
            placeholder="Search records..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 220 }}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchRecords}>Refresh</Button>
        </Space>
      </div>

      <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15, showTotal: (total) => `Total ${total} records` }}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ padding: '8px 0' }}>
                {record.description && <div><Text strong>Description: </Text>{record.description}</div>}
                {record.medications && <div style={{ marginTop: 4 }}><Text strong>Medications: </Text>{record.medications}</div>}
              </div>
            ),
          }}
        />
      </Card>
    </div>
  );
};

export default Records;
