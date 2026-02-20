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
  AimOutlined
} from '@ant-design/icons';
import { Button, Card, Row, Col, Typography, Space, Statistic, Modal, Form, Input, Select, message } from 'antd';
import axios from 'axios';
import './SaaSLanding.css';


const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const SaaSLanding: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = React.useState(false);
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
      await axios.post('http://localhost:5001/api/sales-inquiry', {
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
              <RocketOutlined /> Trusted by 1000+ Hospitals Worldwide
            </div>
            <Title level={1} className="hero-title">
              Modern Hospital Management
              <br />
              <span className="gradient-text">Built for Scale</span>
            </Title>
            <Paragraph className="hero-description">
              Complete multi-tenant SaaS platform for hospitals. Manage patients,
              doctors, appointments, pharmacy, laboratory, and more - all in one place.
            </Paragraph>
            <Space size="large" className="hero-buttons">
              <Link to="/signup">
                <Button type="primary" size="large" icon={<RocketOutlined />}>
                  Start Free Trial
                </Button>
              </Link>
              <Button size="large" ghost>
                Watch Demo
              </Button>
            </Space>
            <div className="hero-stats">
              <Statistic title="Active Hospitals" value={1000} suffix="+" />
              <Statistic title="Patients Served" value={500000} suffix="+" />
              <Statistic title="Uptime" value={99.9} suffix="%" />
            </div>
          </div>
          <div className="hero-image">
            <div className="floating-card card-1">
              <MedicineBoxOutlined style={{ fontSize: '48px', color: '#10B981' }} />
              <Text strong>Multi-Tenant</Text>
            </div>
            <div className="floating-card card-2">
              <SafetyOutlined style={{ fontSize: '48px', color: '#34D399' }} />
              <Text strong>Secure & Compliant</Text>
            </div>
            <div className="floating-card card-3">
              <ThunderboltOutlined style={{ fontSize: '48px', color: '#047857' }} />
              <Text strong>Lightning Fast</Text>
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
                    <span className="currency">$</span>
                    <span className="amount">99</span>
                    <span className="period">/month</span>
                  </div>
                </div>
                <ul className="pricing-features">
                  <li><CheckCircleOutlined /> Up to 5 doctors</li>
                  <li><CheckCircleOutlined /> Up to 100 patients</li>
                  <li><CheckCircleOutlined /> Basic features</li>
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
                    <span className="currency">$</span>
                    <span className="amount">299</span>
                    <span className="period">/month</span>
                  </div>
                </div>
                <ul className="pricing-features">
                  <li><CheckCircleOutlined /> Up to 20 doctors</li>
                  <li><CheckCircleOutlined /> Up to 1000 patients</li>
                  <li><CheckCircleOutlined /> All features</li>
                  <li><CheckCircleOutlined /> Priority support</li>
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
                    <span className="currency">$</span>
                    <span className="amount">999</span>
                    <span className="period">/month</span>
                  </div>
                </div>
                <ul className="pricing-features">
                  <li><CheckCircleOutlined /> Unlimited doctors</li>
                  <li><CheckCircleOutlined /> Unlimited patients</li>
                  <li><CheckCircleOutlined /> All features</li>
                  <li><CheckCircleOutlined /> Dedicated support</li>
                  <li><CheckCircleOutlined /> Unlimited storage</li>
                  <li><CheckCircleOutlined /> Custom domain</li>
                  <li><CheckCircleOutlined /> SLA guarantee</li>
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
                    Founded in 2020, we've grown from a small startup to a trusted partner
                    for hospitals worldwide, serving patients annually.
                  </Paragraph>
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div className="mission-stats">
                  <Row gutter={[24, 24]}>
                    <Col xs={12}>
                      <Card className="stat-card scroll-animate-stagger">
                        <Statistic
                          title="Founded"
                          value="2020"
                          valueStyle={{ color: '#10B981' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={12}>
                      <Card className="stat-card scroll-animate-stagger">
                        <Statistic
                          title="Team Members"
                          value="50+"
                          valueStyle={{ color: '#10B981' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={12}>
                      <Card className="stat-card scroll-animate-stagger">
                        <Statistic
                          title="Countries"
                          value="5+"
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
                    <Text><strong>Email:</strong> hello@ayphencare.com</Text>
                    <Text><strong>Phone:</strong> +1 (555) 123-4567</Text>
                    <Text><strong>Address:</strong> 123 Health Street, San Francisco, CA 94102</Text>
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
            Join 1000+ hospitals already using our platform. Start your free 30-day trial today.
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
              <Input placeholder="John Doe" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Work Email"
              rules={[
                { required: true, message: 'Please enter your work email' },
                { type: 'email', message: 'Please enter a valid email' }
              ]}
            >
              <Input placeholder="john@hospital.com" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="phone"
                  label="Phone Number"
                >
                  <Input placeholder="+1 (555) 000-0000" />
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
              <TextArea rows={4} placeholder="I'm interested in a demo for our Cardiology department..." />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: '1rem' }}>
              <Button type="primary" htmlType="submit" block size="large" loading={loading} style={{ background: '#10B981', borderColor: '#10B981' }}>
                Submit Request
              </Button>
            </Form.Item>
          </Form>
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
                <li><a href="#contact">Contact</a></li>
                <li><a href="#careers">Careers</a></li>
                <li><a href="#blog">Blog</a></li>
              </ul>
            </Col>
            <Col xs={24} md={6}>
              <Title level={5}>Legal</Title>
              <ul className="footer-links">
                <li><a href="#privacy">Privacy Policy</a></li>
                <li><a href="#terms">Terms of Service</a></li>
                <li><a href="#security">Security</a></li>
                <li><a href="#compliance">Compliance</a></li>
              </ul>
            </Col>
          </Row>
          <div className="footer-bottom">
            <Text>© 2025 Ayphen Care. All rights reserved.</Text>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SaaSLanding;
