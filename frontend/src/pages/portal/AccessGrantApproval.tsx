import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, Result, Button, Spin, Typography, Space, Alert } from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    LoadingOutlined,
    SafetyOutlined,
    HomeOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Paragraph, Text } = Typography;

interface ApprovalResult {
    success: boolean;
    message: string;
    details?: {
        doctorName: string;
        hospital: string;
        duration: string;
        expiresAt: string;
        accessibleFrom: string;
    };
    code?: string;
}

const AccessGrantApproval: React.FC = () => {
    const { requestId, token } = useParams<{ requestId: string; token: string }>();
    const location = useLocation();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<ApprovalResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Determine if this is an approval or rejection based on URL path
    const isApproval = location.pathname.includes('/approve/');

    useEffect(() => {
        processRequest();
    }, [requestId, token]);

    const processRequest = async () => {
        if (!requestId || !token) {
            setError('Invalid link. Please use the link from your email.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const endpoint = isApproval
                ? `/access-grants/approve/${requestId}/${token}`
                : `/access-grants/reject/${requestId}/${token}`;

            const response = await api.get(endpoint);
            setResult(response.data);
        } catch (err: any) {
            const errMsg = err.response?.data?.message || 'Failed to process request';
            const errCode = err.response?.data?.code;

            if (errCode === 'REQUEST_NOT_FOUND') {
                setError('This access request was not found or has already been processed.');
            } else {
                setError(errMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <Card style={{ textAlign: 'center', padding: 40, borderRadius: 16 }}>
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
                    <Title level={4} style={{ marginTop: 24 }}>
                        {isApproval ? 'Approving Access...' : 'Processing Request...'}
                    </Title>
                    <Paragraph type="secondary">Please wait while we process your request.</Paragraph>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: 20
            }}>
                <Card style={{ maxWidth: 500, textAlign: 'center', borderRadius: 16 }}>
                    <Result
                        status="warning"
                        title="Unable to Process Request"
                        subTitle={error}
                        extra={[
                            <Button
                                type="primary"
                                key="home"
                                icon={<HomeOutlined />}
                                onClick={() => navigate('/')}
                            >
                                Go to Homepage
                            </Button>
                        ]}
                    />
                    <Alert
                        message="Need Help?"
                        description="If you believe this is an error, please contact your healthcare provider or check your email for a new access request link."
                        type="info"
                        showIcon
                        style={{ marginTop: 20 }}
                    />
                </Card>
            </div>
        );
    }

    if (result?.success && isApproval) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                padding: 20
            }}>
                <Card style={{ maxWidth: 600, borderRadius: 16 }}>
                    <Result
                        icon={<CheckCircleOutlined style={{ color: '#10b981' }} />}
                        title="Access Granted Successfully!"
                        subTitle={result.message}
                    />

                    {result.details && (
                        <Card
                            size="small"
                            style={{
                                background: '#f0fdf4',
                                borderColor: '#10b981',
                                marginBottom: 24
                            }}
                        >
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <div>
                                    <Text type="secondary">Doctor</Text>
                                    <br />
                                    <Text strong style={{ fontSize: 16 }}>{result.details.doctorName}</Text>
                                </div>
                                <div>
                                    <Text type="secondary">Hospital</Text>
                                    <br />
                                    <Text>{result.details.hospital}</Text>
                                </div>
                                <div>
                                    <Text type="secondary">Access Duration</Text>
                                    <br />
                                    <Text>{result.details.duration}</Text>
                                </div>
                                <div>
                                    <Text type="secondary">Expires On</Text>
                                    <br />
                                    <Text>{new Date(result.details.expiresAt).toLocaleString()}</Text>
                                </div>
                            </Space>
                        </Card>
                    )}

                    <Alert
                        message="What Happens Next?"
                        description={
                            <ul style={{ paddingLeft: 20, margin: 0 }}>
                                <li>The doctor has been notified that you approved their request.</li>
                                <li>They can now view your medical records for the specified duration.</li>
                                <li>You can revoke this access at any time from your Patient Portal.</li>
                            </ul>
                        }
                        type="info"
                        showIcon
                        icon={<SafetyOutlined />}
                        style={{ marginBottom: 24 }}
                    />

                    <div style={{ textAlign: 'center' }}>
                        <Button
                            type="primary"
                            size="large"
                            icon={<HomeOutlined />}
                            onClick={() => navigate('/portal')}
                        >
                            Go to Patient Portal
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    if (result?.success && !isApproval) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)',
                padding: 20
            }}>
                <Card style={{ maxWidth: 500, borderRadius: 16 }}>
                    <Result
                        icon={<CloseCircleOutlined style={{ color: '#dc2626' }} />}
                        title="Access Request Denied"
                        subTitle="You have denied the access request. The doctor has been notified."
                    />

                    <Alert
                        message="Your Privacy is Protected"
                        description="The doctor will not be able to access your medical records. If you change your mind, you can ask them to submit a new request."
                        type="info"
                        showIcon
                        style={{ marginBottom: 24 }}
                    />

                    <div style={{ textAlign: 'center' }}>
                        <Button
                            type="primary"
                            size="large"
                            icon={<HomeOutlined />}
                            onClick={() => navigate('/portal')}
                        >
                            Go to Patient Portal
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return null;
};

export default AccessGrantApproval;
