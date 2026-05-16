import React from 'react';
import { Space, Typography } from 'antd';
import { flexBetween } from '../utils/styles';

const { Title, Text } = Typography;

interface PageHeaderProps {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => {
  if (actions) {
    return (
      <div style={{ ...flexBetween, alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>
            {title}
          </Title>
          <Text type="secondary">{subtitle}</Text>
        </div>
        <Space wrap>{actions}</Space>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <Title level={3} style={{ marginBottom: 4 }}>
        {title}
      </Title>
      <Text type="secondary">{subtitle}</Text>
    </div>
  );
};
