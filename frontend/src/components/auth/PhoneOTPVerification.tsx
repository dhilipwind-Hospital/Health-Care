import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, message, Space, Typography, Alert } from 'antd';
import { PhoneOutlined, SafetyOutlined, CheckCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { 
  setupRecaptcha, 
  sendOTP, 
  verifyOTP, 
  isFirebaseConfigured,
  ConfirmationResult 
} from '../../config/firebase';

const { Text, Title } = Typography;

const Container = styled.div`
  max-width: 400px;
  margin: 0 auto;
  padding: 24px;
`;

const OTPInputContainer = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  margin: 24px 0;
`;

const OTPInput = styled(Input)`
  width: 48px !important;
  height: 48px;
  text-align: center;
  font-size: 20px;
  font-weight: 600;
`;

const TimerText = styled(Text)`
  display: block;
  text-align: center;
  margin-top: 16px;
  color: #666;
`;

interface PhoneOTPVerificationProps {
  phoneNumber?: string;
  onVerificationSuccess: (phoneNumber: string, firebaseUser?: any) => void;
  onCancel?: () => void;
  purpose?: 'registration' | 'login' | 'verification';
}

const PhoneOTPVerification: React.FC<PhoneOTPVerificationProps> = ({
  phoneNumber: initialPhone,
  onVerificationSuccess,
  onCancel,
  purpose = 'verification'
}) => {
  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [phoneNumber, setPhoneNumber] = useState(initialPhone || '');
  const [countryCode, setCountryCode] = useState('+91');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifier = useRef<any>(null);

  // Check if Firebase is configured
  const firebaseReady = isFirebaseConfigured();

  useEffect(() => {
    // Initialize reCAPTCHA when component mounts
    if (firebaseReady && recaptchaContainerRef.current && !recaptchaVerifier.current) {
      recaptchaVerifier.current = setupRecaptcha('recaptcha-container');
    }
    
    return () => {
      // Cleanup reCAPTCHA on unmount
      if (recaptchaVerifier.current) {
        try {
          recaptchaVerifier.current.clear();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [firebaseReady]);

  useEffect(() => {
    // Timer countdown
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(t => t - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0 && step === 'otp') {
      setCanResend(true);
    }
  }, [timer, step]);

  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      message.error('Please enter a valid phone number');
      return;
    }

    if (!firebaseReady) {
      message.error('Phone authentication is not configured. Please contact support.');
      return;
    }

    if (!recaptchaVerifier.current) {
      recaptchaVerifier.current = setupRecaptcha('recaptcha-container');
    }

    setLoading(true);
    try {
      const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/^0+/, '')}`;
      const result = await sendOTP(fullPhoneNumber, recaptchaVerifier.current);
      
      if (result) {
        setConfirmationResult(result);
        setStep('otp');
        setTimer(60);
        setCanResend(false);
        message.success('OTP sent successfully!');
      }
    } catch (error: any) {
      console.error('Send OTP error:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/invalid-phone-number') {
        message.error('Invalid phone number format');
      } else if (error.code === 'auth/too-many-requests') {
        message.error('Too many attempts. Please try again later.');
      } else if (error.code === 'auth/quota-exceeded') {
        message.error('SMS quota exceeded. Please try again tomorrow.');
      } else {
        message.error(error.message || 'Failed to send OTP');
      }
      
      // Reset reCAPTCHA on error
      if (recaptchaVerifier.current) {
        try {
          recaptchaVerifier.current.clear();
          recaptchaVerifier.current = setupRecaptcha('recaptcha-container');
        } catch (e) {
          // Ignore
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      message.error('Please enter the complete 6-digit OTP');
      return;
    }

    if (!confirmationResult) {
      message.error('Session expired. Please request a new OTP.');
      setStep('phone');
      return;
    }

    setLoading(true);
    try {
      const user = await verifyOTP(confirmationResult, otpCode);
      setStep('success');
      message.success('Phone number verified successfully!');
      
      // Call success callback with verified phone number
      const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/^0+/, '')}`;
      onVerificationSuccess(fullPhoneNumber, user);
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      
      if (error.code === 'auth/invalid-verification-code') {
        message.error('Invalid OTP. Please check and try again.');
      } else if (error.code === 'auth/code-expired') {
        message.error('OTP expired. Please request a new one.');
        setCanResend(true);
      } else {
        message.error(error.message || 'Failed to verify OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = () => {
    setOtp(['', '', '', '', '', '']);
    handleSendOTP();
  };

  if (!firebaseReady) {
    return (
      <Container>
        <Alert
          type="warning"
          message="Phone Authentication Not Available"
          description="Firebase Phone Authentication is not configured. Please set up Firebase credentials in the environment variables."
          showIcon
        />
      </Container>
    );
  }

  return (
    <Container>
      {/* Hidden reCAPTCHA container */}
      <div id="recaptcha-container" ref={recaptchaContainerRef} />

      {step === 'phone' && (
        <>
          <Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>
            <PhoneOutlined /> Verify Phone Number
          </Title>
          
          <Form layout="vertical">
            <Form.Item label="Phone Number">
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  style={{ width: '30%' }}
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  placeholder="+91"
                />
                <Input
                  style={{ width: '70%' }}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210"
                  maxLength={10}
                />
              </Space.Compact>
            </Form.Item>
            
            <Button
              type="primary"
              block
              size="large"
              loading={loading}
              onClick={handleSendOTP}
              icon={<SafetyOutlined />}
            >
              Send OTP
            </Button>
            
            {onCancel && (
              <Button block style={{ marginTop: 12 }} onClick={onCancel}>
                Cancel
              </Button>
            )}
          </Form>
        </>
      )}

      {step === 'otp' && (
        <>
          <Title level={4} style={{ textAlign: 'center', marginBottom: 8 }}>
            <SafetyOutlined /> Enter OTP
          </Title>
          
          <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
            We've sent a 6-digit code to {countryCode}{phoneNumber}
          </Text>

          <OTPInputContainer>
            {otp.map((digit, index) => (
              <OTPInput
                key={index}
                ref={(el) => (otpInputRefs.current[index] = el as any)}
                value={digit}
                onChange={(e) => handleOTPChange(index, e.target.value)}
                onKeyDown={(e) => handleOTPKeyDown(index, e)}
                maxLength={1}
              />
            ))}
          </OTPInputContainer>

          <Button
            type="primary"
            block
            size="large"
            loading={loading}
            onClick={handleVerifyOTP}
            icon={<CheckCircleOutlined />}
          >
            Verify OTP
          </Button>

          {timer > 0 ? (
            <TimerText>
              Resend OTP in {timer} seconds
            </TimerText>
          ) : (
            <Button
              type="link"
              block
              onClick={handleResendOTP}
              disabled={!canResend}
              style={{ marginTop: 16 }}
            >
              Resend OTP
            </Button>
          )}

          <Button
            type="text"
            block
            onClick={() => setStep('phone')}
            style={{ marginTop: 8 }}
          >
            Change Phone Number
          </Button>
        </>
      )}

      {step === 'success' && (
        <div style={{ textAlign: 'center' }}>
          <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }} />
          <Title level={4}>Phone Verified!</Title>
          <Text type="secondary">
            Your phone number has been verified successfully.
          </Text>
        </div>
      )}
    </Container>
  );
};

export default PhoneOTPVerification;
