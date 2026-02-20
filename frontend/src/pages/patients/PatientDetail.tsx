import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Tabs, Typography, Tag, Space, Divider, Badge, Avatar, Skeleton, Upload, App, Alert, Timeline, Table, Empty, Spin } from 'antd';
import {
  EditOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  CalendarOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  HeartOutlined,
  ClockCircleOutlined,
  ExperimentOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import dayjs from 'dayjs';
import { Patient } from '../../types/patient';
import patientService from '../../services/patientService';
import patientHistoryService from '../../services/patientHistoryService';
import type { PatientTimelineEntry, LabTestHistory, PrescriptionHistory, VisitHistory } from '../../types/patientHistory';

const { Title, Text } = Typography;
// Use Tabs items API instead of deprecated TabPane

const PatientDetailContainer = styled.div`
  .patient-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 16px;
  }
  
  .patient-avatar {
    background-color: #1890ff;
    margin-right: 16px;
  }
  
  .patient-info {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
  }
  
  .patient-actions {
    display: flex;
    gap: 8px;
  }
`;

const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const { message } = App.useApp();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Patient history data states
  const [timeline, setTimeline] = useState<PatientTimelineEntry[]>([]);
  const [appointments, setAppointments] = useState<VisitHistory[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionHistory[]>([]);
  const [labTests, setLabTests] = useState<LabTestHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Mock data for testing (remove this in production)
  const mockPatient: Patient = {
    id: id || '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    dateOfBirth: '1985-05-15',
    gender: 'male',
    bloodGroup: 'A+',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
    status: 'active',
    isActive: true,
    registrationDate: '2023-01-15',
    lastVisit: '2023-10-15',
    notes: 'Patient has a history of allergies to penicillin.',
    emergencyContact: {
      name: 'Jane Doe',
      relationship: 'Spouse',
      phone: '+1987654321',
      email: 'jane.doe@example.com'
    },
    insurance: {
      provider: 'HealthPlus',
      policyNumber: 'HP12345678',
      validUntil: '2025-12-31'
    },
    allergies: ['Penicillin', 'Peanuts'],
    conditions: ['Hypertension', 'Type 2 Diabetes'],
    medications: ['Lisinopril 10mg', 'Metformin 500mg']
  };

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await patientService.getPatient(id);
        setPatient(data);
        setErrorMsg(null);

        // Fetch patient history data
        fetchPatientHistory(id);
      } catch (error) {
        console.error('Error fetching patient:', error);
        setErrorMsg('Unable to load patient details. Showing limited information.');
        setPatient(mockPatient);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [id]);

  const fetchPatientHistory = async (patientId: string) => {
    setLoadingHistory(true);
    try {
      const [timelineData, appointmentsData, prescriptionsData, labTestsData] = await Promise.all([
        patientHistoryService.getTimeline(patientId, 20),
        patientHistoryService.getVisits(patientId),
        patientHistoryService.getPrescriptions(patientId),
        patientHistoryService.getLabTests(patientId)
      ]);

      setTimeline(timelineData);
      setAppointments(appointmentsData);
      setPrescriptions(prescriptionsData);
      setLabTests(labTestsData);
    } catch (error) {
      console.error('Error fetching patient history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (loading || !patient) {
    return <Skeleton active />;
  }

  const getAge = (dateOfBirth: string) => {
    return dayjs().diff(dayjs(dateOfBirth), 'year');
  };

  const avatarSrc = patient?.profileImage ? patient.profileImage : undefined;

  const beforeUpload = async (file: File) => {
    if (!id) return false as any;
    try {
      setUploading(true);
      const { photoUrl } = await patientService.uploadPatientPhoto(id, file);
      setPatient(prev => prev ? { ...prev, profileImage: photoUrl } as any : prev);
      message.success('Photo uploaded');
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
    return false as any; // prevent auto upload by AntD Upload
  };

  const statusVal = String((patient as any)?.status || '').toLowerCase();
  const statusColor = statusVal === 'active' ? 'green' : statusVal === 'inactive' ? 'red' : 'default';
  const statusLabel = statusVal ? statusVal.toUpperCase() : '—';

  return (
    <PatientDetailContainer>
      {errorMsg && (
        <Alert type="warning" message={errorMsg} showIcon style={{ marginBottom: 12 }} />
      )}
      <div className="patient-header">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
        >
          Back to Patients
        </Button>
        <div className="patient-actions">
          <Upload showUploadList={false} beforeUpload={beforeUpload} accept="image/*">
            <Button loading={uploading}>Upload Photo</Button>
          </Upload>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/patients/${id}/edit`)}
          >
            Edit Patient
          </Button>
        </div>
      </div>

      <Card loading={loading}>
        <div className="patient-info">
          <Avatar size={64} src={avatarSrc} icon={<UserOutlined />} className="patient-avatar" />
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {patient.firstName} {patient.lastName}
              <Tag color={statusColor} style={{ marginLeft: 8 }}>
                {statusLabel}
              </Tag>
            </Title>
            <Text type="secondary">
              Patient ID: {patient.id} • Registered on {dayjs(patient.registrationDate).format('MMM D, YYYY')}
            </Text>
          </div>
        </div>

        <Tabs
          defaultActiveKey="overview"
          style={{ marginTop: 24 }}
          items={[
            {
              key: 'overview',
              label: 'Overview',
              children: (
                <Descriptions bordered column={2}>
                  <Descriptions.Item label="Full Name">
                    {patient.firstName} {patient.lastName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Date of Birth">
                    <Space>
                      <CalendarOutlined />
                      {dayjs(patient.dateOfBirth).format('MMMM D, YYYY')}
                      <Text type="secondary">({getAge(patient.dateOfBirth)} years old)</Text>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Gender">
                    {patient.gender}
                  </Descriptions.Item>
                  <Descriptions.Item label="Blood Group">
                    <Tag color="red" style={{ fontSize: '14px' }}>
                      <HeartOutlined /> {patient.bloodGroup}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">
                    <Space>
                      <MailOutlined />
                      {patient.email}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Phone">
                    <Space>
                      <PhoneOutlined />
                      {patient.phone}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Address" span={2}>
                    <Space direction="vertical" size={0}>
                      <div>
                        <HomeOutlined /> {patient.address}
                      </div>
                      <div>
                        {patient.city}, {patient.state} {patient.zipCode}
                      </div>
                      <div>{patient.country}</div>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Emergency Contact" span={2}>
                    <Space direction="vertical" size={0}>
                      <div><strong>{patient.emergencyContact?.name}</strong></div>
                      <div>{patient.emergencyContact?.relationship}</div>
                      <div>
                        <PhoneOutlined /> {patient.emergencyContact?.phone}
                      </div>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Notes" span={2}>
                    {patient.notes || 'No notes available'}
                  </Descriptions.Item>
                </Descriptions>
              )
            },
            {
              key: 'records',
              label: (
                <span>
                  <HistoryOutlined /> Medical Records
                </span>
              ),
              children: (
                <Card>
                  {loadingHistory ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Spin size="large" />
                    </div>
                  ) : timeline.length > 0 ? (
                    <Timeline
                      mode="left"
                      items={timeline.map(entry => ({
                        key: entry.id,
                        color: entry.type === 'admission' ? 'red' :
                          entry.type === 'discharge' ? 'green' :
                            entry.type === 'lab' ? 'blue' : 'gray',
                        dot: entry.type === 'admission' ? <ClockCircleOutlined /> :
                          entry.type === 'lab' ? <ExperimentOutlined /> : undefined,
                        children: (
                          <div>
                            <div style={{ fontWeight: 'bold' }}>{entry.title}</div>
                            <div style={{ color: '#666', fontSize: '12px' }}>
                              {dayjs(entry.date).format('MMM D, YYYY h:mm A')}
                            </div>
                            {entry.description && (
                              <div style={{ marginTop: '4px' }}>{entry.description}</div>
                            )}
                            {entry.doctorName && (
                              <div style={{ marginTop: '4px', color: '#1890ff' }}>
                                {entry.doctorName}
                              </div>
                            )}
                            {entry.status && (
                              <Tag style={{ marginTop: '4px' }}>{entry.status}</Tag>
                            )}
                          </div>
                        )
                      }))}
                    />
                  ) : (
                    <Empty description="No medical records found" />
                  )}
                </Card>
              )
            },
            {
              key: 'appointments',
              label: (
                <span>
                  <CalendarOutlined /> Appointments ({appointments.length})
                </span>
              ),
              children: (
                <Card>
                  {loadingHistory ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Spin size="large" />
                    </div>
                  ) : appointments.length > 0 ? (
                    <Table
                      dataSource={appointments}
                      rowKey="id"
                      pagination={{ pageSize: 10 }}
                      columns={[
                        {
                          title: 'Visit Date',
                          dataIndex: 'visitDate',
                          key: 'visitDate',
                          render: (date: string) => dayjs(date).format('MMM D, YYYY'),
                          sorter: (a, b) => dayjs(a.visitDate).unix() - dayjs(b.visitDate).unix(),
                          defaultSortOrder: 'descend'
                        },
                        {
                          title: 'Department',
                          dataIndex: 'departmentName',
                          key: 'department'
                        },
                        {
                          title: 'Doctor',
                          dataIndex: 'doctorName',
                          key: 'doctor'
                        },
                        {
                          title: 'Visit Type',
                          dataIndex: 'visitType',
                          key: 'visitType',
                          render: (type: string) => (
                            <Tag color={type === 'emergency' ? 'red' : 'blue'}>
                              {type.replace('_', ' ').toUpperCase()}
                            </Tag>
                          )
                        },
                        {
                          title: 'Chief Complaint',
                          dataIndex: 'chiefComplaint',
                          key: 'complaint',
                          ellipsis: true
                        },
                        {
                          title: 'Outcome',
                          dataIndex: 'outcome',
                          key: 'outcome',
                          render: (outcome: string) => (
                            <Tag color={outcome === 'resolved' ? 'green' : 'orange'}>
                              {outcome?.toUpperCase()}
                            </Tag>
                          )
                        }
                      ]}
                    />
                  ) : (
                    <Empty description="No appointment history found" />
                  )}
                </Card>
              )
            },
            {
              key: 'prescriptions',
              label: (
                <span>
                  <MedicineBoxOutlined /> Prescriptions ({prescriptions.length})
                </span>
              ),
              children: (
                <Card>
                  {loadingHistory ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Spin size="large" />
                    </div>
                  ) : prescriptions.length > 0 ? (
                    <Table
                      dataSource={prescriptions}
                      rowKey="id"
                      pagination={{ pageSize: 10 }}
                      expandable={{
                        expandedRowRender: (record) => (
                          <div style={{ padding: '16px', backgroundColor: '#fafafa' }}>
                            <Typography.Title level={5}>Medications:</Typography.Title>
                            {record.items && record.items.length > 0 ? (
                              <ul>
                                {record.items.map((item: any, idx: number) => (
                                  <li key={idx}>
                                    <strong>{item.medicationName}</strong>
                                    {item.strength && ` (${item.strength})`}
                                    {' - '}
                                    {item.dosage} {item.frequency} for {item.duration}
                                    {item.instructions && (
                                      <div style={{ color: '#666', fontSize: '12px' }}>
                                        Instructions: {item.instructions}
                                      </div>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <Text type="secondary">No medication details available</Text>
                            )}
                            {record.notes && (
                              <div style={{ marginTop: '8px' }}>
                                <strong>Notes:</strong> {record.notes}
                              </div>
                            )}
                          </div>
                        )
                      }}
                      columns={[
                        {
                          title: 'Prescribed Date',
                          dataIndex: 'prescribedDate',
                          key: 'prescribedDate',
                          render: (date: string) => dayjs(date).format('MMM D, YYYY'),
                          sorter: (a, b) => dayjs(a.prescribedDate).unix() - dayjs(b.prescribedDate).unix(),
                          defaultSortOrder: 'descend'
                        },
                        {
                          title: 'Prescribed By',
                          dataIndex: 'prescribedByName',
                          key: 'doctor'
                        },
                        {
                          title: 'Medications',
                          dataIndex: 'medicationsSummary',
                          key: 'medications',
                          ellipsis: true,
                          render: (text: string) => text || 'No medications'
                        },
                        {
                          title: 'Status',
                          dataIndex: 'status',
                          key: 'status',
                          render: (status: string) => (
                            <Tag color={
                              status === 'active' ? 'green' :
                                status === 'completed' ? 'blue' :
                                  status === 'discontinued' ? 'red' : 'default'
                            }>
                              {status?.toUpperCase()}
                            </Tag>
                          )
                        }
                      ]}
                    />
                  ) : (
                    <Empty description="No prescription history found" />
                  )}
                </Card>
              )
            },
            {
              key: 'lab-results',
              label: (
                <span>
                  <ExperimentOutlined /> Lab Results ({labTests.length})
                </span>
              ),
              children: (
                <Card>
                  {loadingHistory ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Spin size="large" />
                    </div>
                  ) : labTests.length > 0 ? (
                    <Table
                      dataSource={labTests}
                      rowKey="id"
                      pagination={{ pageSize: 10 }}
                      columns={[
                        {
                          title: 'Order Date',
                          dataIndex: 'orderDate',
                          key: 'orderDate',
                          render: (date: string) => dayjs(date).format('MMM D, YYYY'),
                          sorter: (a, b) => dayjs(a.orderDate).unix() - dayjs(b.orderDate).unix(),
                          defaultSortOrder: 'descend'
                        },
                        {
                          title: 'Test Name',
                          dataIndex: 'testName',
                          key: 'testName'
                        },
                        {
                          title: 'Category',
                          dataIndex: 'testCategory',
                          key: 'category',
                          render: (category: string) => (
                            <Tag>{category?.toUpperCase()}</Tag>
                          )
                        },
                        {
                          title: 'Result',
                          dataIndex: 'resultValue',
                          key: 'result',
                          render: (value: any, record: any) => {
                            if (!value) return <Text type="secondary">Pending</Text>;
                            return (
                              <span>
                                {value} {record.resultUnits}
                                {record.resultFlag && record.resultFlag !== 'normal' && (
                                  <Tag color="red" style={{ marginLeft: '8px' }}>
                                    {record.resultFlag.toUpperCase()}
                                  </Tag>
                                )}
                              </span>
                            );
                          }
                        },
                        {
                          title: 'Reference Range',
                          dataIndex: 'referenceRange',
                          key: 'range',
                          render: (range: string) => range || '-'
                        },
                        {
                          title: 'Status',
                          dataIndex: 'overallStatus',
                          key: 'status',
                          render: (status: string) => (
                            <Tag color={
                              status === 'completed' ? 'green' :
                                status === 'processing' ? 'blue' :
                                  status === 'pending' ? 'orange' : 'default'
                            }>
                              {status?.toUpperCase()}
                            </Tag>
                          )
                        }
                      ]}
                    />
                  ) : (
                    <Empty description="No lab results found" />
                  )}
                </Card>
              )
            }
          ]}
        />
      </Card>
    </PatientDetailContainer>
  );
};

export default PatientDetail;
