package com.citizenrequest.api.dto.request;

import com.citizenrequest.api.domain.RequestStatus;

public record ServiceRequestDto(
    Long id,
    String title,
    String description,
    RequestStatus status,
    String address,
    Double latitude,
    Double longitude,
    String imageUrl,
    Long citizenId,
    String submitterDisplayName,
    Boolean anonymousSubmission,
    Long departmentId,
    String departmentName,
    long voteCount,
    boolean likedByCurrentUser,
    long commentCount) {}
