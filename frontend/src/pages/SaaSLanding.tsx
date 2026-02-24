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
  ExperimentOutlined
} from '@ant-design/icons';
import { Button, Card, Row, Col, Typography, Space, Statistic, Modal, Form, Input, Select, message, Collapse } from 'antd';
import api from '../services/api';
import './SaaSLanding.css';


const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const SaaSLanding: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [isDemoModalVisible, setIsDemoModalVisible] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [form] = Form.useForm();

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
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe all elements with scroll animation classes
    const animateElements = document.querySelectorAll(
      '.scroll-animate, .scroll-animate-card, .scroll-animate-stagger'
    );

    animateElements.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

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
              <Button size="large" ghost icon={<PlayCircleOutlined />} onClick={() => setIsDemoModalVisible(true)}>
                Watch Demo
              </Button>
            </Space>
            <div className="hero-stats">
              <Statistic title="Modules" value={30} suffix="+" />
              <Statistic title="User Roles" value={8} />
              <Statistic title="Uptime" value={99.9} suffix="%" />
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
          <Row gutter={[32, 32]}>
            <Col xs={24} md={8} className="scroll-animate-stagger">
              <Card className="feature-card scroll-animate-card" hoverable>
                <TeamOutlined className="feature-icon" />
                <Title level={4}>Patient Management</Title>
                <Paragraph>
                  Complete patient records, medical history, appointments, and more.
                  HIPAA compliant and secure.
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={8} className="scroll-animate-stagger">
              <Card className="feature-card scroll-animate-card" hoverable>
                <MedicineBoxOutlined className="feature-icon" />
                <Title level={4}>Multi-Department</Title>
                <Paragraph>
                  Manage multiple departments, services, and specializations with ease.
                  Complete workflow automation.
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={8} className="scroll-animate-stagger">
              <Card className="feature-card scroll-animate-card" hoverable>
                <SafetyOutlined className="feature-icon" />
                <Title level={4}>Pharmacy & Lab</Title>
                <Paragraph>
                  Integrated pharmacy management, lab orders, and results tracking.
                  Real-time inventory.
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={8} className="scroll-animate-stagger">
              <Card className="feature-card scroll-animate-card" hoverable>
                <CloudOutlined className="feature-icon" />
                <Title level={4}>Cloud-Based</Title>
                <Paragraph>
                  Access from anywhere, anytime. Automatic backups and 99.9% uptime
                  guarantee.
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={8} className="scroll-animate-stagger">
              <Card className="feature-card scroll-animate-card" hoverable>
                <LockOutlined className="feature-icon" />
                <Title level={4}>Data Security</Title>
                <Paragraph>
                  Enterprise-grade security with encryption, role-based access, and
                  audit logs.
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={8} className="scroll-animate-stagger">
              <Card className="feature-card scroll-animate-card" hoverable>
                <GlobalOutlined className="feature-icon" />
                <Title level={4}>Multi-Tenant</Title>
                <Paragraph>
                  Each hospital gets their own isolated environment with custom
                  branding.
                </Paragraph>
              </Card>
            </Col>
          </Row>
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
              <Card className="pricing-card scroll-animate-card">
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
                    <Button type="default" size="large" block>
                      Start Free Trial
                    </Button>
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
                    <Button type="primary" size="large" block>
                      Start Free Trial
                    </Button>
                  </Link>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={8} className="scroll-animate-stagger">
              <Card className="pricing-card scroll-animate-card">
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
                  <Link to="/signup?plan=enterprise">
                    <Button size="large" block onClick={(e) => { e.preventDefault(); handleTalkToSales(); }}>
                      Contact Sales
                    </Button>
                  </Link>
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
                          value="30+"
                          valueStyle={{ color: '#10B981' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={12}>
                      <Card className="stat-card scroll-animate-stagger">
                        <Statistic
                          title="User Roles"
                          value="8"
                          valueStyle={{ color: '#10B981' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={12}>
                      <Card className="stat-card scroll-animate-stagger">
                        <Statistic
                          title="Departments"
                          value="10+"
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

          {/* Why Choose Us */}
          <div className="about-why scroll-animate">
            <Row gutter={[48, 32]} align="middle">
              <Col xs={24} md={12}>
                <Title level={3}>
                  <TrophyOutlined style={{ color: '#10B981', marginRight: 12 }} />
                  Why Choose Ayphen Care?
                </Title>
                <ul className="why-list">
                  <li>
                    <CheckCircleOutlined /> <strong>Multi-Tenant Architecture</strong> —
                    Perfect for hospital chains and healthcare networks
                  </li>
                  <li>
                    <CheckCircleOutlined /> <strong>Blazing Fast Performance</strong> —
                    Sub-second response times, even with millions of records
                  </li>
                  <li>
                    <CheckCircleOutlined /> <strong>Customizable & Scalable</strong> —
                    Grows with your organization from 1 to 1000+ locations
                  </li>
                  <li>
                    <CheckCircleOutlined /> <strong>24/7 Expert Support</strong> —
                    Dedicated healthcare IT specialists always available
                  </li>
                  <li>
                    <CheckCircleOutlined /> <strong>Regular Updates</strong> —
                    New features and improvements released monthly
                  </li>
                </ul>
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
                    <Text><strong>Location:</strong> Chennai, Tamil Nadu, India</Text>
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
                  children: <Paragraph>Ayphen Care includes 30+ modules: OPD Management, Appointments, Patient Registration, Pharmacy & Inventory, Laboratory, Billing & GST, Inpatient (IPD), Radiology, Blood Bank, Diet Management, OT Management, Telemedicine, Staff Management, and more. All modules work seamlessly together.</Paragraph>
                },
                {
                  key: '2',
                  label: 'Can I manage multiple hospital branches?',
                  children: <Paragraph>Yes! Our multi-location architecture lets you manage unlimited branches from a single dashboard. Patient records, staff, and inventory sync across all locations in real-time. Each branch can have its own settings while sharing the organizational data.</Paragraph>
                },
                {
                  key: '3',
                  label: 'Is my patient data secure?',
                  children: <Paragraph>Absolutely. We use enterprise-grade encryption (AES-256), role-based access control with 8 different user roles, audit logging, and regular security updates. Your data is hosted on Tier-1 cloud infrastructure with 99.9% uptime SLA.</Paragraph>
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
