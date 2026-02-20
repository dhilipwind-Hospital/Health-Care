import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Select, Input, Tag, Space, message, Tabs, DatePicker, Descriptions, InputNumber, Checkbox, Row, Col, Statistic } from 'antd';
import { PlusOutlined, EyeOutlined, PrinterOutlined, AlertOutlined, FileTextOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { TextArea } = Input;
const { Option } = Select;

interface MlcRecord {
  id: string;
  mlcNumber: string;
  patientId: string;
  dateTime: string;
  broughtBy?: string;
  policeStation?: string;
  natureOfInjury: string;
  gcsScore?: number;
  status: string;
  policeIntimationSent: boolean;
  isDoa: boolean;
  patient?: { firstName: string; lastName: string };
  attendingDoctor?: { firstName: string; lastName: string };
}

const MlcManagement: React.FC = () => {
  const [mlcRecords, setMlcRecords] = useState<MlcRecord[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [intimationModalVisible, setIntimationModalVisible] = useState(false);
  const [selectedMlc, setSelectedMlc] = useState<MlcRecord | null>(null);
  const [intimationLetter, setIntimationLetter] = useState('');
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const fetchMlcRecords = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/mlc', { params: { page, limit: pagination.pageSize } });
      setMlcRecords(res.data.data || []);
      setPagination(prev => ({ ...prev, current: page, total: res.data.meta?.total || 0 }));
    } catch {
      message.error('Failed to load MLC records');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/mlc/analytics');
      setAnalytics(res.data.data);
    } catch {
      console.error('Failed to load analytics');
    }
  };

  useEffect(() => {
    fetchMlcRecords();
    fetchAnalytics();
  }, []);

  const handleCreate = async (values: any) => {
    try {
      const payload = {
        ...values,
        dateTime: values.dateTime?.toISOString() || new Date().toISOString(),
        gcsScore: values.gcsEye && values.gcsVerbal && values.gcsMotor
          ? values.gcsEye + values.gcsVerbal + values.gcsMotor
          : undefined,
      };
      await api.post('/mlc', payload);
      message.success('MLC registered successfully');
      setModalVisible(false);
      form.resetFields();
      fetchMlcRecords();
      fetchAnalytics();
    } catch {
      message.error('Failed to register MLC');
    }
  };

  const handleSendIntimation = async () => {
    if (!selectedMlc) return;
    try {
      const res = await api.post(`/mlc/${selectedMlc.id}/police-intimation`);
      setIntimationLetter(res.data.intimationLetter);
      message.success('Police intimation generated');
      fetchMlcRecords();
    } catch {
      message.error('Failed to generate intimation');
    }
  };

  const getStatusTag = (status: string) => {
    const colors: Record<string, string> = {
      registered: 'blue',
      under_treatment: 'orange',
      discharged: 'green',
      referred: 'purple',
      deceased: 'red',
      absconded: 'default',
    };
    return <Tag color={colors[status] || 'default'}>{status.replace(/_/g, ' ').toUpperCase()}</Tag>;
  };

  const columns = [
    { title: 'MLC No.', dataIndex: 'mlcNumber', width: 140 },
    {
      title: 'Patient',
      dataIndex: 'patient',
      render: (patient: any) => patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
    },
    {
      title: 'Date/Time',
      dataIndex: 'dateTime',
      render: (date: string) => new Date(date).toLocaleString(),
      width: 160,
    },
    {
      title: 'Nature of Injury',
      dataIndex: 'natureOfInjury',
      render: (type: string) => type?.replace(/_/g, ' ').toUpperCase(),
    },
    { title: 'GCS', dataIndex: 'gcsScore', width: 60 },
    { title: 'Status', dataIndex: 'status', render: getStatusTag, width: 120 },
    {
      title: 'Police Intimation',
      dataIndex: 'policeIntimationSent',
      render: (sent: boolean) => sent ? <Tag color="green">Sent</Tag> : <Tag color="orange">Pending</Tag>,
      width: 120,
    },
    {
      title: 'DOA',
      dataIndex: 'isDoa',
      render: (isDoa: boolean) => isDoa ? <Tag color="red">Yes</Tag> : '-',
      width: 60,
    },
    {
      title: 'Actions',
      width: 150,
      render: (_: any, record: MlcRecord) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" onClick={() => { setSelectedMlc(record); setViewModalVisible(true); }} />
          {!record.policeIntimationSent && (
            <Button
              icon={<PrinterOutlined />}
              size="small"
              type="primary"
              onClick={() => { setSelectedMlc(record); setIntimationModalVisible(true); }}
            >
              Intimation
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={<><AlertOutlined /> Medico-Legal Case (MLC) Management</>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            Register MLC
          </Button>
        }
      >
        {analytics && (
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={4}><Statistic title="Total MLCs" value={analytics.total} /></Col>
            <Col span={4}><Statistic title="Registered" value={analytics.registered} valueStyle={{ color: '#1890ff' }} /></Col>
            <Col span={4}><Statistic title="Under Treatment" value={analytics.underTreatment} valueStyle={{ color: '#fa8c16' }} /></Col>
            <Col span={4}><Statistic title="Discharged" value={analytics.discharged} valueStyle={{ color: '#52c41a' }} /></Col>
            <Col span={4}><Statistic title="Deceased" value={analytics.deceased} valueStyle={{ color: '#f5222d' }} /></Col>
            <Col span={4}><Statistic title="DOA Cases" value={analytics.doaCases} valueStyle={{ color: '#722ed1' }} /></Col>
          </Row>
        )}

        <Tabs defaultActiveKey="list" items={[
          {
            key: 'list',
            label: 'MLC Records',
            children: (
              <Table
                columns={columns}
                dataSource={mlcRecords}
                rowKey="id"
                loading={loading}
                pagination={{ ...pagination, onChange: (page) => fetchMlcRecords(page) }}
                scroll={{ x: 1200 }}
              />
            ),
          },
        ]} />
      </Card>

      <Modal
        title="Register New MLC"
        open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        footer={null}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="patientId" label="Patient ID" rules={[{ required: true }]}>
                <Input placeholder="Enter patient ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dateTime" label="Date & Time">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="broughtBy" label="Brought By">
                <Input placeholder="Name of person who brought patient" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="broughtByRelation" label="Relation">
                <Input placeholder="Relation to patient" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="policeStation" label="Police Station">
                <Input placeholder="Nearest police station" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="natureOfInjury" label="Nature of Injury" rules={[{ required: true }]}>
                <Select placeholder="Select injury type">
                  <Option value="road_accident">Road Accident</Option>
                  <Option value="assault">Assault</Option>
                  <Option value="fall">Fall</Option>
                  <Option value="burn">Burn</Option>
                  <Option value="poisoning">Poisoning</Option>
                  <Option value="animal_bite">Animal Bite</Option>
                  <Option value="firearm">Firearm</Option>
                  <Option value="stab_wound">Stab Wound</Option>
                  <Option value="hanging">Hanging</Option>
                  <Option value="drowning">Drowning</Option>
                  <Option value="electrocution">Electrocution</Option>
                  <Option value="industrial">Industrial</Option>
                  <Option value="domestic_violence">Domestic Violence</Option>
                  <Option value="sexual_assault">Sexual Assault</Option>
                  <Option value="self_inflicted">Self Inflicted</Option>
                  <Option value="unknown">Unknown</Option>
                  <Option value="other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="injuryDescription" label="Injury Description">
            <TextArea rows={2} placeholder="Describe the injuries" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="weaponUsed" label="Weapon/Object Used">
                <Input placeholder="If any" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="foulPlaySuspected" valuePropName="checked">
                <Checkbox>Foul Play Suspected</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="alcoholSmell" valuePropName="checked">
                <Checkbox>Alcohol Smell Present</Checkbox>
              </Form.Item>
            </Col>
          </Row>

          <Card size="small" title="Glasgow Coma Scale (GCS)" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="gcsEye" label="Eye Response (1-4)">
                  <InputNumber min={1} max={4} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="gcsVerbal" label="Verbal Response (1-5)">
                  <InputNumber min={1} max={5} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="gcsMotor" label="Motor Response (1-6)">
                  <InputNumber min={1} max={6} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="consciousnessLevel" label="Consciousness Level">
                <Select placeholder="Select level">
                  <Option value="conscious">Conscious</Option>
                  <Option value="drowsy">Drowsy</Option>
                  <Option value="stuporous">Stuporous</Option>
                  <Option value="unconscious">Unconscious</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isDoa" valuePropName="checked">
                <Checkbox>Dead on Arrival (DOA)</Checkbox>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="clinicalFindings" label="Clinical Findings">
            <TextArea rows={3} placeholder="Clinical examination findings" />
          </Form.Item>

          <Form.Item name="notes" label="Additional Notes">
            <TextArea rows={2} placeholder="Any additional notes" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">Register MLC</Button>
              <Button onClick={() => { setModalVisible(false); form.resetFields(); }}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="MLC Details"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={<Button onClick={() => setViewModalVisible(false)}>Close</Button>}
        width={700}
      >
        {selectedMlc && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="MLC Number">{selectedMlc.mlcNumber}</Descriptions.Item>
            <Descriptions.Item label="Status">{getStatusTag(selectedMlc.status)}</Descriptions.Item>
            <Descriptions.Item label="Patient">
              {selectedMlc.patient ? `${selectedMlc.patient.firstName} ${selectedMlc.patient.lastName}` : 'Unknown'}
            </Descriptions.Item>
            <Descriptions.Item label="Date/Time">{new Date(selectedMlc.dateTime).toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="Nature of Injury">{selectedMlc.natureOfInjury?.replace(/_/g, ' ')}</Descriptions.Item>
            <Descriptions.Item label="GCS Score">{selectedMlc.gcsScore || '-'}</Descriptions.Item>
            <Descriptions.Item label="Brought By">{selectedMlc.broughtBy || '-'}</Descriptions.Item>
            <Descriptions.Item label="Police Station">{selectedMlc.policeStation || '-'}</Descriptions.Item>
            <Descriptions.Item label="Police Intimation">
              {selectedMlc.policeIntimationSent ? <Tag color="green">Sent</Tag> : <Tag color="orange">Pending</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="DOA">{selectedMlc.isDoa ? 'Yes' : 'No'}</Descriptions.Item>
            <Descriptions.Item label="Attending Doctor" span={2}>
              {selectedMlc.attendingDoctor ? `Dr. ${selectedMlc.attendingDoctor.firstName} ${selectedMlc.attendingDoctor.lastName}` : '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal
        title="Police Intimation Letter"
        open={intimationModalVisible}
        onCancel={() => { setIntimationModalVisible(false); setIntimationLetter(''); }}
        footer={
          <Space>
            {!intimationLetter && (
              <Button type="primary" onClick={handleSendIntimation}>Generate Intimation</Button>
            )}
            {intimationLetter && (
              <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>Print</Button>
            )}
            <Button onClick={() => { setIntimationModalVisible(false); setIntimationLetter(''); }}>Close</Button>
          </Space>
        }
        width={700}
      >
        {!intimationLetter ? (
          <p>Click "Generate Intimation" to create the police intimation letter for MLC: {selectedMlc?.mlcNumber}</p>
        ) : (
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', background: '#f5f5f5', padding: 16, borderRadius: 4 }}>
            {intimationLetter}
          </pre>
        )}
      </Modal>
    </div>
  );
};

export default MlcManagement;
