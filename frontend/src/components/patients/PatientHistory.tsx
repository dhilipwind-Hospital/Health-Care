/**
 * Patient History Timeline Component
 * 
 * Displays a unified timeline of patient's medical history.
 * This is a NEW file - does not modify any existing code.
 */

import React, { useState, useEffect } from 'react';
import {
    Card,
    Timeline,
    Typography,
    Tag,
    Space,
    Spin,
    Empty,
    Button,
    Tabs,
    Table,
    Statistic,
    Row,
    Col,
    Input
} from 'antd';
import {
    MedicineBoxOutlined,
    ExperimentOutlined,
    CalendarOutlined,
    FileTextOutlined,
    HeartOutlined,
    UserOutlined,
    DollarOutlined,
    ScissorOutlined,
    HomeOutlined,
    ClockCircleOutlined,
    ReloadOutlined,
    DownloadOutlined,
    SearchOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import dayjs from 'dayjs';
import VitalsTrendChart from './VitalsTrendChart';
import exportMedicalHistoryToPDF from '../../utils/exportMedicalHistory';
import patientHistoryService from '../../services/patientHistoryService';
import {
    AdmissionHistory,
    VisitHistory,
    VitalSignsRecord,
    LabTestHistory,
    PrescriptionHistory,
    ProcedureHistory,
    PatientDocument,
    ClinicalNote
} from '../../types/patientHistory';

const { Title, Text } = Typography;

const HistoryContainer = styled.div`
  .history-stat-card {
    transition: all 0.3s ease;
    cursor: pointer;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }
  
  .timeline-card {
    margin-top: 16px;
  }
  
  .ant-timeline-item-content {
    padding-bottom: 16px;
  }
`;

interface PatientHistoryProps {
    patientId: string;
}

const PatientHistory: React.FC<PatientHistoryProps> = ({ patientId }) => {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('timeline');
    const [searchText, setSearchText] = useState('');

    // Data states
    const [admissions, setAdmissions] = useState<AdmissionHistory[]>([]);
    const [visits, setVisits] = useState<VisitHistory[]>([]);
    const [vitals, setVitals] = useState<VitalSignsRecord[]>([]);
    const [labs, setLabs] = useState<LabTestHistory[]>([]);
    const [prescriptions, setPrescriptions] = useState<PrescriptionHistory[]>([]);
    const [procedures, setProcedures] = useState<ProcedureHistory[]>([]);
    const [documents, setDocuments] = useState<PatientDocument[]>([]);
    const [notes, setNotes] = useState<ClinicalNote[]>([]);

    const [dataLoaded, setDataLoaded] = useState(false);

    useEffect(() => {
        if (patientId) {
            loadAllData();
        }
    }, [patientId]);

    const loadAllData = async () => {
        if (!patientId) return;

        setLoading(true);
        try {
            const [admData, visitData, vitalData, labData, rxData, procData, docData, noteData] = await Promise.all([
                patientHistoryService.getAdmissions(patientId),
                patientHistoryService.getVisits(patientId),
                patientHistoryService.getVitals(patientId),
                patientHistoryService.getLabTests(patientId),
                patientHistoryService.getPrescriptions(patientId),
                patientHistoryService.getProcedures(patientId),
                patientHistoryService.getDocuments(patientId),
                patientHistoryService.getClinicalNotes(patientId)
            ]);

            setAdmissions(Array.isArray(admData) ? admData : []);
            setVisits(Array.isArray(visitData) ? visitData : []);
            setVitals(Array.isArray(vitalData) ? vitalData : []);
            setLabs(Array.isArray(labData) ? labData : []);
            setPrescriptions(Array.isArray(rxData) ? rxData : []);
            setProcedures(Array.isArray(procData) ? procData : []);
            setDocuments(Array.isArray(docData) ? docData : []);
            setNotes(Array.isArray(noteData) ? noteData : []);
            setDataLoaded(true);
        } catch (error) {
            console.error('Error loading patient history:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        exportMedicalHistoryToPDF({
            patientName: 'Patient Record', // ideally should fetch patient name
            patientId,
            admissions,
            visits,
            vitals,
            labs,
            prescriptions,
            procedures,
            documents,
            notes
        });
    };

    // Get combined timeline entries
    const getTimelineEntries = () => {
        const entries: Array<{
            date: string;
            type: string;
            icon: React.ReactNode;
            color: string;
            title: string;
            description: string;
        }> = [];

        // Add admissions
        admissions?.forEach(adm => {
            entries.push({
                date: adm.admissionDate,
                type: 'admission',
                icon: <HomeOutlined />,
                color: 'red',
                title: `Admitted - ${adm.admissionReason}`,
                description: `Ward: ${adm.wardName || 'N/A'}, Room: ${adm.roomNumber || 'N/A'}`
            });
            if (adm.dischargeDate) {
                entries.push({
                    date: adm.dischargeDate,
                    type: 'discharge',
                    icon: <HomeOutlined />,
                    color: 'green',
                    title: `Discharged - ${adm.dischargeStatus || 'Recovered'}`,
                    description: `${adm.totalDays || 0} days stay`
                });
            }
        });

        // Add visits
        visits?.forEach(visit => {
            entries.push({
                date: visit.visitDate,
                type: 'visit',
                icon: <UserOutlined />,
                color: 'blue',
                title: `OPD Visit - ${visit.departmentName || 'General'}`,
                description: `${visit.doctorName || 'Doctor'} | ${visit.chiefComplaint || ''}`
            });
        });

        // Add lab tests
        labs?.forEach(lab => {
            entries.push({
                date: lab.orderDate,
                type: 'lab',
                icon: <ExperimentOutlined />,
                color: 'purple',
                title: `Lab Test - ${lab.testName}`,
                description: `Status: ${lab.overallStatus}`
            });
        });

        // Add prescriptions
        prescriptions?.forEach(rx => {
            entries.push({
                date: rx.prescribedDate,
                type: 'prescription',
                icon: <MedicineBoxOutlined />,
                color: 'cyan',
                title: `Prescription - ${rx.items?.length || 0} medications`,
                description: `By ${rx.prescribedByName || 'Doctor'}`
            });
        });

        // Add procedures
        procedures?.forEach(proc => {
            entries.push({
                date: proc.procedureDate,
                type: 'procedure',
                icon: <ScissorOutlined />,
                color: 'red',
                title: `Procedure - ${proc.procedureName}`,
                description: `Surgeon: ${proc.surgeonName || 'N/A'}`
            });
        });

        // Add documents
        documents?.forEach(doc => {
            entries.push({
                date: doc.uploadedAt,
                type: 'document',
                icon: <FileTextOutlined />,
                color: 'geekblue',
                title: `Document - ${doc.documentName}`,
                description: `Type: ${doc.documentType}`
            });
        });

        // Add notes
        notes?.forEach(note => {
            entries.push({
                date: note.noteDate,
                type: 'note',
                icon: <FileTextOutlined />,
                color: 'gold',
                title: `Clinical Note - ${note.noteType}`,
                description: `By ${note.authorName || 'Staff'}`
            });
        });

        // Sort by date descending
        const sortedEntries = entries.sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        if (!searchText) return sortedEntries;

        const lowerSearch = searchText.toLowerCase();
        return sortedEntries.filter(entry =>
            entry.title.toLowerCase().includes(lowerSearch) ||
            entry.description.toLowerCase().includes(lowerSearch) ||
            (entry.type && entry.type.toLowerCase().includes(lowerSearch))
        );
    };

    // Table columns for admissions
    const admissionColumns = [
        {
            title: 'Date',
            dataIndex: 'admissionDate',
            key: 'admissionDate',
            render: (date: string) => dayjs(date).format('MMM D, YYYY')
        },
        {
            title: 'Reason',
            dataIndex: 'admissionReason',
            key: 'admissionReason'
        },
        {
            title: 'Ward/Room',
            key: 'location',
            render: (_: any, record: AdmissionHistory) =>
                `${record.wardName || 'N/A'} / ${record.roomNumber || 'N/A'}`
        },
        {
            title: 'Days',
            dataIndex: 'totalDays',
            key: 'totalDays',
            render: (days: number) => days || '-'
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={status === 'admitted' ? 'red' : 'green'}>
                    {status?.toUpperCase()}
                </Tag>
            )
        }
    ];

    // Table columns for visits
    const visitColumns = [
        {
            title: 'Date',
            dataIndex: 'visitDate',
            key: 'visitDate',
            render: (date: string) => dayjs(date).format('MMM D, YYYY')
        },
        {
            title: 'Department',
            dataIndex: 'departmentName',
            key: 'departmentName',
            render: (dept: string) => dept || 'General'
        },
        {
            title: 'Doctor',
            dataIndex: 'doctorName',
            key: 'doctorName'
        },
        {
            title: 'Complaint',
            dataIndex: 'chiefComplaint',
            key: 'chiefComplaint',
            ellipsis: true
        },
        {
            title: 'Outcome',
            dataIndex: 'outcome',
            key: 'outcome',
            render: (outcome: string) => (
                <Tag color={outcome === 'resolved' ? 'green' : 'orange'}>
                    {outcome?.toUpperCase() || 'N/A'}
                </Tag>
            )
        }
    ];

    // Table columns for vitals
    const vitalColumns = [
        {
            title: 'Date',
            dataIndex: 'recordedAt',
            key: 'recordedAt',
            render: (date: string) => dayjs(date).format('MMM D, YYYY h:mm A')
        },
        {
            title: 'BP',
            key: 'bp',
            render: (_: any, record: VitalSignsRecord) =>
                record.bloodPressureSystolic && record.bloodPressureDiastolic
                    ? `${record.bloodPressureSystolic}/${record.bloodPressureDiastolic}`
                    : '-'
        },
        {
            title: 'HR',
            dataIndex: 'heartRate',
            key: 'heartRate',
            render: (hr: number) => hr ? `${hr} bpm` : '-'
        },
        {
            title: 'Temp',
            dataIndex: 'temperature',
            key: 'temperature',
            render: (temp: number, record: VitalSignsRecord) =>
                temp ? `${temp}°${record.temperatureUnit === 'celsius' ? 'C' : 'F'}` : '-'
        },
        {
            title: 'SpO2',
            dataIndex: 'oxygenSaturation',
            key: 'oxygenSaturation',
            render: (spo2: number) => spo2 ? `${spo2}%` : '-'
        },
        {
            title: 'Weight',
            dataIndex: 'weight',
            key: 'weight',
            render: (w: number) => w ? `${w} kg` : '-'
        }
    ];

    const tabItems = [
        {
            key: 'timeline',
            label: (
                <span><ClockCircleOutlined /> Timeline</span>
            ),
            children: (
                <Card className="timeline-card">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 40 }}>
                            <Spin size="large" />
                        </div>
                    ) : !dataLoaded ? (
                        <Empty
                            description="Click 'Load History' to view patient timeline"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    ) : getTimelineEntries().length === 0 ? (
                        <Empty description="No history records found" />
                    ) : (
                        <Timeline mode="left">
                            {getTimelineEntries().map((entry, index) => (
                                <Timeline.Item
                                    key={index}
                                    color={entry.color}
                                    dot={entry.icon}
                                >
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {dayjs(entry.date).format('MMM D, YYYY')}
                                    </Text>
                                    <br />
                                    <Text strong>{entry.title}</Text>
                                    <br />
                                    <Text type="secondary">{entry.description}</Text>
                                </Timeline.Item>
                            ))}
                        </Timeline>
                    )}
                </Card>
            )
        },
        {
            key: 'admissions',
            label: (
                <span><HomeOutlined /> Admissions ({admissions.length})</span>
            ),
            children: (
                <Card>
                    <Table
                        columns={admissionColumns}
                        dataSource={admissions}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 5 }}
                        locale={{ emptyText: dataLoaded ? 'No admission records' : 'Click "Load History" to view data' }}
                    />
                </Card>
            )
        },
        {
            key: 'visits',
            label: (
                <span><CalendarOutlined /> Visits ({visits.length})</span>
            ),
            children: (
                <Card>
                    <Table
                        columns={visitColumns}
                        dataSource={visits}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 5 }}
                        locale={{ emptyText: dataLoaded ? 'No visit records' : 'Click "Load History" to view data' }}
                    />
                </Card>
            )
        },
        {
            key: 'vitals',
            label: (
                <span><HeartOutlined /> Vitals ({vitals.length})</span>
            ),
            children: (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <VitalsTrendChart vitals={vitals} loading={loading} />
                    <Card>
                        <Table
                            columns={vitalColumns}
                            dataSource={vitals}
                            rowKey="id"
                            loading={loading}
                            pagination={{ pageSize: 5 }}
                            locale={{ emptyText: dataLoaded ? 'No vital records' : 'Click "Load History" to view data' }}
                        />
                    </Card>
                </Space>
            )
        },
        {
            key: 'labs',
            label: (
                <span><ExperimentOutlined /> Labs ({labs.length})</span>
            ),
            children: (
                <Card>
                    <Table
                        columns={[
                            { title: 'Date', dataIndex: 'orderDate', render: (d: string) => dayjs(d).format('MMM D, YYYY') },
                            { title: 'Test', dataIndex: 'testName' },
                            { title: 'Category', dataIndex: 'testCategory', render: (c: string) => <Tag>{c?.toUpperCase()}</Tag> },
                            {
                                title: 'Result',
                                dataIndex: 'resultValue',
                                render: (value: string, record: any) => {
                                    if (!value) return <span style={{ color: '#999' }}>Pending</span>;
                                    const flagColors: Record<string, string> = {
                                        normal: 'green',
                                        abnormal: 'orange',
                                        critical: 'red'
                                    };
                                    return (
                                        <Space>
                                            <strong>{value}</strong>
                                            {record.resultUnits && <span>{record.resultUnits}</span>}
                                            {record.resultFlag && (
                                                <Tag color={flagColors[record.resultFlag] || 'default'}>
                                                    {record.resultFlag?.toUpperCase()}
                                                </Tag>
                                            )}
                                        </Space>
                                    );
                                }
                            },
                            {
                                title: 'Status',
                                dataIndex: 'overallStatus',
                                render: (s: string) => (
                                    <Tag color={s === 'completed' ? 'green' : 'orange'}>
                                        {s?.toUpperCase()}
                                    </Tag>
                                )
                            }
                        ]}
                        dataSource={labs}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 5 }}
                        expandable={{
                            expandedRowRender: (record: any) => (
                                <div style={{ padding: '12px', background: '#fafafa', borderRadius: '8px' }}>
                                    <Row gutter={[16, 8]}>
                                        <Col span={8}>
                                            <strong>Reference Range:</strong> {record.referenceRange || 'N/A'}
                                        </Col>
                                        <Col span={8}>
                                            <strong>Interpretation:</strong> {record.interpretation || 'N/A'}
                                        </Col>
                                        <Col span={8}>
                                            <strong>Result Date:</strong> {record.resultDate ? dayjs(record.resultDate).format('MMM D, YYYY h:mm A') : 'N/A'}
                                        </Col>
                                        {record.notes && (
                                            <Col span={24}>
                                                <strong>Notes:</strong> {record.notes}
                                            </Col>
                                        )}
                                    </Row>
                                </div>
                            ),
                            rowExpandable: (record: any) => record.resultValue || record.notes || record.interpretation
                        }}
                        locale={{ emptyText: dataLoaded ? 'No lab records' : 'Click "Load History" to view data' }}
                    />
                </Card>
            )
        },
        {
            key: 'prescriptions',
            label: (
                <span><MedicineBoxOutlined /> Rx ({prescriptions.length})</span>
            ),
            children: (
                <Card>
                    <Table
                        columns={[
                            { title: 'Date', dataIndex: 'prescribedDate', render: (d: string) => dayjs(d).format('MMM D, YYYY') },
                            { title: 'Doctor', dataIndex: 'prescribedByName' },
                            {
                                title: 'Medications',
                                dataIndex: 'medicationsSummary',
                                ellipsis: true,
                                render: (summary: string, record: any) => (
                                    <span title={summary}>
                                        {summary || `${record.items?.length || 0} items`}
                                    </span>
                                )
                            },
                            {
                                title: 'Status',
                                dataIndex: 'status',
                                render: (s: string) => {
                                    const statusColors: Record<string, string> = {
                                        pending: 'orange',
                                        active: 'blue',
                                        dispensed: 'green',
                                        completed: 'green',
                                        cancelled: 'red'
                                    };
                                    return (
                                        <Tag color={statusColors[s] || 'default'}>
                                            {s?.toUpperCase()}
                                        </Tag>
                                    );
                                }
                            }
                        ]}
                        dataSource={prescriptions}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 5 }}
                        expandable={{
                            expandedRowRender: (record: any) => (
                                <div style={{ padding: '12px', background: '#fafafa', borderRadius: '8px' }}>
                                    <Typography.Text strong style={{ marginBottom: '12px', display: 'block' }}>
                                        Medication Details
                                    </Typography.Text>
                                    {record.items && record.items.length > 0 ? (
                                        <Table
                                            dataSource={record.items}
                                            rowKey="id"
                                            size="small"
                                            pagination={false}
                                            columns={[
                                                {
                                                    title: 'Medicine',
                                                    dataIndex: 'medicationName',
                                                    render: (name: string, item: any) => (
                                                        <div>
                                                            <strong>{name}</strong>
                                                            {item.genericName && <div style={{ fontSize: '12px', color: '#666' }}>({item.genericName})</div>}
                                                        </div>
                                                    )
                                                },
                                                { title: 'Dosage', dataIndex: 'dosage' },
                                                { title: 'Frequency', dataIndex: 'frequency' },
                                                { title: 'Duration', dataIndex: 'duration' },
                                                { title: 'Qty', dataIndex: 'quantity', width: 60 },
                                                {
                                                    title: 'Instructions',
                                                    dataIndex: 'instructions',
                                                    ellipsis: true,
                                                    render: (i: string) => i || '-'
                                                }
                                            ]}
                                        />
                                    ) : (
                                        <Empty description="No medication details available" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                    )}
                                    {record.notes && (
                                        <div style={{ marginTop: '12px' }}>
                                            <strong>Notes:</strong> {record.notes}
                                        </div>
                                    )}
                                </div>
                            ),
                            rowExpandable: (record: any) => record.items && record.items.length > 0
                        }}
                        locale={{ emptyText: dataLoaded ? 'No prescription records' : 'Click "Load History" to view data' }}
                    />
                </Card>
            )
        },
        {
            key: 'procedures',
            label: (
                <span><ScissorOutlined /> Procedures ({procedures.length})</span>
            ),
            children: (
                <Card>
                    <Table
                        columns={[
                            { title: 'Date', dataIndex: 'procedureDate', render: (d: string) => dayjs(d).format('MMM D, YYYY') },
                            { title: 'Procedure', dataIndex: 'procedureName' },
                            { title: 'Type', dataIndex: 'procedureType', render: (t: string) => <Tag>{t?.toUpperCase()}</Tag> },
                            { title: 'Surgeon', dataIndex: 'surgeonName' },
                            { title: 'Diagnosis', dataIndex: 'preOpDiagnosis', ellipsis: true }
                        ]}
                        dataSource={procedures}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 5 }}
                        locale={{ emptyText: dataLoaded ? 'No procedure records' : 'Click "Load History" to view data' }}
                    />
                </Card>
            )
        },
        {
            key: 'documents',
            label: (
                <span><FileTextOutlined /> Docs ({documents.length})</span>
            ),
            children: (
                <Card>
                    <Table
                        columns={[
                            { title: 'Uploaded', dataIndex: 'uploadedAt', render: (d: string) => dayjs(d).format('MMM D, YYYY') },
                            { title: 'Name', dataIndex: 'documentName' },
                            { title: 'Type', dataIndex: 'documentType', render: (t: string) => <Tag color="blue">{t?.toUpperCase()}</Tag> },
                            {
                                title: 'Link',
                                key: 'link',
                                render: (_, record: PatientDocument) => (
                                    <Button type="link" href={record.fileUrl} target="_blank" size="small">
                                        View
                                    </Button>
                                )
                            }
                        ]}
                        dataSource={documents}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 5 }}
                        locale={{ emptyText: dataLoaded ? 'No documents found' : 'Click "Load History" to view data' }}
                    />
                </Card>
            )
        },
        {
            key: 'notes',
            label: (
                <span><FileTextOutlined /> Notes ({notes.length})</span>
            ),
            children: (
                <Card>
                    <Table
                        columns={[
                            { title: 'Date', dataIndex: 'noteDate', render: (d: string) => dayjs(d).format('MMM D, YYYY') },
                            { title: 'Type', dataIndex: 'noteType', render: (t: string) => <Tag color="gold">{t?.toUpperCase()}</Tag> },
                            { title: 'Author', dataIndex: 'authorName' },
                            { title: 'Content', dataIndex: 'content', ellipsis: true }
                        ]}
                        dataSource={notes}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 5 }}
                        locale={{ emptyText: dataLoaded ? 'No clinical notes' : 'Click "Load History" to view data' }}
                    />
                </Card>
            )
        }
    ];

    return (
        <HistoryContainer>
            <Card
                title={
                    <Space>
                        <FileTextOutlined />
                        <span>Patient History</span>
                    </Space>
                }
                extra={
                    <Space>
                        <Input
                            placeholder="Search history..."
                            prefix={<SearchOutlined />}
                            allowClear
                            onChange={e => setSearchText(e.target.value)}
                            style={{ width: 220 }}
                        />
                        <Button
                            type="primary"
                            icon={<ReloadOutlined />}
                            onClick={loadAllData}
                            loading={loading}
                        >
                            {dataLoaded ? 'Refresh' : 'Load History'}
                        </Button>
                        <Button
                            icon={<DownloadOutlined />}
                            onClick={handleExport}
                            disabled={!dataLoaded}
                        >
                            Export PDF
                        </Button>
                    </Space>
                }
            >
                {/* Summary Stats */}
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col xs={12} sm={8} md={4}>
                        <Card size="small" className="history-stat-card">
                            <Statistic
                                title="Admissions"
                                value={admissions.length}
                                prefix={<HomeOutlined />}
                                valueStyle={{ color: '#f5222d' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={12} sm={8} md={4}>
                        <Card size="small" className="history-stat-card">
                            <Statistic
                                title="Visits"
                                value={visits.length}
                                prefix={<CalendarOutlined />}
                                valueStyle={{ color: '#1890ff' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={12} sm={8} md={4}>
                        <Card size="small" className="history-stat-card">
                            <Statistic
                                title="Vitals"
                                value={vitals.length}
                                prefix={<HeartOutlined />}
                                valueStyle={{ color: '#eb2f96' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={12} sm={8} md={4}>
                        <Card size="small" className="history-stat-card">
                            <Statistic
                                title="Lab Tests"
                                value={labs.length}
                                prefix={<ExperimentOutlined />}
                                valueStyle={{ color: '#722ed1' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={12} sm={8} md={4}>
                        <Card size="small" className="history-stat-card">
                            <Statistic
                                title="Prescriptions"
                                value={prescriptions.length}
                                prefix={<MedicineBoxOutlined />}
                                valueStyle={{ color: '#13c2c2' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={12} sm={8} md={4}>
                        <Card size="small" className="history-stat-card">
                            <Statistic
                                title="Procedures"
                                value={procedures.length}
                                prefix={<ScissorOutlined />}
                                valueStyle={{ color: '#fa8c16' }}
                            />
                        </Card>
                    </Col>
                </Row >

                {/* Tabs */}
                < Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={tabItems}
                />
            </Card >
        </HistoryContainer >
    );
};

export default PatientHistory;
