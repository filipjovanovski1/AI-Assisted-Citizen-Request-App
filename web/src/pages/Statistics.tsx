import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Card, Col, Empty, Progress, Row, Spin, Statistic, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { publicApi } from '../services/api';
import { getApiError } from '../utils/toast';
import type { RequestStatus, ServiceRequestDto } from '../types';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { StatusTag } from '../components/StatusTag';

const { Text } = Typography;

type DepartmentRow = {
  key: string;
  department: string;
  requests: number;
  share: number;
  resolvedRate: number;
};

export const StatisticsPage: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ServiceRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    publicApi
      .getRequests(user?.id)
      .then(setRequests)
      .catch((err) => setError(getApiError(err, 'Failed to load analytics data.')))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const analytics = useMemo(() => {
    const total = requests.length;

    type ReduceAcc = {
      statusCounts: Record<RequestStatus, number>;
      supported: number;
      comments: number;
      geoTagged: number;
      anonymous: number;
      byDepartment: Record<string, { total: number; resolved: number }>;
    };

    const { statusCounts, supported, comments, geoTagged, anonymous, byDepartment } =
      requests.reduce<ReduceAcc>(
        (acc, req) => {
          acc.statusCounts[req.status] += 1;
          acc.supported += req.voteCount;
          acc.comments += req.commentCount;
          if (req.latitude && req.longitude) { acc.geoTagged += 1; }
          if (req.anonymousSubmission) { acc.anonymous += 1; }

          const key = req.departmentName || 'Unassigned';
          if (!acc.byDepartment[key]) {
            acc.byDepartment[key] = { total: 0, resolved: 0 };
          }
          acc.byDepartment[key].total += 1;
          if (req.status === 'RESOLVED' || req.status === 'CLOSED') {
            acc.byDepartment[key].resolved += 1;
          }
          return acc;
        },
        {
          statusCounts: { NEW: 0, IN_REVIEW: 0, ASSIGNED: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0 },
          supported: 0,
          comments: 0,
          geoTagged: 0,
          anonymous: 0,
          byDepartment: {},
        },
      );

    const resolved = statusCounts.RESOLVED + statusCounts.CLOSED;
    const active =
      statusCounts.NEW + statusCounts.IN_REVIEW + statusCounts.ASSIGNED + statusCounts.IN_PROGRESS;

    const departmentRows: DepartmentRow[] = Object.entries(byDepartment)
      .map(([department, value]) => ({
        key: department,
        department,
        requests: value.total,
        share: total === 0 ? 0 : Math.round((value.total / total) * 100),
        resolvedRate: value.total === 0 ? 0 : Math.round((value.resolved / value.total) * 100),
      }))
      .sort((a, b) => b.requests - a.requests);

    return {
      total,
      active,
      resolved,
      supported,
      comments,
      geoTagged,
      anonymous,
      statusCounts,
      departmentRows,
      resolutionRate: total === 0 ? 0 : Math.round((resolved / total) * 100),
      geoRate: total === 0 ? 0 : Math.round((geoTagged / total) * 100),
      anonymousRate: total === 0 ? 0 : Math.round((anonymous / total) * 100),
    };
  }, [requests]);

  const deptColumns: ColumnsType<DepartmentRow> = [
    { title: 'Department', dataIndex: 'department', key: 'department' },
    { title: 'Requests', dataIndex: 'requests', key: 'requests', width: 110 },
    {
      title: 'Share',
      dataIndex: 'share',
      key: 'share',
      width: 140,
      render: (share: number) => `${share}%`,
    },
    {
      title: 'Resolved',
      dataIndex: 'resolvedRate',
      key: 'resolvedRate',
      width: 180,
      render: (rate: number) => <Progress percent={rate} size="small" />,
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert type="error" message={error} />;
  }

  if (analytics.total === 0) {
    return <Empty description="No analytics yet. Submit the first report to get started." />;
  }

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Administrative insight into platform performance, operational load, and resolution quality."
      />

      <Row gutter={16} style={{ marginBottom: 18 }}>
        <Col xs={12} md={8} lg={4}>
          <Card>
            <Statistic title="Total Reports" value={analytics.total} />
          </Card>
        </Col>
        <Col xs={12} md={8} lg={4}>
          <Card>
            <Statistic title="Active Queue" value={analytics.active} />
          </Card>
        </Col>
        <Col xs={12} md={8} lg={4}>
          <Card>
            <Statistic title="Resolved" value={analytics.resolved} />
          </Card>
        </Col>
        <Col xs={12} md={8} lg={4}>
          <Card>
            <Statistic title="Support Count" value={analytics.supported} />
          </Card>
        </Col>
        <Col xs={12} md={8} lg={4}>
          <Card>
            <Statistic title="Comments" value={analytics.comments} />
          </Card>
        </Col>
        <Col xs={12} md={8} lg={4}>
          <Card>
            <Statistic title="Geo-tagged" value={`${analytics.geoRate}%`} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 18 }}>
        <Col xs={24} lg={12}>
          <Card title="Pipeline Performance">
            <SpaceColumn
              label="Resolution Rate"
              value={analytics.resolutionRate}
              stroke="#3fb950"
            />
            <SpaceColumn
              label="Anonymous Submissions"
              value={analytics.anonymousRate}
              stroke="#d29922"
            />
            <SpaceColumn label="Location Coverage" value={analytics.geoRate} stroke="#2f81f7" />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Status Distribution">
            {(Object.keys(analytics.statusCounts) as RequestStatus[]).map((status) => {
              const count = analytics.statusCounts[status];
              const percent =
                analytics.total === 0 ? 0 : Math.round((count / analytics.total) * 100);
              return (
                <div key={status} style={{ marginBottom: 10 }}>
                  <Text
                    style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}
                  >
                    <span>
                      <StatusTag status={status} />
                    </span>
                    <span>{count}</span>
                  </Text>
                  <Progress percent={percent} size="small" showInfo={false} />
                </div>
              );
            })}
          </Card>
        </Col>
      </Row>

      <Card title="Department Analytics">
        <Table columns={deptColumns} dataSource={analytics.departmentRows} pagination={false} />
      </Card>
    </div>
  );
};

const SpaceColumn: React.FC<{ label: string; value: number; stroke: string }> = ({
  label,
  value,
  stroke,
}) => (
  <div style={{ marginBottom: 12 }}>
    <Text style={{ display: 'block', marginBottom: 6 }}>{label}</Text>
    <Progress percent={value} strokeColor={stroke} />
  </div>
);
