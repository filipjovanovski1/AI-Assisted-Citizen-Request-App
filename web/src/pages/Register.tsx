import React, { useState } from 'react';
import { Form, Input, Button, Typography, Alert, theme } from 'antd';
import { UserOutlined, LockOutlined, IdcardOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { useAuth } from '../context/AuthContext';
import { getApiError, toast } from '../utils/toast';

const { Title, Text } = Typography;

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = theme.useToken();

  const onFinish = async (values: {
    username: string;
    firstName: string;
    lastName: string;
    embg?: string;
    password: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      await register(values);
      toast.success('Account created successfully. Please sign in.');
      navigate(ROUTES.LOGIN);
    } catch (e: unknown) {
      setError(getApiError(e, 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: token.colorBgLayout,
      }}
    >
      <div style={{ width: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Text strong style={{ fontSize: 22, color: '#1677ff' }}>
            Citizen Request System
          </Text>
          <Title level={3} style={{ margin: '8px 0 4px' }}>
            Create account
          </Title>
          <Text type="secondary">Join to start reporting issues in your area</Text>
        </div>

        <div
          style={{
            background: token.colorBgContainer,
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: token.borderRadius,
            padding: 32,
          }}
        >
          {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 20 }} />}
          <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
            <Form.Item
              name="firstName"
              label="First name"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input placeholder="Jane" size="large" />
            </Form.Item>
            <Form.Item
              name="lastName"
              label="Last name"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input placeholder="Doe" size="large" />
            </Form.Item>
            <Form.Item
              name="username"
              label="Username"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="jane.doe" size="large" />
            </Form.Item>
            <Form.Item name="embg" label="National ID (EMBG) — optional">
              <Input prefix={<IdcardOutlined />} placeholder="1234567890123" size="large" />
            </Form.Item>
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, min: 6, message: 'At least 6 characters' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
              <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                Create account
              </Button>
            </Form.Item>
          </Form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Text type="secondary">
            Already have an account? <Link to="/login">Sign in</Link>
          </Text>
        </div>
      </div>
    </div>
  );
};
