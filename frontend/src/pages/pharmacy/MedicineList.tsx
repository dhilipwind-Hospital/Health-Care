import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Input, Space, Select, Row, Col, Statistic, Tooltip, Modal, Form, InputNumber, DatePicker, message } from 'antd';
import { SearchOutlined, MedicineBoxOutlined, WarningOutlined, ClockCircleOutlined, ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

interface Medicine {
  id: string;
  name: string;
  genericName: string;
  brandName: string;
  manufacturer: string;
  category: string;
  dosageForm: string;
  strength: string;
  unitPrice: number;
  sellingPrice: number;
  batchNumber: string;
  manufactureDate: string;
  expiryDate: string;
  currentStock: number;
  reorderLevel: number;
  isActive: boolean;
  description?: string;
  sideEffects?: string;
  contraindications?: string;
  storageInstructions?: string;
}

const MedicineList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [stockFilter, setStockFilter] = useState<string | null>(null);
  const [dosageFormFilter, setDosageFormFilter] = useState<string | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [updateStockModalVisible, setUpdateStockModalVisible] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [stockForm] = Form.useForm();

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const response = await api.get('/pharmacy/medicines?limit=500');
      const medicineData = response.data.medicines || response.data.data || response.data || [];
      setMedicines(medicineData);
    } catch (error) {
      console.error('Error fetching medicines:', error);
      // Set empty array on error - no mock data
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = async (values: any) => {
    try {
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
      message.success('Medicine added successfully');
      setAddModalVisible(false);
      form.resetFields();
      fetchMedicines(); // Refresh the list
    } catch (error: any) {
      console.error('Error adding medicine:', error);
      message.error(error.response?.data?.message || 'Failed to add medicine');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenUpdateStock = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    stockForm.setFieldsValue({
      quantity: 0,
      batchNumber: '',
      notes: ''
    });
    setUpdateStockModalVisible(true);
  };

  const handleUpdateStock = async () => {
    try {
      const values = await stockForm.validateFields();
      setSubmitting(true);
      
      await api.post('/inventory/movements', {
        medicineId: selectedMedicine?.id,
        movementType: 'purchase',
        quantity: values.quantity,
        notes: values.notes || `Stock update for ${selectedMedicine?.name}`,
        referenceNumber: values.batchNumber || `STK-${Date.now()}`
      });
      
      message.success('Stock updated successfully');
      setUpdateStockModalVisible(false);
      stockForm.resetFields();
      fetchMedicines(); // Refresh the list
    } catch (error: any) {
      console.error('Error updating stock:', error);
      message.error(error.response?.data?.message || 'Failed to update stock');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewMedicine = (medicine: Medicine) => {
    Modal.info({
      title: `Medicine Details: ${medicine.name}`,
      width: 600,
      content: (
        <div style={{ marginTop: 16 }}>
          <p><strong>Generic Name:</strong> {medicine.genericName}</p>
          <p><strong>Brand Name:</strong> {medicine.brandName}</p>
          <p><strong>Manufacturer:</strong> {medicine.manufacturer}</p>
          <p><strong>Category:</strong> {medicine.category}</p>
          <p><strong>Dosage Form:</strong> {medicine.dosageForm}</p>
          <p><strong>Strength:</strong> {medicine.strength}</p>
          <p><strong>Current Stock:</strong> {medicine.currentStock}</p>
          <p><strong>Reorder Level:</strong> {medicine.reorderLevel}</p>
          <p><strong>Unit Price:</strong> ${Number(medicine.unitPrice || 0).toFixed(2)}</p>
          <p><strong>Selling Price:</strong> ${Number(medicine.sellingPrice || 0).toFixed(2)}</p>
          <p><strong>Batch Number:</strong> {medicine.batchNumber}</p>
          <p><strong>Expiry Date:</strong> {medicine.expiryDate}</p>
          {medicine.description && <p><strong>Description:</strong> {medicine.description}</p>}
        </div>
      ),
    });
  };

  const applyFilters = (medicine: Medicine) => {
    // Apply category filter
    if (categoryFilter && medicine.category !== categoryFilter) {
      return false;
    }

    // Apply dosage form filter
    if (dosageFormFilter && medicine.dosageForm !== dosageFormFilter) {
      return false;
    }

    // Apply stock filter
    if (stockFilter) {
      if (stockFilter === 'low' && medicine.currentStock > medicine.reorderLevel) {
        return false;
      }
      if (stockFilter === 'adequate' && medicine.currentStock <= medicine.reorderLevel) {
        return false;
      }
    }

    // Apply search text
    const searchLower = searchText.toLowerCase();
    return medicine.name.toLowerCase().includes(searchLower) ||
      medicine.genericName.toLowerCase().includes(searchLower) ||
      medicine.category.toLowerCase().includes(searchLower) ||
      medicine.manufacturer.toLowerCase().includes(searchLower);
  };

  const filteredMedicines = medicines.filter(applyFilters);

  const getStockStatus = (medicine: Medicine) => {
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

  const categories = [...new Set(medicines.map(med => med.category))];
  const dosageForms = [...new Set(medicines.map(med => med.dosageForm))];

  const lowStockCount = medicines.filter(med => med.currentStock <= med.reorderLevel).length;
  const expiringCount = medicines.filter(med => {
    const expiryDate = new Date(med.expiryDate);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return expiryDate <= threeMonthsFromNow;
  }).length;

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Medicine, b: Medicine) => a.name.localeCompare(b.name),
      render: (text: string, record: Medicine) => (
        <Tooltip title={record.description}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      sorter: (a: Medicine, b: Medicine) => a.category.localeCompare(b.category),
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
      sorter: (a: Medicine, b: Medicine) => a.currentStock - b.currentStock,
      render: (text: number, record: Medicine) => (
        <span style={{
          color: record.currentStock <= record.reorderLevel ? '#cf1322' : 'inherit',
          fontWeight: record.currentStock <= record.reorderLevel ? 'bold' : 'normal'
        }}>
          {text}
        </span>
      ),
    },
    {
      title: 'Reorder Level',
      dataIndex: 'reorderLevel',
      key: 'reorderLevel',
    },
    {
      title: 'Status',
      key: 'status',
      render: (text: string, medicine: Medicine) => getStockStatus(medicine),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text: string, medicine: Medicine) => (
        <Space size="small">
          <Button size="small" type="primary" onClick={() => handleViewMedicine(medicine)}>
            View
          </Button>
          <Button size="small" onClick={() => handleOpenUpdateStock(medicine)}>
            Update Stock
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="medicine-list">
      <div style={{ marginBottom: 16 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/pharmacy')}
        >
          Back to Pharmacy
        </Button>
      </div>
      <h1>Global Medicine Inventory</h1>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Medicines"
              value={medicines.length}
              prefix={<MedicineBoxOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Low Stock Medicines"
              value={lowStockCount}
              valueStyle={{ color: lowStockCount > 0 ? '#cf1322' : 'inherit' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Expiring Soon"
              value={expiringCount}
              valueStyle={{ color: expiringCount > 0 ? '#fa8c16' : 'inherit' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search medicines"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 250 }}
          />

          <Select
            placeholder="Filter by Category"
            style={{ width: 180 }}
            allowClear
            onChange={(value) => setCategoryFilter(value)}
            value={categoryFilter}
          >
            {categories.map(category => (
              <Option key={category} value={category}>{category}</Option>
            ))}
          </Select>

          <Select
            placeholder="Filter by Dosage Form"
            style={{ width: 180 }}
            allowClear
            onChange={(value) => setDosageFormFilter(value)}
            value={dosageFormFilter}
          >
            {dosageForms.map(form => (
              <Option key={form} value={form}>{form}</Option>
            ))}
          </Select>

          <Select
            placeholder="Filter by Stock Status"
            style={{ width: 180 }}
            allowClear
            onChange={(value) => setStockFilter(value)}
            value={stockFilter}
          >
            <Option value="low">Low Stock</Option>
            <Option value="adequate">Adequate Stock</Option>
          </Select>

          <Button onClick={() => {
            setCategoryFilter(null);
            setDosageFormFilter(null);
            setStockFilter(null);
            setSearchText('');
          }}>
            Clear Filters
          </Button>

          <Button icon={<PlusOutlined />} type="primary" onClick={() => setAddModalVisible(true)}>
            Add Medicine
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredMedicines}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          bordered
          summary={(pageData) => {
            const totalStock = pageData.reduce((total, medicine) => total + medicine.currentStock, 0);

            return (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={4}>Total</Table.Summary.Cell>
                  <Table.Summary.Cell index={1}><strong>{totalStock}</strong></Table.Summary.Cell>
                  <Table.Summary.Cell index={2} colSpan={3}></Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />
      </Card>

      {/* Add Medicine Modal */}
      <Modal
        title="Add New Medicine"
        open={addModalVisible}
        onCancel={() => {
          setAddModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddMedicine}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Medicine Name"
                rules={[{ required: true, message: 'Please enter medicine name' }]}
              >
                <Input placeholder="Enter medicine name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="genericName"
                label="Generic Name"
                rules={[{ required: true, message: 'Please enter generic name' }]}
              >
                <Input placeholder="Enter generic name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                name="brandName" 
                label="Brand Name"
                rules={[{ required: true, message: 'Please enter brand name' }]}
              >
                <Input placeholder="Enter brand name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="manufacturer" 
                label="Manufacturer"
                rules={[{ required: true, message: 'Please enter manufacturer' }]}
              >
                <Input placeholder="Enter manufacturer" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Please select category' }]}
              >
                <Select placeholder="Select category">
                  <Option value="Analgesic">Analgesic</Option>
                  <Option value="Antibiotic">Antibiotic</Option>
                  <Option value="Antidiabetic">Antidiabetic</Option>
                  <Option value="Antihypertensive">Antihypertensive</Option>
                  <Option value="Cardiovascular">Cardiovascular</Option>
                  <Option value="Gastrointestinal">Gastrointestinal</Option>
                  <Option value="Respiratory">Respiratory</Option>
                  <Option value="Vitamins">Vitamins</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="dosageForm"
                label="Dosage Form"
                rules={[{ required: true, message: 'Please select dosage form' }]}
              >
                <Select placeholder="Select dosage form">
                  <Option value="Tablet">Tablet</Option>
                  <Option value="Capsule">Capsule</Option>
                  <Option value="Syrup">Syrup</Option>
                  <Option value="Injection">Injection</Option>
                  <Option value="Cream">Cream</Option>
                  <Option value="Ointment">Ointment</Option>
                  <Option value="Drops">Drops</Option>
                  <Option value="Inhaler">Inhaler</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                name="strength" 
                label="Strength"
                rules={[{ required: true, message: 'Please enter strength' }]}
              >
                <Input placeholder="e.g., 500mg" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="unitPrice"
                label="Unit Price"
                rules={[{ required: true, message: 'Please enter unit price' }]}
              >
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                name="sellingPrice" 
                label="Selling Price"
                rules={[{ required: true, message: 'Please enter selling price' }]}
              >
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="currentStock" label="Initial Stock">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item 
                name="batchNumber" 
                label="Batch Number"
                rules={[{ required: true, message: 'Please enter batch number' }]}
              >
                <Input placeholder="Enter batch number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                name="manufactureDate" 
                label="Manufacture Date"
                rules={[{ required: true, message: 'Please select manufacture date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                name="expiryDate" 
                label="Expiry Date"
                rules={[{ required: true, message: 'Please select expiry date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="reorderLevel" label="Reorder Level">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="50" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Add Medicine
              </Button>
              <Button onClick={() => {
                setAddModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
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

export default MedicineList;
