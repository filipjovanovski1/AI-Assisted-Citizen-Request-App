import React from 'react';
import { Alert, Col, List, Progress, Row, Spin, Table, Tag, Typography, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';

import { RequestLiveMap } from './RequestLiveMap';
import type { ServiceRequestDto, RequestStatus } from '../types';
import { STATUS_HEX_COLORS, STATUS_LABELS } from '../constants/requestStatus';
import { ROUTES } from '../config/routes';

const { Text } = Typography;

export interface RequestMapDashboardProps {
  requests: ServiceRequestDto[];
  loading: boolean;
  error?: string | null;
  /** Extra columns appended after ID / Title / Department / Status */
  extraColumns?: ColumnsType<ServiceRequestDto>;
  /** Whether to show the Department column. Defaults to true. */
  showDepartmentColumn?: boolean;
  /** Whether to show the Top Departments by Volume list in Data Coverage. Defaults to true. */
  showDepartmentVolume?: boolean;
  /** Whether to show AI review summary/tagging in the dashboard and table. Defaults to false. */
  showAiReview?: boolean;
  /** Label shown above the "Recent Reports" table. Defaults to "Recent Reports". */
  tableTitle?: string;
}

export const RequestMapDashboard: React.FC<RequestMapDashboardProps> = ({
  requests,
  loading,
  error,
  extraColumns,
  showDepartmentColumn = true,
  showDepartmentVolume = true,
  showAiReview = false,
  tableTitle = 'Recent Reports',
}) => {
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const stats = {
    total: requests.length,
    newCount: requests.filter((r) => r.status === 'NEW').length,
    reviewCount: requests.filter((r) => r.status === 'IN_REVIEW').length,
    assignedCount: requests.filter((r) => r.status === 'ASSIGNED').length,
    inProgress: requests.filter((r) => r.status === 'IN_PROGRESS').length,
    resolved: requests.filter((r) => r.status === 'RESOLVED' || r.status === 'CLOSED').length,
    geoTagged: requests.filter((r) => r.latitude && r.longitude).length,
    misclassified: requests.filter((r) => r.misclassification).length,
  };

  const resolutionRate = stats.total === 0 ? 0 : Math.round((stats.resolved / stats.total) * 100);
  const geoTagRate = stats.total === 0 ? 0 : Math.round((stats.geoTagged / stats.total) * 100);

  const departmentsEngaged = new Set(
    requests.map((r) => r.departmentName).filter((d): d is string => Boolean(d)),
  ).size;

  const summaryRows = [
    { key: 'total', metric: 'Total requests', value: stats.total },
    { key: 'new', metric: 'New requests', value: stats.newCount },
    { key: 'review', metric: 'In review', value: stats.reviewCount },
    { key: 'assigned', metric: 'Assigned', value: stats.assignedCount },
    { key: 'progress', metric: 'In progress', value: stats.inProgress },
    { key: 'resolved', metric: 'Resolved or closed', value: stats.resolved },
    ...(showAiReview ? [{ key: 'misclassified', metric: 'AI flagged', value: stats.misclassified }] : []),
    { key: 'departments', metric: 'Departments engaged', value: departmentsEngaged },
    { key: 'geo', metric: 'Geo-tagged requests', value: stats.geoTagged },
  ];

  const statusBreakdownRows = (Object.keys(STATUS_LABELS) as RequestStatus[]).map((status) => {
    const count = requests.filter((r) => r.status === status).length;
    const share = stats.total === 0 ? 0 : Math.round((count / stats.total) * 100);
    return { key: status, status, count, share };
  });

  const departmentLoad = requests.reduce<Record<string, number>>((acc, r) => {
    const key = r.departmentName || 'Unassigned';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const topDepartments = Object.entries(departmentLoad)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const baseColumns: ColumnsType<ServiceRequestDto> = [
    { title: '#', dataIndex: 'id', key: 'id', width: 60 },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (v: string) => <Text strong>{v}</Text>,
    },
    ...(showDepartmentColumn
      ? ([
          {
            title: 'Department',
            dataIndex: 'departmentName',
            key: 'dept',
            render: (v?: string) => v ?? <Text type="secondary">Unassigned</Text>,
          },
        ] as ColumnsType<ServiceRequestDto>)
      : []),
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: RequestStatus) => <Tag color={STATUS_HEX_COLORS[s]}>{STATUS_LABELS[s]}</Tag>,
    },
    ...(showAiReview
      ? ([
          {
            title: 'AI Review',
            dataIndex: 'misclassification',
            key: 'misclassification',
            render: (misclassification: boolean) =>
              misclassification ? <Tag color="volcano">Misclassified</Tag> : <Tag>Normal</Tag>,
          },
        ] as ColumnsType<ServiceRequestDto>)
      : []),
    ...(extraColumns ?? []),
  ];

  const cardStyle = {
    background: token.colorBgContainer,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: 6,
    overflow: 'hidden' as const,
    boxShadow: '0 1px 2px rgba(0,0,0,0.18)',
  };

  const cardHeaderStyle = {
    padding: '12px 16px',
    borderBottom: `1px solid ${token.colorBorderSecondary}`,
  };

  return (
    <div>
      {error && <Alert type="error" message={error} style={{ marginBottom: 10 }} />}

      <Row gutter={8} style={{ marginBottom: 8 }}>
        <Col xs={24} lg={12}>
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <Text strong>Dashboard Summary</Text>
            </div>
            <Table
              rowKey="key"
              loading={loading}
              pagination={false}
              size="small"
              dataSource={summaryRows}
              columns={[
                { title: 'Metric', dataIndex: 'metric', key: 'metric' },
                { title: 'Value', dataIndex: 'value', key: 'value', width: 130 },
              ]}
            />
          </div>
        </Col>
        <Col xs={24} lg={12}>
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <Text strong>Status Breakdown</Text>
            </div>
            <Table
              rowKey="key"
              loading={loading}
              pagination={false}
              size="small"
              dataSource={statusBreakdownRows}
              columns={[
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (s: RequestStatus) => (
                    <Tag color={STATUS_HEX_COLORS[s]}>{STATUS_LABELS[s]}</Tag>
                  ),
                },
                { title: 'Count', dataIndex: 'count', key: 'count', width: 90 },
                {
                  title: 'Share',
                  dataIndex: 'share',
                  key: 'share',
                  width: 120,
                  render: (share: number) => `${share}%`,
                },
              ]}
            />
          </div>
        </Col>
      </Row>

      <Row gutter={8} style={{ marginBottom: 8 }}>
        <Col xs={24} lg={12}>
          <div style={{ ...cardStyle, padding: '16px 18px', overflow: 'visible' }}>
            <Text strong style={{ display: 'block', marginBottom: 12 }}>
              Queue Health
            </Text>
            <Progress percent={resolutionRate} status="active" strokeColor="#3fb950" />
            <Text type="secondary">
              {resolutionRate}% of submitted reports are currently resolved or closed.
            </Text>
          </div>
        </Col>
        <Col xs={24} lg={12}>
          <div style={{ ...cardStyle, padding: '16px 18px', overflow: 'visible' }}>
            <Text strong style={{ display: 'block', marginBottom: 10 }}>
              Data Coverage
            </Text>
            <Text style={{ display: 'block', marginBottom: 8 }}>Geo-tagged reports</Text>
            <Progress percent={geoTagRate} strokeColor="#2f81f7" />
            <Text type="secondary">{stats.geoTagged} requests include exact coordinates.</Text>
            {showDepartmentVolume ? (
              <div style={{ marginTop: 14 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  Top Departments by Volume
                </Text>
                <List
                  size="small"
                  dataSource={topDepartments}
                  locale={{ emptyText: 'No department data yet' }}
                  renderItem={([name, count]) => (
                    <List.Item style={{ paddingLeft: 0, paddingRight: 0 }}>
                      <Text>{name}</Text>
                      <Tag>{count}</Tag>
                    </List.Item>
                  )}
                />
              </div>
            ) : null}
          </div>
        </Col>
      </Row>

      <Row gutter={8} style={{ marginBottom: 8 }}>
        <Col xs={24}>
          <RequestLiveMap requests={requests} loading={loading} />
        </Col>
      </Row>

      <Row gutter={8}>
        <Col xs={24}>
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <Text strong>{tableTitle}</Text>
            </div>
            <Spin spinning={loading}>
              <Table
                columns={baseColumns}
                dataSource={requests.slice(0, 30)}
                rowKey="id"
                size="small"
                pagination={false}
                onRow={(r) =>
                  extraColumns && extraColumns.length > 0
                    ? {}
                    : {
                        onClick: () => navigate(ROUTES.REQUEST(r.id)),
                        style: { cursor: 'pointer' },
                      }
                }
                scroll={{ y: 420 }}
              />
            </Spin>
          </div>
        </Col>
      </Row>
    </div>
  );
};
