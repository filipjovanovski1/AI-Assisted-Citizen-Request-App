package com.citizenrequest.api.dto.request;

import com.citizenrequest.api.domain.RequestStatus;
import java.time.LocalDateTime;

public record RequestStatusHistoryDto(
    Long id,
    Long serviceRequestId,
    RequestStatus oldStatus,
    RequestStatus newStatus,
    Long oldDepartmentId,
    String oldDepartmentName,
    Long newDepartmentId,
    String newDepartmentName,
    Long changedById,
    String changedByUsername,
    String note,
    LocalDateTime changedAt) {}
