import React from 'react';
import { Result, Button, Card } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface ModulePlaceholderProps {
    title: string;
    description?: string;
}

const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({ title, description }) => {
    const navigate = useNavigate();

    return (
        <div style={{ padding: '24px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Card style={{ width: '100%', maxWidth: 600, borderRadius: 16, textAlign: 'center' }}>
                <Result
                    icon={<RocketOutlined style={{ color: '#10B981' }} />}
                    title={`${title} Module`}
                    subTitle={description || "This advanced module is currently under development or disabled in your plan."}
                    extra={[
                        <Button type="primary" key="dashboard" onClick={() => navigate('/')} style={{ background: '#10B981' }}>
                            Back to Dashboard
                        </Button>,
                        <Button key="contact">Contact Support</Button>,
                    ]}
                />
            </Card>
        </div>
    );
};

export default ModulePlaceholder;
