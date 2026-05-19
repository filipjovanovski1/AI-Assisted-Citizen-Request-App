import axios from 'axios';
import type {
  UserDto,
  ServiceRequestDto,
  DepartmentDto,
  RequestStatusHistoryDto,
  RequestCommentDto,
  CreateRequestPayload,
  RequestStatus,
  AiTriageResultDto,
  ImportResultDto,
} from '../types';

const http = axios.create({
  baseURL: 'https://aqnsbpgyu9.execute-api.eu-west-1.amazonaws.com/api',
  withCredentials: true,
});

export const uploadApi = {
  uploadRequestImage: async (file: File): Promise<{ imageUrl: string }> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await http.post<{ imageUrl: string }>('/uploads/request-image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};

export const authApi = {
  login: async (body: { username: string; password: string }): Promise<UserDto> => {
    const { data } = await http.post<UserDto>('/auth/login', body);
    return data;
  },
  register: async (body: {
    username: string;
    firstName: string;
    lastName: string;
    embg?: string;
    password: string;
  }): Promise<UserDto> => {
    const { data } = await http.post<UserDto>('/auth/register', body);
    return data;
  },
  logout: async (): Promise<void> => {
    await http.post('/auth/logout');
  },
};

export const publicApi = {
  getRequests: async (
    currentUserId?: number,
    filters?: {
      status?: RequestStatus;
      departmentId?: number;
      misclassified?: boolean;
      keyword?: string;
      from?: string;
      to?: string;
    },
  ): Promise<ServiceRequestDto[]> => {
    const { data } = await http.get<ServiceRequestDto[]>('/public/requests', {
      params: { currentUserId, ...filters },
    });
    return data;
  },
  getRequestById: async (requestId: number, currentUserId?: number): Promise<ServiceRequestDto> => {
    const { data } = await http.get<ServiceRequestDto>(`/public/requests/${requestId}`, {
      params: currentUserId ? { currentUserId } : {},
    });
    return data;
  },
  getRequestHistory: async (requestId: number): Promise<RequestStatusHistoryDto[]> => {
    const { data } = await http.get<RequestStatusHistoryDto[]>(
      `/public/requests/${requestId}/history`,
    );
    return data;
  },
  getRequestComments: async (requestId: number): Promise<RequestCommentDto[]> => {
    const { data } = await http.get<RequestCommentDto[]>(`/public/requests/${requestId}/comments`);
    return data;
  },
};

export const departmentApi = {
  getAll: async (): Promise<DepartmentDto[]> => {
    const { data } = await http.get<DepartmentDto[]>('/departments');
    return data;
  },
};

export const citizenApi = {
  createRequest: async (
    citizenId: number,
    payload: CreateRequestPayload,
  ): Promise<ServiceRequestDto> => {
    const { data } = await http.post<ServiceRequestDto>('/requests', payload, {
      params: { citizenId },
    });
    return data;
  },
  getMyRequests: async (citizenId: number): Promise<ServiceRequestDto[]> => {
    const { data } = await http.get<ServiceRequestDto[]>(`/citizens/${citizenId}/requests`);
    return data;
  },
  getMyRequestById: async (citizenId: number, requestId: number): Promise<ServiceRequestDto> => {
    const { data } = await http.get<ServiceRequestDto>(
      `/citizens/${citizenId}/requests/${requestId}`,
    );
    return data;
  },
  getMyRequestHistory: async (
    citizenId: number,
    requestId: number,
  ): Promise<RequestStatusHistoryDto[]> => {
    const { data } = await http.get<RequestStatusHistoryDto[]>(
      `/citizens/${citizenId}/requests/${requestId}/history`,
    );
    return data;
  },
  getMyRequestComments: async (
    citizenId: number,
    requestId: number,
  ): Promise<RequestCommentDto[]> => {
    const { data } = await http.get<RequestCommentDto[]>(
      `/citizens/${citizenId}/requests/${requestId}/comments`,
    );
    return data;
  },
  updateOwnRequest: async (
    citizenId: number,
    requestId: number,
    payload: {
      title?: string;
      description?: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      imageUrl?: string;
      anonymousSubmission?: boolean;
    },
  ): Promise<ServiceRequestDto> => {
    const { data } = await http.put<ServiceRequestDto>(
      `/citizens/${citizenId}/requests/${requestId}`,
      payload,
    );
    return data;
  },
  deleteOwnRequest: async (citizenId: number, requestId: number): Promise<void> => {
    await http.delete(`/citizens/${citizenId}/requests/${requestId}`);
  },
  addComment: async (
    citizenId: number,
    requestId: number,
    body: string,
  ): Promise<RequestCommentDto> => {
    const { data } = await http.post<RequestCommentDto>(
      `/citizens/${citizenId}/requests/${requestId}/comments`,
      { body },
    );
    return data;
  },
  deleteOwnComment: async (
    citizenId: number,
    requestId: number,
    commentId: number,
  ): Promise<void> => {
    await http.delete(`/citizens/${citizenId}/requests/${requestId}/comments/${commentId}`);
  },
  toggleVote: async (requestId: number, userId: number): Promise<ServiceRequestDto> => {
    const { data } = await http.post<ServiceRequestDto>(`/requests/${requestId}/vote`, null, {
      params: { userId },
    });
    return data;
  },
};

export const userApi = {
  getProfile: async (id: number): Promise<UserDto> => {
    const { data } = await http.get<UserDto>(`/users/${id}`);
    return data;
  },
  updateProfile: async (
    id: number,
    payload: { firstName?: string; lastName?: string },
  ): Promise<UserDto> => {
    const { data } = await http.put<UserDto>(`/users/${id}/profile`, payload);
    return data;
  },
};

export const staffApi = {
  getDepartmentRequests: async (
    employeeId: number,
    filters?: {
      status?: RequestStatus;
      misclassified?: boolean;
      keyword?: string;
      from?: string;
      to?: string;
    },
  ): Promise<ServiceRequestDto[]> => {
    const { data } = await http.get<ServiceRequestDto[]>(`/employees/${employeeId}/requests`, {
      params: filters,
    });
    return data;
  },
  getDepartmentRequestHistory: async (
    employeeId: number,
    requestId: number,
  ): Promise<RequestStatusHistoryDto[]> => {
    const { data } = await http.get<RequestStatusHistoryDto[]>(
      `/employees/${employeeId}/requests/${requestId}/history`,
    );
    return data;
  },
  updateRequestStatus: async (
    employeeId: number,
    requestId: number,
    status: RequestStatus,
    note?: string,
  ): Promise<ServiceRequestDto> => {
    const { data } = await http.put<ServiceRequestDto>(
      `/employees/${employeeId}/requests/${requestId}/status`,
      { status, note },
    );
    return data;
  },
  updateRequestDetails: async (
    employeeId: number,
    requestId: number,
    payload: {
      title?: string;
      description?: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      imageUrl?: string;
      status?: RequestStatus;
      note?: string;
    },
  ): Promise<ServiceRequestDto> => {
    const { data } = await http.put<ServiceRequestDto>(
      `/employees/${employeeId}/requests/${requestId}`,
      payload,
    );
    return data;
  },
  addComment: async (
    employeeId: number,
    requestId: number,
    body: string,
  ): Promise<RequestCommentDto> => {
    const { data } = await http.post<RequestCommentDto>(
      `/employees/${employeeId}/requests/${requestId}/comments`,
      { body },
    );
    return data;
  },
};

export const adminApi = {
  getUsers: async (): Promise<UserDto[]> => {
    const { data } = await http.get<UserDto[]>('/admin/users');
    return data;
  },
  getDepartments: async (): Promise<DepartmentDto[]> => {
    const { data } = await http.get<DepartmentDto[]>('/admin/departments');
    return data;
  },
  createDepartment: async (payload: {
    name: string;
    description?: string;
    contactEmail?: string;
  }): Promise<DepartmentDto> => {
    const { data } = await http.post<DepartmentDto>('/admin/departments', payload);
    return data;
  },
  updateDepartment: async (
    id: number,
    payload: { name?: string; description?: string; contactEmail?: string },
  ): Promise<DepartmentDto> => {
    const { data } = await http.put<DepartmentDto>(`/admin/departments/${id}`, payload);
    return data;
  },
  deleteDepartment: async (id: number): Promise<void> => {
    await http.delete(`/admin/departments/${id}`);
  },
  deactivateDepartment: async (id: number): Promise<DepartmentDto> => {
    const { data } = await http.patch<DepartmentDto>(`/admin/departments/${id}/deactivate`);
    return data;
  },
  activateDepartment: async (id: number): Promise<DepartmentDto> => {
    const { data } = await http.patch<DepartmentDto>(`/admin/departments/${id}/activate`);
    return data;
  },
  createMunicipalEmployee: async (payload: {
    username: string;
    firstName: string;
    lastName: string;
    embg?: string;
    password: string;
    departmentId: number;
  }): Promise<UserDto> => {
    const { data } = await http.post<UserDto>('/admin/users/municipal-employees', payload);
    return data;
  },
  updateUser: async (
    id: number,
    payload: {
      username?: string;
      firstName?: string;
      lastName?: string;
      embg?: string;
      password?: string;
      role?: 'CITIZEN' | 'MUNICIPAL_EMPLOYEE' | 'ADMIN';
      departmentId?: number;
    },
  ): Promise<UserDto> => {
    const { data } = await http.put<UserDto>(`/admin/users/${id}`, payload);
    return data;
  },
  deleteUser: async (id: number): Promise<void> => {
    await http.delete(`/admin/users/${id}`);
  },
  getRequests: async (
    adminId: number,
    filters?: {
      status?: RequestStatus;
      departmentId?: number;
      misclassified?: boolean;
      keyword?: string;
      from?: string;
      to?: string;
    },
  ): Promise<ServiceRequestDto[]> => {
    const { data } = await http.get<ServiceRequestDto[]>('/admin/requests', {
      params: { adminId, ...filters },
    });
    return data;
  },
  assignDepartment: async (
    requestId: number,
    adminId: number,
    departmentId: number,
    note?: string,
  ): Promise<ServiceRequestDto> => {
    const { data } = await http.put<ServiceRequestDto>(
      `/admin/requests/${requestId}/assign`,
      { departmentId, note },
      { params: { adminId } },
    );
    return data;
  },
  updateRequestStatus: async (
    requestId: number,
    adminId: number,
    status: RequestStatus,
    note?: string,
  ): Promise<ServiceRequestDto> => {
    const { data } = await http.put<ServiceRequestDto>(
      `/admin/requests/${requestId}/status`,
      { status, note },
      { params: { adminId } },
    );
    return data;
  },
  updateRequestDetails: async (
    requestId: number,
    adminId: number,
    payload: {
      title?: string;
      description?: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      imageUrl?: string;
      departmentId?: number;
      status?: RequestStatus;
      note?: string;
    },
  ): Promise<ServiceRequestDto> => {
    const { data } = await http.put<ServiceRequestDto>(`/admin/requests/${requestId}`, payload, {
      params: { adminId },
    });
    return data;
  },
  deleteComment: async (requestId: number, commentId: number, adminId: number): Promise<void> => {
    await http.delete(`/admin/requests/${requestId}/comments/${commentId}`, {
      params: { adminId },
    });
  },
  deleteRequest: async (requestId: number, adminId: number): Promise<void> => {
    await http.delete(`/admin/requests/${requestId}`, { params: { adminId } });
  },
  exportReport: async (adminId: number, from?: string, to?: string): Promise<Blob> => {
    const params: Record<string, string | number> = { adminId };
    if (from) {
      params.from = from;
    }
    if (to) {
      params.to = to;
    }
    const { data } = await http.get('/admin/export/report', {
      params,
      responseType: 'blob',
    });
    return data;
  },
  exportSingleRequest: async (requestId: number, adminId: number): Promise<Blob> => {
    const { data } = await http.get(`/admin/export/requests/${requestId}`, {
      params: { adminId },
      responseType: 'blob',
    });
    return data;
  },
  importRequests: async (adminId: number, file: File): Promise<ImportResultDto> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await http.post<ImportResultDto>('/admin/import/requests', form, {
      params: { adminId },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};

export const staffExportApi = {
  exportSingleRequest: async (requestId: number, employeeId: number): Promise<Blob> => {
    const { data } = await http.get(`/employees/export/requests/${requestId}`, {
      params: { employeeId },
      responseType: 'blob',
    });
    return data;
  },
  exportDepartmentRequests: async (employeeId: number): Promise<Blob> => {
    const { data } = await http.get('/employees/export/department', {
      params: { employeeId },
      responseType: 'blob',
    });
    return data;
  },
  importRequests: async (employeeId: number, file: File): Promise<ImportResultDto> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await http.post<ImportResultDto>('/employees/import/requests', form, {
      params: { employeeId },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};

export const aiTriageApi = {
  getTriageResult: async (requestId: number): Promise<AiTriageResultDto> => {
    const { data } = await http.get<AiTriageResultDto>(`/requests/${requestId}/ai-triage`);
    return data;
  },
  acceptSuggestion: async (
    employeeId: number,
    requestId: number,
    departmentId?: number,
    note?: string,
  ): Promise<AiTriageResultDto> => {
    const { data } = await http.put<AiTriageResultDto>(
      `/employees/${employeeId}/requests/${requestId}/ai-triage/accept`,
      { departmentId, note },
    );
    return data;
  },
  declineSuggestion: async (
    employeeId: number,
    requestId: number,
    note?: string,
  ): Promise<AiTriageResultDto> => {
    const { data } = await http.put<AiTriageResultDto>(
      `/employees/${employeeId}/requests/${requestId}/ai-triage/decline`,
      { note },
    );
    return data;
  },
};

export default http;
