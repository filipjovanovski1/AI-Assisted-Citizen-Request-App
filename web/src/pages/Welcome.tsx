import React from 'react';
import { Button, Typography, Row, Col, Space, Divider, theme } from 'antd';
import {
  EnvironmentOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

const features = [
  {
    icon: <EnvironmentOutlined style={{ fontSize: 28, color: '#1677ff' }} />,
    title: 'Location-Based Reporting',
    desc: 'Pin the exact location of an issue directly on a map and provide a clear description.',
  },
  {
    icon: <RobotOutlined style={{ fontSize: 28, color: '#1677ff' }} />,
    title: 'AI-Powered Department Routing',
    desc: 'Our system automatically reads your report and routes it to the correct department — no manual selection needed, no wrong teams.',
  },
  {
    icon: <CheckCircleOutlined style={{ fontSize: 28, color: '#1677ff' }} />,
    title: 'Full Status Tracking',
    desc: 'Follow every stage of your report — from submission to resolution — in one place.',
  },
  {
    icon: <TeamOutlined style={{ fontSize: 28, color: '#1677ff' }} />,
    title: 'Transparent by Design',
    desc: 'All non-sensitive reports are publicly visible, keeping municipalities accountable.',
  },
];

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = theme.useToken();

  return (
    <div style={{ minHeight: '100vh', background: token.colorBgLayout, overflowX: 'hidden' }}>
      {/* Header */}
      <header
        style={{
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          padding: '0 48px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          background: token.colorBgContainer,
          zIndex: 100,
        }}
      >
        <Text strong style={{ fontSize: 18, color: '#1677ff' }}>
          Citizen Request System
        </Text>
        <Space>
          <Button onClick={() => navigate('/login')}>Sign in</Button>
          <Button type="primary" onClick={() => navigate('/register')}>
            Get started
          </Button>
        </Space>
      </header>

      {/* Hero */}
      <div
        style={{
          maxWidth: 760,
          margin: '0 auto',
          padding: '96px 24px 64px',
          textAlign: 'center',
        }}
      >
        <Title style={{ fontSize: 48, fontWeight: 700, marginBottom: 20, lineHeight: 1.2 }}>
          Report municipal issues.
          <br />
          <span style={{ color: '#1677ff' }}>Resolved, step by step.</span>
        </Title>
        <Paragraph
          style={{
            fontSize: 17,
            color: token.colorTextSecondary,
            maxWidth: 560,
            margin: '0 auto 36px',
          }}
        >
          A modern platform that connects citizens with municipal departments. Submit a report, get
          it routed to the right team, and follow its progress to resolution.
        </Paragraph>
        <Space size={12}>
          <Button type="primary" size="large" onClick={() => navigate('/register')}>
            Create a free account
          </Button>
          <Button size="large" onClick={() => navigate('/dashboard')}>
            View public map
          </Button>
        </Space>
      </div>

      <Divider style={{ margin: '0 48px' }} />

      {/* AI highlight banner */}
      <div
        style={{
          background: token.colorBgContainer,
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          padding: '40px 24px',
          textAlign: 'center',
        }}
      >
        <Space direction="vertical" size={10} style={{ maxWidth: 600, margin: '0 auto' }}>
          <RobotOutlined style={{ fontSize: 28, color: '#1677ff' }} />
          <Title level={3} style={{ margin: 0 }}>
            No more guessing which department to contact
          </Title>
          <Paragraph style={{ color: token.colorTextSecondary, marginBottom: 0, fontSize: 15 }}>
            When you submit a report, our system automatically reads the title and description and
            routes it to the correct municipal department — no dropdowns, no wrong teams.
          </Paragraph>
        </Space>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '64px 24px' }}>
        <Row gutter={[40, 40]}>
          {features.map((f) => (
            <Col xs={24} sm={12} key={f.title}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ paddingTop: 4 }}>{f.icon}</div>
                <div>
                  <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 6 }}>
                    {f.title}
                  </Text>
                  <Text
                    type="secondary"
                    style={{ fontSize: 14, lineHeight: 1.6, display: 'block' }}
                  >
                    {f.desc}
                  </Text>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      <div
        style={{
          background: token.colorBgContainer,
          textAlign: 'center',
          padding: '48px 24px',
          borderTop: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Title level={3} style={{ marginBottom: 8 }}>
          Ready to report an issue?
        </Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          It takes less than two minutes.
        </Text>
        <Button type="primary" size="large" onClick={() => navigate('/register')}>
          Sign up now
        </Button>
      </div>
    </div>
  );
};
