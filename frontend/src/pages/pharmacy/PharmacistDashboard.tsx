import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Table,
  Tag,
  Button,
  Input,
  Space,
  Tabs,
  Badge,
  Statistic,
  message,
  Modal,
  Form,
  Select,
  InputNumber,
  Empty,
} from 'antd';
import {
  MedicineBoxOutlined,
  SearchOutlined,
  FileTextOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ShoppingCartOutlined,
  ReloadOutlined,
  PlusOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import api from '../../services/api';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

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
  
  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    margin-bottom: 12px;
  }
  
  .stat-value {
    font-size: 28px;
    font-weight: 700;
    line-height: 1.2;
    color: #1E3A5F;
  }
  
  .stat-label {
    font-size: 13px;
    color: #666;
    margin-top: 4px;
  }
  
  &.pending .stat-icon { background: #FEF3C7; color: #F59E0B; }
  &.dispensed .stat-icon { background: #D1FAE5; color: #10B981; }
  &.low-stock .stat-icon { background: #FEE2E2; color: #EF4444; }
  &.expiring .stat-icon { background: #E0F2FE; color: #0EA5E9; }
`;

const ContentCard = styled(Card)`
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

const PrescriptionRow = styled.div`
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
  
  .rx-id {
    font-size: 14px;
    font-weight: 600;
    color: #1E3A5F;
    width: 100px;
  }
  
  .patient-info {
    flex: 1;
    
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
    color: #666;
  }
  
  .items {
    width: 80px;
    text-align: center;
  }
  
  .status {
    width: 100px;
  }
  
  .actions {
    width: 120px;
    text-align: right;
  }
`;

const QuickActionCard = styled(Card)`
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
    }
  }
  
  .ant-card-body {
    padding: 16px 20px;
  }
`;

const ActionButton = styled(Button)`
  height: 40px;
  border-radius: 8px;
  font-weight: 500;
  width: 100%;
  margin-bottom: 8px;
  
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
    }
  }
`;

const AlertCard = styled(Card)`
  border-radius: 12px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  background: #FEF2F2;
  
  .ant-card-head {
    border-bottom: 1px solid rgba(239, 68, 68, 0.2);
    background: transparent;
    
    .ant-card-head-title {
      color: #EF4444;
      font-size: 14px;
      font-weight: 600;
    }
  }
  
  .ant-card-body {
    padding: 12px 16px;
  }
  
  .alert-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
    border-bottom: 1px solid rgba(239, 68, 68, 0.1);
    
    &:last-child {
      border-bottom: none;
    }
    
    .name {
      flex: 1;
      font-weight: 500;
      color: #1a1a2e;
    }
    
    .stock {
      color: #EF4444;
      font-weight: 600;
    }
  }
`;

const PharmacistDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchText, setSearchText] = useState('');
  const [dispenseModalVisible, setDispenseModalVisible] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [dispenseForm] = Form.useForm();
  const [dispensing, setDispensing] = useState(false);

  useEffect(() => {
    fetchPrescriptions();
    fetchMedicines();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      // Try multiple endpoints to get prescriptions
      let prescriptionsData: any[] = [];
      
      // First try the pharmacy/prescriptions/all endpoint for all prescriptions
      try {
        const allRes = await api.get('/pharmacy/prescriptions/all');
        prescriptionsData = allRes.data?.data || [];
      } catch {
        // Fallback to pending prescriptions
        try {
          const pendingRes = await api.get('/pharmacy/prescriptions/pending');
          prescriptionsData = pendingRes.data?.data || [];
        } catch {
          // Try the prescriptions/pharmacy endpoint
          try {
            const pharmacyRes = await api.get('/prescriptions/pharmacy');
            prescriptionsData = pharmacyRes.data?.data || [];
          } catch {
            // Final fallback to root prescriptions endpoint
            const rootRes = await api.get('/prescriptions');
            prescriptionsData = rootRes.data?.data || [];
          }
        }
      }
      
      setPrescriptions(prescriptionsData);
    } catch (e) {
      console.error('Failed to fetch prescriptions:', e);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      const res = await api.get('/pharmacy/medicines', { params: { limit: 100 } });
      setMedicines(res.data?.data || []);
    } catch (e) {
      // Mock data
      setMedicines([
        { id: '1', name: 'Paracetamol 500mg', currentStock: 50, reorderLevel: 100, expiryDate: '2025-06-01' },
        { id: '2', name: 'Amoxicillin 250mg', currentStock: 30, reorderLevel: 50, expiryDate: '2025-03-15' },
        { id: '3', name: 'Metformin 500mg', currentStock: 200, reorderLevel: 100, expiryDate: '2026-01-01' },
      ]);
    }
  };

  const handleDispense = (prescription: any) => {
    setSelectedPrescription(prescription);
    setDispenseModalVisible(true);
    dispenseForm.setFieldsValue({
      medications: prescription.medications?.map((m: any) => ({
        name: m.name,
        quantity: m.quantity,
        dispensed: m.quantity,
      })),
    });
  };

  const handleDispenseSubmit = async () => {
    try {
      setDispensing(true);
      // API call to dispense prescription
      if (selectedPrescription?.id) {
        await api.put(`/pharmacy/prescriptions/${selectedPrescription.id}/dispense`, {
          medications: selectedPrescription.medications,
        });
      }
      message.success('Prescription dispensed successfully');
      setDispenseModalVisible(false);
      fetchPrescriptions();
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to dispense prescription');
    } finally {
      setDispensing(false);
    }
  };

  const handlePointOfSale = () => {
    navigate('/pharmacy/prescriptions');
  };

  const handleCheckInventory = () => {
    navigate('/pharmacy/inventory');
  };

  const handleGenerateReport = () => {
    navigate('/pharmacy/inventory/reports');
  };

  // Stats
  const stats = {
    pending: prescriptions.filter(p => p.status === 'pending').length,
    dispensed: prescriptions.filter(p => p.status === 'dispensed').length,
    lowStock: medicines.filter(m => m.currentStock <= m.reorderLevel).length,
    expiringSoon: medicines.filter(m => dayjs(m.expiryDate).diff(dayjs(), 'month') <= 3).length,
  };

  // Filter prescriptions
  const filteredPrescriptions = prescriptions.filter(p => {
    if (activeTab === 'pending' && p.status !== 'pending') return false;
    if (activeTab === 'dispensed' && p.status !== 'dispensed') return false;
    if (searchText) {
      const search = searchText.toLowerCase();
      const patientName = `${p.patient?.firstName || ''} ${p.patient?.lastName || ''}`.toLowerCase();
      return patientName.includes(search) || p.id?.toLowerCase().includes(search);
    }
    return true;
  });

  const lowStockMedicines = medicines.filter(m => m.currentStock <= m.reorderLevel);

  return (
    <PageContainer>
      <PageHeader>
        <div className="title-section">
          <h2>Pharmacy Dashboard</h2>
          <div className="subtitle">Prescription Management & Inventory</div>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { fetchPrescriptions(); fetchMedicines(); }}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />}>
            New Sale
          </Button>
        </Space>
      </PageHeader>

      {/* Stats Row */}
      <StatsRow gutter={16}>
        <Col xs={12} sm={6}>
          <StatCard className="pending">
            <div className="stat-icon">
              <ClockCircleOutlined />
            </div>
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending Prescriptions</div>
          </StatCard>
        </Col>
        <Col xs={12} sm={6}>
          <StatCard className="dispensed">
            <div className="stat-icon">
              <CheckCircleOutlined />
            </div>
            <div className="stat-value">{stats.dispensed}</div>
            <div className="stat-label">Dispensed Today</div>
          </StatCard>
        </Col>
        <Col xs={12} sm={6}>
          <StatCard className="low-stock">
            <div className="stat-icon">
              <WarningOutlined />
            </div>
            <div className="stat-value">{stats.lowStock}</div>
            <div className="stat-label">Low Stock Items</div>
          </StatCard>
        </Col>
        <Col xs={12} sm={6}>
          <StatCard className="expiring">
            <div className="stat-icon">
              <MedicineBoxOutlined />
            </div>
            <div className="stat-value">{stats.expiringSoon}</div>
            <div className="stat-label">Expiring Soon</div>
          </StatCard>
        </Col>
      </StatsRow>

      <Row gutter={24}>
        {/* Main Content */}
        <Col xs={24} lg={16}>
          <ContentCard
            title="Prescriptions"
            extra={
              <Space>
                <Input
                  placeholder="Search prescription..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: 200 }}
                  allowClear
                />
                <Tabs
                  activeKey={activeTab}
                  onChange={setActiveTab}
                  items={[
                    { key: 'pending', label: <Badge count={stats.pending} offset={[10, 0]}>Pending</Badge> },
                    { key: 'dispensed', label: 'Dispensed' },
                    { key: 'all', label: 'All' },
                  ]}
                  style={{ marginBottom: 0 }}
                />
              </Space>
            }
          >
            {/* Header */}
            <div style={{ display: 'flex', padding: '12px 20px', background: '#F8FAFC', borderBottom: '1px solid rgba(30, 58, 95, 0.08)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', color: '#666' }}>
              <div style={{ width: 100 }}>Rx ID</div>
              <div style={{ flex: 1 }}>Patient</div>
              <div style={{ width: 140 }}>Doctor</div>
              <div style={{ width: 80, textAlign: 'center' }}>Items</div>
              <div style={{ width: 100 }}>Status</div>
              <div style={{ width: 120, textAlign: 'right' }}>Action</div>
            </div>

            {/* Prescription Items */}
            {filteredPrescriptions.length > 0 ? (
              filteredPrescriptions.map((rx) => (
                <PrescriptionRow key={rx.id}>
                  <div className="rx-id">{rx.id}</div>
                  <div className="patient-info">
                    <div className="name">{rx.patient?.firstName} {rx.patient?.lastName}</div>
                    <div className="meta">{dayjs(rx.createdAt).format('h:mm A')}</div>
                  </div>
                  <div className="doctor">Dr. {rx.doctor?.firstName} {rx.doctor?.lastName}</div>
                  <div className="items">
                    <Badge count={rx.medications?.length || 0} style={{ backgroundColor: '#1E3A5F' }} />
                  </div>
                  <div className="status">
                    <Tag color={rx.status === 'pending' ? 'gold' : 'green'}>
                      {rx.status === 'pending' ? 'Pending' : 'Dispensed'}
                    </Tag>
                  </div>
                  <div className="actions">
                    {rx.status === 'pending' ? (
                      <Button type="primary" size="small" onClick={() => handleDispense(rx)}>
                        Dispense
                      </Button>
                    ) : (
                      <Button size="small" icon={<PrinterOutlined />}>Print</Button>
                    )}
                  </div>
                </PrescriptionRow>
              ))
            ) : (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <Empty description="No prescriptions found" />
              </div>
            )}
          </ContentCard>
        </Col>

        {/* Sidebar */}
        <Col xs={24} lg={8}>
          {/* Quick Actions */}
          <QuickActionCard title={<><span>⚡</span> Quick Actions</>}>
            <ActionButton className="primary-action" icon={<ShoppingCartOutlined />} onClick={handlePointOfSale}>
              Point of Sale
            </ActionButton>
            <ActionButton className="secondary-action" icon={<MedicineBoxOutlined />} onClick={handleCheckInventory}>
              Check Inventory
            </ActionButton>
            <ActionButton className="secondary-action" icon={<FileTextOutlined />} onClick={handleGenerateReport}>
              Generate Report
            </ActionButton>
          </QuickActionCard>

          {/* Low Stock Alerts */}
          {lowStockMedicines.length > 0 && (
            <AlertCard title={<><WarningOutlined /> Low Stock Alerts</>}>
              {lowStockMedicines.slice(0, 5).map((med) => (
                <div className="alert-item" key={med.id}>
                  <span className="name">{med.name}</span>
                  <span className="stock">{med.currentStock} left</span>
                </div>
              ))}
              {lowStockMedicines.length > 5 && (
                <Button type="link" size="small">View all {lowStockMedicines.length} items</Button>
              )}
            </AlertCard>
          )}

          {/* Today's Summary */}
          <QuickActionCard title="Today's Summary" style={{ marginTop: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="Total Sales" value={12} prefix="₹" suffix="K" />
              </Col>
              <Col span={12}>
                <Statistic title="Prescriptions" value={stats.dispensed + stats.pending} />
              </Col>
            </Row>
          </QuickActionCard>
        </Col>
      </Row>

      {/* Dispense Modal */}
      <Modal
        title={`Dispense Prescription: ${selectedPrescription?.id}`}
        open={dispenseModalVisible}
        onCancel={() => setDispenseModalVisible(false)}
        onOk={handleDispenseSubmit}
        okText="Dispense"
        confirmLoading={dispensing}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>Patient: </Text>
          <Text>{selectedPrescription?.patient?.firstName} {selectedPrescription?.patient?.lastName}</Text>
        </div>
        <Table
          dataSource={selectedPrescription?.medications || []}
          columns={[
            { title: 'Medication', dataIndex: 'name', key: 'name' },
            { title: 'Prescribed', dataIndex: 'quantity', key: 'quantity' },
            {
              title: 'Dispense',
              key: 'dispense',
              render: (_: any, record: any) => (
                <InputNumber min={0} max={record.quantity} defaultValue={record.quantity} />
              ),
            },
          ]}
          pagination={false}
          size="small"
          rowKey="name"
        />
      </Modal>
    </PageContainer>
  );
};

export default PharmacistDashboard;
