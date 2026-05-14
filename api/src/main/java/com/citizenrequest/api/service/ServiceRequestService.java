package com.citizenrequest.api.service;

import com.citizenrequest.api.domain.ServiceRequest;
import com.citizenrequest.api.dto.request.ServiceRequestDto;
import com.citizenrequest.api.dto.request.UpdateServiceRequestDto;

import java.util.List;

public interface ServiceRequestService {

    ServiceRequestDto createRequest(UpdateServiceRequestDto dto, Long citizenId);

    List<ServiceRequestDto> findPublicRequests(Long currentUserId);

    ServiceRequestDto findPublicRequestById(Long requestId, Long currentUserId);

    List<ServiceRequestDto> findMyRequests(Long citizenId);

    ServiceRequestDto findMyRequestById(Long requestId, Long citizenId);

    List<ServiceRequestDto> findDepartmentRequests(Long employeeId);

    ServiceRequestDto findById(Long requestId, Long currentUserId);

    ServiceRequest findEntityById(Long requestId);

    ServiceRequestDto adminAssignDepartment(Long requestId, Long adminId, UpdateServiceRequestDto dto);

    ServiceRequestDto adminUpdateStatus(Long requestId, Long adminId, UpdateServiceRequestDto dto);

    ServiceRequestDto departmentUpdateStatus(Long requestId, Long employeeId, UpdateServiceRequestDto dto);
}