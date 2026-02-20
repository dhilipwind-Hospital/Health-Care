
import React from 'react';
import { Card } from 'antd';
import { useAuth } from '../../contexts/AuthContext';
import PatientHistory from '../../components/patients/PatientHistory';

const MedicalHistory: React.FC = () => {
  const { user } = useAuth();
  const patientId = user?.id;

  if (!patientId) {
    return <Card>Loading user information...</Card>;
  }

  return (
    <div style={{ padding: '0 24px 24px 24px' }}>
      <PatientHistory patientId={patientId} />
    </div>
  );
};

export default MedicalHistory;
