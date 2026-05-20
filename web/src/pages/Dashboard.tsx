import React, { useEffect, useState } from 'react';
import { DatePicker, Select, Input, Space } from 'antd';
import { publicApi, departmentApi } from '../services/api';
import type { DepartmentDto, RequestStatus, ServiceRequestDto } from '../types';
import { useAuth } from '../context/AuthContext';
import { RequestMapDashboard } from '../components/RequestMapDashboard';
import { PageHeader } from '../components/PageHeader';
import { STATUS_SELECT_OPTIONS } from '../constants/requestStatus';
import type { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;
const MISCLASSIFICATION_FILTER_OPTIONS = [
  { value: true, label: 'Misclassified only' },
  { value: false, label: 'Exclude misclassified' },
];

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ServiceRequestDto[]>([]);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<RequestStatus | undefined>();
  const [departmentFilter, setDepartmentFilter] = useState<number | undefined>();
  const [misclassifiedFilter, setMisclassifiedFilter] = useState<boolean | undefined>();
  const [keywordFilter, setKeywordFilter] = useState('');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const isAdmin = user?.role === 'ADMIN';

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
          misclassified: misclassifiedFilter,
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
  }, [user?.id, statusFilter, departmentFilter, misclassifiedFilter, keywordFilter, dateRange]);

  return (
    <div>
      <PageHeader
        title="Public Dashboard"
        subtitle="Live public overview of issue intake, assignment, and resolution progress."
      />

      <Space wrap style={{ marginBottom: 12 }}>
        <Select
          allowClear
          placeholder="Filter by status"
          style={{ width: 160 }}
          options={STATUS_SELECT_OPTIONS}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v)}
        />
        <Select
          allowClear
          placeholder="Filter by department"
          style={{ width: 200 }}
          options={departments.map((d) => ({ value: d.id, label: d.name }))}
          value={departmentFilter}
          onChange={(v) => setDepartmentFilter(v)}
        />
        {isAdmin ? (
          <Select
            allowClear
            placeholder="AI review"
            style={{ width: 180 }}
            options={MISCLASSIFICATION_FILTER_OPTIONS}
            value={misclassifiedFilter}
            onChange={(v) => setMisclassifiedFilter(v)}
          />
        ) : null}
        <Input.Search
          placeholder="Keyword search..."
          allowClear
          style={{ width: 200 }}
          onSearch={(v) => setKeywordFilter(v)}
          onChange={(e) => {
            if (!e.target.value) {
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

      <RequestMapDashboard
        requests={requests}
        loading={loading}
        error={error}
        showAiReview={isAdmin}
        tableTitle="Recent Reports"
      />
    </div>
  );
};
