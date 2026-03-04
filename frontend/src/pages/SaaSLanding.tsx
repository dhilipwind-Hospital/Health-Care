import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MedicineBoxOutlined,
  SafetyOutlined,
  TeamOutlined,
  CloudOutlined,
  CheckCircleOutlined,
  RocketOutlined,
  GlobalOutlined,
  LockOutlined,
  ThunderboltOutlined,
  CustomerServiceOutlined,
  HeartOutlined,
  TrophyOutlined,
  BulbOutlined,
  AimOutlined,
  WhatsAppOutlined,
  StarFilled,
  QuestionCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  MinusOutlined,
  UserOutlined,
  ScheduleOutlined,
  DollarOutlined,
  ExperimentOutlined,
  HomeOutlined,
  BarChartOutlined,
  AuditOutlined,
  BellOutlined,
  QrcodeOutlined,
  IdcardOutlined,
  MobileOutlined,
  AppstoreOutlined,
  MedicineBoxFilled,
  CarOutlined,
  SolutionOutlined,
  FileProtectOutlined,
  ToolOutlined,
  CalendarOutlined,
  FundOutlined,
  AlertOutlined,
  FormOutlined,
  EyeOutlined,
  ReconciliationOutlined,
  CoffeeOutlined,
  ScissorOutlined,
  BankOutlined,
  PhoneOutlined,
  SkinOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { Button, Card, Row, Col, Typography, Space, Statistic, Modal, Form, Input, Select, message, Collapse } from 'antd';
import api from '../services/api';
import './SaaSLanding.css';


const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const pricingBtnStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  height: '52px',
  background: 'linear-gradient(135deg, #1E3A5F 0%, #0F172A 100%)',
  color: '#ffffff',
  border: 'none',
  borderRadius: '12px',
  fontSize: '1rem',
  fontWeight: 600,
  letterSpacing: '0.01em',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  boxShadow: '0 4px 16px rgba(30, 58, 95, 0.35)',
};

const SaaSLanding: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [isDemoModalVisible, setIsDemoModalVisible] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [form] = Form.useForm();
  const [statsAnimated, setStatsAnimated] = React.useState(false);
  const [modules, setModules] = React.useState(0);
  const [roles, setRoles] = React.useState(0);
  const [uptime, setUptime] = React.useState(0);
  const [activeModuleTab, setActiveModuleTab] = React.useState('clinical');

  const handleTalkToSales = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // In a real app, use the configured axios instance URL
      // Assuming API_URL is available in environment or context, relying on proxy for now
      await api.post('/sales-inquiry', {
        ...values,
        source: 'landing_page'
      });


      message.success('Request sent successfully! Our team will contact you shortly.');
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Sales inquiry error:', error);
      message.error('Failed to send request. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Simple inline scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          
          // Trigger counter animation for hero stats
          if (entry.target.classList.contains('hero-stats') && !statsAnimated) {
            setStatsAnimated(true);
            
            // Animate modules counter
            let moduleCount = 0;
            const moduleInterval = setInterval(() => {
              moduleCount += 1;
              setModules(moduleCount);
              if (moduleCount >= 50) clearInterval(moduleInterval);
            }, 18);

            // Animate roles counter
            let roleCount = 0;
            const roleInterval = setInterval(() => {
              roleCount += 1;
              setRoles(roleCount);
              if (roleCount >= 14) clearInterval(roleInterval);
            }, 50);
            
            // Animate uptime counter
            let uptimeCount = 0;
            const uptimeInterval = setInterval(() => {
              uptimeCount += 0.1;
              setUptime(Math.min(uptimeCount, 99.9));
              if (uptimeCount >= 99.9) clearInterval(uptimeInterval);
            }, 10);
          }
          
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe all elements with scroll animation classes
    const animateElements = document.querySelectorAll(
      '.scroll-animate, .scroll-animate-card, .scroll-animate-stagger, .hero-stats, .journey-step'
    );

    animateElements.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [statsAnimated]);

  return (
    <div className="saas-landing">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <MedicineBoxOutlined style={{ fontSize: '32px', color: '#10B981' }} />
            <span className="logo-text">Ayphen Care</span>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#about">About</a>
            <Link to="/signup">
              <Button type="primary" size="large">Get Started</Button>
            </Link>
            <Link to="/login">
              <Button size="large">Login</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <RocketOutlined /> Complete Hospital Management Platform
            </div>
            <Title level={1} className="hero-title">
              Modern Hospital Management
              <br />
              <span className="gradient-text">Built for Scale</span>
            </Title>
            <Paragraph className="hero-description">
              Complete multi-tenant SaaS platform for hospitals. Manage patients,
              doctors, appointments, pharmacy, laboratory, and more — all in one place.
            </Paragraph>
            <Space size="large" className="hero-buttons">
              <Link to="/signup">
                <Button type="primary" size="large" icon={<RocketOutlined />}>
                  Start Free Trial
                </Button>
              </Link>
            </Space>
            <div className="hero-stats scroll-animate">
              <Statistic title="Modules" value={modules} suffix="+" precision={0} />
              <Statistic title="User Roles" value={roles} precision={0} />
              <Statistic title="Uptime" value={uptime} suffix="%" precision={1} />
            </div>
          </div>
          <div className="hero-image">
            {/* Dashboard Mockup */}
            <div className="dashboard-mockup">
              <div className="mockup-header">
                <div className="mockup-dots">
                  <span></span><span></span><span></span>
                </div>
                <div className="mockup-title">Ayphen Care — Dashboard</div>
              </div>
              <div className="mockup-body">
                <div className="mockup-sidebar">
                  <div className="sidebar-item active"><ScheduleOutlined /> Dashboard</div>
                  <div className="sidebar-item"><UserOutlined /> Patients</div>
                  <div className="sidebar-item"><MedicineBoxOutlined /> Pharmacy</div>
                  <div className="sidebar-item"><ExperimentOutlined /> Laboratory</div>
                </div>
                <div className="mockup-content">
                  <div className="mockup-cards">
                    <div className="kpi-card kpi-blue">
                      <div className="kpi-value">124</div>
                      <div className="kpi-label">Patients Today</div>
                    </div>
                    <div className="kpi-card kpi-green">
                      <div className="kpi-value">48</div>
                      <div className="kpi-label">Appointments</div>
                    </div>
                    <div className="kpi-card kpi-purple">
                      <div className="kpi-value">₹2.4L</div>
                      <div className="kpi-label">Revenue</div>
                    </div>
                  </div>
                  <div className="mockup-chart">
                    <div className="chart-title">Weekly Patient Visits</div>
                    <div className="chart-bars">
                      <div className="chart-bar" style={{ height: '60%' }}></div>
                      <div className="chart-bar" style={{ height: '80%' }}></div>
                      <div className="chart-bar" style={{ height: '45%' }}></div>
                      <div className="chart-bar" style={{ height: '90%' }}></div>
                      <div className="chart-bar" style={{ height: '70%' }}></div>
                      <div className="chart-bar" style={{ height: '55%' }}></div>
                      <div className="chart-bar" style={{ height: '85%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-container">
          <div className="section-header scroll-animate">
            <Title level={2}>Everything You Need to Run a Modern Hospital</Title>
            <Paragraph>
              Comprehensive features designed for healthcare excellence
            </Paragraph>
          </div>
          <Row gutter={[24, 24]} style={{ alignItems: 'stretch' }}>
            {([
              { icon: <TeamOutlined className="feature-icon" />, title: 'Patient Management', desc: 'Complete patient records, medical history, and appointments. HIPAA compliant.' },
              { icon: <MedicineBoxOutlined className="feature-icon" />, title: 'Multi-Department', desc: 'Manage departments, services, and specializations with full workflow automation.' },
              { icon: <SafetyOutlined className="feature-icon" />, title: 'Pharmacy & Lab', desc: 'Integrated pharmacy management, lab orders, results tracking, and inventory.' },
              { icon: <CloudOutlined className="feature-icon" />, title: 'Cloud-Based', desc: 'Access from anywhere, anytime. Automatic backups and 99.9% uptime guaranteed.' },
              { icon: <LockOutlined className="feature-icon" />, title: 'Data Security', desc: 'Enterprise-grade encryption, role-based access control, and full audit trails.' },
              { icon: <GlobalOutlined className="feature-icon" />, title: 'Multi-Tenant', desc: 'Each hospital gets an isolated environment with custom branding and settings.' },
              { icon: <HomeOutlined className="feature-icon" />, title: 'Bed Management', desc: 'Real-time bed occupancy tracking, allocation, and transfer across departments.' },
              { icon: <ScheduleOutlined className="feature-icon" />, title: 'Queue Management', desc: 'Token-based queue system for OPD, departments, and services. Reduces wait times.' },
              { icon: <ThunderboltOutlined className="feature-icon" />, title: 'Smart Reminders', desc: 'Automated SMS and email appointment reminders. Reduce no-shows by up to 40%.' },
              { icon: <BarChartOutlined className="feature-icon" />, title: 'Analytics Dashboard', desc: 'Real-time insights, performance metrics, and revenue tracking for decisions.' },
              { icon: <AuditOutlined className="feature-icon" />, title: 'Audit Logs', desc: 'Complete activity tracking and compliance reporting for regulatory requirements.' },
              { icon: <BellOutlined className="feature-icon" />, title: 'Notifications', desc: 'Instant alerts for critical events, lab results, and patient updates platform-wide.' },
            ] as { icon: React.ReactNode; title: string; desc: string }[]).map((f, i) => (
              <Col key={i} xs={24} sm={12} md={6} className="scroll-animate-stagger" style={{ display: 'flex' }}>
                <Card className="feature-card scroll-animate-card" hoverable style={{ width: '100%' }}>
                  {f.icon}
                  <div style={{ minHeight: 56, display: 'flex', alignItems: 'flex-start' }}>
                    <Title level={4} style={{ margin: 0 }}>{f.title}</Title>
                  </div>
                  <Paragraph style={{ marginTop: 12, marginBottom: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {f.desc}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* All Modules Section */}
      <section className="modules-showcase-section">
        <div className="section-container">
          <div className="section-header scroll-animate" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Title level={2}>50+ Modules, One Platform</Title>
            <Paragraph>Every department covered — from OPD to OT, Pharmacy to Physiotherapy</Paragraph>
          </div>
          <div className="module-tabs scroll-animate" style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            {[
              { key: 'clinical', label: 'Clinical' },
              { key: 'operations', label: 'Operations' },
              { key: 'diagnostics', label: 'Diagnostics' },
              { key: 'finance', label: 'Finance' },
              { key: 'records', label: 'Records & Compliance' },
              { key: 'hr', label: 'HR & Admin' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveModuleTab(tab.key)}
                className={`module-tab-btn ${activeModuleTab === tab.key ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="module-grid scroll-animate">
            {activeModuleTab === 'clinical' && (
              <Row gutter={[16, 16]}>
                {[
                  { icon: <TeamOutlined />, name: 'Patient Management' },
                  { icon: <CalendarOutlined />, name: 'Appointments' },
                  { icon: <ScheduleOutlined />, name: 'Queue & Tokens' },
                  { icon: <SolutionOutlined />, name: 'Consultation' },
                  { icon: <FormOutlined />, name: 'Prescriptions' },
                  { icon: <PhoneOutlined />, name: 'Telemedicine' },
                  { icon: <HomeOutlined />, name: 'Inpatient (IPD)' },
                  { icon: <HeartOutlined />, name: 'Triage & Vitals' },
                  { icon: <ReconciliationOutlined />, name: 'Physiotherapy' },
                  { icon: <CoffeeOutlined />, name: 'Diet Management' },
                  { icon: <AlertOutlined />, name: 'Dialysis' },
                  { icon: <ScissorOutlined />, name: 'Operation Theatre' },
                ].map((m, i) => (
                  <Col key={i} xs={12} sm={8} md={6} lg={4}>
                    <div className="module-chip">{m.icon} <span>{m.name}</span></div>
                  </Col>
                ))}
              </Row>
            )}
            {activeModuleTab === 'operations' && (
              <Row gutter={[16, 16]}>
                {[
                  { icon: <HomeOutlined />, name: 'Bed Management' },
                  { icon: <ScheduleOutlined />, name: 'Ward Management' },
                  { icon: <CarOutlined />, name: 'Ambulance & EMS' },
                  { icon: <EyeOutlined />, name: 'Visitor Management' },
                  { icon: <ToolOutlined />, name: 'Housekeeping' },
                  { icon: <ToolOutlined />, name: 'Asset Management' },
                  { icon: <AppstoreOutlined />, name: 'Service Catalog' },
                  { icon: <EnvironmentOutlined />, name: 'Mortuary' },
                  { icon: <BellOutlined />, name: 'Notifications' },
                  { icon: <ThunderboltOutlined />, name: 'Smart Reminders' },
                ].map((m, i) => (
                  <Col key={i} xs={12} sm={8} md={6} lg={4}>
                    <div className="module-chip">{m.icon} <span>{m.name}</span></div>
                  </Col>
                ))}
              </Row>
            )}
            {activeModuleTab === 'diagnostics' && (
              <Row gutter={[16, 16]}>
                {[
                  { icon: <ExperimentOutlined />, name: 'Laboratory' },
                  { icon: <MedicineBoxOutlined />, name: 'Pharmacy' },
                  { icon: <FundOutlined />, name: 'Radiology' },
                  { icon: <MedicineBoxFilled />, name: 'Blood Bank' },
                  { icon: <FileProtectOutlined />, name: 'Drug Register' },
                  { icon: <SkinOutlined />, name: 'Inventory Management' },
                ].map((m, i) => (
                  <Col key={i} xs={12} sm={8} md={6} lg={4}>
                    <div className="module-chip">{m.icon} <span>{m.name}</span></div>
                  </Col>
                ))}
              </Row>
            )}
            {activeModuleTab === 'finance' && (
              <Row gutter={[16, 16]}>
                {[
                  { icon: <DollarOutlined />, name: 'Billing & Invoices' },
                  { icon: <BankOutlined />, name: 'Packages & Deposits' },
                  { icon: <SafetyOutlined />, name: 'Insurance / TPA' },
                  { icon: <FileProtectOutlined />, name: 'Insurance Claims' },
                  { icon: <BarChartOutlined />, name: 'Financial Reports' },
                  { icon: <FundOutlined />, name: 'Revenue Analytics' },
                ].map((m, i) => (
                  <Col key={i} xs={12} sm={8} md={6} lg={4}>
                    <div className="module-chip">{m.icon} <span>{m.name}</span></div>
                  </Col>
                ))}
              </Row>
            )}
            {activeModuleTab === 'records' && (
              <Row gutter={[16, 16]}>
                {[
                  { icon: <FileProtectOutlined />, name: 'Death Certificates' },
                  { icon: <FormOutlined />, name: 'Birth Register' },
                  { icon: <ReconciliationOutlined />, name: 'Consent Management' },
                  { icon: <AlertOutlined />, name: 'MLC (Medico-Legal)' },
                  { icon: <EnvironmentOutlined />, name: 'Biomedical Waste' },
                  { icon: <AlertOutlined />, name: 'Incident Reports' },
                  { icon: <SafetyOutlined />, name: 'Infection Control' },
                  { icon: <IdcardOutlined />, name: 'ABHA / ABDM' },
                  { icon: <FormOutlined />, name: 'PCPNDT Form F' },
                  { icon: <SolutionOutlined />, name: 'Records Digitization' },
                  { icon: <AuditOutlined />, name: 'Audit Logs' },
                ].map((m, i) => (
                  <Col key={i} xs={12} sm={8} md={6} lg={4}>
                    <div className="module-chip">{m.icon} <span>{m.name}</span></div>
                  </Col>
                ))}
              </Row>
            )}
            {activeModuleTab === 'hr' && (
              <Row gutter={[16, 16]}>
                {[
                  { icon: <CalendarOutlined />, name: 'Duty Roster' },
                  { icon: <IdcardOutlined />, name: 'Staff Attendance' },
                  { icon: <ReconciliationOutlined />, name: 'Shift Handover' },
                  { icon: <TeamOutlined />, name: 'Staff HR' },
                  { icon: <LockOutlined />, name: 'Roles & Permissions' },
                  { icon: <GlobalOutlined />, name: 'Locations & Branches' },
                  { icon: <AppstoreOutlined />, name: 'Departments' },
                  { icon: <BarChartOutlined />, name: 'Global Analytics' },
                  { icon: <BellOutlined />, name: 'Broadcast Alerts' },
                  { icon: <CustomerServiceOutlined />, name: 'System Feedback' },
                ].map((m, i) => (
                  <Col key={i} xs={12} sm={8} md={6} lg={4}>
                    <div className="module-chip">{m.icon} <span>{m.name}</span></div>
                  </Col>
                ))}
              </Row>
            )}
          </div>
        </div>
      </section>

      {/* Patient Journey Section */}
      <section className="journey-section" style={{ background: '#F8FAFC', padding: '4rem 0' }}>
        <div className="section-container">
          <div className="section-header scroll-animate" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <Title level={2}>Seamless Patient Journey</Title>
            <Paragraph>Complete workflow from booking to billing</Paragraph>
          </div>
          <div className="journey-timeline scroll-animate" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1000px', margin: '0 auto', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '30px', left: '10%', right: '10%', height: '2px', background: 'linear-gradient(90deg, #10B981 0%, #10B981 100%)', zIndex: 0 }}></div>
            {[
              { icon: <MobileOutlined style={{ fontSize: 24, color: '#fff' }} />, title: 'Book Online', desc: 'Patient books via portal' },
              { icon: <IdcardOutlined style={{ fontSize: 24, color: '#fff' }} />, title: 'Check-In', desc: 'Token & queue system' },
              { icon: <UserOutlined style={{ fontSize: 24, color: '#fff' }} />, title: 'Consultation', desc: 'Doctor reviews' },
              { icon: <ExperimentOutlined style={{ fontSize: 24, color: '#fff' }} />, title: 'Treatment', desc: 'Lab & pharmacy' },
              { icon: <DollarOutlined style={{ fontSize: 24, color: '#fff' }} />, title: 'Billing', desc: 'Invoice & payment' }
            ].map((step, index) => (
              <div key={index} className="journey-step scroll-animate-stagger" style={{ textAlign: 'center', flex: 1, position: 'relative', zIndex: 1 }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)', flexShrink: 0 }}>
                  {step.icon}
                </div>
                <Text strong style={{ display: 'block', fontSize: '14px', color: '#1E3A5F', marginBottom: '4px' }}>{step.title}</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>{step.desc}</Text>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section">
        <div className="section-container">
          <div className="section-header scroll-animate">
            <Title level={2}>Simple, Transparent Pricing</Title>
            <Paragraph>
              Choose the plan that's right for your hospital
            </Paragraph>
          </div>
          <Row gutter={[32, 32]} justify="center">
            <Col xs={24} md={8} className="scroll-animate-stagger">
              <Card className="pricing-card basic-card scroll-animate-card">
                <div className="pricing-header">
                  <Title level={4}>Basic</Title>
                  <div className="pricing-price">
                    <span className="currency">₹</span>
                    <span className="amount">4,999</span>
                    <span className="period">/month</span>
                  </div>
                </div>
                <ul className="pricing-features">
                  <li><CheckCircleOutlined /> Up to 5 doctors</li>
                  <li><CheckCircleOutlined /> Up to 500 patients</li>
                  <li><CheckCircleOutlined /> OPD & Appointments</li>
                  <li><CheckCircleOutlined /> Email support</li>
                  <li><CheckCircleOutlined /> 5 GB storage</li>
                </ul>
                <div className="pricing-cta">
                  <Link to="/signup?plan=basic">
                    <button style={pricingBtnStyle}>
                      Start Free Trial
                    </button>
                  </Link>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={8} className="scroll-animate-stagger">
              <Card className="pricing-card featured scroll-animate-card">
                <div className="popular-badge">Most Popular</div>
                <div className="pricing-header">
                  <Title level={4}>Professional</Title>
                  <div className="pricing-price">
                    <span className="currency">₹</span>
                    <span className="amount">14,999</span>
                    <span className="period">/month</span>
                  </div>
                </div>
                <ul className="pricing-features">
                  <li><CheckCircleOutlined /> Up to 20 doctors</li>
                  <li><CheckCircleOutlined /> Up to 5,000 patients</li>
                  <li><CheckCircleOutlined /> All modules included</li>
                  <li><CheckCircleOutlined /> Priority WhatsApp support</li>
                  <li><CheckCircleOutlined /> 50 GB storage</li>
                  <li><CheckCircleOutlined /> Custom branding</li>
                </ul>
                <div className="pricing-cta">
                  <Link to="/signup?plan=professional">
                    <button style={pricingBtnStyle}>
                      Start Free Trial
                    </button>
                  </Link>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={8} className="scroll-animate-stagger">
              <Card className="pricing-card enterprise-card scroll-animate-card">
                <div className="pricing-header">
                  <Title level={4}>Enterprise</Title>
                  <div className="pricing-price">
                    <span className="currency">₹</span>
                    <span className="amount">49,999</span>
                    <span className="period">/month</span>
                  </div>
                </div>
                <ul className="pricing-features">
                  <li><CheckCircleOutlined /> Unlimited doctors</li>
                  <li><CheckCircleOutlined /> Unlimited patients</li>
                  <li><CheckCircleOutlined /> All modules + API access</li>
                  <li><CheckCircleOutlined /> Dedicated account manager</li>
                  <li><CheckCircleOutlined /> Unlimited storage</li>
                  <li><CheckCircleOutlined /> Multi-location support</li>
                  <li><CheckCircleOutlined /> 99.9% SLA guarantee</li>
                </ul>
                <div className="pricing-cta">
                  <button style={pricingBtnStyle} onClick={handleTalkToSales}>
                    Contact Sales
                  </button>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="section-container">
          <div className="section-header scroll-animate">
            <Title level={2}>About Ayphen Care</Title>
            <Paragraph>
              Revolutionizing healthcare management with cutting-edge technology
            </Paragraph>
          </div>

          {/* Mission Statement */}
          <div className="about-mission scroll-animate">
            <Row gutter={[48, 48]} align="middle">
              <Col xs={24} md={12}>
                <div className="mission-content">
                  <Title level={3} className="mission-title">
                    <HeartOutlined className="mission-icon" /> Our Mission
                  </Title>
                  <Paragraph className="mission-text">
                    At Ayphen Care, we believe every hospital deserves access to world-class
                    management tools. Our mission is to empower healthcare providers with
                    intuitive, secure, and scalable technology that lets them focus on what
                    matters most — patient care.
                  </Paragraph>
                  <Paragraph className="mission-text">
                    Built by a passionate team of healthcare IT professionals, Ayphen Care
                    is designed to streamline hospital operations from OPD to pharmacy,
                    laboratory to billing — all under one unified platform.
                  </Paragraph>
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div className="mission-stats">
                  <Row gutter={[24, 24]}>
                    <Col xs={12}>
                      <Card className="stat-card scroll-animate-stagger">
                        <Statistic
                          title="Modules"
                          value="50+"
                          valueStyle={{ color: '#10B981' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={12}>
                      <Card className="stat-card scroll-animate-stagger">
                        <Statistic
                          title="User Roles"
                          value="14"
                          valueStyle={{ color: '#10B981' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={12}>
                      <Card className="stat-card scroll-animate-stagger">
                        <Statistic
                          title="Departments"
                          value="100+"
                          valueStyle={{ color: '#10B981' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={12}>
                      <Card className="stat-card scroll-animate-stagger">
                        <Statistic
                          title="Uptime"
                          value="99.9%"
                          valueStyle={{ color: '#10B981' }}
                        />
                      </Card>
                    </Col>
                  </Row>
                </div>
              </Col>
            </Row>
          </div>

          {/* Values */}
          <div className="about-values scroll-animate">
            <Title level={3} style={{ textAlign: 'center', marginBottom: '3rem' }}>
              Our Core Values
            </Title>
            <Row gutter={[32, 32]}>
              <Col xs={24} md={8} className="scroll-animate-stagger">
                <Card className="value-card">
                  <BulbOutlined className="value-icon" />
                  <Title level={4}>Innovation First</Title>
                  <Paragraph>
                    We constantly push boundaries to bring you the latest in healthcare
                    technology, from AI-powered diagnostics to seamless telemedicine integration.
                  </Paragraph>
                </Card>
              </Col>
              <Col xs={24} md={8} className="scroll-animate-stagger">
                <Card className="value-card">
                  <SafetyOutlined className="value-icon" />
                  <Title level={4}>Security & Trust</Title>
                  <Paragraph>
                    Your data security is our top priority. We're HIPAA compliant with
                    enterprise-grade encryption and regular security audits.
                  </Paragraph>
                </Card>
              </Col>
              <Col xs={24} md={8} className="scroll-animate-stagger">
                <Card className="value-card">
                  <AimOutlined className="value-icon" />
                  <Title level={4}>Customer Success</Title>
                  <Paragraph>
                    We're not just a software provider — we're your partner. Our dedicated
                    support team is available 24/7 to ensure your success.
                  </Paragraph>
                </Card>
              </Col>
            </Row>
          </div>

          {/* Role Highlights */}
          <div className="role-highlights scroll-animate" style={{ marginTop: '4rem' }}>
            <Title level={3} style={{ textAlign: 'center', marginBottom: '2rem' }}>
              Built for Every Role in Your Hospital
            </Title>
            <Row gutter={[24, 24]} justify="center">
              {[
                { icon: '👨‍⚕️', role: 'Doctor', desc: 'Consultation & Rx' },
                { icon: '👩‍⚕️', role: 'Nurse', desc: 'Vitals & Ward Care' },
                { icon: '📋', role: 'Receptionist', desc: 'Check-in & Tokens' },
                { icon: '💊', role: 'Pharmacist', desc: 'Dispensing & Stock' },
                { icon: '🧪', role: 'Lab Tech', desc: 'Samples & Results' },
                { icon: '🔬', role: 'Pathologist', desc: 'Lab Management' },
                { icon: '📡', role: 'Radiologist', desc: 'Imaging & Reports' },
                { icon: '💰', role: 'Finance', desc: 'Billing & Revenue' },
                { icon: '🏥', role: 'Admin', desc: 'Analytics Dashboard' },
                { icon: '🦴', role: 'Physiotherapist', desc: 'Rehab Sessions' },
                { icon: '🍽️', role: 'Dietitian', desc: 'Meal Planning' },
                { icon: '⚙️', role: 'Super Admin', desc: 'Platform & SaaS' },
                { icon: '🩺', role: 'Allied Health', desc: 'Multi-specialty' },
                { icon: '👤', role: 'Patient', desc: 'Self-service Portal' }
              ].map((item, index) => (
                <Col key={index} xs={12} sm={6} md={3} className="scroll-animate-stagger">
                  <div style={{ textAlign: 'center', padding: '20px 16px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'all 0.3s ease', cursor: 'pointer', height: '100%', minHeight: '140px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center' }} className="role-card">
                    <div style={{ fontSize: '32px', marginBottom: '8px', lineHeight: 1 }}>{item.icon}</div>
                    <Text strong style={{ display: 'block', fontSize: '13px', color: '#1E3A5F', marginBottom: '4px' }}>{item.role}</Text>
                    <Text type="secondary" style={{ fontSize: '11px' }}>{item.desc}</Text>
                  </div>
                </Col>
              ))}
            </Row>
          </div>

          {/* Security Badges */}
          <div className="security-badges scroll-animate" style={{ marginTop: '4rem', background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', padding: '3rem 2rem', borderRadius: '16px' }}>
            <Title level={3} style={{ textAlign: 'center', marginBottom: '2rem' }}>
              Enterprise-Grade Security
            </Title>
            <Row gutter={[24, 24]} justify="center">
              {[
                { icon: <LockOutlined style={{ fontSize: '32px', color: '#10B981' }} />, title: 'SSL Encryption', desc: 'Data encrypted in transit' },
                { icon: <SafetyOutlined style={{ fontSize: '32px', color: '#3B82F6' }} />, title: 'HIPAA Compliant', desc: 'Healthcare standards' },
                { icon: <CheckCircleOutlined style={{ fontSize: '32px', color: '#8B5CF6' }} />, title: 'SOC 2 Type II', desc: 'Certified security' },
                { icon: <LockOutlined style={{ fontSize: '32px', color: '#F59E0B' }} />, title: 'JWT Auth', desc: 'Secure access control' },
                { icon: <CloudOutlined style={{ fontSize: '32px', color: '#06B6D4' }} />, title: 'Daily Backups', desc: 'Auto data recovery' },
                { icon: <CheckCircleOutlined style={{ fontSize: '32px', color: '#10B981' }} />, title: '99.9% Uptime', desc: 'Guaranteed availability' }
              ].map((badge, index) => (
                <Col key={index} xs={12} sm={8} md={4} className="scroll-animate-stagger">
                  <div style={{ textAlign: 'center', padding: '20px 12px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'all 0.3s ease' }} className="security-badge">
                    <div style={{ marginBottom: '12px' }}>{badge.icon}</div>
                    <Text strong style={{ display: 'block', fontSize: '13px', color: '#1E3A5F', marginBottom: '4px' }}>{badge.title}</Text>
                    <Text type="secondary" style={{ fontSize: '11px' }}>{badge.desc}</Text>
                  </div>
                </Col>
              ))}
            </Row>
          </div>

          {/* Why Choose Us */}
          <div className="about-why scroll-animate" style={{ marginTop: '4rem' }}>
            <Row gutter={[48, 32]} align="middle">
              <Col xs={24} md={12}>
                <Title level={3}>
                  <TrophyOutlined style={{ color: '#10B981', marginRight: 12 }} />
                  Why Choose Ayphen Care?
                </Title>
                <div className="why-list">
                  {[
                    { title: 'Multi-Tenant Architecture', desc: 'Perfect for hospital chains and healthcare networks' },
                    { title: 'Blazing Fast Performance', desc: 'Sub-second response times, even with millions of records' },
                    { title: 'Customizable & Scalable', desc: 'Grows with your organization from 1 to 1000+ locations' },
                    { title: '24/7 Expert Support', desc: 'Dedicated healthcare IT specialists always available' },
                    { title: 'Regular Updates', desc: 'New features and improvements released monthly' },
                  ].map((item, idx) => (
                    <div className="why-item" key={idx}>
                      <div className="why-item-icon"><CheckCircleOutlined /></div>
                      <div className="why-item-title">{item.title}</div>
                      <div className="why-item-desc">— {item.desc}</div>
                    </div>
                  ))}
                </div>
              </Col>
              <Col xs={24} md={12}>
                <Card className="contact-card">
                  <Title level={4}>Get in Touch</Title>
                  <Paragraph>
                    Have questions? Our team is ready to help you find the perfect solution
                    for your healthcare organization.
                  </Paragraph>
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Text><strong>Email:</strong> support@ayphen.com</Text>
                    <Text><strong>Phone:</strong> +91-44-2345-6789</Text>
                    <Text><strong>Location:</strong> RMZ Millenia, Chennai, Tamil Nadu, IN</Text>
                  </Space>
                  <div style={{ marginTop: '1.5rem' }}>
                    <Link to="/signup">
                      <Button type="primary" size="large" icon={<RocketOutlined />}>
                        Start Free Trial
                      </Button>
                    </Link>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container scroll-animate">
          <Title level={2}>Ready to Transform Your Hospital?</Title>
          <Paragraph>
            Start your free 14-day trial today. No credit card required.
          </Paragraph>
          <Space size="large">
            <Link to="/signup">
              <Button type="primary" size="large" icon={<RocketOutlined />}>
                Start Free Trial
              </Button>
            </Link>
            <Button size="large" icon={<CustomerServiceOutlined />} onClick={handleTalkToSales}>
              Talk to Sales
            </Button>
          </Space>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="section-container">
          <div className="section-header scroll-animate">
            <Title level={2}>What Healthcare Professionals Say</Title>
            <Paragraph>Trusted by hospitals and clinics across India</Paragraph>
          </div>
          <Row gutter={[32, 32]}>
            <Col xs={24} md={8} className="scroll-animate-stagger">
              <Card className="testimonial-card scroll-animate-card">
                <div className="testimonial-stars">
                  <StarFilled /><StarFilled /><StarFilled /><StarFilled /><StarFilled />
                </div>
                <Paragraph className="testimonial-text">
                  "Ayphen Care transformed how we manage our hospital. The pharmacy and lab
                  integration alone saved us hours every day. Highly recommended!"
                </Paragraph>
                <div className="testimonial-author">
                  <div className="author-avatar">RK</div>
                  <div>
                    <Text strong>Dr. Rajesh Kumar</Text>
                    <br />
                    <Text type="secondary">Hospital Administrator</Text>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={8} className="scroll-animate-stagger">
              <Card className="testimonial-card scroll-animate-card">
                <div className="testimonial-stars">
                  <StarFilled /><StarFilled /><StarFilled /><StarFilled /><StarFilled />
                </div>
                <Paragraph className="testimonial-text">
                  "The multi-location support is incredible. We manage 2 branches from
                  a single dashboard. Patient records flow seamlessly across locations."
                </Paragraph>
                <div className="testimonial-author">
                  <div className="author-avatar">PV</div>
                  <div>
                    <Text strong>Dr. Priya Venkatesh</Text>
                    <br />
                    <Text type="secondary">Cardiologist</Text>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={8} className="scroll-animate-stagger">
              <Card className="testimonial-card scroll-animate-card">
                <div className="testimonial-stars">
                  <StarFilled /><StarFilled /><StarFilled /><StarFilled /><StarFilled />
                </div>
                <Paragraph className="testimonial-text">
                  "Billing used to be a nightmare. With Ayphen Care, GST invoices are
                  auto-generated and our revenue tracking is finally accurate."
                </Paragraph>
                <div className="testimonial-author">
                  <div className="author-avatar">SG</div>
                  <div>
                    <Text strong>Sanjay Gupta</Text>
                    <br />
                    <Text type="secondary">Hospital Accountant</Text>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="section-container">
          <div className="section-header scroll-animate">
            <Title level={2}><QuestionCircleOutlined style={{ marginRight: 12 }} />Frequently Asked Questions</Title>
            <Paragraph>Everything you need to know about Ayphen Care</Paragraph>
          </div>
          <div className="faq-container scroll-animate">
            <Collapse
              accordion
              size="large"
              expandIcon={({ isActive }) => isActive ? <MinusOutlined /> : <PlusOutlined />}
              items={[
                {
                  key: '1',
                  label: 'What modules are included in Ayphen Care?',
                  children: <Paragraph>Ayphen Care includes 50+ modules across every department: OPD, Appointments, Queue, Triage, Consultation, Prescriptions, Inpatient (IPD), Operation Theatre, Dialysis, Physiotherapy, Diet Management, Telemedicine, Pharmacy, Laboratory, Radiology, Blood Bank, Billing, Insurance/TPA, Financial Reports, Bed &amp; Ward Management, Ambulance, Housekeeping, Visitor Management, Mortuary, Staff Attendance, Duty Roster, Shift Handover, Audit Logs, ABHA/ABDM, Consent Management, Birth/Death Certificates, Infection Control, Biomedical Waste, Incident Reports, MLC, PCPNDT Form F, Records Digitization, and more. All modules work seamlessly together.</Paragraph>
                },
                {
                  key: '2',
                  label: 'Can I manage multiple hospital branches?',
                  children: <Paragraph>Yes! Our multi-location architecture lets you manage unlimited branches from a single dashboard. Patient records, staff, and inventory sync across all locations in real-time. Each branch can have its own settings while sharing the organizational data.</Paragraph>
                },
                {
                  key: '3',
                  label: 'Is my patient data secure?',
                  children: <Paragraph>Absolutely. We use enterprise-grade encryption (AES-256), role-based access control with 14 specialized user roles, complete audit logging, and regular security updates. Your data is hosted on Tier-1 cloud infrastructure with 99.9% uptime SLA.</Paragraph>
                },
                {
                  key: '4',
                  label: 'How long does it take to set up?',
                  children: <Paragraph>You can get started in under 5 minutes! Sign up, create your organization, add your departments and staff — and you're ready to go. Our onboarding wizard guides you through every step. For larger hospitals, we offer dedicated setup assistance.</Paragraph>
                },
                {
                  key: '5',
                  label: 'Do you offer a free trial?',
                  children: <Paragraph>Yes, we offer a 14-day free trial with full access to all features. No credit card required. You can explore every module, add staff, and test the complete workflow before making a decision.</Paragraph>
                },
                {
                  key: '6',
                  label: 'What kind of support do you provide?',
                  children: <Paragraph>We provide email support for all plans, priority WhatsApp support for Professional plans, and a dedicated account manager for Enterprise customers. Our support team consists of healthcare IT specialists who understand hospital workflows.</Paragraph>
                },
                {
                  key: '7',
                  label: 'What user roles are supported?',
                  children: <Paragraph>Ayphen Care supports 14 specialized roles: Super Admin (SaaS platform management), Admin (analytics, user management), Doctor (consultation, prescriptions, lab orders), Nurse (vitals, ward care, medication), Receptionist (appointments, check-in, tokens), Pharmacist (dispensing, inventory), Lab Technician (sample collection, results), Pathologist (lab management), Radiologist (imaging, reports), Finance Officer (billing, insurance, revenue), Physiotherapist (rehab sessions), Dietitian (meal planning), Allied Health Professional (multi-specialty), and Patient (self-service portal). Each role has a customized dashboard with only the features they need.</Paragraph>
                },
                {
                  key: '8',
                  label: 'How does multi-branch management work?',
                  children: <Paragraph>Our multi-branch architecture allows you to manage unlimited hospital locations from a single dashboard. Patient records, staff data, and inventory sync in real-time across all branches. Each branch can have its own settings, departments, and staff while sharing organizational data. You can view consolidated reports or branch-specific analytics. Perfect for hospital chains and healthcare networks.</Paragraph>
                }
              ]}
            />
          </div>
        </div>
      </section>

      {/* Talk to Sales Modal */}
      <Modal
        title="Talk to Sales"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        centered
        width={600}
      >
        <div style={{ padding: '0 0.5rem' }}>
          <Paragraph style={{ marginBottom: '1.5rem', color: '#666' }}>
            Tell us about your organization and needs. We'll get back to you within 24 hours.
          </Paragraph>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            size="large"
          >
            <Form.Item
              name="fullName"
              label="Full Name"
              rules={[{ required: true, message: 'Please enter your full name' }]}
            >
              <Input placeholder="Dr. Rajesh Kumar" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Work Email"
              rules={[
                { required: true, message: 'Please enter your work email' },
                { type: 'email', message: 'Please enter a valid email' }
              ]}
            >
              <Input placeholder="admin@hospital.com" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="phone"
                  label="Phone Number"
                >
                  <Input placeholder="+91-98765-43210" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="companySize"
                  label="Hospital Size (Beds)"
                >
                  <Select placeholder="Select size">
                    <Option value="small">1-50 Beds</Option>
                    <Option value="medium">51-200 Beds</Option>
                    <Option value="large">201-500 Beds</Option>
                    <Option value="enterprise">500+ Beds</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="message"
              label="How can we help?"
              rules={[{ required: true, message: 'Please tell us how we can help' }]}
            >
              <TextArea rows={4} placeholder="I'm interested in a demo for our hospital..." />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: '1rem' }}>
              <Button type="primary" htmlType="submit" block size="large" loading={loading} style={{ background: '#1E3A5F', borderColor: '#1E3A5F' }}>
                Submit Request
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>

      {/* Watch Demo Modal */}
      <Modal
        title="Watch Demo"
        open={isDemoModalVisible}
        onCancel={() => setIsDemoModalVisible(false)}
        footer={null}
        centered
        width={600}
      >
        <div style={{ padding: '1rem 0' }}>
          <Paragraph style={{ marginBottom: '1.5rem', color: '#666', fontSize: '1rem' }}>
            Experience Ayphen Care with our live demo. Log in with any of these roles to explore the full platform:
          </Paragraph>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { role: 'Admin', email: 'admin@chennaihms.com', password: 'Admin@123' },
              { role: 'Doctor', email: 'dr.arun@chennaihms.com', password: 'Doctor@123' },
              { role: 'Pharmacist', email: 'pharma.mohan@chennaihms.com', password: 'Pharma@123' },
              { role: 'Lab Tech', email: 'lab.ganesh@chennaihms.com', password: 'Lab@123' },
              { role: 'Patient', email: 'patient.ravi@chennaihms.com', password: 'Patient@123' },
            ].map((item) => (
              <div key={item.role} style={{
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <Text strong style={{ color: '#1E3A5F' }}>{item.role}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '13px' }}>{item.email} / {item.password}</Text>
                </div>
                <Link to="/login">
                  <Button type="primary" size="small" style={{ background: '#1E3A5F', borderColor: '#1E3A5F' }}>Login</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <Row gutter={[32, 32]}>
            <Col xs={24} md={6}>
              <div className="footer-logo">
                <MedicineBoxOutlined style={{ fontSize: '32px', color: '#10B981' }} />
                <span>Ayphen Care</span>
              </div>
              <Paragraph>
                Modern hospital management platform built for scale.
              </Paragraph>
            </Col>
            <Col xs={24} md={6}>
              <Title level={5}>Product</Title>
              <ul className="footer-links">
                <li><a href="#features">Features</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><Link to="/signup">Sign Up</Link></li>
                <li><Link to="/login">Login</Link></li>
              </ul>
            </Col>
            <Col xs={24} md={6}>
              <Title level={5}>Company</Title>
              <ul className="footer-links">
                <li><a href="#about">About Us</a></li>
                <li><a href="mailto:support@ayphen.com">Contact</a></li>
              </ul>
            </Col>
            <Col xs={24} md={6}>
              <Title level={5}>Support</Title>
              <ul className="footer-links">
                <li><a href="mailto:support@ayphen.com">Email Support</a></li>
                <li><a href="tel:+914423456789">Phone Support</a></li>
              </ul>
            </Col>
          </Row>
          <div className="footer-bottom">
            <Text>© {new Date().getFullYear()} Ayphen Care. All rights reserved.</Text>
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/914423456789?text=Hi%2C%20I'm%20interested%20in%20Ayphen%20Care%20HMS"
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float"
        title="Chat with us on WhatsApp"
      >
        <WhatsAppOutlined />
      </a>
    </div>
  );
};

export default SaaSLanding;
