import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Select, Input, Tag, Space, message, Tabs, DatePicker, Row, Col, Statistic, Descriptions } from 'antd';
import { PlusOutlined, AlertOutlined, CheckCircleOutlined, SearchOutlined } from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const SEVERITY_COLORS: Record<string, string> = {
  near_miss: 'cyan',
  no_harm: 'green',
  minor: 'gold',
  moderate: 'orange',
  severe: 'red',
  death: 'magenta',
};

const STATUS_COLORS: Record<string, string> = {
  reported: 'blue',
  under_investigation: 'orange',
  capa_initiated: 'purple',
  resolved: 'green',
  closed: 'default',
};

const IncidentReportManagement: React.FC = () => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [severities, setSeverities] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [capaModalVisible, setCapaModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [form] = Form.useForm();
  const [capaForm] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  const fetchIncidents = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/incident-reports', { params: { page, limit: pagination.pageSize } });
      setIncidents(res.data.data || []);
      setPagination(prev => ({ ...prev, current: page, total: res.data.meta?.total || 0 }));
    } catch {
      message.error('Failed to load incidents');
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [typesRes, sevRes, dashRes, patientsRes] = await Promise.all([
        api.get('/incident-reports/types'),
        api.get('/incident-reports/severities'),
        api.get('/incident-reports/dashboard'),
        api.get('/users?role=patient&limit=100'),
      ]);
      setTypes(typesRes.data.data || []);
      setSeverities(sevRes.data.data || []);
      setDashboard(dashRes.data.data || null);
      setPatients(patientsRes.data?.data || []);
    } catch {
      console.error('Failed to load metadata');
    }
  };

  useEffect(() => {
    fetchIncidents();
    fetchMetadata();
  }, []);

  const handleCreate = async (values: any) => {
    try {
      await api.post('/incident-reports', {
        ...values,
        incidentDate: values.incidentDate?.toISOString() || new Date().toISOString(),
      });
      message.success('Incident reported successfully');
      setModalVisible(false);
      form.resetFields();
      fetchIncidents();
      fetchMetadata();
    } catch {
      message.error('Failed to report incident');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.patch(`/incident-reports/${id}/status`, { status });
      message.success('Status updated');
      fetchIncidents();
      fetchMetadata();
    } catch {
      message.error('Failed to update status');
    }
  };

  const handleAddCapa = async (values: any) => {
    if (!selectedIncident) return;
    try {
      await api.post(`/incident-reports/${selectedIncident.id}/capa`, {
        ...values,
        capaDueDate: values.capaDueDate?.format('YYYY-MM-DD'),
      });
      message.success('CAPA added successfully');
      setCapaModalVisible(false);
      capaForm.resetFields();
      setSelectedIncident(null);
      fetchIncidents();
    } catch {
      message.error('Failed to add CAPA');
    }
  };

  const handleCompleteCapa = async (id: string) => {
    try {
      await api.post(`/incident-reports/${id}/capa/complete`);
      message.success('CAPA completed');
      fetchIncidents();
      fetchMetadata();
    } catch {
      message.error('Failed to complete CAPA');
    }
  };

  const columns = [
    { title: 'Incident #', dataIndex: 'incidentNumber', width: 130 },
    { title: 'Date', dataIndex: 'incidentDate', render: (d: string) => dayjs(d).format('DD/MM/YY HH:mm'), width: 120 },
    { title: 'Type', dataIndex: 'type', render: (t: string) => t?.replace(/_/g, ' ').toUpperCase(), ellipsis: true },
    { title: 'Severity', dataIndex: 'severity', render: (s: string) => <Tag color={SEVERITY_COLORS[s] || 'default'}>{s?.replace(/_/g, ' ').toUpperCase()}</Tag>, width: 100 },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={STATUS_COLORS[s] || 'default'}>{s?.replace(/_/g, ' ').toUpperCase()}</Tag>, width: 130 },
    { title: 'Location', dataIndex: 'locationArea', ellipsis: true },
    { title: 'Reported By', render: (_: any, r: any) => r.reportedBy ? `${r.reportedBy.firstName} ${r.reportedBy.lastName}` : '-' },
    {
      title: 'Actions',
      width: 200,
      render: (_: any, record: any) => (
        <Space size={4} wrap>
          <Button size="small" icon={<SearchOutlined />} onClick={() => { setSelectedIncident(record); setViewModalVisible(true); }}>View</Button>
          {record.status === 'reported' && (
            <Button size="small" type="primary" onClick={() => handleStatusChange(record.id, 'under_investigation')}>Investigate</Button>
          )}
          {record.status === 'under_investigation' && (
            <Button size="small" style={{ background: '#722ed1', color: '#fff' }} onClick={() => { setSelectedIncident(record); setCapaModalVisible(true); }}>Add CAPA</Button>
          )}
          {record.status === 'capa_initiated' && (
            <Button size="small" style={{ background: '#52c41a', color: '#fff' }} icon={<CheckCircleOutlined />} onClick={() => handleCompleteCapa(record.id)}>Complete</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={<><AlertOutlined /> Incident Reporting & CAPA Management</>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            Report Incident
          </Button>
        }
      >
        {dashboard && (
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={4}><Statistic title="Total Incidents" value={dashboard.total} /></Col>
            {dashboard.byStatus?.map((s: any, i: number) => (
              <Col span={4} key={i}>
                <Statistic title={s.status?.replace(/_/g, ' ').toUpperCase()} value={s.count} valueStyle={{ color: STATUS_COLORS[s.status] === 'red' ? '#cf1322' : undefined }} />
              </Col>
            ))}
          </Row>
        )}

        <Tabs defaultActiveKey="list" items={[
          {
            key: 'list',
            label: 'All Incidents',
            children: (
              <Table
                columns={columns}
                dataSource={incidents}
                rowKey="id"
                loading={loading}
                pagination={{ ...pagination, onChange: (page) => fetchIncidents(page) }}
                size="small"
              />
            ),
          },
          {
            key: 'analytics',
            label: 'Analytics',
            children: dashboard && (
              <Row gutter={16}>
                <Col span={12}>
                  <Card title="By Type" size="small">
                    {dashboard.byType?.map((t: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span>{t.type?.replace(/_/g, ' ')}</span>
                        <Tag>{t.count}</Tag>
                      </div>
                    ))}
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="By Severity" size="small">
                    {dashboard.bySeverity?.map((s: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <Tag color={SEVERITY_COLORS[s.severity]}>{s.severity?.replace(/_/g, ' ').toUpperCase()}</Tag>
                        <span>{s.count}</span>
                      </div>
                    ))}
                  </Card>
                </Col>
              </Row>
            ),
          },
        ]} />
      </Card>

      {/* Report Incident Modal */}
      <Modal title="Report Incident" open={modalVisible} onCancel={() => { setModalVisible(false); form.resetFields(); }} footer={null} width={700}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="incidentDate" label="Incident Date/Time" initialValue={dayjs()}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="Incident Type" rules={[{ required: true }]}>
                <Select placeholder="Select type">
                  {types.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="severity" label="Severity" rules={[{ required: true }]}>
                <Select placeholder="Select severity">
                  {severities.map(s => <Option key={s.value} value={s.value}>{s.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="locationArea" label="Location/Area">
                <Input placeholder="e.g., ICU, Ward A, OT 2" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="patientId" label="Patient Involved (if any)">
                <Select showSearch allowClear placeholder="Select patient" optionFilterProp="children" filterOption={(input, option) => (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())}>
                  {patients.map(p => <Option key={p.id} value={p.id}>{p.firstName} {p.lastName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="witnesses" label="Witnesses">
                <Input placeholder="Names of witnesses" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="Detailed description of the incident" />
          </Form.Item>
          <Form.Item name="immediateAction" label="Immediate Action Taken">
            <TextArea rows={2} placeholder="What immediate action was taken?" />
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Button onClick={() => { setModalVisible(false); form.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit">Report Incident</Button>
          </div>
        </Form>
      </Modal>

      {/* CAPA Modal */}
      <Modal title="Add CAPA (Corrective & Preventive Action)" open={capaModalVisible} onCancel={() => { setCapaModalVisible(false); capaForm.resetFields(); setSelectedIncident(null); }} footer={null} width={600}>
        <Form form={capaForm} layout="vertical" onFinish={handleAddCapa}>
          <Form.Item name="rootCause" label="Root Cause Analysis" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="What was the root cause of this incident?" />
          </Form.Item>
          <Form.Item name="correctiveAction" label="Corrective Action" rules={[{ required: true }]}>
            <TextArea rows={2} placeholder="What corrective action will be taken?" />
          </Form.Item>
          <Form.Item name="preventiveAction" label="Preventive Action" rules={[{ required: true }]}>
            <TextArea rows={2} placeholder="What preventive measures will be implemented?" />
          </Form.Item>
          <Form.Item name="capaDueDate" label="CAPA Due Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Button onClick={() => { setCapaModalVisible(false); capaForm.resetFields(); setSelectedIncident(null); }}>Cancel</Button>
            <Button type="primary" htmlType="submit">Add CAPA</Button>
          </div>
        </Form>
      </Modal>

      {/* View Incident Modal */}
      <Modal title={`Incident Details - ${selectedIncident?.incidentNumber || ''}`} open={viewModalVisible} onCancel={() => { setViewModalVisible(false); setSelectedIncident(null); }} footer={null} width={700}>
        {selectedIncident && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Incident #">{selectedIncident.incidentNumber}</Descriptions.Item>
            <Descriptions.Item label="Status"><Tag color={STATUS_COLORS[selectedIncident.status]}>{selectedIncident.status?.replace(/_/g, ' ').toUpperCase()}</Tag></Descriptions.Item>
            <Descriptions.Item label="Date/Time">{dayjs(selectedIncident.incidentDate).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
            <Descriptions.Item label="Type">{selectedIncident.type?.replace(/_/g, ' ')}</Descriptions.Item>
            <Descriptions.Item label="Severity"><Tag color={SEVERITY_COLORS[selectedIncident.severity]}>{selectedIncident.severity?.replace(/_/g, ' ').toUpperCase()}</Tag></Descriptions.Item>
            <Descriptions.Item label="Location">{selectedIncident.locationArea || '-'}</Descriptions.Item>
            <Descriptions.Item label="Description" span={2}>{selectedIncident.description}</Descriptions.Item>
            <Descriptions.Item label="Immediate Action" span={2}>{selectedIncident.immediateAction || '-'}</Descriptions.Item>
            {selectedIncident.rootCause && <Descriptions.Item label="Root Cause" span={2}>{selectedIncident.rootCause}</Descriptions.Item>}
            {selectedIncident.correctiveAction && <Descriptions.Item label="Corrective Action" span={2}>{selectedIncident.correctiveAction}</Descriptions.Item>}
            {selectedIncident.preventiveAction && <Descriptions.Item label="Preventive Action" span={2}>{selectedIncident.preventiveAction}</Descriptions.Item>}
            {selectedIncident.capaDueDate && <Descriptions.Item label="CAPA Due Date">{dayjs(selectedIncident.capaDueDate).format('DD/MM/YYYY')}</Descriptions.Item>}
            {selectedIncident.capaCompletedDate && <Descriptions.Item label="CAPA Completed">{dayjs(selectedIncident.capaCompletedDate).format('DD/MM/YYYY')}</Descriptions.Item>}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default IncidentReportManagement;
