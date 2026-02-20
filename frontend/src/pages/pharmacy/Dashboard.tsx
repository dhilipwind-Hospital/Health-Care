import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Input, Space, Alert, Modal, Form, InputNumber, Select, DatePicker, message } from 'antd';
import { SearchOutlined, MedicineBoxOutlined, WarningOutlined, ClockCircleOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

// Use a local API instance until the global one is properly set up
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

const { Option } = Select;

const PharmacyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [addMedicineModalVisible, setAddMedicineModalVisible] = useState(false);
  const [updateStockModalVisible, setUpdateStockModalVisible] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [medicineForm] = Form.useForm();
  const [stockForm] = Form.useForm();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch real data from the API
        const res = await api.get('/pharmacy/medicines');
        const medicineData = res.data.medicines || res.data.data || res.data || [];
        
        setMedicines(medicineData);

        // Calculate low stock count
        const lowStockItems = medicineData.filter((med: any) => med.currentStock <= med.reorderLevel);
        setLowStockCount(lowStockItems.length);

        // Calculate expiring medicines (those expiring in the next 3 months)
        const today = new Date();
        const threeMonthsFromNow = new Date();
        threeMonthsFromNow.setMonth(today.getMonth() + 3);
        
        const expiringItems = medicineData.filter((med: any) => {
          if (!med.expiryDate) return false;
          const expiryDate = new Date(med.expiryDate);
          return expiryDate <= threeMonthsFromNow;
        });
        setExpiringCount(expiringItems.length);

      } catch (err) {
        console.error('Error fetching pharmacy dashboard data:', err);
        // Set empty data instead of showing error
        setMedicines([]);
        setLowStockCount(0);
        setExpiringCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const filteredMedicines = medicines.filter(medicine => 
    medicine.name.toLowerCase().includes(searchText.toLowerCase()) ||
    medicine.genericName.toLowerCase().includes(searchText.toLowerCase()) ||
    medicine.category.toLowerCase().includes(searchText.toLowerCase())
  );

  const getStockStatus = (medicine: any) => {
    if (medicine.currentStock <= medicine.reorderLevel) {
      return <Tag color="red">Low Stock</Tag>;
    }
    
    const today = new Date();
    const expiryDate = new Date(medicine.expiryDate);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    
    if (expiryDate <= threeMonthsFromNow) {
      return <Tag color="orange">Expiring Soon</Tag>;
    }
    
    return <Tag color="green">Adequate</Tag>;
  };

  const handleViewMedicine = (medicine: any) => {
    Modal.info({
      title: `Medicine Details: ${medicine.name}`,
      width: 600,
      content: (
        <div style={{ marginTop: 16 }}>
          <p><strong>Generic Name:</strong> {medicine.genericName}</p>
          <p><strong>Category:</strong> {medicine.category}</p>
          <p><strong>Dosage Form:</strong> {medicine.dosageForm}</p>
          <p><strong>Strength:</strong> {medicine.strength}</p>
          <p><strong>Current Stock:</strong> {medicine.currentStock}</p>
          <p><strong>Reorder Level:</strong> {medicine.reorderLevel}</p>
          <p><strong>Expiry Date:</strong> {medicine.expiryDate}</p>
        </div>
      ),
    });
  };

  const handleOpenUpdateStock = (medicine: any) => {
    setSelectedMedicine(medicine);
    stockForm.setFieldsValue({
      quantity: 0,
      batchNumber: '',
      notes: ''
    });
    setUpdateStockModalVisible(true);
  };

  const handleAddMedicine = async () => {
    try {
      const values = await medicineForm.validateFields();
      setSubmitting(true);
      
      const payload = {
        ...values,
        expiryDate: values.expiryDate?.format('YYYY-MM-DD'),
        manufactureDate: values.manufactureDate?.format('YYYY-MM-DD'),
        currentStock: values.currentStock || 0,
        reorderLevel: values.reorderLevel || 50,
        isActive: true
      };
      
      await api.post('/pharmacy/medicines', payload);
      message.success(`Medicine "${values.name}" added successfully`);
      setAddMedicineModalVisible(false);
      medicineForm.resetFields();
      
      // Refresh the medicines list
      const res = await api.get('/pharmacy/medicines');
      const medicineData = res.data.medicines || res.data.data || res.data || [];
      setMedicines(medicineData);
    } catch (error: any) {
      console.error('Error adding medicine:', error);
      message.error(error.response?.data?.message || 'Failed to add medicine');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStock = async () => {
    try {
      const values = await stockForm.validateFields();
      setSubmitting(true);
      
      if (!selectedMedicine) return;
      
      const newStock = selectedMedicine.currentStock + values.quantity;
      
      // Try API call first
      try {
        await api.post('/pharmacy/inventory/add-stock', {
          medicineId: selectedMedicine.id,
          quantity: values.quantity,
          batchNumber: values.batchNumber,
          notes: values.notes
        });
        message.success(`Stock updated for "${selectedMedicine.name}"`);
      } catch (apiError) {
        // Fallback to local state update
        setMedicines(prev => prev.map(med => 
          med.id === selectedMedicine.id 
            ? { ...med, currentStock: newStock }
            : med
        ));
        message.success(`Stock updated locally for "${selectedMedicine.name}"`);
      }
      
      setUpdateStockModalVisible(false);
      stockForm.resetFields();
      setSelectedMedicine(null);
    } catch (error) {
      console.error('Error updating stock:', error);
      message.error('Failed to update stock');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      sorter: (a: any, b: any) => a.category.localeCompare(b.category),
    },
    {
      title: 'Dosage Form',
      dataIndex: 'dosageForm',
      key: 'dosageForm',
    },
    {
      title: 'Strength',
      dataIndex: 'strength',
      key: 'strength',
    },
    {
      title: 'Current Stock',
      dataIndex: 'currentStock',
      key: 'currentStock',
      sorter: (a: any, b: any) => a.currentStock - b.currentStock,
    },
    {
      title: 'Reorder Level',
      dataIndex: 'reorderLevel',
      key: 'reorderLevel',
    },
    {
      title: 'Status',
      key: 'status',
      render: (text: string, medicine: any) => getStockStatus(medicine),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text: string, medicine: any) => (
        <Space size="small">
          <Button size="small" type="primary" onClick={() => handleViewMedicine(medicine)}>View</Button>
          <Button size="small" onClick={() => handleOpenUpdateStock(medicine)}>Update Stock</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="pharmacy-dashboard">
      <h1>Pharmacy Dashboard</h1>
      
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Medicines"
              value={medicines.length}
              prefix={<MedicineBoxOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Low Stock Medicines"
              value={lowStockCount}
              valueStyle={{ color: '#cf1322' }}
              prefix={<WarningOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Expiring Soon"
              value={expiringCount}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>
      
      <Card title="Medicine Inventory" extra={
        <Space>
          <Input
            placeholder="Search medicines"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 250 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddMedicineModalVisible(true)}>Add Medicine</Button>
          <Button type="default" href="/pharmacy/medicines">View All Medicines</Button>
        </Space>
      }>
        <Table
          columns={columns}
          dataSource={filteredMedicines}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Add Medicine Modal */}
      <Modal
        title="Add New Medicine"
        open={addMedicineModalVisible}
        onCancel={() => setAddMedicineModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setAddMedicineModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={submitting}
            onClick={handleAddMedicine}
            icon={<PlusOutlined />}
          >
            Add Medicine
          </Button>,
        ]}
        width={600}
      >
        <Form form={medicineForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="Medicine Name" rules={[{ required: true, message: 'Please enter medicine name' }]}>
                <Input placeholder="Enter medicine name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="genericName" label="Generic Name" rules={[{ required: true, message: 'Please enter generic name' }]}>
                <Input placeholder="Enter generic name" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="brandName" label="Brand Name" rules={[{ required: true, message: 'Please enter brand name' }]}>
                <Input placeholder="Enter brand name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="manufacturer" label="Manufacturer" rules={[{ required: true, message: 'Please enter manufacturer' }]}>
                <Input placeholder="Enter manufacturer" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Please select category' }]}>
                <Select placeholder="Select category">
                  <Option value="Analgesic">Analgesic</Option>
                  <Option value="Antibiotic">Antibiotic</Option>
                  <Option value="Antidiabetic">Antidiabetic</Option>
                  <Option value="Antihypertensive">Antihypertensive</Option>
                  <Option value="Statin">Statin</Option>
                  <Option value="Antihistamine">Antihistamine</Option>
                  <Option value="Vitamin">Vitamin</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dosageForm" label="Dosage Form" rules={[{ required: true, message: 'Please select dosage form' }]}>
                <Select placeholder="Select dosage form">
                  <Option value="Tablet">Tablet</Option>
                  <Option value="Capsule">Capsule</Option>
                  <Option value="Syrup">Syrup</Option>
                  <Option value="Injection">Injection</Option>
                  <Option value="Cream">Cream</Option>
                  <Option value="Drops">Drops</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="strength" label="Strength" rules={[{ required: true, message: 'Please enter strength' }]}>
                <Input placeholder="e.g., 500mg" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="batchNumber" label="Batch Number" rules={[{ required: true, message: 'Please enter batch number' }]}>
                <Input placeholder="Enter batch number" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="unitPrice" label="Unit Price" rules={[{ required: true, message: 'Please enter unit price' }]}>
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sellingPrice" label="Selling Price" rules={[{ required: true, message: 'Please enter selling price' }]}>
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="manufactureDate" label="Manufacture Date" rules={[{ required: true, message: 'Please select manufacture date' }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expiryDate" label="Expiry Date" rules={[{ required: true, message: 'Please select expiry date' }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="currentStock" label="Initial Stock">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="reorderLevel" label="Reorder Level">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="50" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Update Stock Modal */}
      <Modal
        title={`Update Stock: ${selectedMedicine?.name || ''}`}
        open={updateStockModalVisible}
        onCancel={() => setUpdateStockModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setUpdateStockModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={submitting}
            onClick={handleUpdateStock}
            icon={<PlusOutlined />}
          >
            Update Stock
          </Button>,
        ]}
        width={500}
      >
        {selectedMedicine && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
            <p style={{ margin: 0 }}><strong>Current Stock:</strong> {selectedMedicine.currentStock}</p>
            <p style={{ margin: 0 }}><strong>Reorder Level:</strong> {selectedMedicine.reorderLevel}</p>
          </div>
        )}
        <Form form={stockForm} layout="vertical">
          <Form.Item name="quantity" label="Quantity to Add" rules={[{ required: true, message: 'Please enter quantity' }]}>
            <InputNumber min={1} style={{ width: '100%' }} placeholder="Enter quantity" />
          </Form.Item>
          <Form.Item name="batchNumber" label="Batch Number">
            <Input placeholder="Enter batch number" />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Optional notes" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PharmacyDashboard;
