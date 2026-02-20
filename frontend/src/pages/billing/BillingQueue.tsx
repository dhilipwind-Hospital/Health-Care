import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button, Space, Typography, Tag, message, Row, Col, Modal, Table, Descriptions, Divider, InputNumber, Form, Select, Input } from 'antd';
import {
  UserOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  PrinterOutlined,
  ReloadOutlined,
  FileTextOutlined,
  CreditCardOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import { getQueue, serveQueueItem } from '../../services/queue.service';
import api from '../../services/api';
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
  
  &.pending .stat-value { color: #F59E0B; }
  &.completed .stat-value { color: #10B981; }
  &.total .stat-value { color: #1E3A5F; }
  &.revenue .stat-value { color: #0EA5E9; }
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
    width: 80px;
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
  
  .amount {
    width: 120px;
    font-size: 16px;
    font-weight: 600;
    color: #1E3A5F;
    text-align: right;
  }
  
  .status {
    width: 100px;
    text-align: center;
  }
  
  .actions {
    width: 200px;
    text-align: right;
  }
`;

const BillingQueue: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [queue, setQueue] = useState<any[]>([]);
  const [billingModalVisible, setBillingModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [billItems, setBillItems] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [form] = Form.useForm();

  const fetchQueue = async () => {
    try {
      const items = await getQueue('billing');
      setQueue(items || []);
    } catch (e) {
      console.error('Failed to fetch billing queue:', e);
    }
  };

  useEffect(() => {
    fetchQueue();
    const t = setInterval(fetchQueue, 5000);
    return () => clearInterval(t);
  }, []);

  const stats = useMemo(() => {
    const pending = queue.filter(q => q.status === 'waiting' || q.status === 'called').length;
    const completed = queue.filter(q => q.status === 'served').length;
    const total = queue.length;
    return { pending, completed, total };
  }, [queue]);

  const handleOpenBilling = async (item: any) => {
    setSelectedItem(item);
    setBillingModalVisible(true);
    
    // Fetch billable items for this visit
    try {
      const visitId = item.visitId;
      const patientId = item.visit?.patient?.id || item.visit?.patientId;
      
      // Fetch prescriptions, lab orders, consultation for this visit
      const items: any[] = [];
      
      // Add consultation fee
      items.push({
        id: 'consultation',
        description: 'Consultation Fee',
        quantity: 1,
        unitPrice: 500,
        amount: 500,
        source: 'consultation',
      });
      
      // Fetch prescriptions
      if (patientId) {
        try {
          const prescRes = await api.get(`/prescriptions?patientId=${patientId}&limit=10`);
          const prescriptions = prescRes.data?.data || [];
          prescriptions.forEach((p: any, idx: number) => {
            const medCount = p.medications?.length || 1;
            items.push({
              id: `presc-${p.id}`,
              description: `Prescription - ${medCount} medication(s)`,
              quantity: 1,
              unitPrice: medCount * 100,
              amount: medCount * 100,
              source: 'prescription',
              sourceId: p.id,
            });
          });
        } catch {}
      }
      
      // Fetch lab orders
      if (patientId) {
        try {
          const labRes = await api.get(`/laboratory/orders?patientId=${patientId}&limit=10`);
          const labOrders = labRes.data?.data || [];
          labOrders.forEach((l: any) => {
            items.push({
              id: `lab-${l.id}`,
              description: `Lab Test - ${l.testType || 'Test'}`,
              quantity: 1,
              unitPrice: 300,
              amount: 300,
              source: 'lab',
              sourceId: l.id,
            });
          });
        } catch {}
      }
      
      setBillItems(items);
    } catch (e) {
      console.error('Failed to fetch billable items:', e);
      setBillItems([{
        id: 'consultation',
        description: 'Consultation Fee',
        quantity: 1,
        unitPrice: 500,
        amount: 500,
        source: 'consultation',
      }]);
    }
  };

  const calculateTotal = () => {
    return billItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  const handleProcessPayment = async () => {
    try {
      setProcessing(true);
      const values = form.getFieldsValue();
      
      // Create invoice
      const invoiceData = {
        patientId: selectedItem?.visit?.patient?.id || selectedItem?.visit?.patientId,
        visitId: selectedItem?.visitId,
        items: billItems,
        subtotal: calculateTotal(),
        tax: 0,
        discount: values.discount || 0,
        total: calculateTotal() - (values.discount || 0),
        paymentMethod: values.paymentMethod,
        status: 'Paid',
        paidDate: new Date().toISOString(),
      };
      
      try {
        await api.post('/billing/invoices', invoiceData);
      } catch (e) {
        console.log('Invoice API not available, continuing...');
      }
      
      // Mark queue item as served
      await serveQueueItem(selectedItem.id);
      
      message.success('Payment processed successfully!');
      setBillingModalVisible(false);
      setSelectedItem(null);
      setBillItems([]);
      form.resetFields();
      fetchQueue();
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    message.info('Printing receipt...');
    // In a real implementation, this would trigger print functionality
  };

  const getStatusTag = (item: any) => {
    if (item.status === 'served') {
      return <Tag color="green">Paid</Tag>;
    }
    if (item.status === 'called') {
      return <Tag color="blue">Processing</Tag>;
    }
    return <Tag color="orange">Pending</Tag>;
  };

  return (
    <PageContainer>
      <PageHeader>
        <div className="title-section">
          <h2>Billing Queue</h2>
          <div className="subtitle">Process patient payments after consultation</div>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchQueue}>
            Refresh
          </Button>
        </Space>
      </PageHeader>

      {/* Stats Row */}
      <StatsRow gutter={16}>
        <Col xs={12} sm={6}>
          <StatCard className="pending">
            <div className="stat-label">PENDING</div>
            <div className="stat-value">{stats.pending}</div>
          </StatCard>
        </Col>
        <Col xs={12} sm={6}>
          <StatCard className="completed">
            <div className="stat-label">COMPLETED TODAY</div>
            <div className="stat-value">{stats.completed}</div>
          </StatCard>
        </Col>
        <Col xs={12} sm={6}>
          <StatCard className="total">
            <div className="stat-label">TOTAL IN QUEUE</div>
            <div className="stat-value">{stats.total}</div>
          </StatCard>
        </Col>
        <Col xs={12} sm={6}>
          <StatCard className="revenue">
            <div className="stat-label">TODAY'S REVENUE</div>
            <div className="stat-value">₹0</div>
          </StatCard>
        </Col>
      </StatsRow>

      {/* Billing Queue */}
      <QueueCard title="Patients Awaiting Billing">
        {/* Header */}
        <div style={{ display: 'flex', padding: '12px 20px', background: '#F8FAFC', borderBottom: '1px solid rgba(30, 58, 95, 0.08)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', color: '#666' }}>
          <div style={{ width: 80 }}>Token</div>
          <div style={{ flex: 1, marginLeft: 16 }}>Patient</div>
          <div style={{ width: 120, textAlign: 'right' }}>Est. Amount</div>
          <div style={{ width: 100, textAlign: 'center' }}>Status</div>
          <div style={{ width: 200, textAlign: 'right' }}>Action</div>
        </div>

        {/* Queue Items */}
        {queue.length > 0 ? (
          queue.map((item) => {
            const patient = item?.visit?.patient || {};
            return (
              <PatientRow key={item.id}>
                <div className="token">{item.tokenNumber}</div>
                <div className="patient-info">
                  <div className="name">{patient.firstName || ''} {patient.lastName || ''}</div>
                  <div className="meta">
                    {patient.phone || ''} • Visit: {dayjs(item.createdAt).format('h:mm A')}
                  </div>
                </div>
                <div className="amount">₹500+</div>
                <div className="status">
                  {getStatusTag(item)}
                </div>
                <div className="actions">
                  {item.status !== 'served' && (
                    <Space>
                      <Button
                        type="primary"
                        size="small"
                        icon={<DollarOutlined />}
                        onClick={() => handleOpenBilling(item)}
                      >
                        Process Bill
                      </Button>
                    </Space>
                  )}
                  {item.status === 'served' && (
                    <Button size="small" icon={<PrinterOutlined />} onClick={handlePrintReceipt}>
                      Print Receipt
                    </Button>
                  )}
                </div>
              </PatientRow>
            );
          })
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
            No patients in billing queue
          </div>
        )}
      </QueueCard>

      {/* Billing Modal */}
      <Modal
        title={`Process Payment - ${selectedItem?.visit?.patient?.firstName || ''} ${selectedItem?.visit?.patient?.lastName || ''}`}
        open={billingModalVisible}
        onCancel={() => {
          setBillingModalVisible(false);
          setSelectedItem(null);
          setBillItems([]);
        }}
        footer={null}
        width={700}
      >
        <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Token">{selectedItem?.tokenNumber}</Descriptions.Item>
          <Descriptions.Item label="Patient ID">{selectedItem?.visit?.patient?.displayPatientId || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Visit Date">{dayjs(selectedItem?.createdAt).format('DD/MM/YYYY')}</Descriptions.Item>
          <Descriptions.Item label="Doctor">
            {selectedItem?.visit?.doctor ? `Dr. ${selectedItem.visit.doctor.firstName} ${selectedItem.visit.doctor.lastName}` : 'N/A'}
          </Descriptions.Item>
        </Descriptions>

        <Divider>Bill Items</Divider>

        <Table
          dataSource={billItems}
          columns={[
            { title: 'Description', dataIndex: 'description', key: 'description' },
            { title: 'Qty', dataIndex: 'quantity', key: 'quantity', width: 60 },
            { title: 'Unit Price', dataIndex: 'unitPrice', key: 'unitPrice', render: (v: number) => `₹${v}`, width: 100 },
            { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v: number) => `₹${v}`, width: 100 },
          ]}
          pagination={false}
          size="small"
          rowKey="id"
          summary={() => (
            <Table.Summary>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={3}><strong>Total</strong></Table.Summary.Cell>
                <Table.Summary.Cell index={1}><strong>₹{calculateTotal()}</strong></Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />

        <Divider>Payment Details</Divider>

        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="paymentMethod" label="Payment Method" initialValue="Cash">
                <Select>
                  <Select.Option value="Cash">Cash</Select.Option>
                  <Select.Option value="Credit Card">Credit Card</Select.Option>
                  <Select.Option value="Debit Card">Debit Card</Select.Option>
                  <Select.Option value="UPI">UPI</Select.Option>
                  <Select.Option value="Insurance">Insurance</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="discount" label="Discount (₹)" initialValue={0}>
                <InputNumber min={0} max={calculateTotal()} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Any additional notes..." />
          </Form.Item>
        </Form>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
          <div>
            <Text strong style={{ fontSize: 18 }}>
              Final Amount: ₹{calculateTotal() - (form.getFieldValue('discount') || 0)}
            </Text>
          </div>
          <Space>
            <Button onClick={() => setBillingModalVisible(false)}>Cancel</Button>
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleProcessPayment} loading={processing}>
              Process Payment
            </Button>
          </Space>
        </div>
      </Modal>
    </PageContainer>
  );
};

export default BillingQueue;
