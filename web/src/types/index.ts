export type UserRole = 'CITIZEN' | 'MUNICIPAL_EMPLOYEE' | 'ADMIN';

export type RequestStatus =
  | 'NEW'
  | 'IN_REVIEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED';

export interface UserDto {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  departmentId?: number;
  departmentName?: string;
}

export interface DepartmentDto {
  id: number;
  name: string;
  description?: string;
  contactEmail?: string;
  active: boolean;
}

export interface ServiceRequestDto {
  id: number;
  title: string;
  description: string;
  status: RequestStatus;
  address?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  citizenId?: number;
  submitterDisplayName?: string;
  anonymousSubmission: boolean;
  departmentId?: number;
  departmentName?: string;
  voteCount: number;
  likedByCurrentUser: boolean;
  commentCount: number;
  createdAt?: string;
}

export interface RequestStatusHistoryDto {
  id: number;
  serviceRequestId: number;
  oldStatus?: RequestStatus;
  newStatus: RequestStatus;
  oldDepartmentId?: number;
  oldDepartmentName?: string;
  newDepartmentId?: number;
  newDepartmentName?: string;
  changedById?: number;
  changedByUsername?: string;
  note?: string;
  changedAt?: string;
}

export interface RequestCommentDto {
  id: number;
  requestId: number;
  authorId: number;
  authorUsername: string;
  authorRole: UserRole;
  body: string;
}

export interface CreateRequestPayload {
  title: string;
  description: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  anonymousSubmission?: boolean;
}

export interface AiTriageResultDto {
  id: number;
  serviceRequestId: number;
  suggestedDepartmentId?: number;
  suggestedDepartmentName?: string;
  confidence?: number;
  adminRevised: boolean;
  accepted?: boolean;
  misclassification: boolean;
  currentDepartmentId?: number;
  currentDepartmentName?: string;
  currentRequestStatus?: RequestStatus;
}

export interface ImportResultDto {
  totalRows: number;
  imported: number;
  failed: number;
  errors: string[];
}
