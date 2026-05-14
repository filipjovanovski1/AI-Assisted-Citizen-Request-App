package com.citizenrequest.api.dto.request;

import com.citizenrequest.api.domain.UserRole;

public record RequestCommentDto(
    Long id,
    Long requestId,
    Long authorId,
    String authorUsername,
    UserRole authorRole,
    String body) {}
