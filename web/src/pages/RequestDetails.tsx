import React, { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Form,
  Input,
  List,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Timeline,
  Typography,
  theme,
} from 'antd';
import {
  ArrowLeftOutlined,
  CommentOutlined,
  DownloadOutlined,
  EditOutlined,
  LikeOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';

import {
  adminApi,
  aiTriageApi,
  citizenApi,
  publicApi,
  staffApi,
  staffExportApi,
} from '../services/api';
import type {
  AiTriageResultDto,
  DepartmentDto,
  RequestCommentDto,
  RequestStatus,
  RequestStatusHistoryDto,
  ServiceRequestDto,
} from '../types';
import { useAuth } from '../context/AuthContext';
import { toast, getApiError } from '../utils/toast';
import { StatusTag } from '../components/StatusTag';
import { STATUS_LABELS, STATUS_SELECT_OPTIONS } from '../constants/requestStatus';
import { resolveRequestImageUrl } from '../utils/requestImages';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export const RequestDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const requestId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [request, setRequest] = useState<ServiceRequestDto | null>(null);
  const [history, setHistory] = useState<RequestStatusHistoryDto[]>([]);
  const [comments, setComments] = useState<RequestCommentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [togglingVote, setTogglingVote] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [aiTriage, setAiTriage] = useState<AiTriageResultDto | null>(null);
  const [aiTriageLoading, setAiTriageLoading] = useState(false);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [editForm] = Form.useForm<{
    title: string;
    description: string;
    address?: string;
    departmentId?: number;
    status: RequestStatus;
    note?: string;
  }>();

  const { token } = theme.useToken();

  const isCitizen = user?.role === 'CITIZEN';
  const isDepartmentUser = user?.role === 'MUNICIPAL_EMPLOYEE';
  const isAdmin = user?.role === 'ADMIN';
  const isOwnCitizenRequest = isCitizen && !!user && request?.citizenId === user.id;
  const isEditableStatus = request?.status === 'NEW' || request?.status === 'IN_REVIEW';
  const canEditRequest =
    user?.role === 'ADMIN' ||
    user?.role === 'MUNICIPAL_EMPLOYEE' ||
    (isOwnCitizenRequest && isEditableStatus);
  const canDeleteOwnRequest = isOwnCitizenRequest && isEditableStatus;

  const loadRequestData = async () => {
    if (!Number.isFinite(requestId)) {
      setError('Invalid request id.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const baseRequest = await publicApi.getRequestById(requestId, user?.id);
      setRequest(baseRequest);

      const [historyData, commentsData] = await Promise.all([
        publicApi.getRequestHistory(requestId),
        publicApi.getRequestComments(requestId),
      ]);

      setHistory(historyData);
      setComments(commentsData);
    } catch (err) {
      setError(getApiError(err, 'Failed to load request details.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    void (async () => {
      if (!Number.isFinite(requestId)) {
        if (active) {
          setError('Invalid request id.');
          setLoading(false);
        }
        return;
      }

      try {
        const baseRequest = await publicApi.getRequestById(requestId, user?.id);
        const [historyData, commentsData] = await Promise.all([
          publicApi.getRequestHistory(requestId),
          publicApi.getRequestComments(requestId),
        ]);

        if (active) {
          setRequest(baseRequest);
          setHistory(historyData);
          setComments(commentsData);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(getApiError(err, 'Failed to load request details.'));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [requestId, user?.id]);

  useEffect(() => {
    if (!isDepartmentUser || !Number.isFinite(requestId)) { return; }
    let active = true;
    const doLoad = async () => {
      setAiTriageLoading(true);
      try {
        const result = await aiTriageApi.getTriageResult(requestId);
        if (active) { setAiTriage(result); }
      } catch {
        if (active) { setAiTriage(null); }
      } finally {
        if (active) { setAiTriageLoading(false); }
      }
    };
    void doLoad();
    return () => { active = false; };
  }, [requestId, isDepartmentUser]);

  useEffect(() => {
    if (!isAdmin) { return; }

    let active = true;
    adminApi
      .getDepartments()
      .then((data) => {
        if (active) {
          setDepartments(data);
        }
      })
      .catch(() => {
        if (active) {
          setDepartments([]);
        }
      });

    return () => {
      active = false;
    };
  }, [isAdmin]);

  const handleAcceptAiSuggestion = async () => {
    if (!user || !aiTriage) {return;}
    setAiTriageLoading(true);
    try {
      await aiTriageApi.acceptSuggestion(user.id, requestId, aiTriage.suggestedDepartmentId);
      toast.success('AI suggestion accepted. Request assigned.');
      setAiTriage((prev) => (prev ? { ...prev, accepted: true } : prev));
      await loadRequestData();
    } catch (err) {
      toast.error(getApiError(err, 'Failed to accept AI suggestion.'));
    } finally {
      setAiTriageLoading(false);
    }
  };

  const handleDeclineAiSuggestion = async () => {
    if (!user || !aiTriage) {return;}
    setAiTriageLoading(true);
    try {
      await aiTriageApi.declineSuggestion(user.id, requestId);
      toast.info('AI suggestion declined. Request remains in review.');
      setAiTriage((prev) => (prev ? { ...prev, misclassification: true } : prev));
      await loadRequestData();
    } catch (err) {
      toast.error(getApiError(err, 'Failed to decline AI suggestion.'));
    } finally {
      setAiTriageLoading(false);
    }
  };

  const handleToggleVote = async () => {
    if (!user || !request) {
      toast.warning('You need to be logged in to vote.');
      return;
    }

    if (!isCitizen) {
      toast.warning('Only citizens can support requests.');
      return;
    }

    setTogglingVote(true);
    try {
      const updated = await citizenApi.toggleVote(request.id, user.id);
      setRequest(updated);
    } catch (err) {
      toast.error(getApiError(err, 'Failed to update vote.'));
    } finally {
      setTogglingVote(false);
    }
  };

  const handleAddComment = async () => {
    if (!user || !request) {
      toast.warning('You need to be logged in to comment.');
      return;
    }

    if (!isCitizen) {
      toast.warning('Department and admin comments are disabled in the details view.');
      return;
    }

    const body = commentBody.trim();
    if (!body) {
      toast.warning('Comment cannot be empty.');
      return;
    }

    setSubmittingComment(true);
    try {
      await citizenApi.addComment(user.id, request.id, body);
      setCommentBody('');
      await loadRequestData();
      toast.success('Comment added.');
    } catch (err) {
      toast.error(getApiError(err, 'Failed to add comment.'));
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!user || !request) {
      return;
    }

    try {
      if (isAdmin) {
        await adminApi.deleteComment(request.id, commentId, user.id);
      } else if (isCitizen) {
        await citizenApi.deleteOwnComment(user.id, request.id, commentId);
      } else {
        toast.warning('You do not have permission to delete this comment.');
        return;
      }
      toast.success('Comment deleted.');
      await loadRequestData();
    } catch (err) {
      toast.error(getApiError(err, 'Failed to delete comment.'));
    }
  };

  const openEditModal = () => {
    if (!request) {return;}
    editForm.setFieldsValue({
      title: request.title,
      description: request.description,
      address: request.address,
      departmentId: request.departmentId,
      status: request.status,
      note: undefined,
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!user || !request) {return;}
    const values = await editForm.validateFields();
    const nextTitle = values.title.trim();
    const nextDescription = values.description.trim();
    const nextAddress = values.address?.trim();
    const nextDepartmentId = values.departmentId;
    const nextStatus = values.status;
    const nextNote = values.note?.trim();

    const statusChanged = nextStatus !== request.status;
    const departmentReviewed =
      user.role === 'ADMIN'
      && editForm.isFieldTouched('departmentId')
      && typeof nextDepartmentId === 'number';
    const detailsChanged =
      nextTitle !== request.title ||
      nextDescription !== request.description ||
      (nextAddress || undefined) !== (request.address || undefined);

    if (!statusChanged && !detailsChanged && !departmentReviewed && !nextNote) {
      toast.info('No changes to save.');
      return;
    }

    setSavingEdit(true);

    try {
      if (user.role === 'CITIZEN') {
        await citizenApi.updateOwnRequest(user.id, request.id, {
          title: nextTitle,
          description: nextDescription,
          address: nextAddress,
        });
        toast.success('Request updated successfully.');
        setEditOpen(false);
        await loadRequestData();
        return;
      }

      if (user.role === 'ADMIN') {
        if (departmentReviewed || detailsChanged || statusChanged) {
          await adminApi.updateRequestDetails(request.id, user.id, {
            title: nextTitle,
            description: nextDescription,
            address: nextAddress,
            departmentId: departmentReviewed ? nextDepartmentId : undefined,
            status: nextStatus,
            note: nextNote,
          });
        } else if (nextNote) {
          await adminApi.updateRequestStatus(request.id, user.id, nextStatus, nextNote);
        }

        toast.success('Request updated successfully.');
        setEditOpen(false);
        await loadRequestData();
        return;
      }

      if (statusChanged || nextNote) {
        if (user.role === 'MUNICIPAL_EMPLOYEE') {
          await staffApi.updateRequestStatus(user.id, request.id, nextStatus, nextNote);
        }
      }

      if (detailsChanged) {
        const detailsPayload = {
          title: nextTitle,
          description: nextDescription,
          address: nextAddress,
        };

        if (user.role === 'MUNICIPAL_EMPLOYEE') {
          await staffApi.updateRequestDetails(user.id, request.id, detailsPayload);
        }
      }

      toast.success('Request updated successfully.');
      setEditOpen(false);
      await loadRequestData();
    } catch (err) {
      toast.error(getApiError(err, 'Failed to update request.'));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteOwnRequest = async () => {
    if (!user || !request || user.role !== 'CITIZEN') {return;}
    try {
      await citizenApi.deleteOwnRequest(user.id, request.id);
      toast.success('Request deleted.');
      navigate('/my-reports');
    } catch (err) {
      toast.error(getApiError(err, 'Failed to delete request.'));
    }
  };

  const handleAdminDeleteRequest = async () => {
    if (!user || !request || user.role !== 'ADMIN') {return;}
    try {
      await adminApi.deleteRequest(request.id, user.id);
      toast.success('Request permanently deleted.');
      navigate(-1);
    } catch (err: unknown) {
      toast.error(getApiError(err, 'Failed to delete request.'));
    }
  };

  const handleExportCsv = async () => {
    if (!user || !request) {return;}
    try {
      let blob: Blob;
      if (user.role === 'ADMIN') {
        blob = await adminApi.exportSingleRequest(request.id, user.id);
      } else {
        blob = await staffExportApi.exportSingleRequest(request.id, user.id);
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `request-${request.id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Request exported.');
    } catch (err) {
      toast.error(getApiError(err, 'Failed to export request.'));
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '42px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert type="error" message={error} />;
  }

  if (!request) {
    return <Empty description="Request not found" />;
  }

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
        Back
      </Button>

      <Card>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <Space align="center" wrap>
                <Title level={3} style={{ margin: 0 }}>
                  {request.title}
                </Title>
                <StatusTag status={request.status} />
                {isAdmin && request.misclassification && (
                  <Tag color="volcano">Misclassified</Tag>
                )}
                {isDepartmentUser && request.departmentMisclassification && (
                  <Tag color="volcano">Misclassified</Tag>
                )}
              </Space>

              <Paragraph style={{ marginBottom: 0 }}>{request.description}</Paragraph>

              <img
                src={resolveRequestImageUrl(request.imageUrl)}
                alt={request.title}
                style={{
                  width: '100%',
                  maxWidth: 360,
                  aspectRatio: '1 / 1',
                  objectFit: 'cover',
                  borderRadius: 10,
                  display: 'block',
                }}
              />

              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Request ID">#{request.id}</Descriptions.Item>
                <Descriptions.Item label="Department">
                  {request.departmentName || <Text type="secondary">Unassigned</Text>}
                </Descriptions.Item>
                <Descriptions.Item label="Address">
                  {request.address || <Text type="secondary">Not provided</Text>}
                </Descriptions.Item>
                <Descriptions.Item label="Location">
                  {request.latitude && request.longitude
                    ? `${request.latitude.toFixed(5)}, ${request.longitude.toFixed(5)}`
                    : 'No coordinates'}
                </Descriptions.Item>
                <Descriptions.Item label="Submitted by">
                  {request.submitterDisplayName || 'Citizen'}
                </Descriptions.Item>
              </Descriptions>

              <Space>
                <Button
                  icon={<LikeOutlined />}
                  onClick={handleToggleVote}
                  disabled={!isCitizen}
                  loading={togglingVote}
                >
                  {request.likedByCurrentUser ? 'Supported' : 'Support'} ({request.voteCount})
                </Button>
                {canEditRequest && (
                  <Button icon={<EditOutlined />} type="primary" onClick={openEditModal}>
                    Edit Request
                  </Button>
                )}
                {(isAdmin || isDepartmentUser) && (
                  <Button icon={<DownloadOutlined />} onClick={handleExportCsv}>
                    Export CSV
                  </Button>
                )}
                {isOwnCitizenRequest && (
                  <Popconfirm
                    title="Delete request"
                    description={
                      canDeleteOwnRequest
                        ? 'This action cannot be undone.'
                        : 'Only requests in New or In Review status can be deleted.'
                    }
                    okText="Delete"
                    okButtonProps={{ disabled: !canDeleteOwnRequest }}
                    cancelText="Cancel"
                    onConfirm={canDeleteOwnRequest ? handleDeleteOwnRequest : undefined}
                  >
                    <Button danger disabled={!canDeleteOwnRequest}>
                      Delete Request
                    </Button>
                  </Popconfirm>
                )}
                {isAdmin && (
                  <Popconfirm
                    title="Permanently delete this request?"
                    description="This will remove the request and all its history. Cannot be undone."
                    okText="Delete"
                    okType="danger"
                    cancelText="Cancel"
                    onConfirm={handleAdminDeleteRequest}
                  >
                    <Button danger>Delete (Admin)</Button>
                  </Popconfirm>
                )}
              </Space>
            </Space>
          </Col>

          <Col xs={24} lg={8}>
            <Card type="inner" title="Status Timeline">
              {history.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No history yet" />
              ) : (
                <Timeline
                  items={history.map((h) => ({
                    color: 'blue',
                    children: (
                      <div>
                        <Text strong>{STATUS_LABELS[h.newStatus]}</Text>
                        <br />
                        <Text type="secondary">
                          {h.changedAt ? new Date(h.changedAt).toLocaleString() : 'Unknown time'}
                        </Text>
                        {h.note && (
                          <>
                            <br />
                            <Text>{h.note}</Text>
                          </>
                        )}
                      </div>
                    ),
                  }))}
                />
              )}
            </Card>
          </Col>
        </Row>
      </Card>

      {isDepartmentUser &&
        aiTriage &&
        aiTriage.accepted === null &&
        !aiTriage.misclassification && (
          <Card title="Department Suggestion" extra={<Tag color="blue">Pending Review</Tag>}>
            <Space direction="vertical" size={8}>
              <Text>
                The AI suggests assigning this request to:{' '}
                <Text strong>{aiTriage.suggestedDepartmentName || 'Unknown'}</Text>
                {aiTriage.confidence !== null && (
                  <Text type="secondary">
                    {' '}
                    (confidence: {Math.round(aiTriage.confidence * 100)}%)
                  </Text>
                )}
              </Text>
              <Space>
                <Button type="primary" loading={aiTriageLoading} onClick={handleAcceptAiSuggestion}>
                  Accept
                </Button>
                <Button danger loading={aiTriageLoading} onClick={handleDeclineAiSuggestion}>
                  Decline (Mark as Misclassification)
                </Button>
              </Space>
            </Space>
          </Card>
        )}

      <Card title={`Comments (${comments.length})`}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {comments.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No comments yet" />
          ) : (
            <List
              itemLayout="vertical"
              dataSource={comments}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  style={{
                    border: `1px solid ${token.colorBorderSecondary}`,
                    background: token.colorBgElevated,
                    borderRadius: token.borderRadius,
                    padding: 14,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <Avatar
                      icon={<UserOutlined />}
                      style={{ background: token.colorPrimary, flexShrink: 0 }}
                    >
                      {item.authorUsername.slice(0, 1).toUpperCase()}
                    </Avatar>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Space size={8} wrap>
                        <Text strong>{item.authorUsername}</Text>
                        <Tag>{item.authorRole}</Tag>
                      </Space>
                      <div style={{ marginTop: 6 }}>
                        <Text style={{ whiteSpace: 'pre-wrap' }}>{item.body}</Text>
                      </div>
                    </div>
                    {(isAdmin || (isCitizen && item.authorId === user?.id)) && (
                      <Popconfirm
                        title="Delete comment"
                        description="This action cannot be undone."
                        okText="Delete"
                        cancelText="Cancel"
                        onConfirm={() => handleDeleteComment(item.id)}
                      >
                        <Button danger size="small" style={{ flexShrink: 0 }}>
                          Delete
                        </Button>
                      </Popconfirm>
                    )}
                  </div>
                </List.Item>
              )}
            />
          )}

          {isDepartmentUser ? (
            <Alert
              type="info"
              message="Department comments are disabled in details view. Use status and request edits instead."
            />
          ) : (
            <>
              <TextArea
                rows={3}
                placeholder={user ? 'Write a comment...' : 'Login to comment'}
                value={commentBody}
                disabled={!user || !isCitizen}
                onChange={(e) => setCommentBody(e.target.value)}
              />
              <Button
                type="primary"
                icon={<CommentOutlined />}
                disabled={!user || !isCitizen}
                loading={submittingComment}
                onClick={handleAddComment}
              >
                Add Comment
              </Button>
            </>
          )}
        </Space>
      </Card>

      <Modal
        title={`Edit Request #${request.id}`}
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        footer={
          user?.role === 'CITIZEN'
            ? [
                <Button key="cancel" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>,
                <Button key="save" type="primary" onClick={handleSaveEdit} loading={savingEdit}>
                  Save Changes
                </Button>,
              ]
            : [
                <Button key="cancel" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>,
                <Button key="save" type="primary" onClick={handleSaveEdit} loading={savingEdit}>
                  Save Changes
                </Button>,
              ]
        }
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input />
          </Form.Item>
          {user?.role === 'ADMIN' && (
            <Form.Item name="departmentId" label="Department">
              <Select
                allowClear
                placeholder="Keep current department"
                options={departments.map((department) => ({
                  value: department.id,
                  label: department.name,
                }))}
              />
            </Form.Item>
          )}
          {user?.role !== 'CITIZEN' && (
            <>
              <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                <Select options={STATUS_SELECT_OPTIONS} />
              </Form.Item>
              <Form.Item name="note" label="Change Note">
                <Input.TextArea rows={2} />
              </Form.Item>
            </>
          )}
          {user?.role === 'CITIZEN' && (
            <Alert
              type="info"
              showIcon
              message="You can update your report details here. Status changes are managed by municipal staff."
            />
          )}
        </Form>
      </Modal>
    </Space>
  );
};
