import React, { useEffect, useState } from 'react';
import { Table, Space, Button, Typography, Alert, Popconfirm, theme } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';

import { citizenApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast, getApiError } from '../utils/toast';
import type { ServiceRequestDto, RequestStatus } from '../types';
import { PageHeader } from '../components/PageHeader';
import { StatusTag } from '../components/StatusTag';
import { STATUS_LABELS } from '../constants/requestStatus';
import { ROUTES } from '../config/routes';

export const MyReportsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const [data, setData] = useState<ServiceRequestDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    if (!user) {return;}
    setLoading(true);
    setError(null);
    try {
      const reports = await citizenApi.getMyRequests(user.id);
      setData(reports);
    } catch (err) {
      setError(getApiError(err, 'Failed to load your reports.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (requestId: number) => {
    if (!user) {return;}
    try {
      await citizenApi.deleteOwnRequest(user.id, requestId);
      toast.success('Report deleted.');
      await fetchReports();
    } catch (err) {
      toast.error(getApiError(err, 'Failed to delete report.'));
    }
  };

  useEffect(() => {
    if (!user) { return; }
    let active = true;
    const doLoad = async () => {
      setLoading(true);
      setError(null);
      try {
        const reports = await citizenApi.getMyRequests(user.id);
        if (active) { setData(reports); }
      } catch (err) {
        if (active) { setError(getApiError(err, 'Failed to load your reports.')); }
      } finally {
        if (active) { setLoading(false); }
      }
    };
    void doLoad();
    return () => { active = false; };
  }, [user]);

  const columns: ColumnsType<ServiceRequestDto> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Title', dataIndex: 'title', key: 'title' },
    {
      title: 'Department',
      dataIndex: 'departmentName',
      key: 'department',
      render: (dept?: string) =>
        dept || <Typography.Text type="secondary">Unassigned</Typography.Text>,
    },
    {
      title: 'Date Submitted',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: RequestStatus) => <StatusTag status={status} />,
      filters: Object.keys(STATUS_LABELS).map((key) => ({
        text: STATUS_LABELS[key as RequestStatus],
        value: key,
      })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => {
        const isEditable = record.status === 'NEW' || record.status === 'IN_REVIEW';
        return (
          <Space size="middle">
            {isEditable && (
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => navigate(ROUTES.REQUEST(record.id))}
              >
                Edit
              </Button>
            )}
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => navigate(ROUTES.REQUEST(record.id))}
            >
              View
            </Button>
            {isEditable && (
              <Popconfirm
                title="Delete report"
                description="This action cannot be undone."
                okText="Delete"
                cancelText="Cancel"
                onConfirm={() => handleDeleteReport(record.id)}
              >
                <Button type="link" danger icon={<DeleteOutlined />}>
                  Delete
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  if (!user) {
    return <Alert type="warning" message="You need to be logged in to view your reports." />;
  }

  return (
    <div
      style={{
        backgroundColor: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`,
        padding: 24,
        borderRadius: 8,
      }}
    >
      <PageHeader
        title="My Reports"
        subtitle="Track the status of your submitted issue reports."
        actions={
          <>
            <Button icon={<ReloadOutlined />} onClick={fetchReports} loading={loading}>
              Refresh
            </Button>
            <Button type="primary" onClick={() => navigate(ROUTES.REPORT)}>
              Report New Issue
            </Button>
          </>
        }
      />

      {error ? (
        <Alert type="error" message={error} style={{ marginBottom: 16 }} />
      ) : (
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      )}
    </div>
  );
};
