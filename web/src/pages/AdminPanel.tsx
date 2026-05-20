import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DownloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { Dayjs } from 'dayjs';

import type {
  DepartmentDto,
  ImportResultDto,
  RequestStatus,
  ServiceRequestDto,
  UserDto,
  UserRole,
} from '../types';
import { useAuth } from '../context/AuthContext';
import { toast, getApiError } from '../utils/toast';
import { adminApi } from '../services/api';
import { PageHeader } from '../components/PageHeader';
import { STATUS_SELECT_OPTIONS } from '../constants/requestStatus';
const { Text } = Typography;

const MISCLASSIFICATION_FILTER_OPTIONS = [
  { value: true, label: 'Misclassified only' },
  { value: false, label: 'Exclude misclassified' },
];

export const AdminPanelPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserDto[]>([]);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [requests, setRequests] = useState<ServiceRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [newDepartmentModalOpen, setNewDepartmentModalOpen] = useState(false);
  const [editDepartmentModalOpen, setEditDepartmentModalOpen] = useState(false);
  const [newEmployeeModalOpen, setNewEmployeeModalOpen] = useState(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequestDto | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentDto | null>(null);
  const [selectedManagedUser, setSelectedManagedUser] = useState<UserDto | null>(null);
  const [exportDateRange, setExportDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    null,
    null,
  ]);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResultDto | null>(null);

  // Request filters
  const [reqStatus, setReqStatus] = useState<RequestStatus | undefined>();
  const [reqDepartment, setReqDepartment] = useState<number | undefined>();
  const [reqMisclassified, setReqMisclassified] = useState<boolean | undefined>();
  const [reqKeyword, setReqKeyword] = useState('');
  const [reqDateRange, setReqDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);

  const [departmentForm] = Form.useForm<{
    name: string;
    description?: string;
    contactEmail?: string;
  }>();
  const [employeeForm] = Form.useForm<{
    username: string;
    firstName: string;
    lastName: string;
    embg?: string;
    password: string;
    departmentId: number;
  }>();
  const [editUserForm] = Form.useForm<{
    username: string;
    firstName: string;
    lastName: string;
    embg?: string;
    password?: string;
    role: UserRole;
    departmentId?: number;
  }>();
  const [assignForm] = Form.useForm<{ departmentId: number; note?: string }>();
  const [statusForm] = Form.useForm<{ status: RequestStatus; note?: string }>();

  const departmentOptions = useMemo(
    () => departments.map((dep) => ({ value: dep.id, label: dep.name })),
    [departments],
  );

  // Load users and departments once (or when user changes)
  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      return;
    }
    let active = true;
    Promise.allSettled([adminApi.getUsers(), adminApi.getDepartments()]).then(
      ([usersData, departmentsData]) => {
        if (!active) {
          return;
        }
        if (usersData.status === 'fulfilled') {
          setUsers(usersData.value);
        }
        if (departmentsData.status === 'fulfilled') {
          setDepartments(departmentsData.value);
        }
      },
    );
    return () => {
      active = false;
    };
  }, [user?.id, user?.role]);

  // Reload requests whenever filters change
  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      return;
    }
    let active = true;
    const doLoad = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await adminApi.getRequests(user.id, {
          status: reqStatus,
          departmentId: reqDepartment,
          misclassified: reqMisclassified,
          keyword: reqKeyword || undefined,
          from: reqDateRange[0] ? reqDateRange[0].format('YYYY-MM-DD') : undefined,
          to: reqDateRange[1] ? reqDateRange[1].format('YYYY-MM-DD') : undefined,
        });
        if (active) {
          setRequests(data);
        }
      } catch (err) {
        if (active) {
          setError(getApiError(err, 'Failed to load requests.'));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    void doLoad();
    return () => {
      active = false;
    };
  }, [user, reqStatus, reqDepartment, reqMisclassified, reqKeyword, reqDateRange]);

  const loadData = async () => {
    if (!user) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [usersData, departmentsData, requestsData] = await Promise.allSettled([
        adminApi.getUsers(),
        adminApi.getDepartments(),
        adminApi.getRequests(user.id, {
          status: reqStatus,
          departmentId: reqDepartment,
          misclassified: reqMisclassified,
          keyword: reqKeyword || undefined,
          from: reqDateRange[0] ? reqDateRange[0].format('YYYY-MM-DD') : undefined,
          to: reqDateRange[1] ? reqDateRange[1].format('YYYY-MM-DD') : undefined,
        }),
      ]);
      if (requestsData.status === 'fulfilled') {
        setRequests(requestsData.value);
      } else {
        setRequests([]);
      }
      if (usersData.status === 'fulfilled') {
        setUsers(usersData.value);
      }
      if (departmentsData.status === 'fulfilled') {
        setDepartments(departmentsData.value);
      }
    } catch (err) {
      setError(getApiError(err, 'Failed to reload admin data.'));
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = (request: ServiceRequestDto) => {
    setSelectedRequest(request);
    assignForm.setFieldsValue({ departmentId: request.departmentId });
    setAssignModalOpen(true);
  };

  const openStatusModal = (request: ServiceRequestDto) => {
    setSelectedRequest(request);
    statusForm.setFieldsValue({ status: request.status });
    setStatusModalOpen(true);
  };

  const openDepartmentEdit = (department: DepartmentDto) => {
    setSelectedDepartment(department);
    departmentForm.setFieldsValue({
      name: department.name,
      description: department.description,
      contactEmail: department.contactEmail,
    });
    setEditDepartmentModalOpen(true);
  };

  const openUserEdit = (managedUser: UserDto) => {
    setSelectedManagedUser(managedUser);
    editUserForm.setFieldsValue({
      username: managedUser.username,
      firstName: managedUser.firstName,
      lastName: managedUser.lastName,
      embg: undefined,
      password: undefined,
      role: managedUser.role,
      departmentId: managedUser.departmentId,
    });
    setEditUserModalOpen(true);
  };

  const submitCreateDepartment = async () => {
    const values = await departmentForm.validateFields();
    setSaving(true);
    try {
      await adminApi.createDepartment(values);
      toast.success('Department created successfully.');
      setNewDepartmentModalOpen(false);
      departmentForm.resetFields();
      await loadData();
    } catch (err) {
      toast.error(getApiError(err, 'Failed to create department.'));
    } finally {
      setSaving(false);
    }
  };

  const submitUpdateDepartment = async () => {
    if (!selectedDepartment) {
      return;
    }
    const values = await departmentForm.validateFields();
    setSaving(true);
    try {
      await adminApi.updateDepartment(selectedDepartment.id, values);
      toast.success('Department updated successfully.');
      setEditDepartmentModalOpen(false);
      await loadData();
    } catch (err) {
      toast.error(getApiError(err, 'Failed to update department.'));
    } finally {
      setSaving(false);
    }
  };

  const submitCreateEmployee = async () => {
    const values = await employeeForm.validateFields();
    const payload = {
      username: values.username.trim(),
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      embg: values.embg?.trim() || undefined,
      password: values.password.trim(),
      departmentId: values.departmentId,
    };
    setSaving(true);
    try {
      await adminApi.createMunicipalEmployee(payload);
      toast.success('Department staff account created or upgraded.');
      setNewEmployeeModalOpen(false);
      employeeForm.resetFields();
      await loadData();
    } catch (err) {
      toast.error(getApiError(err, 'Failed to create department staff account.'));
    } finally {
      setSaving(false);
    }
  };

  const submitUpdateUser = async () => {
    if (!selectedManagedUser) {
      return;
    }

    const values = await editUserForm.validateFields();
    const payload = {
      username: values.username.trim(),
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      embg: values.embg?.trim() || undefined,
      password: values.password?.trim() || undefined,
      role: values.role,
      departmentId: values.role === 'MUNICIPAL_EMPLOYEE' ? values.departmentId : undefined,
    };

    setSaving(true);
    try {
      await adminApi.updateUser(selectedManagedUser.id, payload);
      toast.success('User updated successfully.');
      setEditUserModalOpen(false);
      setSelectedManagedUser(null);
      editUserForm.resetFields();
      await loadData();
    } catch (err) {
      toast.error(getApiError(err, 'Failed to update user.'));
    } finally {
      setSaving(false);
    }
  };

  const submitAssignDepartment = async () => {
    if (!user || !selectedRequest) {
      return;
    }
    const values = await assignForm.validateFields();
    setSaving(true);
    try {
      await adminApi.assignDepartment(
        selectedRequest.id,
        user.id,
        values.departmentId,
        values.note,
      );
      toast.success('Department assignment updated.');
      setAssignModalOpen(false);
      await loadData();
    } catch (err) {
      toast.error(getApiError(err, 'Failed to assign department.'));
    } finally {
      setSaving(false);
    }
  };

  const submitStatusUpdate = async () => {
    if (!user || !selectedRequest) {
      return;
    }
    const values = await statusForm.validateFields();
    setSaving(true);
    try {
      await adminApi.updateRequestStatus(selectedRequest.id, user.id, values.status, values.note);
      toast.success('Request status updated.');
      setStatusModalOpen(false);
      await loadData();
    } catch (err) {
      toast.error(getApiError(err, 'Failed to update status.'));
    } finally {
      setSaving(false);
    }
  };

  const deleteDepartment = async (departmentId: number) => {
    setSaving(true);
    try {
      await adminApi.deleteDepartment(departmentId);
      toast.success('Department deleted.');
      await loadData();
    } catch (err) {
      toast.error(getApiError(err, 'Failed to delete department.'));
    } finally {
      setSaving(false);
    }
  };

  const toggleDepartmentActive = async (dept: DepartmentDto) => {
    setSaving(true);
    try {
      if (dept.active) {
        await adminApi.deactivateDepartment(dept.id);
        toast.success(`${dept.name} deactivated.`);
      } else {
        await adminApi.activateDepartment(dept.id);
        toast.success(`${dept.name} activated.`);
      }
      await loadData();
    } catch (err) {
      toast.error(getApiError(err, 'Failed to update department status.'));
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (userId: number) => {
    setSaving(true);
    try {
      await adminApi.deleteUser(userId);
      toast.success('User deleted.');
      await loadData();
    } catch (err) {
      toast.error(getApiError(err, 'Failed to delete user.'));
    } finally {
      setSaving(false);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportReport = async () => {
    if (!user) {
      return;
    }
    setExportLoading(true);
    try {
      const [fromDate, toDate] = exportDateRange;
      const blob = await adminApi.exportReport(
        user.id,
        fromDate ? fromDate.format('YYYY-MM-DD') : undefined,
        toDate ? toDate.format('YYYY-MM-DD') : undefined,
      );
      const from = fromDate ? `-from-${fromDate.format('YYYY-MM-DD')}` : '';
      const to = toDate ? `-to-${toDate.format('YYYY-MM-DD')}` : '';
      downloadBlob(blob, `admin-report${from}${to}.csv`);
      toast.success('Report downloaded.');
    } catch (err) {
      toast.error(getApiError(err, 'Failed to export report.'));
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportSingleRequest = async (requestId: number) => {
    if (!user) {
      return;
    }
    try {
      const blob = await adminApi.exportSingleRequest(requestId, user.id);
      downloadBlob(blob, `request-${requestId}.csv`);
      toast.success('Request exported.');
    } catch (err) {
      toast.error(getApiError(err, 'Failed to export request.'));
    }
  };

  const handleImport = async (file: File) => {
    if (!user) {
      return;
    }
    setImportLoading(true);
    setImportResult(null);
    try {
      const result = await adminApi.importRequests(user.id, file);
      setImportResult(result);
      if (result.failed === 0) {
        toast.success(`Imported ${result.imported} request(s) successfully.`);
      } else {
        toast.warning(
          `Imported ${result.imported} of ${result.totalRows} rows. ${result.failed} failed.`,
        );
      }
    } catch (err) {
      toast.error(getApiError(err, 'Import failed. Please check the file format.'));
    } finally {
      setImportLoading(false);
    }
  };

  const userColumns: ColumnsType<UserDto> = [
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Name', key: 'name', render: (_, item) => `${item.firstName} ${item.lastName}` },
    { title: 'Role', dataIndex: 'role', key: 'role', render: (role) => <Tag>{role}</Tag> },
    {
      title: 'Department',
      dataIndex: 'departmentName',
      key: 'departmentName',
      render: (value?: string) => value || <Text type="secondary">Unassigned</Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openUserEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete user"
            description="This cannot be undone."
            okText="Delete"
            cancelText="Cancel"
            onConfirm={() => deleteUser(record.id)}
            disabled={record.role === 'ADMIN'}
          >
            <Button danger size="small" disabled={record.role === 'ADMIN'}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const departmentColumns: ColumnsType<DepartmentDto> = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { title: 'Contact', dataIndex: 'contactEmail', key: 'contactEmail' },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'default'}>{active ? 'Active' : 'Inactive'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openDepartmentEdit(record)}>
            Edit
          </Button>
          <Button size="small" onClick={() => toggleDepartmentActive(record)}>
            {record.active ? 'Deactivate' : 'Activate'}
          </Button>
          <Popconfirm
            title="Delete department"
            description="All department users will be detached from this department."
            okText="Delete"
            cancelText="Cancel"
            onConfirm={() => deleteDepartment(record.id)}
          >
            <Button danger size="small">
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const requestColumns: ColumnsType<ServiceRequestDto> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: 280,
      render: (title: string) => (
        <Text ellipsis={{ tooltip: title }} style={{ display: 'inline-block', maxWidth: 250 }}>
          {title}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status) => <Tag>{status}</Tag>,
    },
    {
      title: 'Department',
      dataIndex: 'departmentName',
      key: 'departmentName',
      width: 180,
      render: (departmentName?: string) => (
        <Text ellipsis={{ tooltip: departmentName || 'Unassigned' }}>
          {departmentName || 'Unassigned'}
        </Text>
      ),
    },
    {
      title: 'AI Review',
      dataIndex: 'misclassification',
      key: 'misclassification',
      width: 150,
      render: (misclassification: boolean) =>
        misclassification ? <Tag color="volcano">Misclassified</Tag> : <Tag>Normal</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 300,
      fixed: 'right',
      render: (_, request) => (
        <Space size={[6, 6]} wrap>
          <Button size="small" onClick={() => openAssignModal(request)}>
            Assign
          </Button>
          <Button size="small" onClick={() => openStatusModal(request)}>
            Status
          </Button>
          <Button size="small" onClick={() => navigate(`/requests/${request.id}`)}>
            Details
          </Button>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleExportSingleRequest(request.id)}
          >
            CSV
          </Button>
        </Space>
      ),
    },
  ];

  if (user?.role !== 'ADMIN') {
    return <Alert type="warning" message="Admin access only." />;
  }

  return (
    <Space direction="vertical" size={12} style={{ width: '100%', marginTop: 0 }}>
      <PageHeader
        title="Administration Console"
        subtitle="Manage all reports, users, and departments from one place."
      />

      {error && <Alert type="error" message={error} />}

      <Tabs
        items={[
          {
            key: 'requests',
            label: 'Requests',
            children: (
              <Card title={`All Reports (${requests.length})`}>
                <Space wrap style={{ marginBottom: 12 }}>
                  <Select
                    allowClear
                    placeholder="Filter by status"
                    style={{ width: 160 }}
                    options={STATUS_SELECT_OPTIONS}
                    value={reqStatus}
                    onChange={(v) => setReqStatus(v)}
                  />
                  <Select
                    allowClear
                    placeholder="Filter by department"
                    style={{ width: 200 }}
                    options={departments.map((d) => ({ value: d.id, label: d.name }))}
                    value={reqDepartment}
                    onChange={(v) => setReqDepartment(v)}
                  />
                  <Select
                    allowClear
                    placeholder="AI review"
                    style={{ width: 180 }}
                    options={MISCLASSIFICATION_FILTER_OPTIONS}
                    value={reqMisclassified}
                    onChange={(v) => setReqMisclassified(v)}
                  />
                  <Input.Search
                    placeholder="Keyword search..."
                    allowClear
                    style={{ width: 200 }}
                    onSearch={(v) => setReqKeyword(v)}
                    onChange={(e) => {
                      if (!e.target.value) {
                        setReqKeyword('');
                      }
                    }}
                  />
                  <DatePicker.RangePicker
                    value={reqDateRange}
                    onChange={(range) =>
                      setReqDateRange(range ? [range[0], range[1]] : [null, null])
                    }
                    format="YYYY-MM-DD"
                    placeholder={['From date', 'To date']}
                    allowEmpty={[true, true]}
                  />
                </Space>
                <Table
                  rowKey="id"
                  dataSource={requests}
                  columns={requestColumns}
                  loading={loading}
                  pagination={false}
                  size="small"
                  tableLayout="fixed"
                  scroll={{ x: 980, y: 420 }}
                />
              </Card>
            ),
          },
          {
            key: 'departments',
            label: 'Departments',
            children: (
              <Card
                title="Department Directory"
                extra={
                  <Button onClick={() => setNewDepartmentModalOpen(true)}>Add Department</Button>
                }
              >
                <Table
                  rowKey="id"
                  dataSource={departments}
                  columns={departmentColumns}
                  loading={loading}
                />
              </Card>
            ),
          },
          {
            key: 'users',
            label: 'Users',
            children: (
              <Card
                title="Users and Roles"
                extra={
                  <Button onClick={() => setNewEmployeeModalOpen(true)}>
                    Add Department Staff
                  </Button>
                }
              >
                <Table rowKey="id" dataSource={users} columns={userColumns} loading={loading} />
              </Card>
            ),
          },
          {
            key: 'export',
            label: 'Reports & Export',
            children: (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Card title="Administrative Report Export">
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Typography.Text type="secondary">
                      Generate a CSV report with aggregated statistics: total requests, requests by
                      department, backlog, overdue, and average response/resolution times.
                      Optionally filter by date range (based on submission date).
                    </Typography.Text>
                    <Space wrap>
                      <DatePicker.RangePicker
                        value={exportDateRange}
                        onChange={(range) =>
                          setExportDateRange(range ? [range[0], range[1]] : [null, null])
                        }
                        format="YYYY-MM-DD"
                        placeholder={['From date', 'To date']}
                        allowEmpty={[true, true]}
                      />
                      <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        loading={exportLoading}
                        onClick={handleExportReport}
                      >
                        Download Admin Report (CSV)
                      </Button>
                    </Space>
                  </Space>
                </Card>

                <Card title="Import Requests from CSV">
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <Typography.Text type="secondary">
                      Upload a CSV file to bulk-import citizen requests. Expected columns (with
                      header row): <code>title,description,address,latitude,longitude</code>. The{' '}
                      <code>title</code> and <code>description</code> columns are required; the rest
                      are optional.
                    </Typography.Text>
                    <Space wrap>
                      <input
                        type="file"
                        accept=".csv,text/csv"
                        disabled={importLoading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImport(file);
                            e.target.value = '';
                          }
                        }}
                      />
                      {importLoading && (
                        <Typography.Text type="secondary">Importing…</Typography.Text>
                      )}
                    </Space>
                    {importResult && (
                      <Space direction="vertical" size={4}>
                        <Typography.Text>
                          Result: <strong>{importResult.imported}</strong> imported,{' '}
                          <strong>{importResult.failed}</strong> failed out of{' '}
                          <strong>{importResult.totalRows}</strong> rows.
                        </Typography.Text>
                        {importResult.errors.length > 0 && (
                          <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                            {importResult.errors.map((err, i) => (
                              <li key={i}>
                                <Typography.Text type="danger">{err}</Typography.Text>
                              </li>
                            ))}
                          </ul>
                        )}
                      </Space>
                    )}
                  </Space>
                </Card>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title="Create Department"
        open={newDepartmentModalOpen}
        onCancel={() => setNewDepartmentModalOpen(false)}
        onOk={submitCreateDepartment}
        confirmLoading={saving}
      >
        <Form form={departmentForm} layout="vertical">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Name is required.' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="contactEmail" label="Contact Email">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Edit Department: ${selectedDepartment?.name ?? ''}`}
        open={editDepartmentModalOpen}
        onCancel={() => setEditDepartmentModalOpen(false)}
        onOk={submitUpdateDepartment}
        confirmLoading={saving}
      >
        <Form form={departmentForm} layout="vertical">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Name is required.' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="contactEmail" label="Contact Email">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Create Department Staff Account"
        open={newEmployeeModalOpen}
        onCancel={() => setNewEmployeeModalOpen(false)}
        onOk={submitCreateEmployee}
        confirmLoading={saving}
      >
        <Form form={employeeForm} layout="vertical">
          <Form.Item name="username" label="Username" rules={[{ required: true }]}>
            <Input placeholder="Existing citizen usernames will be upgraded to staff" />
          </Form.Item>
          <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="embg" label="EMBG">
            <Input />
          </Form.Item>
          <Form.Item name="departmentId" label="Department" rules={[{ required: true }]}>
            <Select options={departmentOptions} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Edit User${selectedManagedUser ? `: ${selectedManagedUser.username}` : ''}`}
        open={editUserModalOpen}
        onCancel={() => {
          setEditUserModalOpen(false);
          setSelectedManagedUser(null);
        }}
        onOk={submitUpdateUser}
        confirmLoading={saving}
      >
        <Form form={editUserForm} layout="vertical">
          <Form.Item name="username" label="Username" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Password">
            <Input.Password placeholder="Leave blank to keep current password" />
          </Form.Item>
          <Form.Item name="embg" label="EMBG">
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'CITIZEN', label: 'Citizen' },
                { value: 'MUNICIPAL_EMPLOYEE', label: 'Municipal Employee' },
                { value: 'ADMIN', label: 'Admin' },
              ]}
              onChange={(value: UserRole) => {
                if (value !== 'MUNICIPAL_EMPLOYEE') {
                  editUserForm.setFieldValue('departmentId', undefined);
                }
              }}
            />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prev, next) => prev.role !== next.role}
          >
            {({ getFieldValue }) =>
              getFieldValue('role') === 'MUNICIPAL_EMPLOYEE' ? (
                <Form.Item
                  name="departmentId"
                  label="Department"
                  rules={[{ required: true, message: 'Department is required.' }]}
                >
                  <Select options={departmentOptions} />
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Assign Department #${selectedRequest?.id ?? ''}`}
        open={assignModalOpen}
        onCancel={() => setAssignModalOpen(false)}
        onOk={submitAssignDepartment}
        confirmLoading={saving}
      >
        <Form form={assignForm} layout="vertical">
          <Form.Item
            name="departmentId"
            label="Department"
            rules={[{ required: true, message: 'Department is required.' }]}
          >
            <Select options={departmentOptions} />
          </Form.Item>
          <Form.Item name="note" label="Note">
            <Input.TextArea rows={3} placeholder="Optional context for assignment" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Update Status #${selectedRequest?.id ?? ''}`}
        open={statusModalOpen}
        onCancel={() => setStatusModalOpen(false)}
        onOk={submitStatusUpdate}
        confirmLoading={saving}
      >
        <Form form={statusForm} layout="vertical">
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select options={STATUS_SELECT_OPTIONS} />
          </Form.Item>
          <Form.Item name="note" label="Note">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};
