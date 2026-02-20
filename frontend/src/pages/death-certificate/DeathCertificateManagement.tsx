import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, DatePicker, TimePicker, Row, Col, Space, Tag, message, Tabs, Descriptions, Checkbox } from 'antd';
import { PlusOutlined, EditOutlined, SafetyCertificateOutlined, FileTextOutlined } from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const DeathCertificateManagement: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [viewRecord, setViewRecord] = useState<any>(null);
  const [form] = Form.useForm();
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10 });

  const load = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.get(`/death-certificates?page=${page}&limit=${meta.limit}`);
      setRecords(res.data?.data || []);
      setMeta(res.data?.meta || { total: 0, page: 1, limit: 10 });
    } catch { message.error('Failed to load records'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (values: any) => {
    try {
      setLoading(true);
      const payload = {
        ...values,
        dateOfDeath: values.dateOfDeath?.format('YYYY-MM-DD'),
        timeOfDeath: values.timeOfDeath?.format('HH:mm'),
      };
      if (editing) {
        await api.put(`/death-certificates/${editing.id}`, payload);
        message.success('Certificate updated');
      } else {
        await api.post('/death-certificates', payload);
        message.success('Certificate created');
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditing(null);
      load();
    } catch (e: any) { message.error(e.response?.data?.message || 'Failed to save'); }
    finally { setLoading(false); }
  };

  const handleCertify = async (id: string) => {
    try {
      await api.patch(`/death-certificates/${id}/certify`, {});
      message.success('Certificate certified');
      load();
    } catch { message.error('Failed to certify'); }
  };

  const openEdit = (record: any) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      dateOfDeath: record.dateOfDeath ? dayjs(record.dateOfDeath) : undefined,
      timeOfDeath: record.timeOfDeath ? dayjs(record.timeOfDeath, 'HH:mm') : undefined,
    });
    setIsModalOpen(true);
  };

  const statusColor: Record<string, string> = {
    draft: 'orange', certified: 'blue', registered: 'green', issued: 'cyan',
  };

  const columns = [
    { title: 'Certificate #', dataIndex: 'certificateNumber', key: 'cert', width: 150 },
    { title: 'Deceased Name', dataIndex: 'deceasedName', key: 'name' },
    { title: 'Date of Death', dataIndex: 'dateOfDeath', key: 'dod', render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '-' },
    { title: 'Age', dataIndex: 'age', key: 'age', render: (v: number, r: any) => v ? `${v} ${r.ageUnit || 'years'}` : '-' },
    { title: 'Gender', dataIndex: 'gender', key: 'gender' },
    { title: 'Cause', dataIndex: 'immediateCause', key: 'cause', ellipsis: true },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={statusColor[s] || 'default'}>{s?.toUpperCase()}</Tag> },
    {
      title: 'Actions', key: 'actions', render: (_: any, r: any) => (
        <Space>
          <Button size="small" icon={<FileTextOutlined />} onClick={() => setViewRecord(r)}>View</Button>
          {r.status === 'draft' && <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>Edit</Button>}
          {r.status === 'draft' && <Button size="small" type="primary" icon={<SafetyCertificateOutlined />} onClick={() => handleCertify(r.id)}>Certify</Button>}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={<><SafetyCertificateOutlined /> Death Certificate Management</>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setIsModalOpen(true); }}>New Certificate</Button>}
      >
        <Table
          dataSource={records}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ current: meta.page, total: meta.total, pageSize: meta.limit, onChange: (p) => load(p) }}
        />
      </Card>

      <Modal title={editing ? 'Edit Death Certificate' : 'New Death Certificate'} open={isModalOpen} onCancel={() => { setIsModalOpen(false); setEditing(null); }} footer={null} width={900} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Tabs items={[
            { key: '1', label: 'Deceased Info', children: (
              <Row gutter={16}>
                <Col span={12}><Form.Item name="deceasedName" label="Name of Deceased" rules={[{ required: true }]}><Input /></Form.Item></Col>
                <Col span={6}><Form.Item name="dateOfDeath" label="Date of Death" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={6}><Form.Item name="timeOfDeath" label="Time of Death" rules={[{ required: true }]}><TimePicker format="HH:mm" style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={4}><Form.Item name="age" label="Age" rules={[{ required: true }]}><Input type="number" /></Form.Item></Col>
                <Col span={4}><Form.Item name="ageUnit" label="Unit" initialValue="years"><Select><Option value="years">Years</Option><Option value="months">Months</Option><Option value="days">Days</Option></Select></Form.Item></Col>
                <Col span={4}><Form.Item name="gender" label="Gender" rules={[{ required: true }]}><Select><Option value="male">Male</Option><Option value="female">Female</Option><Option value="other">Other</Option></Select></Form.Item></Col>
                <Col span={6}><Form.Item name="fatherOrHusbandName" label="Father/Husband Name"><Input /></Form.Item></Col>
                <Col span={6}><Form.Item name="motherName" label="Mother's Name"><Input /></Form.Item></Col>
                <Col span={6}><Form.Item name="aadhaarNumber" label="Aadhaar Number"><Input maxLength={12} /></Form.Item></Col>
                <Col span={6}><Form.Item name="religion" label="Religion"><Input /></Form.Item></Col>
                <Col span={6}><Form.Item name="occupation" label="Occupation"><Input /></Form.Item></Col>
                <Col span={6}><Form.Item name="maritalStatus" label="Marital Status"><Select allowClear><Option value="single">Single</Option><Option value="married">Married</Option><Option value="widowed">Widowed</Option><Option value="divorced">Divorced</Option></Select></Form.Item></Col>
                <Col span={24}><Form.Item name="address" label="Address"><TextArea rows={2} /></Form.Item></Col>
              </Row>
            )},
            { key: '2', label: 'Cause of Death', children: (
              <Row gutter={16}>
                <Col span={24}><Form.Item name="immediateCause" label="Immediate Cause of Death" rules={[{ required: true }]}><Input /></Form.Item></Col>
                <Col span={12}><Form.Item name="antecedentCause1" label="Antecedent Cause (a)"><Input /></Form.Item></Col>
                <Col span={12}><Form.Item name="antecedentCause2" label="Antecedent Cause (b)"><Input /></Form.Item></Col>
                <Col span={12}><Form.Item name="underlyingCause" label="Underlying Cause"><Input /></Form.Item></Col>
                <Col span={12}><Form.Item name="otherConditions" label="Other Conditions"><TextArea rows={2} /></Form.Item></Col>
                <Col span={6}><Form.Item name="icdCodePrimary" label="ICD Code (Primary)"><Input /></Form.Item></Col>
                <Col span={6}><Form.Item name="mannerOfDeath" label="Manner of Death" initialValue="natural"><Select><Option value="natural">Natural</Option><Option value="accident">Accident</Option><Option value="suicide">Suicide</Option><Option value="homicide">Homicide</Option><Option value="pending">Pending</Option></Select></Form.Item></Col>
                <Col span={6}><Form.Item name="placeOfDeath" label="Place of Death" initialValue="hospital"><Select><Option value="hospital">Hospital</Option><Option value="brought_dead">Brought Dead</Option><Option value="home">Home</Option><Option value="other">Other</Option></Select></Form.Item></Col>
                <Col span={6}><Form.Item name="isMlc" label="MLC Case" valuePropName="checked"><Checkbox>Yes</Checkbox></Form.Item></Col>
              </Row>
            )},
            { key: '3', label: 'Body Handover', children: (
              <Row gutter={16}>
                <Col span={8}><Form.Item name="bodyHandoverTo" label="Handed Over To"><Input /></Form.Item></Col>
                <Col span={8}><Form.Item name="bodyHandoverRelation" label="Relation"><Input /></Form.Item></Col>
                <Col span={8}><Form.Item name="bodyHandoverIdProof" label="ID Proof"><Input /></Form.Item></Col>
                <Col span={12}><Form.Item name="bodyHandoverWitness" label="Witness"><Input /></Form.Item></Col>
                <Col span={24}><Form.Item name="notes" label="Notes"><TextArea rows={3} /></Form.Item></Col>
              </Row>
            )},
          ]} />
          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>Save</Button>
            </Space>
          </div>
        </Form>
      </Modal>

      <Modal title="Death Certificate Details" open={!!viewRecord} onCancel={() => setViewRecord(null)} footer={null} width={800}>
        {viewRecord && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Certificate #">{viewRecord.certificateNumber}</Descriptions.Item>
            <Descriptions.Item label="Status"><Tag color={statusColor[viewRecord.status]}>{viewRecord.status?.toUpperCase()}</Tag></Descriptions.Item>
            <Descriptions.Item label="Deceased Name">{viewRecord.deceasedName}</Descriptions.Item>
            <Descriptions.Item label="Date of Death">{viewRecord.dateOfDeath ? dayjs(viewRecord.dateOfDeath).format('DD/MM/YYYY') : '-'}</Descriptions.Item>
            <Descriptions.Item label="Age">{viewRecord.age} {viewRecord.ageUnit}</Descriptions.Item>
            <Descriptions.Item label="Gender">{viewRecord.gender}</Descriptions.Item>
            <Descriptions.Item label="Immediate Cause">{viewRecord.immediateCause}</Descriptions.Item>
            <Descriptions.Item label="Manner of Death">{viewRecord.mannerOfDeath}</Descriptions.Item>
            <Descriptions.Item label="Place of Death">{viewRecord.placeOfDeath}</Descriptions.Item>
            <Descriptions.Item label="MLC">{viewRecord.isMlc ? 'Yes' : 'No'}</Descriptions.Item>
            <Descriptions.Item label="Body Handed To">{viewRecord.bodyHandoverTo || '-'}</Descriptions.Item>
            <Descriptions.Item label="Certified By">{viewRecord.certifyingDoctorName || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default DeathCertificateManagement;
