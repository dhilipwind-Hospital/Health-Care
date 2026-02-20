import React, { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import { Card, Table, Button, Space, Tag, Row, Col, Typography, Input, Select, Modal, Form, message, Tabs, Statistic, Avatar, Progress, Calendar, Badge } from 'antd';
import { useSelectedBranch } from '../../hooks/useSelectedBranch';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  TeamOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  StarOutlined,
  PhoneOutlined,
  MailOutlined,
  IdcardOutlined,
  SafetyOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

interface StaffMember {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  role: string;
  department: string;
  specialization?: string;
  hireDate: string;
  status: 'Active' | 'Inactive' | 'On Leave' | 'Terminated';
  shift: 'Morning' | 'Evening' | 'Night' | 'Rotating';
  salary: number;
  performanceRating: number;
  certifications: string[];
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  hoursWorked: number;
  status: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'Leave';
  notes?: string;
}

interface Schedule {
  id: string;
  employeeId: string;
  date: string;
  shift: string;
  startTime: string;
  endTime: string;
  department: string;
  status: 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled';
}

const StaffManagement: React.FC = () => {
  const { selectedBranchId } = useSelectedBranch();
  const [activeTab, setActiveTab] = useState('staff');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Fetch staff from API
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);

  // Load departments
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const res = await api.get('/departments', { suppressErrorToast: true } as any);
        setDepartments(res.data?.data || res.data || []);
      } catch (error) {
        console.error('Failed to load departments:', error);
      }
    };
    loadDepartments();
  }, []);

  // Load staff from API
  useEffect(() => {
    const loadStaff = async () => {
      try {
        setLoading(true);
        // Build query parameters with location filtering
        const params: any = {
          role: 'admin,doctor,nurse,pharmacist,lab_technician,receptionist',
          status: 'active',
          limit: 100
        };

        // Add locationId filter if user has a current branch selected
        if (selectedBranchId) {
          params.locationId = selectedBranchId;
        }

        const res = await api.get('/users', {
          params,
          suppressErrorToast: true
        } as any);
        const users = res.data?.data || [];
        const mappedStaff: StaffMember[] = users.map((user: any) => ({
          id: user.id,
          employeeId: `EMP-${user.id.substring(0, 6)}`,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.phone || '',
          avatar: user.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.firstName}`,
          role: user.role === 'lab_technician' ? 'Lab Technician' : (user.role?.charAt(0).toUpperCase() + user.role?.slice(1)) || '',
          department: user.department?.name || 'N/A',
          hireDate: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : '',
          status: user.isActive ? 'Active' : 'Inactive',
          shift: 'Morning',
          salary: 0,
          performanceRating: 4.5,
          certifications: [],
          emergencyContact: {
            name: '',
            relationship: '',
            phone: ''
          }
        }));
        setStaff(mappedStaff);
      } catch (error) {
        console.error('Failed to load staff:', error);
        setStaff([]);
      } finally {
        setLoading(false);
      }
    };
    loadStaff();
  }, [selectedBranchId]); // Reload when branch changes

  const [attendance, setAttendance] = useState<Attendance[]>([]);

  // Generate sample attendance data based on actual staff
  useEffect(() => {
    if (staff.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const sampleAttendance: Attendance[] = staff.slice(0, 3).map((staffMember, index) => ({
        id: `att-${index + 1}`,
        employeeId: staffMember.id,
        date: today,
        checkIn: index === 0 ? '08:00' : index === 1 ? '22:00' : '08:15',
        checkOut: index === 0 ? '17:00' : index === 1 ? '06:00' : '17:15',
        hoursWorked: index === 0 ? 9 : index === 1 ? 8 : 9,
        status: index === 0 ? 'Present' : index === 1 ? 'Present' : 'Late',
        notes: index === 2 ? '15 minutes late due to traffic' : undefined
      }));
      setAttendance(sampleAttendance);
    }
  }, [staff]);

  const staffColumns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (record: StaffMember) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar src={record.avatar} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 600 }}>{record.firstName} {record.lastName}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.employeeId}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Role & Department',
      key: 'role',
      render: (record: StaffMember) => (
        <div>
          <Tag color="#10B981">{record.role}</Tag>
          <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
            {record.department}
          </div>
          {record.specialization && (
            <div style={{ fontSize: '10px', color: '#999' }}>
              {record.specialization}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (record: StaffMember) => (
        <div>
          <div style={{ fontSize: '12px', marginBottom: 2 }}>
            <MailOutlined style={{ marginRight: 4 }} />
            {record.email}
          </div>
          <div style={{ fontSize: '12px' }}>
            <PhoneOutlined style={{ marginRight: 4 }} />
            {record.phone}
          </div>
        </div>
      ),
    },
    {
      title: 'Performance',
      key: 'performance',
      render: (record: StaffMember) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <StarOutlined style={{ color: '#faad14' }} />
            <Text strong>{record.performanceRating}</Text>
          </div>
          <Progress
            percent={record.performanceRating * 20}
            size="small"
            showInfo={false}
            strokeColor="#10B981"
          />
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: StaffMember) => {
        const colors = {
          Active: '#52c41a',
          Inactive: '#d9d9d9',
          'On Leave': '#faad14',
          Terminated: '#ff4d4f'
        };
        return (
          <div>
            <Tag color={colors[status as keyof typeof colors]}>
              {status}
            </Tag>
            <div style={{ fontSize: '10px', color: '#666' }}>
              {record.shift} Shift
            </div>
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: StaffMember) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewStaff(record)}
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditStaff(record)}
          />
          <Button
            type="text"
            icon={<CalendarOutlined />}
            onClick={() => handleViewSchedule(record)}
          />
        </Space>
      ),
    },
  ];

  const attendanceColumns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (record: Attendance) => {
        const employee = staff.find(s => s.id === record.employeeId);
        return employee ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar src={employee.avatar} icon={<UserOutlined />} size="small" />
            <div>
              <div style={{ fontWeight: 500 }}>{employee.firstName} {employee.lastName}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>{employee.employeeId}</div>
            </div>
          </div>
        ) : 'Unknown';
      },
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Check In',
      dataIndex: 'checkIn',
      key: 'checkIn',
      render: (time: string) => (
        <Text code>{time}</Text>
      ),
    },
    {
      title: 'Check Out',
      dataIndex: 'checkOut',
      key: 'checkOut',
      render: (time: string) => (
        time ? <Text code>{time}</Text> : <Text type="secondary">Not checked out</Text>
      ),
    },
    {
      title: 'Hours',
      dataIndex: 'hoursWorked',
      key: 'hoursWorked',
      render: (hours: number) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#10B981' }}>
            {hours}h
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          Present: '#52c41a',
          Absent: '#ff4d4f',
          Late: '#faad14',
          'Half Day': '#1890ff',
          Leave: '#722ed1'
        };
        return (
          <Tag color={colors[status as keyof typeof colors]}>
            {status}
          </Tag>
        );
      },
    },
  ];

  const handleViewStaff = (staff: StaffMember) => {
    Modal.info({
      title: `${staff.firstName} ${staff.lastName} - Employee Details`,
      width: 800,
      content: (
        <div style={{ marginTop: '16px' }}>
          <Row gutter={16}>
            <Col span={8}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Avatar src={staff.avatar} size={80} icon={<UserOutlined />} />
                <div style={{ marginTop: 8, fontWeight: 600 }}>{staff.firstName} {staff.lastName}</div>
                <div style={{ color: '#666' }}>{staff.employeeId}</div>
              </div>
            </Col>
            <Col span={16}>
              <Row gutter={[16, 8]}>
                <Col span={12}>
                  <Text strong>Role:</Text> {staff.role}
                </Col>
                <Col span={12}>
                  <Text strong>Department:</Text> {staff.department}
                </Col>
                <Col span={12}>
                  <Text strong>Email:</Text> {staff.email}
                </Col>
                <Col span={12}>
                  <Text strong>Phone:</Text> {staff.phone}
                </Col>
                <Col span={12}>
                  <Text strong>Hire Date:</Text> {staff.hireDate}
                </Col>
                <Col span={12}>
                  <Text strong>Shift:</Text> {staff.shift}
                </Col>
                <Col span={12}>
                  <Text strong>Status:</Text>
                  <Tag color={staff.status === 'Active' ? '#52c41a' : '#faad14'} style={{ marginLeft: 8 }}>
                    {staff.status}
                  </Tag>
                </Col>
                <Col span={12}>
                  <Text strong>Performance:</Text>
                  <span style={{ marginLeft: 8 }}>
                    <StarOutlined style={{ color: '#faad14' }} /> {staff.performanceRating}/5
                  </span>
                </Col>
              </Row>
            </Col>
          </Row>

          <div style={{ marginTop: 16 }}>
            <Title level={5}>Certifications</Title>
            <div>
              {staff.certifications.map(cert => (
                <Tag key={cert} color="#10B981" style={{ marginBottom: 4 }}>
                  <SafetyOutlined /> {cert}
                </Tag>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <Title level={5}>Emergency Contact</Title>
            <div>
              <Text strong>Name:</Text> {staff.emergencyContact.name}<br />
              <Text strong>Relationship:</Text> {staff.emergencyContact.relationship}<br />
              <Text strong>Phone:</Text> {staff.emergencyContact.phone}
            </div>
          </div>
        </div>
      ),
    });
  };

  const handleEditStaff = (staff: StaffMember) => {
    setEditingStaff(staff);
    form.setFieldsValue(staff);
    setIsModalVisible(true);
  };

  const handleViewSchedule = (staff: StaffMember) => {
    message.info(`Viewing schedule for ${staff.firstName} ${staff.lastName}`);
  };

  const handleAddStaff = () => {
    setEditingStaff(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleSaveStaff = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (editingStaff) {
        // Update existing staff
        await api.patch(`/users/${editingStaff.id}`, values);
        message.success('Staff member updated successfully');
      } else {
        // Create new staff - departmentId should be a UUID from the departments list
        const payload: any = {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
          role: values.role,
          isActive: true
        };
        // Only include departmentId if a valid department was selected
        if (values.department && values.department.match(/^[0-9a-f-]{36}$/i)) {
          payload.departmentId = values.department;
        }

        // Fix: Assign the new staff member to the currently selected branch/location
        if (selectedBranchId) {
          payload.locationId = selectedBranchId;
        }
        await api.post('/users', payload);
        message.success('Staff member created successfully');
      }

      setIsModalVisible(false);
      form.resetFields();

      // Reload staff list
      const reloadParams: any = {
        role: 'admin,doctor,nurse,pharmacist,lab_technician,receptionist',
        status: 'active',
        limit: 100
      };

      // Add locationId filter if user has a current branch selected
      if (selectedBranchId) {
        reloadParams.locationId = selectedBranchId;
      }

      const res = await api.get('/users', {
        params: reloadParams,
        suppressErrorToast: true
      } as any);
      const users = res.data?.data || [];
      const mappedStaff: StaffMember[] = users.map((user: any) => ({
        id: user.id,
        employeeId: `EMP-${user.id.substring(0, 6)}`,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.profileImage,
        role: user.role || 'staff',
        department: user.department?.name || 'General',
        specialization: user.specialization,
        hireDate: user.joinDate || user.createdAt || new Date().toISOString(),
        status: user.isActive ? 'Active' : 'Inactive',
        shift: 'Morning' as const,
        salary: user.salary || 0,
        performanceRating: user.performanceRating || 4.5,
        certifications: [],
        emergencyContact: { name: '', relationship: '', phone: '' }
      }));
      setStaff(mappedStaff);
    } catch (error: any) {
      console.error('Error saving staff:', error);
      message.error(error?.response?.data?.message || 'Failed to save staff member');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalStaff = staff.length;
  const activeStaff = staff.filter(s => s.status === 'Active').length;
  const onLeaveStaff = staff.filter(s => s.status === 'On Leave').length;
  const presentToday = attendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
  const avgPerformance = staff.reduce((sum, s) => sum + s.performanceRating, 0) / staff.length;

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ color: '#10B981', marginBottom: '8px' }}>
          <TeamOutlined /> Staff Management
        </Title>
        <Text type="secondary">
          Manage hospital staff, attendance, and performance
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Staff"
              value={totalStaff}
              prefix={<TeamOutlined style={{ color: '#10B981' }} />}
              valueStyle={{ color: '#10B981' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Staff"
              value={activeStaff}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Present Today"
              value={presentToday}
              prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary">Avg Performance</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <StarOutlined style={{ color: '#faad14', fontSize: '20px' }} />
                <span style={{ fontSize: '24px', fontWeight: 600, color: '#10B981' }}>
                  {avgPerformance.toFixed(1)}
                </span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab={<span><TeamOutlined />Staff Directory</span>} key="staff">
          <Card>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Search
                  placeholder="Search staff..."
                  style={{ width: 300 }}
                  prefix={<SearchOutlined />}
                />
                <Select defaultValue="all" style={{ width: 120 }}>
                  <Option value="all">All Roles</Option>
                  <Option value="doctor">Doctor</Option>
                  <Option value="nurse">Nurse</Option>
                  <Option value="pharmacist">Pharmacist</Option>
                  <Option value="lab_technician">Lab Technician</Option>
                  <Option value="receptionist">Receptionist</Option>
                  <Option value="admin">Admin</Option>
                </Select>
                <Select defaultValue="all" style={{ width: 120 }}>
                  <Option value="all">All Status</Option>
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                  <Option value="leave">On Leave</Option>
                </Select>
              </Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddStaff}
                style={{ background: '#10B981', borderColor: '#10B981' }}
              >
                Add Staff Member
              </Button>
            </div>

            <Table
              columns={staffColumns}
              dataSource={staff}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} staff members`,
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab={<span><ClockCircleOutlined />Attendance</span>} key="attendance">
          <Card>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Search
                  placeholder="Search attendance..."
                  style={{ width: 300 }}
                  prefix={<SearchOutlined />}
                />
                <Select defaultValue="today" style={{ width: 120 }}>
                  <Option value="today">Today</Option>
                  <Option value="week">This Week</Option>
                  <Option value="month">This Month</Option>
                </Select>
              </Space>
              <Button
                type="primary"
                style={{ background: '#10B981', borderColor: '#10B981' }}
              >
                Mark Attendance
              </Button>
            </div>

            <Table
              columns={attendanceColumns}
              dataSource={attendance}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} attendance records`,
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab={<span><CalendarOutlined />Scheduling</span>} key="scheduling">
          <Card title="Staff Scheduling">
            <Calendar
              dateCellRender={(value) => {
                const dateStr = value.format('YYYY-MM-DD');
                const dayAttendance = attendance.filter(a => a.date === dateStr);
                return (
                  <div>
                    {dayAttendance.map(a => {
                      const employee = staff.find(s => s.id === a.employeeId);
                      return employee ? (
                        <Badge
                          key={a.id}
                          status={a.status === 'Present' ? 'success' : a.status === 'Late' ? 'warning' : 'error'}
                          text={employee.firstName}
                          style={{ fontSize: '10px', display: 'block' }}
                        />
                      ) : null;
                    })}
                  </div>
                );
              }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Add/Edit Staff Modal */}
      <Modal
        title={editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="save" type="primary" loading={loading} onClick={handleSaveStaff} style={{ background: '#10B981', borderColor: '#10B981' }}>
            Save Staff Member
          </Button>
        ]}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
                <Input placeholder="Enter first name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
                <Input placeholder="Enter last name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                <Input placeholder="Enter email address" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                <Select placeholder="Select role">
                  <Option value="doctor">Doctor</Option>
                  <Option value="nurse">Nurse</Option>
                  <Option value="pharmacist">Pharmacist</Option>
                  <Option value="lab_technician">Lab Technician</Option>
                  <Option value="receptionist">Receptionist</Option>
                  <Option value="admin">Administrator</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="department" label="Department">
                <Select placeholder="Select department" allowClear>
                  {departments.map(dept => (
                    <Option key={dept.id} value={dept.id}>{dept.name}</Option>
                  ))}
                  {departments.length === 0 && (
                    <Option value="" disabled>No departments available</Option>
                  )}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="shift" label="Shift" rules={[{ required: true }]}>
                <Select placeholder="Select shift">
                  <Option value="Morning">Morning</Option>
                  <Option value="Evening">Evening</Option>
                  <Option value="Night">Night</Option>
                  <Option value="Rotating">Rotating</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="specialization" label="Specialization">
            <Input placeholder="Enter specialization (if applicable)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StaffManagement;
