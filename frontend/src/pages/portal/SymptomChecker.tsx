/**
 * Symptom Checker Page
 * 
 * AI-powered symptom analysis chatbot for the Patient Portal.
 * Helps patients describe symptoms and recommends appropriate specialists.
 * 
 * Created: February 4, 2026
 * Updated: February 4, 2026 - Fixed View Doctors, Describe more symptoms issues
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    Card,
    Input,
    Button,
    Typography,
    Space,
    Tag,
    Alert,
    Spin,
    Avatar,
    List,
    Divider,
    message,
    Row,
    Col,
    Modal,
    Empty
} from 'antd';
import {
    SendOutlined,
    RobotOutlined,
    UserOutlined,
    MedicineBoxOutlined,
    CalendarOutlined,
    TeamOutlined,
    WarningOutlined,
    HeartOutlined,
    ReloadOutlined,
    CloseOutlined,
    PhoneOutlined,
    EnvironmentOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Doctor {
    id: string;
    firstName: string;
    lastName: string;
    specialization?: string;
    qualification?: string;
    experience?: number;
    consultationFee?: number;
    profileImage?: string;
    department?: {
        id: string;
        name: string;
    };
    availableFrom?: string;
    availableTo?: string;
    workingDays?: string[];
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    analysis?: {
        department?: string;
        doctorTypes?: string[];
        urgencyLevel?: string;
        isEmergency?: boolean;
        suggestedDoctors?: any[];
    };
    suggestions?: Array<{
        label: string;
        action: string;
        department?: string;
    }>;
}

const SymptomChecker: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Doctor modal state
    const [doctorModalVisible, setDoctorModalVisible] = useState(false);
    const [doctorModalLoading, setDoctorModalLoading] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);

    // Input focus ref
    const inputRef = useRef<any>(null);

    // Theme colors
    const primaryColor = '#10B981';

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Initial greeting
    useEffect(() => {
        const greeting: ChatMessage = {
            id: 'greeting',
            role: 'assistant',
            content: `Hello${user?.firstName ? ` ${user.firstName}` : ''}! 👋\n\nI'm your AI Health Assistant. I can help you understand your symptoms and recommend the right specialist.\n\n**How can I help you today?**\n\nTry telling me something like:\n• "I have shoulder pain"\n• "I've been having headaches"\n• "My child has a fever"`,
            timestamp: new Date(),
            suggestions: [
                { label: '🦴 Shoulder/Joint Pain', action: 'symptom' },
                { label: '🤕 Headache', action: 'symptom' },
                { label: '🤒 Fever/Cold', action: 'symptom' },
                { label: '❤️ Chest Discomfort', action: 'symptom' }
            ]
        };
        setMessages([greeting]);
    }, [user?.firstName]);

    // Fetch doctors for a specific department within the organization
    const fetchDoctorsByDepartment = async (department: string) => {
        setDoctorModalLoading(true);
        setSelectedDepartment(department);
        setDoctorModalVisible(true);

        try {
            // Use the dedicated symptom-checker doctors endpoint
            const orgId = (user as any)?.organization?.id || (user as any)?.organizationId;
            const response = await api.get(`/symptom-checker/doctors/${encodeURIComponent(department)}`, {
                params: {
                    organizationId: orgId
                }
            });

            const doctors = response.data?.doctors || [];
            setFilteredDoctors(Array.isArray(doctors) ? doctors : []);

            if (doctors.length === 0) {
                message.info(`No doctors found in ${department} department. You can still book a general appointment.`);
            }
        } catch (error: any) {
            console.error('Error fetching doctors:', error);
            message.error('Could not load doctors. Please try again.');
            setFilteredDoctors([]);
        } finally {
            setDoctorModalLoading(false);
        }
    };

    const handleSend = async (text?: string) => {
        const messageText = text || inputValue.trim();
        if (!messageText) return;

        // Add user message
        const userMessage: ChatMessage = {
            id: `user_${Date.now()}`,
            role: 'user',
            content: messageText,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setLoading(true);

        try {
            // Call the symptom checker API
            const response = await api.post('/symptom-checker/chat', {
                message: messageText,
                sessionId,
                organizationId: (user as any)?.organization?.id || (user as any)?.organizationId
            });

            const { reply, analysis, suggestions } = response.data;

            // Add assistant response
            const assistantMessage: ChatMessage = {
                id: `assistant_${Date.now()}`,
                role: 'assistant',
                content: reply || "I've received your message. How else can I help you?",
                timestamp: new Date(),
                analysis,
                suggestions
            };
            setMessages(prev => [...prev, assistantMessage]);

        } catch (error: any) {
            console.error('Symptom checker error:', error);
            const errorMessage: ChatMessage = {
                id: `error_${Date.now()}`,
                role: 'assistant',
                content: "I'm sorry, I couldn't process that. Please try describing your symptoms again.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
            message.error('Failed to analyze symptoms');
        } finally {
            setLoading(false);
        }
    };

    const handleSuggestionClick = (suggestion: { label: string; action: string; department?: string }) => {
        if (suggestion.action === 'book' && suggestion.department) {
            // Navigate to appointment booking with department pre-selected
            navigate(`/appointments/new?department=${encodeURIComponent(suggestion.department)}`);
        } else if (suggestion.action === 'doctors' && suggestion.department) {
            // Fetch and show doctors in a modal (FIXED - no longer navigates to public page)
            fetchDoctorsByDepartment(suggestion.department);
        } else if (suggestion.action === 'symptom') {
            // Extract symptom from label and send
            const symptomText = suggestion.label.replace(/^[^\w]+/, '').trim();
            handleSend(`I have ${symptomText.toLowerCase()}`);
        } else if (suggestion.action === 'continue') {
            // Focus on input for user to type more symptoms (FIXED)
            inputRef.current?.focus();
            message.info('Please type your additional symptoms below');
        } else {
            // Just send the label as a message
            handleSend(suggestion.label);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleNewConversation = () => {
        setMessages([]);
        setTimeout(() => {
            const greeting: ChatMessage = {
                id: 'greeting',
                role: 'assistant',
                content: `Let's start fresh! 👋\n\nPlease describe your symptoms and I'll help you find the right specialist.`,
                timestamp: new Date(),
                suggestions: [
                    { label: '🦴 Shoulder/Joint Pain', action: 'symptom' },
                    { label: '🤕 Headache', action: 'symptom' },
                    { label: '🤒 Fever/Cold', action: 'symptom' },
                    { label: '❤️ Chest Discomfort', action: 'symptom' }
                ]
            };
            setMessages([greeting]);
        }, 100);
    };

    const getUrgencyColor = (level?: string) => {
        switch (level) {
            case 'emergency': return 'red';
            case 'urgent': return 'orange';
            case 'moderate': return 'gold';
            default: return 'green';
        }
    };

    const renderMessage = (msg: ChatMessage) => {
        const isUser = msg.role === 'user';

        return (
            <div
                key={msg.id}
                style={{
                    display: 'flex',
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                    marginBottom: 16
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: isUser ? 'row-reverse' : 'row',
                        alignItems: 'flex-start',
                        maxWidth: '85%'
                    }}
                >
                    <Avatar
                        icon={isUser ? <UserOutlined /> : <RobotOutlined />}
                        style={{
                            backgroundColor: isUser ? primaryColor : '#f0f0f0',
                            color: isUser ? 'white' : primaryColor,
                            marginLeft: isUser ? 8 : 0,
                            marginRight: isUser ? 0 : 8,
                            flexShrink: 0
                        }}
                    />
                    <div>
                        {/* Message bubble - using div instead of Card for reliability */}
                        <div
                            style={{
                                backgroundColor: isUser ? primaryColor : '#f9f9f9',
                                borderRadius: 12,
                                padding: '12px 16px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                minWidth: isUser ? 60 : 200,
                                maxWidth: '100%'
                            }}
                        >
                            {/* Display message content */}
                            <div
                                style={{
                                    color: isUser ? 'white' : '#333',
                                    whiteSpace: 'pre-wrap',
                                    lineHeight: 1.6,
                                    wordBreak: 'break-word',
                                    fontSize: 14
                                }}
                            >
                                {isUser ? (
                                    // For user messages, display as plain text
                                    <span>{msg.content}</span>
                                ) : (
                                    // For assistant messages, parse markdown-like formatting
                                    <span
                                        dangerouslySetInnerHTML={{
                                            __html: msg.content
                                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                .replace(/\n/g, '<br/>')
                                        }}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Analysis details */}
                        {msg.analysis && !msg.analysis.isEmergency && msg.analysis.department && (
                            <div style={{ marginTop: 12 }}>
                                <Space wrap>
                                    <Tag icon={<MedicineBoxOutlined />} color={primaryColor}>
                                        {msg.analysis.department}
                                    </Tag>
                                    {msg.analysis.urgencyLevel && (
                                        <Tag color={getUrgencyColor(msg.analysis.urgencyLevel)}>
                                            {msg.analysis.urgencyLevel.toUpperCase()}
                                        </Tag>
                                    )}
                                </Space>

                                {/* Doctor suggestions displayed inline if available */}
                                {msg.analysis.suggestedDoctors && msg.analysis.suggestedDoctors.length > 0 && (
                                    <Card
                                        size="small"
                                        style={{ marginTop: 12 }}
                                        title={<><TeamOutlined /> Available Doctors in {msg.analysis.department}</>}
                                    >
                                        <List
                                            size="small"
                                            dataSource={msg.analysis.suggestedDoctors}
                                            renderItem={(doctor: any) => (
                                                <List.Item
                                                    actions={[
                                                        <Button
                                                            type="primary"
                                                            size="small"
                                                            icon={<CalendarOutlined />}
                                                            onClick={() => navigate(`/appointments/new?doctorId=${doctor.id}`)}
                                                            style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                                                        >
                                                            Book
                                                        </Button>
                                                    ]}
                                                >
                                                    <List.Item.Meta
                                                        avatar={<Avatar src={doctor.profileImage} icon={<UserOutlined />} />}
                                                        title={doctor.name}
                                                        description={`${doctor.specialization} • ${doctor.experience || 0} years exp`}
                                                    />
                                                </List.Item>
                                            )}
                                        />
                                    </Card>
                                )}
                            </div>
                        )}

                        {/* Emergency alert */}
                        {msg.analysis?.isEmergency && (
                            <Alert
                                type="error"
                                icon={<WarningOutlined />}
                                message="Emergency Situation"
                                description="Please call emergency services (108/112) immediately or visit the nearest Emergency Room."
                                showIcon
                                style={{ marginTop: 12, borderRadius: 8 }}
                                action={
                                    <Button danger type="primary" href="tel:108">
                                        Call 108
                                    </Button>
                                }
                            />
                        )}

                        {/* Suggestion buttons */}
                        {msg.suggestions && msg.suggestions.length > 0 && (
                            <div style={{ marginTop: 12 }}>
                                <Space wrap>
                                    {msg.suggestions.map((sug, idx) => (
                                        <Button
                                            key={idx}
                                            size="small"
                                            onClick={() => handleSuggestionClick(sug)}
                                            style={{
                                                borderColor: primaryColor,
                                                color: primaryColor
                                            }}
                                        >
                                            {sug.label}
                                        </Button>
                                    ))}
                                </Space>
                            </div>
                        )}

                        <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <Title level={2} style={{ margin: 0, color: primaryColor }}>
                            <HeartOutlined style={{ marginRight: 12 }} />
                            AI Symptom Checker
                        </Title>
                        <Text type="secondary">
                            Describe your symptoms and get specialist recommendations
                        </Text>
                    </div>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={handleNewConversation}
                    >
                        New Chat
                    </Button>
                </div>
            </div>

            {/* Disclaimer */}
            <Alert
                type="info"
                showIcon
                message="Important Notice"
                description="This AI assistant provides general health information only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or qualified health provider."
                style={{ marginBottom: 24, borderRadius: 8 }}
            />

            {/* Chat Container */}
            <Card
                style={{
                    borderRadius: 16,
                    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                    height: '60vh',
                    display: 'flex',
                    flexDirection: 'column'
                }}
                styles={{
                    body: {
                        padding: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%'
                    }
                }}
            >
                {/* Messages Area */}
                <div
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: 24,
                        backgroundColor: '#fafafa'
                    }}
                >
                    {messages.map(renderMessage)}

                    {loading && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#999' }}>
                            <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#f0f0f0', color: primaryColor }} />
                            <Spin size="small" />
                            <Text type="secondary">Analyzing your symptoms...</Text>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                <Divider style={{ margin: 0 }} />

                {/* Input Area */}
                <div style={{ padding: 16, backgroundColor: 'white' }}>
                    <Row gutter={12}>
                        <Col flex="auto">
                            <TextArea
                                ref={inputRef}
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Describe your symptoms here... (e.g., 'I have shoulder pain')"
                                autoSize={{ minRows: 1, maxRows: 4 }}
                                disabled={loading}
                                style={{ borderRadius: 8 }}
                            />
                        </Col>
                        <Col>
                            <Button
                                type="primary"
                                icon={<SendOutlined />}
                                onClick={() => handleSend()}
                                loading={loading}
                                disabled={!inputValue.trim()}
                                style={{
                                    backgroundColor: primaryColor,
                                    borderColor: primaryColor,
                                    height: 40,
                                    width: 40,
                                    borderRadius: 8
                                }}
                            />
                        </Col>
                    </Row>
                </div>
            </Card>

            {/* Quick Actions */}
            <Card style={{ marginTop: 16, borderRadius: 12 }}>
                <Title level={5} style={{ marginBottom: 12 }}>Common Symptoms</Title>
                <Space wrap>
                    {[
                        '🦴 Shoulder Pain',
                        '🦵 Knee Pain',
                        '🤕 Headache',
                        '🤒 Fever',
                        '😷 Cough & Cold',
                        '💔 Chest Pain',
                        '🤢 Stomach Pain',
                        '😰 Anxiety'
                    ].map((symptom, idx) => (
                        <Button
                            key={idx}
                            onClick={() => handleSend(`I have ${symptom.replace(/^[^\w]+/, '').toLowerCase()}`)}
                            disabled={loading}
                        >
                            {symptom}
                        </Button>
                    ))}
                </Space>
            </Card>

            {/* Doctor List Modal - Shows organization doctors filtered by department */}
            <Modal
                title={
                    <Space>
                        <TeamOutlined style={{ color: primaryColor }} />
                        <span>Doctors in {selectedDepartment}</span>
                    </Space>
                }
                open={doctorModalVisible}
                onCancel={() => setDoctorModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setDoctorModalVisible(false)}>
                        Close
                    </Button>,
                    <Button
                        key="book"
                        type="primary"
                        icon={<CalendarOutlined />}
                        onClick={() => {
                            setDoctorModalVisible(false);
                            navigate(`/appointments/new?department=${encodeURIComponent(selectedDepartment)}`);
                        }}
                        style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                    >
                        Book Appointment
                    </Button>
                ]}
                width={700}
            >
                {doctorModalLoading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <Spin size="large" />
                        <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
                            Loading doctors in {selectedDepartment}...
                        </Text>
                    </div>
                ) : filteredDoctors.length > 0 ? (
                    <List
                        itemLayout="horizontal"
                        dataSource={filteredDoctors}
                        renderItem={(doctor: Doctor) => (
                            <List.Item
                                actions={[
                                    <Button
                                        type="primary"
                                        icon={<CalendarOutlined />}
                                        onClick={() => {
                                            setDoctorModalVisible(false);
                                            navigate(`/appointments/new?doctorId=${doctor.id}`);
                                        }}
                                        style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                                    >
                                        Book
                                    </Button>
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={
                                        <Avatar
                                            size={56}
                                            src={doctor.profileImage}
                                            icon={<UserOutlined />}
                                            style={{ backgroundColor: '#f0f0f0' }}
                                        />
                                    }
                                    title={
                                        <Space>
                                            <Text strong>Dr. {doctor.firstName} {doctor.lastName}</Text>
                                            {doctor.department?.name && (
                                                <Tag color={primaryColor}>{doctor.department.name}</Tag>
                                            )}
                                        </Space>
                                    }
                                    description={
                                        <div>
                                            <div>
                                                <Text type="secondary">
                                                    {doctor.specialization || 'Specialist'} • {doctor.qualification || 'MBBS'}
                                                </Text>
                                            </div>
                                            <div>
                                                <Text type="secondary">
                                                    {doctor.experience ? `${doctor.experience} years experience` : ''}
                                                    {doctor.consultationFee ? ` • ₹${doctor.consultationFee} consultation` : ''}
                                                </Text>
                                            </div>
                                            {doctor.availableFrom && doctor.availableTo && (
                                                <div>
                                                    <Text type="secondary">
                                                        Available: {doctor.availableFrom} - {doctor.availableTo}
                                                    </Text>
                                                </div>
                                            )}
                                        </div>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                ) : (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <span>
                                No doctors found in <strong>{selectedDepartment}</strong> department.
                                <br />
                                You can still book a general appointment.
                            </span>
                        }
                    >
                        <Button
                            type="primary"
                            icon={<CalendarOutlined />}
                            onClick={() => {
                                setDoctorModalVisible(false);
                                navigate('/appointments/new');
                            }}
                            style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                        >
                            Book General Appointment
                        </Button>
                    </Empty>
                )}
            </Modal>
        </div>
    );
};

export default SymptomChecker;
