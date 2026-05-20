package com.citizenrequest.api.service;

import com.citizenrequest.api.domain.RequestStatus;
import com.citizenrequest.api.domain.ServiceRequest;
import com.citizenrequest.api.dto.request.ServiceRequestDto;
import com.citizenrequest.api.dto.request.UpdateServiceRequestDto;
import java.time.LocalDate;
import java.util.List;

public interface ServiceRequestService {

  ServiceRequestDto createRequest(UpdateServiceRequestDto dto, Long citizenId);

  List<ServiceRequestDto> findPublicRequests(
      Long currentUserId,
      RequestStatus status,
      Long departmentId,
      Boolean misclassified,
      String keyword,
      LocalDate from,
      LocalDate to);

  ServiceRequestDto findPublicRequestById(Long requestId, Long currentUserId);

  List<ServiceRequestDto> findMyRequests(Long citizenId);

  ServiceRequestDto findMyRequestById(Long requestId, Long citizenId);

  List<ServiceRequestDto> findDepartmentRequests(
      Long employeeId,
      RequestStatus status,
      Boolean misclassified,
      String keyword,
      LocalDate from,
      LocalDate to);

  ServiceRequestDto findById(Long requestId, Long currentUserId);

  ServiceRequest findEntityById(Long requestId);

  ServiceRequestDto adminAssignDepartment(
      Long requestId, Long adminId, UpdateServiceRequestDto dto);

  ServiceRequestDto adminUpdateStatus(Long requestId, Long adminId, UpdateServiceRequestDto dto);

  ServiceRequestDto adminUpdateRequestDetails(
      Long requestId, Long adminId, UpdateServiceRequestDto dto);

  ServiceRequestDto departmentUpdateStatus(
      Long requestId, Long employeeId, UpdateServiceRequestDto dto);

  ServiceRequestDto departmentUpdateRequestDetails(
      Long requestId, Long employeeId, UpdateServiceRequestDto dto);

  ServiceRequestDto citizenUpdateRequest(
      Long requestId, Long citizenId, UpdateServiceRequestDto dto);

  void citizenDeleteRequest(Long requestId, Long citizenId);

  void adminDeleteRequest(Long requestId, Long adminId);
}
