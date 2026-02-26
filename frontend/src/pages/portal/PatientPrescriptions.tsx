import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Typography, Space, Button, Empty, message, Input, Select, Modal, Descriptions, Divider } from 'antd';
import {
  MedicineBoxOutlined,
  SearchOutlined,
  EyeOutlined,
  PrinterOutlined,
  CalendarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface PrescriptionItem {
  id: string;
  medicine?: { id: string; name: string; dosageForm?: string; strength?: string };
  name?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  quantity?: number;
  instructions?: string;
  status?: string;
}

interface Prescription {
  id: string;
  prescriptionDate?: string;
  createdAt?: string;
  status: string;
  diagnosis?: string;
  notes?: string;
  doctor?: { id: string; firstName?: string; lastName?: string; specialization?: string };
  items?: PrescriptionItem[];
  medications?: PrescriptionItem[];
}

const PatientPrescriptions: React.FC = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      // Try patient-specific endpoint first
      let data: Prescription[] = [];
      try {
        const res = await api.get(`/prescriptions/patient/${user?.id}`);
        data = res.data?.data || res.data || [];
      } catch {
        // Fallback: try with query param
        try {
          const res = await api.get('/prescriptions', { params: { patientId: user?.id } });
          data = res.data?.data || res.data || [];
        } catch {
          // Final fallback
          data = [];
        }
      }
      setPrescriptions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'orange';
      case 'dispensed': return 'green';
      case 'partially_dispensed': return 'blue';
      case 'cancelled': return 'red';
      case 'expired': return 'default';
      default: return 'default';
    }
  };

  const filteredPrescriptions = prescriptions.filter(p => {
    const matchesSearch = searchText
      ? (p.doctor?.firstName || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (p.doctor?.lastName || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (p.diagnosis || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (p.id || '').toLowerCase().includes(searchText.toLowerCase())
      : true;
    const matchesStatus = statusFilter === 'all' ? true : p.status?.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewDetail = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setDetailModalVisible(true);
  };

  const handlePrint = (prescription: Prescription) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const items = prescription.items || prescription.medications || [];
    const doctorName = `Dr. ${prescription.doctor?.firstName || ''} ${prescription.doctor?.lastName || ''}`.trim();
    const date = dayjs(prescription.prescriptionDate || prescription.createdAt).format('DD MMM YYYY');

    printWindow.document.write(`
      <html>
      <head>
        <title>Prescription - ${prescription.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #10B981; padding-bottom: 16px; margin-bottom: 24px; }
          .header h1 { color: #10B981; margin: 0; }
          .header p { color: #666; margin: 4px 0; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 16px; }
          .info-item { }
          .info-label { font-weight: bold; color: #555; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          th { background: #f8f9fa; color: #333; text-align: left; padding: 10px; border: 1px solid #dee2e6; }
          td { padding: 10px; border: 1px solid #dee2e6; }
          .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; }
          .diagnosis { background: #f0fdf4; padding: 12px; border-radius: 8px; margin-bottom: 16px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Ayphen Care HMS</h1>
          <p>Prescription</p>
        </div>
        <div class="info-row">
          <div class="info-item"><span class="info-label">Patient:</span> ${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}</div>
          <div class="info-item"><span class="info-label">Date:</span> ${date}</div>
        </div>
        <div class="info-row">
          <div class="info-item"><span class="info-label">Doctor:</span> ${doctorName}</div>
          <div class="info-item"><span class="info-label">Status:</span> ${prescription.status}</div>
        </div>
        ${prescription.diagnosis ? `<div class="diagnosis"><span class="info-label">Diagnosis:</span> ${prescription.diagnosis}</div>` : ''}
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Medicine</th>
              <th>Dosage</th>
              <th>Frequency</th>
              <th>Duration</th>
              <th>Qty</th>
              <th>Instructions</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${item.medicine?.name || item.name || '-'}</td>
                <td>${item.dosage || '-'}</td>
                <td>${item.frequency || '-'}</td>
                <td>${item.duration || '-'}</td>
                <td>${item.quantity || '-'}</td>
                <td>${item.instructions || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${prescription.notes ? `<p><strong>Notes:</strong> ${prescription.notes}</p>` : ''}
        <div class="footer">
          <p>This is a computer-generated prescription. Please consult your doctor for any queries.</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'prescriptionDate',
      key: 'date',
      render: (_: any, record: Prescription) => (
        <Space>
          <CalendarOutlined />
          {dayjs(record.prescriptionDate || record.createdAt).format('DD MMM YYYY')}
        </Space>
      ),
      sorter: (a: Prescription, b: Prescription) =>
        dayjs(a.prescriptionDate || a.createdAt).unix() - dayjs(b.prescriptionDate || b.createdAt).unix(),
      defaultSortOrder: 'descend' as const,
    },
    {
      title: 'Doctor',
      key: 'doctor',
      render: (_: any, record: Prescription) => (
        <Space>
          <UserOutlined />
          <div>
            <div>Dr. {record.doctor?.firstName} {record.doctor?.lastName}</div>
            {record.doctor?.specialization && (
              <Text type="secondary" style={{ fontSize: 12 }}>{record.doctor.specialization}</Text>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Diagnosis',
      dataIndex: 'diagnosis',
      key: 'diagnosis',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: 'Medicines',
      key: 'medicines',
      render: (_: any, record: Prescription) => {
        const items = record.items || record.medications || [];
        return (
          <Space direction="vertical" size={0}>
            {items.slice(0, 2).map((item, idx) => (
              <Text key={idx} style={{ fontSize: 13 }}>
                <MedicineBoxOutlined style={{ marginRight: 4, color: '#10B981' }} />
                {item.medicine?.name || item.name || 'Unknown'}
              </Text>
            ))}
            {items.length > 2 && <Text type="secondary" style={{ fontSize: 12 }}>+{items.length - 2} more</Text>}
          </Space>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{(status || 'unknown').replace(/_/g, ' ').toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Prescription) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>View</Button>
          <Button type="link" icon={<PrinterOutlined />} onClick={() => handlePrint(record)}>Print</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '0 0 24px 0' }}>
      <Card
        title={
          <Space>
            <MedicineBoxOutlined style={{ color: '#10B981' }} />
            <span>My Prescriptions</span>
          </Space>
        }
        extra={
          <Space>
            <Input
              placeholder="Search prescriptions..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 220 }}
              allowClear
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 160 }}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'pending', label: 'Pending' },
                { value: 'dispensed', label: 'Dispensed' },
                { value: 'partially_dispensed', label: 'Partially Dispensed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredPrescriptions}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (total) => `${total} prescriptions` }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No prescriptions found"
              />
            ),
          }}
        />
      </Card>

      {/* Prescription Detail Modal */}
      <Modal
        title={
          <Space>
            <MedicineBoxOutlined style={{ color: '#10B981' }} />
            Prescription Details
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>Close</Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => selectedPrescription && handlePrint(selectedPrescription)}>
            Print Prescription
          </Button>,
        ]}
        width={700}
      >
        {selectedPrescription && (
          <>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Prescription ID">{selectedPrescription.id}</Descriptions.Item>
              <Descriptions.Item label="Date">
                {dayjs(selectedPrescription.prescriptionDate || selectedPrescription.createdAt).format('DD MMM YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Doctor">
                Dr. {selectedPrescription.doctor?.firstName} {selectedPrescription.doctor?.lastName}
              </Descriptions.Item>
              <Descriptions.Item label="Specialization">
                {selectedPrescription.doctor?.specialization || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Status" span={2}>
                <Tag color={getStatusColor(selectedPrescription.status)}>
                  {(selectedPrescription.status || 'unknown').replace(/_/g, ' ').toUpperCase()}
                </Tag>
              </Descriptions.Item>
              {selectedPrescription.diagnosis && (
                <Descriptions.Item label="Diagnosis" span={2}>{selectedPrescription.diagnosis}</Descriptions.Item>
              )}
            </Descriptions>

            <Divider>Medications</Divider>

            <Table
              size="small"
              pagination={false}
              dataSource={selectedPrescription.items || selectedPrescription.medications || []}
              rowKey={(_, idx) => String(idx)}
              columns={[
                { title: '#', render: (_, __, idx) => idx + 1, width: 40 },
                { title: 'Medicine', render: (_, r: PrescriptionItem) => r.medicine?.name || r.name || '-' },
                { title: 'Dosage', dataIndex: 'dosage', render: (v: string) => v || '-' },
                { title: 'Frequency', dataIndex: 'frequency', render: (v: string) => v || '-' },
                { title: 'Duration', dataIndex: 'duration', render: (v: string) => v || '-' },
                { title: 'Qty', dataIndex: 'quantity', render: (v: number) => v || '-' },
                { title: 'Instructions', dataIndex: 'instructions', ellipsis: true, render: (v: string) => v || '-' },
              ]}
            />

            {selectedPrescription.notes && (
              <>
                <Divider>Notes</Divider>
                <Text>{selectedPrescription.notes}</Text>
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default PatientPrescriptions;
