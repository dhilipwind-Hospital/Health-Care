import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, Row, Col, Typography, Input, Select, Modal, Form, message, Tabs, Statistic, DatePicker, Progress } from 'antd';
import api from '../../services/api';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  SearchOutlined,
  DollarOutlined,
  CreditCardOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  PrinterOutlined,
  DownloadOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  source?: string; // 'appointment' | 'lab' | 'prescription' | 'manual'
  sourceId?: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  services: ServiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  paymentMethod?: string;
  insuranceClaimId?: string;
  notes?: string;
}

interface ServiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  department: string;
}

interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMethod: 'Cash' | 'Credit Card' | 'Insurance' | 'Bank Transfer' | 'Check';
  paymentDate: string;
  transactionId?: string;
  status: 'Completed' | 'Pending' | 'Failed';
  notes?: string;
}

const BillingManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('invoices');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [form] = Form.useForm();
  const [patients, setPatients] = useState<any[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBillables, setLoadingBillables] = useState(false);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [discountRate, setDiscountRate] = useState<number>(0);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [paymentForm] = Form.useForm();
  const [savingPayment, setSavingPayment] = useState(false);

  // Sample data - initialized as empty, fetch from API
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [patientsRes, invoicesRes] = await Promise.all([
          api.get('/users?role=patient&limit=100'),
          api.get('/billing'),
        ]);
        setPatients(patientsRes.data?.data || []);
        // Map backend invoice format to frontend format
        const invoiceData = invoicesRes.data?.data || [];
        const mappedInvoices = invoiceData.map((inv: any) => ({
          ...inv,
          services: inv.items || [],
          total: inv.totalAmount || inv.total || 0,
          subtotal: inv.subtotal || 0,
          tax: inv.taxAmount || inv.tax || 0,
          discount: inv.discountAmount || inv.discount || 0,
        }));
        setInvoices(mappedInvoices);
        // Load payments
        const paymentsRes = await api.get('/billing/payments/all').catch(() => ({ data: { data: [] } }));
        setPayments(paymentsRes.data?.data || []);
      } catch (e) {
        console.error('Failed to load data');
      }
    };
    loadData();
  }, []);

  const invoiceColumns = [
    {
      title: 'Invoice',
      key: 'invoice',
      render: (record: Invoice) => (
        <div>
          <div style={{ fontWeight: 600, color: '#10B981' }}>{record.invoiceNumber}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.issueDate}</div>
        </div>
      ),
    },
    {
      title: 'Patient',
      key: 'patient',
      render: (record: Invoice) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.patientName}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.patientEmail}</div>
        </div>
      ),
    },
    {
      title: 'Services',
      dataIndex: 'services',
      key: 'services',
      render: (services: ServiceItem[] | undefined) => {
        const items = services || [];
        return (
          <div>
            <Text strong>{items.length}</Text>
            <Text type="secondary"> services</Text>
            <div style={{ marginTop: 4 }}>
              {items.slice(0, 2).map((service, idx) => (
                <Tag key={service?.id || idx} style={{ fontSize: '10px', marginBottom: 2 }}>
                  {service?.description || 'Item'}
                </Tag>
              ))}
              {items.length > 2 && (
                <Tag style={{ fontSize: '10px' }}>
                  +{items.length - 2} more
                </Tag>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Amount',
      dataIndex: 'total',
      key: 'total',
      render: (total: number | undefined) => (
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#10B981' }}>
            ₹{(total || 0).toFixed(2)}
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: Invoice) => {
        const colors = {
          Draft: '#d9d9d9',
          Sent: '#1890ff',
          Paid: '#52c41a',
          Overdue: '#ff4d4f',
          Cancelled: '#ff4d4f'
        };
        const icons = {
          Draft: <EditOutlined />,
          Sent: <ClockCircleOutlined />,
          Paid: <CheckCircleOutlined />,
          Overdue: <ExclamationCircleOutlined />,
          Cancelled: <ExclamationCircleOutlined />
        };
        return (
          <div>
            <Tag color={colors[status as keyof typeof colors]} icon={icons[status as keyof typeof icons]}>
              {status}
            </Tag>
            {status === 'Overdue' && (
              <div style={{ fontSize: '10px', color: '#ff4d4f' }}>
                Due: {record.dueDate}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Invoice) => (
        <Space>
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            onClick={() => handleViewInvoice(record)}
          />
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEditInvoice(record)}
          />
          <Button 
            type="text" 
            icon={<PrinterOutlined />} 
            onClick={() => handlePrintInvoice(record)}
          />
          {record.status === 'Sent' && (
            <Button 
              type="text" 
              style={{ color: '#52c41a' }}
              onClick={() => handleMarkPaid(record)}
            >
              Mark Paid
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const paymentColumns = [
    {
      title: 'Payment ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <Text code>PAY-{id.padStart(3, '0')}</Text>
      ),
    },
    {
      title: 'Invoice',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
      render: (invoiceId: string) => {
        const invoice = invoices.find(inv => inv.id === invoiceId);
        return invoice ? invoice.invoiceNumber : 'N/A';
      },
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number | undefined) => (
        <Text strong style={{ color: '#10B981' }}>₹{(amount || 0).toFixed(2)}</Text>
      ),
    },
    {
      title: 'Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method: string) => (
        <Tag color="blue">{method}</Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Completed' ? 'green' : status === 'Pending' ? 'orange' : 'red'}>
          {status}
        </Tag>
      ),
    },
  ];

  const handleViewInvoice = (invoice: Invoice) => {
    Modal.info({
      title: `Invoice ${invoice.invoiceNumber}`,
      width: 800,
      content: (
        <div style={{ marginTop: '16px' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Card size="small" title="Patient Information">
                <p><strong>Name:</strong> {invoice.patientName}</p>
                <p><strong>Email:</strong> {invoice.patientEmail}</p>
                <p><strong>Issue Date:</strong> {invoice.issueDate}</p>
                <p><strong>Due Date:</strong> {invoice.dueDate}</p>
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" title="Payment Information">
                <p><strong>Subtotal:</strong> ₹{(invoice.subtotal || 0).toFixed(2)}</p>
                <p><strong>Tax:</strong> ₹{(invoice.tax || 0).toFixed(2)}</p>
                <p><strong>Discount:</strong> ₹{(invoice.discount || 0).toFixed(2)}</p>
                <p><strong>Total:</strong> <Text strong style={{ color: '#10B981' }}>₹{(invoice.total || 0).toFixed(2)}</Text></p>
              </Card>
            </Col>
          </Row>
          <Card size="small" title="Services" style={{ marginTop: '16px' }}>
            <Table
              size="small"
              dataSource={invoice.services}
              rowKey="id"
              pagination={false}
              columns={[
                { title: 'Description', dataIndex: 'description', key: 'description' },
                { title: 'Department', dataIndex: 'department', key: 'department' },
                { title: 'Qty', dataIndex: 'quantity', key: 'quantity', width: 60 },
                { title: 'Unit Price', dataIndex: 'unitPrice', key: 'unitPrice', render: (price: number) => `$${price}` },
                { title: 'Total', dataIndex: 'total', key: 'total', render: (total: number) => `$${total}` }
              ]}
            />
          </Card>
        </div>
      ),
    });
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    form.setFieldsValue(invoice);
    setIsModalVisible(true);
  };

  const handlePrintInvoice = (invoice: Invoice) => {
    message.success(`Printing invoice ${invoice.invoiceNumber}`);
  };

  const handleMarkPaid = (invoice: Invoice) => {
    Modal.confirm({
      title: 'Mark Invoice as Paid',
      content: `Mark invoice ${invoice.invoiceNumber} as paid?`,
      onOk: () => {
        setInvoices(invoices.map(inv => 
          inv.id === invoice.id 
            ? { ...inv, status: 'Paid' as const, paidDate: new Date().toISOString().split('T')[0] }
            : inv
        ));
        message.success('Invoice marked as paid');
      },
    });
  };

  const handleAddInvoice = () => {
    setEditingInvoice(null);
    form.resetFields();
    setInvoiceItems([]);
    setTaxRate(0);
    setDiscountRate(0);
    setIsModalVisible(true);
  };

  // Load billable items when patient is selected
  const loadBillableItems = async (patientId: string) => {
    if (!patientId) {
      setInvoiceItems([]);
      return;
    }
    setLoadingBillables(true);
    try {
      const items: InvoiceItem[] = [];
      let itemId = 1;

      // Load appointments (unbilled)
      try {
        const appointmentsRes = await api.get(`/appointments?patientId=${patientId}&status=completed`);
        const appointments = appointmentsRes.data?.data || appointmentsRes.data || [];
        appointments.forEach((apt: any) => {
          if (apt && !apt.billed) {
            items.push({
              id: String(itemId++),
              description: `Consultation - ${apt.doctorName || apt.doctor?.firstName || 'Doctor'} (${apt.date || ''})`,
              quantity: 1,
              unitPrice: apt.fee || apt.consultationFee || 500,
              amount: apt.fee || apt.consultationFee || 500,
              source: 'appointment',
              sourceId: apt.id,
            });
          }
        });
      } catch (e) { console.log('No appointments'); }

      // Load lab orders (unbilled)
      try {
        const labRes = await api.get(`/lab/orders?patientId=${patientId}`);
        const labOrders = labRes.data?.data || labRes.data || [];
        labOrders.forEach((order: any) => {
          if (order && order.status === 'completed' && !order.billed) {
            const tests = order.items || order.tests || [];
            tests.forEach((test: any) => {
              items.push({
                id: String(itemId++),
                description: `Lab Test - ${test.testName || test.name || 'Test'}`,
                quantity: 1,
                unitPrice: test.price || test.cost || 200,
                amount: test.price || test.cost || 200,
                source: 'lab',
                sourceId: order.id,
              });
            });
          }
        });
      } catch (e) { console.log('No lab orders'); }

      // Load prescriptions (unbilled)
      try {
        const rxRes = await api.get(`/prescriptions?patientId=${patientId}`);
        const prescriptions = rxRes.data?.data || rxRes.data || [];
        prescriptions.forEach((rx: any) => {
          if (rx && !rx.billed) {
            const medicines = rx.items || rx.medicines || [];
            medicines.forEach((med: any) => {
              items.push({
                id: String(itemId++),
                description: `Medicine - ${med.medicineName || med.name || 'Medicine'}`,
                quantity: med.quantity || 1,
                unitPrice: med.price || med.unitPrice || 50,
                amount: (med.quantity || 1) * (med.price || med.unitPrice || 50),
                source: 'prescription',
                sourceId: rx.id,
              });
            });
          }
        });
      } catch (e) { console.log('No prescriptions'); }

      setInvoiceItems(items);
    } catch (e) {
      console.error('Failed to load billable items', e);
    } finally {
      setLoadingBillables(false);
    }
  };

  const addInvoiceItem = () => {
    const newId = String(invoiceItems.length + 1);
    setInvoiceItems([...invoiceItems, { id: newId, description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
  };

  const updateInvoiceItem = (index: number, field: string, value: any) => {
    const updated = [...invoiceItems];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      updated[index].amount = updated[index].quantity * updated[index].unitPrice;
    }
    setInvoiceItems(updated);
  };

  const removeInvoiceItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = invoiceItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const tax = subtotal * (taxRate / 100);
    const discount = subtotal * (discountRate / 100);
    const total = subtotal + tax - discount;
    return { subtotal, tax, discount, total };
  };

  const handleSaveInvoice = async () => {
    try {
      const values = await form.validateFields();
      if (invoiceItems.length === 0 || invoiceItems.every(i => !i.description)) {
        message.error('Add at least one item to the invoice');
        return;
      }

      const patient = patients.find(p => p.id === values.patientId);
      const { subtotal, tax, discount, total } = calculateTotals();

      setLoading(true);
      const payload = {
        patientId: values.patientId,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : '',
        patientEmail: values.patientEmail,
        items: invoiceItems.filter(i => i.description),
        subtotal,
        taxAmount: tax,
        discountAmount: discount,
        totalAmount: total,
        taxRate: taxRate,
        discountRate: discountRate,
        issueDate: values.issueDate?.format('YYYY-MM-DD'),
        dueDate: values.dueDate?.format('YYYY-MM-DD'),
        notes: values.notes,
      };

      if (editingInvoice) {
        await api.put(`/billing/${editingInvoice.id}`, payload);
        message.success('Invoice updated successfully');
      } else {
        await api.post('/billing', payload);
        message.success('Invoice created successfully');
      }

      setIsModalVisible(false);
      form.resetFields();
      setInvoiceItems([]);
      setTaxRate(0);
      setDiscountRate(0);
      // Reload invoices
      const res = await api.get('/billing');
      const invoiceData = res.data?.data || [];
      const mappedInvoices = invoiceData.map((inv: any) => ({
        ...inv,
        services: inv.items || [],
        total: inv.totalAmount || inv.total || 0,
        subtotal: inv.subtotal || 0,
        tax: inv.taxAmount || inv.tax || 0,
        discount: inv.discountAmount || inv.discount || 0,
      }));
      setInvoices(mappedInvoices);
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalRevenue = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + (inv.total || 0), 0);
  const pendingAmount = invoices.filter(inv => inv.status === 'Sent').reduce((sum, inv) => sum + (inv.total || 0), 0);
  const overdueAmount = invoices.filter(inv => inv.status === 'Overdue').reduce((sum, inv) => sum + (inv.total || 0), 0);
  const paidInvoices = invoices.filter(inv => inv.status === 'Paid').length;
  const totalInvoices = invoices.length;
  const collectionRate = totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0;

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ color: '#10B981', marginBottom: '8px' }}>
          <DollarOutlined /> Billing Management
        </Title>
        <Text type="secondary">
          Manage invoices, payments, and billing operations
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={totalRevenue}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending Amount"
              value={pendingAmount}
              prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
              precision={2}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Overdue Amount"
              value={overdueAmount}
              prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
              precision={2}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary">Collection Rate</Text>
              </div>
              <Progress
                type="circle"
                percent={collectionRate}
                size={80}
                strokeColor="#10B981"
                format={percent => `${percent?.toFixed(0)}%`}
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab={<span><FileTextOutlined />Invoices</span>} key="invoices">
          <Card>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Search
                  placeholder="Search invoices..."
                  style={{ width: 300 }}
                  prefix={<SearchOutlined />}
                />
                <Select defaultValue="all" style={{ width: 120 }}>
                  <Option value="all">All Status</Option>
                  <Option value="draft">Draft</Option>
                  <Option value="sent">Sent</Option>
                  <Option value="paid">Paid</Option>
                  <Option value="overdue">Overdue</Option>
                </Select>
                <RangePicker />
              </Space>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleAddInvoice}
                style={{ background: '#10B981', borderColor: '#10B981' }}
              >
                Create Invoice
              </Button>
            </div>
            
            <Table
              columns={invoiceColumns}
              dataSource={invoices}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} invoices`,
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab={<span><CreditCardOutlined />Payments</span>} key="payments">
          <Card>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Search
                  placeholder="Search payments..."
                  style={{ width: 300 }}
                  prefix={<SearchOutlined />}
                />
                <Select defaultValue="all" style={{ width: 120 }}>
                  <Option value="all">All Methods</Option>
                  <Option value="cash">Cash</Option>
                  <Option value="card">Credit Card</Option>
                  <Option value="insurance">Insurance</Option>
                </Select>
                <RangePicker />
              </Space>
              <Button 
                type="primary"
                icon={<PlusOutlined />}
                style={{ background: '#10B981', borderColor: '#10B981' }}
                onClick={() => {
                  paymentForm.resetFields();
                  setIsPaymentModalVisible(true);
                }}
              >
                Record Payment
              </Button>
            </div>
            
            <Table
              columns={paymentColumns}
              dataSource={payments}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} payments`,
              }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Add/Edit Invoice Modal */}
      <Modal
        title={editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => { setIsModalVisible(false); setInvoiceItems([]); }}>
            Cancel
          </Button>,
          <Button key="save" type="primary" style={{ background: '#10B981', borderColor: '#10B981' }} onClick={handleSaveInvoice} loading={loading}>
            Save Invoice
          </Button>
        ]}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="patientId" label="Patient" rules={[{ required: true }]}>
                <Select 
                  showSearch 
                  placeholder="Select patient" 
                  optionFilterProp="children" 
                  filterOption={(input, option) => (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())}
                  onChange={(value) => {
                    const patient = patients.find(p => p.id === value);
                    if (patient) {
                      form.setFieldsValue({ patientEmail: patient.email });
                    }
                    loadBillableItems(value);
                  }}
                  loading={loadingBillables}
                >
                  {patients.map(p => <Option key={p.id} value={p.id}>{p.firstName} {p.lastName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="patientEmail" label="Patient Email" rules={[{ required: true, type: 'email' }]}>
                <Input placeholder="Patient email" disabled />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="issueDate" label="Issue Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dueDate" label="Due Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          {/* Invoice Items */}
          <Card 
            title={<span>Invoice Items {loadingBillables && <Text type="secondary" style={{ fontSize: 12 }}>(Loading billable items...)</Text>}</span>} 
            size="small" 
            style={{ marginBottom: 16 }} 
            extra={<Button type="dashed" icon={<PlusOutlined />} onClick={addInvoiceItem}>Add Item</Button>}
          >
            {invoiceItems.length === 0 && !loadingBillables && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                <Text type="secondary">Select a patient to load billable items, or click "Add Item" to add manually</Text>
              </div>
            )}
            <Table
              size="small"
              dataSource={invoiceItems}
              rowKey="id"
              pagination={false}
              locale={{ emptyText: loadingBillables ? 'Loading...' : 'No items' }}
              columns={[
                {
                  title: 'Description',
                  dataIndex: 'description',
                  render: (_: any, record: InvoiceItem, index: number) => (
                    <div>
                      <Input
                        placeholder="Service/Item description"
                        value={invoiceItems[index]?.description}
                        onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                      />
                      {record.source && (
                        <Tag style={{ marginTop: 4, fontSize: 10 }} color={record.source === 'appointment' ? 'blue' : record.source === 'lab' ? 'green' : record.source === 'prescription' ? 'orange' : 'default'}>
                          {record.source}
                        </Tag>
                      )}
                    </div>
                  ),
                },
                {
                  title: 'Qty',
                  dataIndex: 'quantity',
                  width: 80,
                  render: (_: any, __: any, index: number) => (
                    <Input
                      type="number"
                      min={1}
                      value={invoiceItems[index]?.quantity}
                      onChange={(e) => updateInvoiceItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  ),
                },
                {
                  title: 'Unit Price (₹)',
                  dataIndex: 'unitPrice',
                  width: 120,
                  render: (_: any, __: any, index: number) => (
                    <Input
                      type="number"
                      min={0}
                      value={invoiceItems[index]?.unitPrice}
                      onChange={(e) => updateInvoiceItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  ),
                },
                {
                  title: 'Amount (₹)',
                  dataIndex: 'amount',
                  width: 100,
                  render: (_: any, __: any, index: number) => (
                    <Text strong>₹{(invoiceItems[index]?.amount || 0).toFixed(2)}</Text>
                  ),
                },
                {
                  title: '',
                  width: 50,
                  render: (_: any, __: any, index: number) => (
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeInvoiceItem(index)} />
                  ),
                },
              ]}
            />
          </Card>

          {/* Totals */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Tax Rate (%)">
                <Input 
                  type="number" 
                  min={0} 
                  max={100} 
                  placeholder="0" 
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} 
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Discount Rate (%)">
                <Input 
                  type="number" 
                  min={0} 
                  max={100} 
                  placeholder="0" 
                  value={discountRate}
                  onChange={(e) => setDiscountRate(parseFloat(e.target.value) || 0)} 
                />
              </Form.Item>
            </Col>
          </Row>

          <Card size="small" style={{ background: '#f5f5f5', marginBottom: 16 }}>
            <Row justify="end">
              <Col span={8}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>Subtotal:</Text>
                  <Text strong>₹{calculateTotals().subtotal.toFixed(2)}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>Tax:</Text>
                  <Text>₹{calculateTotals().tax.toFixed(2)}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>Discount:</Text>
                  <Text>-₹{calculateTotals().discount.toFixed(2)}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #d9d9d9', paddingTop: 8 }}>
                  <Text strong style={{ fontSize: 16 }}>Total:</Text>
                  <Text strong style={{ fontSize: 16, color: '#10B981' }}>₹{calculateTotals().total.toFixed(2)}</Text>
                </div>
              </Col>
            </Row>
          </Card>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Enter any notes or comments" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        title="Record Payment"
        visible={isPaymentModalVisible}
        onCancel={() => setIsPaymentModalVisible(false)}
        width={500}
        footer={[
          <Button key="cancel" onClick={() => setIsPaymentModalVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="save" 
            type="primary" 
            style={{ background: '#10B981', borderColor: '#10B981' }} 
            onClick={async () => {
              try {
                const values = await paymentForm.validateFields();
                setSavingPayment(true);
                
                await api.post(`/billing/${values.invoiceId}/payment`, {
                  amount: parseFloat(values.amount),
                  paymentMethod: values.paymentMethod,
                  reference: values.reference,
                  notes: values.notes,
                });
                
                message.success('Payment recorded successfully');
                setIsPaymentModalVisible(false);
                paymentForm.resetFields();
                
                // Reload invoices and payments
                const [invoicesRes, paymentsRes] = await Promise.all([
                  api.get('/billing'),
                  api.get('/billing/payments/all').catch(() => ({ data: { data: [] } })),
                ]);
                const invoiceData = invoicesRes.data?.data || [];
                const mappedInvoices = invoiceData.map((inv: any) => ({
                  ...inv,
                  services: inv.items || [],
                  total: inv.totalAmount || inv.total || 0,
                  subtotal: inv.subtotal || 0,
                  tax: inv.taxAmount || inv.tax || 0,
                  discount: inv.discountAmount || inv.discount || 0,
                }));
                setInvoices(mappedInvoices);
                setPayments(paymentsRes.data?.data || []);
              } catch (e: any) {
                message.error(e.response?.data?.message || 'Failed to record payment');
              } finally {
                setSavingPayment(false);
              }
            }} 
            loading={savingPayment}
          >
            Save Payment
          </Button>
        ]}
      >
        <Form form={paymentForm} layout="vertical">
          <Form.Item 
            name="invoiceId" 
            label="Select Invoice" 
            rules={[{ required: true, message: 'Please select an invoice' }]}
          >
            <Select 
              showSearch 
              placeholder="Select invoice to pay" 
              optionFilterProp="children"
              onChange={(value) => {
                const invoice = invoices.find(inv => inv.id === value);
                if (invoice) {
                  const dueAmount = (invoice.total || 0) - (invoice as any).paidAmount || invoice.total || 0;
                  paymentForm.setFieldsValue({ amount: dueAmount > 0 ? dueAmount : invoice.total });
                }
              }}
            >
              {invoices
                .filter(inv => inv.status !== 'Paid' && inv.status !== 'Cancelled')
                .map(inv => (
                  <Option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} - {inv.patientName} (₹{(inv.total || 0).toFixed(2)})
                  </Option>
                ))}
            </Select>
          </Form.Item>
          
          <Form.Item 
            name="amount" 
            label="Payment Amount (₹)" 
            rules={[{ required: true, message: 'Please enter amount' }]}
          >
            <Input type="number" min={0} placeholder="Enter payment amount" />
          </Form.Item>
          
          <Form.Item 
            name="paymentMethod" 
            label="Payment Method" 
            rules={[{ required: true, message: 'Please select payment method' }]}
            initialValue="Cash"
          >
            <Select>
              <Option value="Cash">Cash</Option>
              <Option value="Credit Card">Credit Card</Option>
              <Option value="Debit Card">Debit Card</Option>
              <Option value="UPI">UPI</Option>
              <Option value="Net Banking">Net Banking</Option>
              <Option value="Insurance">Insurance</Option>
              <Option value="Cheque">Cheque</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="reference" label="Reference / Transaction ID">
            <Input placeholder="Enter reference number or transaction ID" />
          </Form.Item>
          
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Any additional notes" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BillingManagement;
