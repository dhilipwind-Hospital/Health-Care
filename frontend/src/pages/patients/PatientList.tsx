import React, { useState, useEffect, useContext } from 'react';
import type { TablePaginationConfig } from 'antd/es/table';
import type { SorterResult, ColumnsType, TableCurrentDataSource } from 'antd/es/table/interface';
import type { FilterValue } from 'antd/es/table/interface';
import {
  Table,
  Button,
  Space,
  Input,
  Card,
  Typography,
  Tag,
  Badge,
  Avatar,
  Select,
  Row,
  Col,
  Dropdown,
  Modal,
  Form,
  DatePicker,
  message,
  Statistic
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  FilterOutlined,
  DownloadOutlined,
  MoreOutlined,
  TeamOutlined,
  MedicineBoxOutlined,
  AlertOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Patient } from '../../types/patient';
import patientService from '../../services/patientService';
import { debounce } from 'lodash';

const { Title, Text } = Typography;
const { Search } = Input;

const PatientListContainer = styled.div`
  .patient-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 16px;
  }
  
  .search-box {
    width: 300px;
  }
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const FilterTab = styled.button<{ $active?: boolean; $danger?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border-radius: 50px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid ${props => props.$active ? 'transparent' : '#eee'};
  
  background: ${props =>
    props.$active
      ? '#10B981'
      : '#fff'};
      
  color: ${props =>
    props.$active
      ? '#fff'
      : (props.$danger ? '#ff4d4f' : '#666')};
      
  box-shadow: ${props =>
    props.$active
      ? '0 4px 15px rgba(233, 30, 99, 0.3)'
      : '0 2px 4px rgba(0,0,0,0.02)'};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props =>
    props.$active
      ? '0 6px 20px rgba(233, 30, 99, 0.4)'
      : '0 4px 12px rgba(0,0,0,0.05)'};
    border-color: ${props => props.$active ? 'transparent' : '#10B981'};
    color: ${props => props.$active ? '#fff' : '#10B981'};
  }
`;

type PatientFilters = {
  status?: string[];
  gender?: string; // single selection
  bloodGroup?: string; // single selection
  [key: string]: string[] | string | undefined;
};

interface FetchParams {
  pagination?: { current: number; pageSize: number };
  filters?: PatientFilters;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  searchText?: string;
  patientType?: string;
}

interface PatientStats {
  totalPatients: number;
  inpatients: number;
  outpatients: number;
  emergency: number;
  discharged: number;
}

interface PatientListState {
  data: Patient[];
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  loading: boolean;
  searchText: string;
  filters: {
    status?: string[];
    gender?: string;
    bloodGroup?: string;
  };
  selectedRowKeys: React.Key[];
  patientType: string;
  stats: PatientStats | null;
  loadingStats: boolean;
}

const PatientList: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [state, setState] = useState<PatientListState>({
    data: [],
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
    loading: false,
    searchText: '',
    filters: {
      status: [] as string[],
      gender: undefined,
      bloodGroup: undefined,
    },
    selectedRowKeys: [],
    patientType: 'all',
    stats: null,
    loadingStats: false,
  });

  const navigate = useNavigate();

  const fetchPatients = async (params: FetchParams = {}) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const { pagination, filters, searchText, patientType } = state;

      const response = await patientService.getPatients({
        page: params.pagination?.current || pagination.current,
        search: params.searchText !== undefined ? params.searchText : searchText,
        ...(params.filters || filters),
        // Fix: Explicitly map 'patientType' to ensure correct backend filtering.
        // 'all' maps to undefined (no filter), others satisfy backend expectation.
        patientType: (params.patientType ?? patientType) === 'all' ? undefined : (params.patientType ?? patientType),
        sortBy: params.sortField,
        sortOrder: params.sortOrder,
        // Note: Patients are not filtered by locationId since they can visit any location
      });

      setState(prev => ({
        ...prev,
        loading: false,
        data: response.data,
        pagination: {
          ...prev.pagination,
          total: response.pagination.total,
          current: response.pagination.page,
          pageSize: response.pagination.limit,
        },
        ...(params.filters && { filters: params.filters }),
        ...(params.searchText !== undefined && { searchText: params.searchText }),
      }));
    } catch (error) {
      console.error('Error fetching patients:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  // Debounced search
  const debouncedSearch = debounce((value: string) => {
    fetchPatients({
      searchText: value,
      pagination: { ...state.pagination, current: 1 },
    });
  }, 500);

  const fetchStats = async () => {
    try {
      setState(prev => ({ ...prev, loadingStats: true }));
      const stats = await patientService.getPatientStats();
      setState(prev => ({ ...prev, stats, loadingStats: false }));
    } catch (error) {
      console.error('Error fetching stats:', error);
      setState(prev => ({ ...prev, loadingStats: false }));
    }
  };

  useEffect(() => {
    fetchPatients();
    fetchStats();
  }, []); // Load patients on mount

  const handlePatientTypeFilter = (type: string) => {
    setState(prev => ({ ...prev, patientType: type }));
    fetchPatients({
      patientType: type === 'all' ? undefined : type,
      pagination: { ...state.pagination, current: 1 }
    });
  };

  // Search handler is now using debouncedSearch directly in the Search component

  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<Patient> | SorterResult<Patient>[],
    _extra: TableCurrentDataSource<Patient>
  ) => {
    const nextPagination = {
      current: pagination.current ?? state.pagination.current,
      pageSize: pagination.pageSize ?? state.pagination.pageSize,
    };

    const nextFilters: PatientFilters = {
      ...state.filters,
      status: (filters.status as string[] | null) ?? state.filters.status,
      gender: ((filters.gender as string[] | null)?.[0]) ?? state.filters.gender,
      bloodGroup: ((filters.bloodGroup as string[] | null)?.[0]) ?? state.filters.bloodGroup,
    };

    fetchPatients({
      pagination: nextPagination,
      filters: nextFilters,
      sortField: Array.isArray(sorter) || !sorter.field ? undefined : String(sorter.field),
      sortOrder: Array.isArray(sorter) || !sorter.order ? undefined : sorter.order === 'ascend' ? 'asc' : 'desc',
    });
  };

  const handleStatusFilter = (status: string) => {
    const newFilters = {
      ...state.filters,
      status: status === 'all' ? undefined : [status]
    };

    if (status === 'all') {
      const { status: _omit, ...rest } = newFilters;
      fetchPatients({ filters: rest, pagination: { ...state.pagination, current: 1 } });
      return;
    }
    fetchPatients({ filters: newFilters, pagination: { ...state.pagination, current: 1 } });
  };

  const confirmDelete = async (id: string) => {
    try {
      await patientService.deletePatient(id);
      message.success('Patient deleted successfully');
      fetchPatients();
    } catch (error) {
      console.error('Error deleting patient:', error);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await patientService.bulkDeletePatients(state.selectedRowKeys as string[]);
      message.success('Selected patients deleted successfully');
      setState(prev => ({ ...prev, selectedRowKeys: [] }));
      fetchPatients();
    } catch (error) {
      console.error('Error deleting patients:', error);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const blob = await patientService.exportPatients(format, state.filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `patients_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting patients:', error);
    }
  };

  const columns: ColumnsType<Patient> = [
    {
      title: 'Patient',
      dataIndex: 'firstName',
      key: 'name',
      sorter: true,
      render: (_: any, record: Patient) => (
        <Space
          style={{ cursor: 'pointer' }}
          onClick={() => navigate(`/patients/${record.id}`)}
        >
          <Avatar icon={<UserOutlined />} />
          <span style={{ color: '#1890ff' }}>{record.firstName} {record.lastName}</span>
        </Space>
      ),
    },
    {
      title: 'Contact',
      dataIndex: 'email',
      key: 'email',
      render: (email: string | undefined, record: Patient) => (
        <div>
          <div>{email || '—'}</div>
          <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>{record.phone || '—'}</span>
        </div>
      ),
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      filters: [
        { text: 'Male', value: 'male' },
        { text: 'Female', value: 'female' },
        { text: 'Other', value: 'other' },
      ],
      filteredValue: state.filters.gender ? [state.filters.gender] : [],
    },
    {
      title: 'Blood Group',
      dataIndex: 'bloodGroup',
      key: 'bloodGroup',
      filters: [
        { text: 'A+', value: 'A+' },
        { text: 'A-', value: 'A-' },
        { text: 'B+', value: 'B+' },
        { text: 'B-', value: 'B-' },
        { text: 'AB+', value: 'AB+' },
        { text: 'AB-', value: 'AB-' },
        { text: 'O+', value: 'O+' },
        { text: 'O-', value: 'O-' },
      ],
      filteredValue: state.filters.bloodGroup ? [state.filters.bloodGroup] : [],
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string | undefined, record: Patient) => {
        let s = (status || '').toString().toLowerCase();
        if (!s) {
          s = record.isActive ? 'active' : 'inactive';
        }
        const color = s === 'active' ? 'green' : s === 'inactive' ? 'red' : 'default';
        return (
          <Tag color={color}>
            {s.toUpperCase()}
          </Tag>
        );
      },
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Inactive', value: 'inactive' },
      ],
      filteredValue: state.filters.status ?? [],
    },
    {
      title: 'Last Visit',
      dataIndex: 'lastVisit',
      key: 'lastVisit',
      sorter: true,
      render: (date: string) => date ? new Date(date).toLocaleDateString() : 'N/A',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Patient) => (
        <Dropdown
          menu={{
            items: [
              { key: 'view', icon: <UserOutlined />, label: 'View Details', onClick: () => navigate(`/patients/${record.id}`) },
              { key: 'edit', icon: <EditOutlined />, label: 'Edit', onClick: () => navigate(`/patients/${record.id}/edit`) },
              { type: 'divider' as const },
              {
                key: 'delete', danger: true, icon: <DeleteOutlined />, label: 'Delete', onClick: () => {
                  Modal.confirm({
                    title: 'Delete Patient',
                    content: `Are you sure you want to delete ${record.firstName} ${record.lastName}?`,
                    okText: 'Yes, delete',
                    okType: 'danger',
                    cancelText: 'Cancel',
                    onOk: () => confirmDelete(record.id),
                  });
                }
              },
            ]
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys: state.selectedRowKeys,
    onChange: (selectedRowKeys: React.Key[]) => {
      setState(prev => ({ ...prev, selectedRowKeys }));
    },
  };

  const hasSelected = state.selectedRowKeys.length > 0;

  // Removed duplicate function declarations

  return (
    <PatientListContainer>
      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Patients"
              value={state.stats?.totalPatients || 0}
              prefix={<TeamOutlined />}
              loading={state.loadingStats}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Inpatients (IPD)"
              value={state.stats?.inpatients || 0}
              prefix={<MedicineBoxOutlined />}
              valueStyle={{ color: '#1890ff' }}
              loading={state.loadingStats}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Outpatients (OPD)"
              value={state.stats?.outpatients || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
              loading={state.loadingStats}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Emergency"
              value={state.stats?.emergency || 0}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
              loading={state.loadingStats}
            />
          </Card>
        </Col>
      </Row>

      <div className="patient-header">
        <Title level={4} style={{ margin: 0 }}>Patients</Title>
        <Space>
          <Search
            placeholder="Search patients..."
            allowClear
            enterButton={<SearchOutlined />}
            onSearch={debouncedSearch}
            onChange={(e) => debouncedSearch(e.target.value)}
            className="search-box"
          />

          <Dropdown
            menu={{
              items: [
                { key: 'export-csv', label: 'Export as CSV', onClick: () => handleExport('csv') },
                { key: 'export-pdf', label: 'Export as PDF', onClick: () => handleExport('pdf') },
              ]
            }}
          >
            <Button icon={<DownloadOutlined />}>
              Export
            </Button>
          </Dropdown>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/patients/new')}
          >
            Add Patient
          </Button>
        </Space>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <FilterTabs>
            <FilterTab
              $active={state.patientType === 'all'}
              onClick={() => handlePatientTypeFilter('all')}
            >
              <TeamOutlined /> All Patients
            </FilterTab>

            <FilterTab
              $active={state.patientType === 'inpatient'}
              onClick={() => handlePatientTypeFilter('inpatient')}
            >
              <MedicineBoxOutlined /> Inpatients (IPD)
            </FilterTab>

            <FilterTab
              $active={state.patientType === 'outpatient'}
              onClick={() => handlePatientTypeFilter('outpatient')}
            >
              <UserOutlined /> Outpatients (OPD)
            </FilterTab>

            <FilterTab
              $active={state.patientType === 'emergency'}
              $danger={state.patientType === 'emergency'}
              onClick={() => handlePatientTypeFilter('emergency')}
            >
              <AlertOutlined /> Emergency
            </FilterTab>

            <FilterTab
              $active={state.patientType === 'discharged'}
              onClick={() => handlePatientTypeFilter('discharged')}
            >
              <CheckCircleOutlined /> Discharged
            </FilterTab>

            {hasSelected && (
              <FilterTab
                as="div"
                style={{ background: '#fff1f0', color: '#ff4d4f', borderColor: '#ffccc7' }}
                onClick={handleBulkDelete}
              >
                <DeleteOutlined /> Delete Selected ({state.selectedRowKeys.length})
              </FilterTab>
            )}
          </FilterTabs>
        </div>

        <Table
          columns={columns}
          rowSelection={rowSelection}
          dataSource={state.data}
          rowKey="id"
          loading={state.loading}
          pagination={{
            ...state.pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} patients`,
          }}
          onChange={handleTableChange}
          locale={{
            emptyText: (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <div style={{
                  width: 80,
                  height: 80,
                  background: 'linear-gradient(135deg, #EFF6FF, #fff)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 4px 15px rgba(233, 30, 99, 0.1)'
                }}>
                  <TeamOutlined style={{ fontSize: 32, color: '#10B981' }} />
                </div>
                <Typography.Text strong style={{ fontSize: 16, display: 'block', color: '#1a1a2e' }}>
                  No patients found
                </Typography.Text>
                <Typography.Text type="secondary">
                  {state.patientType === 'all'
                    ? 'Get started by adding a new patient.'
                    : `No patients found in the "${state.patientType}" category.`}
                </Typography.Text>
                {state.patientType === 'all' && (
                  <div style={{ marginTop: 16 }}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/patients/new')} style={{ background: '#10B981', border: 'none' }}>
                      Add New Patient
                    </Button>
                  </div>
                )}
              </div>
            )
          }}
        />
      </Card>
    </PatientListContainer>
  );
};

export default PatientList;
