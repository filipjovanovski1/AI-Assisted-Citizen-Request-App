package com.citizenrequest.api.service;

import com.citizenrequest.api.domain.Department;
import com.citizenrequest.api.domain.RequestStatus;
import com.citizenrequest.api.domain.ServiceRequest;
import com.citizenrequest.api.domain.User;
import com.citizenrequest.api.dto.request.RequestStatusHistoryDto;

import java.util.List;

public interface RequestStatusHistoryService {

    void recordChange(
            ServiceRequest serviceRequest,
            RequestStatus oldStatus,
            RequestStatus newStatus,
            Department oldDepartment,
            Department newDepartment,
            User changedBy,
            String note
    );

    List<RequestStatusHistoryDto> findPublicHistoryByRequestId(Long requestId);

    List<RequestStatusHistoryDto> findMyRequestHistory(Long requestId, Long citizenId);

    List<RequestStatusHistoryDto> findDepartmentRequestHistory(Long requestId, Long employeeId);

    List<RequestStatusHistoryDto> findAdminRequestHistory(Long requestId, Long adminId);
}