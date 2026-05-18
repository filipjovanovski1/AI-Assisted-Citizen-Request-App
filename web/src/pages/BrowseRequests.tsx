import React, { useEffect, useState } from 'react';
import { Alert, Button, DatePicker, Input, Select, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import { useNavigate } from 'react-router-dom';

import { departmentApi, publicApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { DepartmentDto, RequestStatus, ServiceRequestDto } from '../types';
import { PageHeader } from '../components/PageHeader';
import { RequestLiveMap } from '../components/RequestLiveMap';
import { StatusTag } from '../components/StatusTag';
import { STATUS_SELECT_OPTIONS } from '../constants/requestStatus';
import { ROUTES } from '../config/routes';
import { resolveRequestImageUrl } from '../utils/requestImages';

const { RangePicker } = DatePicker;

export const BrowseRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequestDto[]>([]);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<RequestStatus | undefined>();
  const [departmentFilter, setDepartmentFilter] = useState<number | undefined>();
  const [keywordFilter, setKeywordFilter] = useState('');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);

  useEffect(() => {
    departmentApi
      .getAll()
      .then(setDepartments)
      .catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    const doLoad = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await publicApi.getRequests(user?.id, {
          status: statusFilter,
          departmentId: departmentFilter,
          keyword: keywordFilter || undefined,
          from: dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : undefined,
          to: dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : undefined,
        });
        if (active) {
          setRequests(data);
          setLoading(false);
        }
      } catch {
        if (active) {
          setError('Failed to load requests.');
          setLoading(false);
        }
      }
    };
    void doLoad();
    return () => {
      active = false;
    };
  }, [user?.id, statusFilter, departmentFilter, keywordFilter, dateRange]);

  const columns: ColumnsType<ServiceRequestDto> = [
    {
      title: 'Image',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 120,
      render: (value?: string) => (
        <img
          src={resolveRequestImageUrl(value)}
          alt="Request"
          style={{
            width: 72,
            height: 72,
            objectFit: 'cover',
            borderRadius: 8,
            display: 'block',
          }}
        />
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (value: string) => <strong>{value}</strong>,
    },
    {
      title: 'Department',
      dataIndex: 'departmentName',
      key: 'department',
      render: (value?: string) => value || 'Unassigned',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (value: RequestStatus) => <StatusTag status={value} />,
      width: 140,
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      render: (value?: string) => value || 'Not provided',
    },
    {
      title: 'Support',
      dataIndex: 'voteCount',
      key: 'voteCount',
      width: 90,
    },
    {
      title: 'Comments',
      dataIndex: 'commentCount',
      key: 'commentCount',
      width: 100,
    },
    {
      title: 'Submitted',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (value?: string) => (value ? new Date(value).toLocaleDateString() : 'Unknown'),
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(ROUTES.REQUEST(record.id))}>
          View details
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Browse Reported Issues"
        subtitle="Explore community reports, apply filters, and open any request to support it or join the discussion."
      />

      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder="Filter by status"
          style={{ width: 170 }}
          options={STATUS_SELECT_OPTIONS}
          value={statusFilter}
          onChange={(value) => setStatusFilter(value)}
        />
        <Select
          allowClear
          placeholder="Filter by department"
          style={{ width: 220 }}
          options={departments.map((department) => ({
            value: department.id,
            label: department.name,
          }))}
          value={departmentFilter}
          onChange={(value) => setDepartmentFilter(value)}
        />
        <Input.Search
          allowClear
          placeholder="Search by keyword..."
          style={{ width: 240 }}
          onSearch={(value) => setKeywordFilter(value)}
          onChange={(event) => {
            if (!event.target.value) {
              setKeywordFilter('');
            }
          }}
        />
        <RangePicker
          value={dateRange}
          onChange={(range) => setDateRange(range ? [range[0], range[1]] : [null, null])}
          format="YYYY-MM-DD"
          placeholder={['From date', 'To date']}
          allowEmpty={[true, true]}
        />
      </Space>

      {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}

      <div style={{ marginBottom: 16 }}>
        <RequestLiveMap
          requests={requests}
          loading={loading}
          title="Live Request Map"
          height={420}
        />
      </div>

      <Table
        columns={columns}
        dataSource={requests}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 12 }}
        onRow={(record) => ({
          onClick: () => navigate(ROUTES.REQUEST(record.id)),
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  );
};
