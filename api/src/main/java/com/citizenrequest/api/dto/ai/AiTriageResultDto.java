package com.citizenrequest.api.dto.ai;

import com.citizenrequest.api.domain.RequestStatus;

public record AiTriageResultDto(
    Long id,
    Long serviceRequestId,
    Long suggestedDepartmentId,
    String suggestedDepartmentName,
    Double confidence,
    Boolean adminRevised,
    Boolean accepted,
    Boolean misclassification,
    Long currentDepartmentId,
    String currentDepartmentName,
    RequestStatus currentRequestStatus) {}
