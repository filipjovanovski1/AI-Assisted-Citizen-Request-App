import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Form, Input, Modal, Select, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';

import type { RequestStatus, ServiceRequestDto } from '../types';
import { useAuth } from '../context/AuthContext';
import { toast, getApiError } from '../utils/toast';
import { staffApi } from '../services/api';
import { RequestMapDashboard } from '../components/RequestMapDashboard';
import { PageHeader } from '../components/PageHeader';
import { STATUS_OPTIONS, STATUS_LABELS } from '../constants/requestStatus';

export const StaffDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequestDto | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [statusForm] = Form.useForm<{ status: RequestStatus; note?: string }>();
  const [commentForm] = Form.useForm<{ body: string }>();

  const loadRequests = useCallback(async () => {
    if (!user) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await staffApi.getDepartmentRequests(user.id);
      setRequests(data);
    } catch (err) {
      setError(getApiError(err, 'Failed to load department requests.'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.role !== 'MUNICIPAL_EMPLOYEE') {
      return;
    }
    let active = true;
    const doLoad = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await staffApi.getDepartmentRequests(user.id);
        if (active) {
          setRequests(data);
        }
      } catch (err) {
        if (active) {
          setError(getApiError(err, 'Failed to load department requests.'));
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
  }, [user?.id, user?.role]);

  const openStatusModal = (request: ServiceRequestDto) => {
    setSelectedRequest(request);
    statusForm.setFieldsValue({ status: request.status });
    setStatusModalOpen(true);
  };

  const openCommentModal = (request: ServiceRequestDto) => {
    setSelectedRequest(request);
    commentForm.resetFields();
    setCommentModalOpen(true);
  };

  const submitStatus = async () => {
    if (!user || !selectedRequest) {
      return;
    }
    const values = await statusForm.validateFields();
    setSaving(true);
    try {
      await staffApi.updateRequestStatus(user.id, selectedRequest.id, values.status, values.note);
      toast.success('Status updated successfully.');
      setStatusModalOpen(false);
      await loadRequests();
    } catch (err) {
      toast.error(getApiError(err, 'Failed to update status.'));
    } finally {
      setSaving(false);
    }
  };

  const submitComment = async () => {
    if (!user || !selectedRequest) {
      return;
    }
    const values = await commentForm.validateFields();
    setSaving(true);
    try {
      await staffApi.addComment(user.id, selectedRequest.id, values.body);
      toast.success('Note added successfully.');
      setCommentModalOpen(false);
    } catch (err) {
      toast.error(getApiError(err, 'Failed to add note.'));
    } finally {
      setSaving(false);
    }
  };

  const actionColumns: ColumnsType<ServiceRequestDto> = [
    { title: 'Address', dataIndex: 'address', key: 'address' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, request) => (
        <Space>
          <Button size="small" onClick={() => openStatusModal(request)}>
            Update Status
          </Button>
          <Button size="small" onClick={() => openCommentModal(request)}>
            Add Note
          </Button>
          <Button size="small" onClick={() => navigate(`/requests/${request.id}`)}>
            View / Edit
          </Button>
        </Space>
      ),
    },
  ];

  if (user?.role !== 'MUNICIPAL_EMPLOYEE') {
    return <Alert type="warning" message="Department access only." />;
  }

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <PageHeader
        title="Department Dashboard"
        subtitle="Only requests assigned to your department are visible here."
      />

      <RequestMapDashboard
        requests={requests}
        loading={loading}
        error={error}
        extraColumns={actionColumns}
        showDepartmentColumn={false}
        tableTitle="Assigned Requests"
      />

      <Modal
        title={`Update Status #${selectedRequest?.id ?? ''}`}
        open={statusModalOpen}
        onCancel={() => setStatusModalOpen(false)}
        onOk={submitStatus}
        confirmLoading={saving}
      >
        <Form form={statusForm} layout="vertical">
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select
              options={STATUS_OPTIONS.map((status) => ({
                value: status,
                label: STATUS_LABELS[status],
              }))}
            />
          </Form.Item>
          <Form.Item name="note" label="Note">
            <Input.TextArea rows={3} placeholder="Optional context for this status change" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Add Note #${selectedRequest?.id ?? ''}`}
        open={commentModalOpen}
        onCancel={() => setCommentModalOpen(false)}
        onOk={submitComment}
        confirmLoading={saving}
      >
        <Form form={commentForm} layout="vertical">
          <Form.Item
            name="body"
            label="Note"
            rules={[{ required: true, message: 'Note is required.' }]}
          >
            <Input.TextArea rows={4} placeholder="Add operational note for this request" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};
