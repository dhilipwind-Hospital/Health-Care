import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Select, Input, Tag, message, DatePicker, Row, Col, Descriptions } from 'antd';
import { PlusOutlined, FileProtectOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const PcpndtFormManagement: React.FC = () => {
  const [forms, setForms] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [indications, setIndications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModal, setViewModal] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [formsRes, patientsRes, doctorsRes, indicationsRes] = await Promise.all([
        api.get('/pcpndt'),
        api.get('/users?role=patient&limit=100'),
        api.get('/users?role=doctor&limit=100'),
        api.get('/pcpndt/indications'),
      ]);
      setForms(formsRes.data.data || []);
      setPatients(patientsRes.data?.data || []);
      setDoctors(doctorsRes.data?.data || []);
      setIndications(indicationsRes.data.data || []);
    } catch { message.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (values: any) => {
    try {
      const patient = patients.find(p => p.id === values.patientId);
      await api.post('/pcpndt', {
        ...values,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : values.patientName,
        lmpDate: values.lmpDate?.format('YYYY-MM-DD'),
        procedureDate: values.procedureDate?.format('YYYY-MM-DD'),
      });
      message.success('PCPNDT Form F created');
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch { message.error('Failed to create form'); }
  };

  const handleSign = async (id: string) => {
    try {
      await api.post(`/pcpndt/${id}/sign`, { patientSignature: 'signed', doctorSignature: 'signed' });
      message.success('Declaration signed');
      fetchData();
    } catch { message.error('Failed to sign declaration'); }
  };

  const columns = [
    { title: 'Form #', dataIndex: 'formNumber', width: 140 },
    { title: 'Patient', dataIndex: 'patientName' },
    { title: 'Age', dataIndex: 'patientAge', width: 60 },
    { title: 'Husband Name', dataIndex: 'husbandName' },
    { title: 'Procedure Date', dataIndex: 'procedureDate', render: (d: string) => d ? dayjs(d).format('DD/MM/YY') : '-' },
    { title: 'Gestational Weeks', dataIndex: 'gestationalWeeks', width: 100 },
    { title: 'Doctor', render: (_: any, r: any) => r.doctor ? `Dr. ${r.doctor.firstName} ${r.doctor.lastName}` : '-' },
    { title: 'Signed', dataIndex: 'declarationSigned', render: (v: boolean) => v ? <Tag color="green">Yes</Tag> : <Tag color="orange">Pending</Tag> },
    {
      title: 'Actions', width: 180,
      render: (_: any, r: any) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setViewModal(r)}>View</Button>
          {!r.declarationSigned && <Button size="small" type="primary" onClick={() => handleSign(r.id)}>Sign</Button>}
        </div>
      )
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={<><FileProtectOutlined /> PCPNDT Form F - Pre-Natal Diagnostic Procedures</>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>New Form F</Button>}
      >
        <Table columns={columns} dataSource={forms} rowKey="id" loading={loading} size="small" />
      </Card>

      <Modal title="Create PCPNDT Form F" open={modalVisible} onCancel={() => { setModalVisible(false); form.resetFields(); }} footer={null} width={800}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="patientId" label="Patient" rules={[{ required: true }]}>
                <Select showSearch placeholder="Select patient" optionFilterProp="children" filterOption={(input, option) => (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())}
                  onChange={(val) => {
                    const p = patients.find(pt => pt.id === val);
                    if (p) form.setFieldsValue({ patientName: `${p.firstName} ${p.lastName}` });
                  }}>
                  {patients.map(p => <Option key={p.id} value={p.id}>{p.firstName} {p.lastName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}><Form.Item name="patientAge" label="Age" rules={[{ required: true }]}><Input type="number" /></Form.Item></Col>
            <Col span={6}><Form.Item name="husbandName" label="Husband Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Form.Item name="address" label="Address" rules={[{ required: true }]}><TextArea rows={2} /></Form.Item>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="referredBy" label="Referred By"><Input placeholder="Doctor/Clinic name" /></Form.Item></Col>
            <Col span={8}><Form.Item name="selfReferral" label="Self Referral" initialValue={false}>
              <Select><Option value={false}>No</Option><Option value={true}>Yes</Option></Select>
            </Form.Item></Col>
            <Col span={8}><Form.Item name="lmpDate" label="LMP Date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}><Form.Item name="gestationalWeeks" label="Gestational Weeks" rules={[{ required: true }]}><Input type="number" /></Form.Item></Col>
            <Col span={6}><Form.Item name="gravida" label="Gravida"><Input type="number" /></Form.Item></Col>
            <Col span={6}><Form.Item name="para" label="Para"><Input type="number" /></Form.Item></Col>
            <Col span={6}><Form.Item name="livingChildren" label="Living Children"><Input type="number" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="procedureDate" label="Procedure Date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}>
              <Form.Item name="indicationForTest" label="Indication for Test" rules={[{ required: true }]}>
                <Select placeholder="Select indication">
                  {indications.map(i => <Option key={i.value} value={i.value}>{i.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="doctorId" label="Doctor" rules={[{ required: true }]}>
                <Select showSearch placeholder="Select doctor" optionFilterProp="children" filterOption={(input, option) => (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())}>
                  {doctors.map(d => <Option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="doctorRegistrationNumber" label="Doctor Reg. Number" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Form.Item name="historyOfGeneticDisease" label="History of Genetic Disease"><TextArea rows={2} /></Form.Item>
          <Form.Item name="remarks" label="Remarks"><TextArea rows={2} /></Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => { setModalVisible(false); form.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit">Create Form</Button>
          </div>
        </Form>
      </Modal>

      <Modal title={`Form F - ${viewModal?.formNumber || ''}`} open={!!viewModal} onCancel={() => setViewModal(null)} footer={null} width={700}>
        {viewModal && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Form Number">{viewModal.formNumber}</Descriptions.Item>
            <Descriptions.Item label="Procedure Date">{viewModal.procedureDate ? dayjs(viewModal.procedureDate).format('DD/MM/YYYY') : '-'}</Descriptions.Item>
            <Descriptions.Item label="Patient Name">{viewModal.patientName}</Descriptions.Item>
            <Descriptions.Item label="Age">{viewModal.patientAge}</Descriptions.Item>
            <Descriptions.Item label="Husband Name">{viewModal.husbandName}</Descriptions.Item>
            <Descriptions.Item label="Address" span={2}>{viewModal.address}</Descriptions.Item>
            <Descriptions.Item label="LMP Date">{viewModal.lmpDate ? dayjs(viewModal.lmpDate).format('DD/MM/YYYY') : '-'}</Descriptions.Item>
            <Descriptions.Item label="Gestational Weeks">{viewModal.gestationalWeeks}</Descriptions.Item>
            <Descriptions.Item label="Gravida">{viewModal.gravida}</Descriptions.Item>
            <Descriptions.Item label="Para">{viewModal.para}</Descriptions.Item>
            <Descriptions.Item label="Indication">{viewModal.indicationForTest}</Descriptions.Item>
            <Descriptions.Item label="Referred By">{viewModal.referredBy || 'Self'}</Descriptions.Item>
            <Descriptions.Item label="Doctor">{viewModal.doctor ? `Dr. ${viewModal.doctor.firstName} ${viewModal.doctor.lastName}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="Reg. Number">{viewModal.doctorRegistrationNumber}</Descriptions.Item>
            <Descriptions.Item label="Declaration Signed">{viewModal.declarationSigned ? <Tag color="green">Yes</Tag> : <Tag color="orange">Pending</Tag>}</Descriptions.Item>
            <Descriptions.Item label="Declaration Date">{viewModal.declarationDate ? dayjs(viewModal.declarationDate).format('DD/MM/YYYY') : '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default PcpndtFormManagement;
