import React, { useState } from 'react';
import { Card, Button, Typography, Space, Alert, message } from 'antd';
import { PhoneOutlined, CheckCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import PhoneOTPVerification from '../components/auth/PhoneOTPVerification';
import api from '../services/api';
import { getFirebaseIdToken } from '../config/firebase';

const { Title, Text } = Typography;

const Container = styled.div`
  max-width: 500px;
  margin: 50px auto;
  padding: 20px;
`;

const PhoneAuthTest: React.FC = () => {
  const [showOTP, setShowOTP] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleVerificationSuccess = async (phoneNumber: string, firebaseUser?: any) => {
    console.log('Phone verified:', phoneNumber, firebaseUser);
    
    setLoading(true);
    try {
      // Get Firebase ID token
      const idToken = await getFirebaseIdToken();
      if (!idToken) {
        message.error('Failed to get Firebase token');
        return;
      }

      // Send to backend for verification and authentication
      const response = await api.post('/phone-auth/verify', {
        firebaseIdToken: idToken,
        phoneNumber: phoneNumber
      });

      if (response.data) {
        setVerifiedUser(response.data.user);
        message.success('Phone authentication successful!');
        setShowOTP(false);
      }
    } catch (error: any) {
      console.error('Backend verification error:', error);
      message.error(error.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      setVerifiedUser(null);
      message.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Container>
      <Card>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
          <PhoneOutlined /> Firebase Phone Auth Test
        </Title>

        {!verifiedUser ? (
          <>
            <Alert
              type="info"
              message="Test Phone Authentication"
              description="This page demonstrates Firebase Phone Authentication integration. Use test phone numbers for development."
              style={{ marginBottom: 24 }}
            />

            <Alert
              type="success"
              message="Test Numbers"
              description={
                <div>
                  <Text>+91 9999999999 → Code: 123456</Text><br />
                  <Text>+1 650-555-1234 → Code: 123456</Text>
                </div>
              }
              style={{ marginBottom: 24 }}
            />

            <Button
              type="primary"
              size="large"
              block
              icon={<PhoneOutlined />}
              onClick={() => setShowOTP(true)}
              loading={loading}
            >
              Test Phone Authentication
            </Button>

            {showOTP && (
              <PhoneOTPVerification
                onVerificationSuccess={handleVerificationSuccess}
                onCancel={() => setShowOTP(false)}
              />
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }} />
            <Title level={4}>Authentication Successful!</Title>
            
            <Card style={{ marginTop: 24, textAlign: 'left' }}>
              <Text strong>User Details:</Text><br />
              <Text>Name: {verifiedUser.firstName} {verifiedUser.lastName}</Text><br />
              <Text>Phone: {verifiedUser.phone}</Text><br />
              <Text>Role: {verifiedUser.role}</Text><br />
              <Text>User ID: {verifiedUser.id}</Text>
            </Card>

            <Space style={{ marginTop: 24 }}>
              <Button onClick={handleLogout}>Logout</Button>
              <Button type="primary" onClick={() => window.location.href = '/portal'}>
                Go to Portal
              </Button>
            </Space>
          </div>
        )}
      </Card>
    </Container>
  );
};

export default PhoneAuthTest;
