import React from 'react';
import { Layout, Menu, Dropdown, Avatar, Space, Typography, theme } from 'antd';
import {
  HomeOutlined,
  PlusCircleOutlined,
  UnorderedListOutlined,
  LogoutOutlined,
  BarChartOutlined,
  TeamOutlined,
  DownOutlined,
  EnvironmentOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../config/routes';

const { Header, Content } = Layout;
const { Text } = Typography;

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const { token } = theme.useToken();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const userMenuItems = {
    items: [{ key: 'logout', label: 'Sign out', icon: <LogoutOutlined />, onClick: handleLogout }],
  };

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';

  const navItems = [
    {
      key: ROUTES.DASHBOARD,
      icon: <HomeOutlined />,
      label: user?.role === 'MUNICIPAL_EMPLOYEE' ? 'Department Dashboard' : 'Dashboard',
    },
    ...(user?.role === 'CITIZEN'
      ? [
          { key: ROUTES.REPORT, icon: <PlusCircleOutlined />, label: 'Report Issue' },
          { key: ROUTES.MY_REPORTS, icon: <UnorderedListOutlined />, label: 'My Reports' },
        ]
      : []),
    ...(user?.role === 'MUNICIPAL_EMPLOYEE'
      ? [{ key: ROUTES.STAFF_IMPORT_EXPORT, icon: <SwapOutlined />, label: 'Import / Export' }]
      : []),
    ...(user?.role === 'ADMIN'
      ? [{ key: ROUTES.ADMIN, icon: <TeamOutlined />, label: 'Admin' }]
      : []),
    ...(user?.role === 'ADMIN' || user?.role === 'MUNICIPAL_EMPLOYEE'
      ? [{ key: ROUTES.ANALYTICS, icon: <BarChartOutlined />, label: 'Analytics' }]
      : []),
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgLayout }}>
      <Header
        style={{
          background: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          height: 56,
          lineHeight: '56px',
        }}
      >
        {/* Left: Brand */}
        <div
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          onClick={() => navigate(ROUTES.DASHBOARD)}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              border: `1px solid ${token.colorBorderSecondary}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: token.colorInfo,
              background: token.colorBgElevated,
            }}
            title="City Service Hub"
          >
            <EnvironmentOutlined style={{ fontSize: 13 }} />
          </div>
          <Text strong style={{ fontSize: 15, color: token.colorText, whiteSpace: 'nowrap' }}>
            Citizen Request System
          </Text>
        </div>

        {/* Center: Nav */}
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          style={{
            border: 'none',
            flex: 1,
            justifyContent: 'center',
            minWidth: 0,
            background: 'transparent',
            lineHeight: '54px',
            color: token.colorText,
          }}
          items={navItems}
        />

        {/* Right: User */}
        <Space size={12} style={{ flexShrink: 0 }}>
          <Dropdown menu={userMenuItems} placement="bottomRight" trigger={['click']}>
            <Space style={{ cursor: 'pointer', userSelect: 'none', flexShrink: 0 }} size={8}>
              <Avatar
                size={30}
                style={{
                  background: '#1677ff',
                  fontSize: 12,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {initials}
              </Avatar>
              <Text style={{ fontSize: 13, color: token.colorTextSecondary }}>
                Welcome, {user?.firstName ?? user?.username ?? 'User'}
              </Text>
              <DownOutlined style={{ fontSize: 10, color: token.colorTextTertiary }} />
            </Space>
          </Dropdown>
        </Space>
      </Header>

      <Content
        style={{
          padding: '18px 24px',
          maxWidth: 1400,
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        <Outlet />
      </Content>
    </Layout>
  );
};
