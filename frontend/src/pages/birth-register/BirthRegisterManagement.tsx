import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, DatePicker, TimePicker, Row, Col, Space, Tag, message, Tabs, Descriptions, Checkbox, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, FileTextOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const BirthRegisterManagement: React.FC = () => {
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
      const res = await api.get(`/birth-registers?page=${page}&limit=${meta.limit}`);
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
        dateOfBirth: values.dateOfBirth?.format('YYYY-MM-DD'),
        timeOfBirth: values.timeOfBirth?.format('HH:mm'),
      };
      if (editing) {
        await api.put(`/birth-registers/${editing.id}`, payload);
        message.success('Record updated');
      } else {
        await api.post('/birth-registers', payload);
        message.success('Record created');
      }
      setIsModalOpen(false);
      form.resetFields();
      setEditing(null);
      load();
    } catch (e: any) { message.error(e.response?.data?.message || 'Failed to save'); }
    finally { setLoading(false); }
  };

  const openEdit = (record: any) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      dateOfBirth: record.dateOfBirth ? dayjs(record.dateOfBirth) : undefined,
      timeOfBirth: record.timeOfBirth ? dayjs(record.timeOfBirth, 'HH:mm') : undefined,
    });
    setIsModalOpen(true);
  };

  const statusColor: Record<string, string> = { draft: 'orange', certified: 'blue', registered: 'green', issued: 'cyan' };

  const columns = [
    { title: 'Register #', dataIndex: 'registerNumber', key: 'reg', width: 140 },
    { title: 'Date of Birth', dataIndex: 'dateOfBirth', key: 'dob', render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '-' },
    { title: 'Gender', dataIndex: 'gender', key: 'gender' },
    { title: 'Birth Weight', dataIndex: 'birthWeight', key: 'wt', render: (v: number) => v ? `${v} kg` : '-' },
    { title: 'Delivery Type', dataIndex: 'deliveryType', key: 'del', render: (v: string) => v?.replace(/_/g, ' ').toUpperCase() },
    { title: 'Mother Name', dataIndex: 'motherName', key: 'mother' },
    { title: 'Father Name', dataIndex: 'fatherName', key: 'father' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={statusColor[s] || 'default'}>{s?.toUpperCase()}</Tag> },
    {
      title: 'Actions', key: 'actions', render: (_: any, r: any) => (
        <Space>
          <Button size="small" icon={<FileTextOutlined />} onClick={() => setViewRecord(r)}>View</Button>
          {r.status === 'draft' && <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>Edit</Button>}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={<><MedicineBoxOutlined /> Birth Register Management</>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setIsModalOpen(true); }}>New Birth Record</Button>}
      >
        <Table dataSource={records} columns={columns} rowKey="id" loading={loading}
          pagination={{ current: meta.page, total: meta.total, pageSize: meta.limit, onChange: (p) => load(p) }} />
      </Card>

      <Modal title={editing ? 'Edit Birth Record' : 'New Birth Record'} open={isModalOpen} onCancel={() => { setIsModalOpen(false); setEditing(null); }} footer={null} width={950} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Tabs items={[
            { key: '1', label: 'Child & Delivery', children: (
              <Row gutter={16}>
                <Col span={8}><Form.Item name="childName" label="Child Name (if named)"><Input /></Form.Item></Col>
                <Col span={8}><Form.Item name="dateOfBirth" label="Date of Birth" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={8}><Form.Item name="timeOfBirth" label="Time of Birth" rules={[{ required: true }]}><TimePicker format="HH:mm" style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={4}><Form.Item name="gender" label="Gender" rules={[{ required: true }]}><Select><Option value="male">Male</Option><Option value="female">Female</Option><Option value="other">Other</Option></Select></Form.Item></Col>
                <Col span={4}><Form.Item name="birthWeight" label="Weight (kg)" rules={[{ required: true }]}><InputNumber step={0.001} min={0} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={4}><Form.Item name="birthLength" label="Length (cm)"><InputNumber step={0.1} min={0} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={4}><Form.Item name="headCircumference" label="Head Circ (cm)"><InputNumber step={0.1} min={0} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={4}><Form.Item name="apgarScore1Min" label="APGAR 1min"><InputNumber min={0} max={10} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={4}><Form.Item name="apgarScore5Min" label="APGAR 5min"><InputNumber min={0} max={10} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={6}><Form.Item name="deliveryType" label="Delivery Type" rules={[{ required: true }]} initialValue="normal_vaginal"><Select><Option value="normal_vaginal">Normal Vaginal</Option><Option value="lscs">LSCS</Option><Option value="assisted_vaginal">Assisted Vaginal</Option><Option value="forceps">Forceps</Option><Option value="vacuum">Vacuum</Option></Select></Form.Item></Col>
                <Col span={6}><Form.Item name="typeOfBirth" label="Type" initialValue="single"><Select><Option value="single">Single</Option><Option value="twin">Twin</Option><Option value="triplet">Triplet</Option></Select></Form.Item></Col>
                <Col span={6}><Form.Item name="birthOrder" label="Birth Order" initialValue={1}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={6}><Form.Item name="isStillbirth" label="Stillbirth" valuePropName="checked"><Checkbox>Yes</Checkbox></Form.Item></Col>
              </Row>
            )},
            { key: '2', label: 'Mother Details', children: (
              <Row gutter={16}>
                <Col span={8}><Form.Item name="motherName" label="Mother's Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
                <Col span={4}><Form.Item name="motherAge" label="Age" rules={[{ required: true }]}><InputNumber min={10} max={60} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={6}><Form.Item name="motherAadhaar" label="Aadhaar"><Input maxLength={12} /></Form.Item></Col>
                <Col span={6}><Form.Item name="motherReligion" label="Religion"><Input /></Form.Item></Col>
                <Col span={6}><Form.Item name="motherEducation" label="Education"><Input /></Form.Item></Col>
                <Col span={6}><Form.Item name="motherOccupation" label="Occupation"><Input /></Form.Item></Col>
                <Col span={24}><Form.Item name="motherAddress" label="Address"><TextArea rows={2} /></Form.Item></Col>
                <Col span={4}><Form.Item name="gravida" label="Gravida"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={4}><Form.Item name="para" label="Para"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={4}><Form.Item name="livingChildren" label="Living Children"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={6}><Form.Item name="antenatalCareReceived" label="ANC Received" valuePropName="checked"><Checkbox>Yes</Checkbox></Form.Item></Col>
              </Row>
            )},
            { key: '3', label: 'Father Details', children: (
              <Row gutter={16}>
                <Col span={8}><Form.Item name="fatherName" label="Father's Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
                <Col span={4}><Form.Item name="fatherAge" label="Age"><InputNumber min={10} max={80} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={6}><Form.Item name="fatherAadhaar" label="Aadhaar"><Input maxLength={12} /></Form.Item></Col>
                <Col span={6}><Form.Item name="fatherOccupation" label="Occupation"><Input /></Form.Item></Col>
                <Col span={6}><Form.Item name="fatherEducation" label="Education"><Input /></Form.Item></Col>
              </Row>
            )},
            { key: '4', label: 'Vaccination', children: (
              <Row gutter={16}>
                <Col span={6}><Form.Item name="bcgGiven" label="BCG" valuePropName="checked"><Checkbox>Given</Checkbox></Form.Item></Col>
                <Col span={6}><Form.Item name="opv0Given" label="OPV-0" valuePropName="checked"><Checkbox>Given</Checkbox></Form.Item></Col>
                <Col span={6}><Form.Item name="hepB0Given" label="Hep B-0" valuePropName="checked"><Checkbox>Given</Checkbox></Form.Item></Col>
                <Col span={6}><Form.Item name="vitaminKGiven" label="Vitamin K" valuePropName="checked"><Checkbox>Given</Checkbox></Form.Item></Col>
                <Col span={6}><Form.Item name="nicuAdmission" label="NICU Admission" valuePropName="checked"><Checkbox>Yes</Checkbox></Form.Item></Col>
                <Col span={18}><Form.Item name="nicuReason" label="NICU Reason"><Input /></Form.Item></Col>
                <Col span={24}><Form.Item name="notes" label="Notes"><TextArea rows={3} /></Form.Item></Col>
              </Row>
            )},
          ]} />
          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Space><Button onClick={() => setIsModalOpen(false)}>Cancel</Button><Button type="primary" htmlType="submit" loading={loading}>Save</Button></Space>
          </div>
        </Form>
      </Modal>

      <Modal title="Birth Record Details" open={!!viewRecord} onCancel={() => setViewRecord(null)} footer={null} width={800}>
        {viewRecord && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Register #">{viewRecord.registerNumber}</Descriptions.Item>
            <Descriptions.Item label="Status"><Tag color={statusColor[viewRecord.status]}>{viewRecord.status?.toUpperCase()}</Tag></Descriptions.Item>
            <Descriptions.Item label="DOB">{viewRecord.dateOfBirth ? dayjs(viewRecord.dateOfBirth).format('DD/MM/YYYY') : '-'}</Descriptions.Item>
            <Descriptions.Item label="Time">{viewRecord.timeOfBirth}</Descriptions.Item>
            <Descriptions.Item label="Gender">{viewRecord.gender}</Descriptions.Item>
            <Descriptions.Item label="Weight">{viewRecord.birthWeight} kg</Descriptions.Item>
            <Descriptions.Item label="Delivery">{viewRecord.deliveryType?.replace(/_/g, ' ')}</Descriptions.Item>
            <Descriptions.Item label="APGAR">{viewRecord.apgarScore1Min}/{viewRecord.apgarScore5Min}</Descriptions.Item>
            <Descriptions.Item label="Mother">{viewRecord.motherName}</Descriptions.Item>
            <Descriptions.Item label="Father">{viewRecord.fatherName}</Descriptions.Item>
            <Descriptions.Item label="BCG">{viewRecord.bcgGiven ? '✅' : '❌'}</Descriptions.Item>
            <Descriptions.Item label="OPV-0">{viewRecord.opv0Given ? '✅' : '❌'}</Descriptions.Item>
            <Descriptions.Item label="Hep B-0">{viewRecord.hepB0Given ? '✅' : '❌'}</Descriptions.Item>
            <Descriptions.Item label="Vitamin K">{viewRecord.vitaminKGiven ? '✅' : '❌'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default BirthRegisterManagement;
