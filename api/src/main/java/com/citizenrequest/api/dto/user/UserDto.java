package com.citizenrequest.api.dto.user;

import com.citizenrequest.api.domain.UserRole;

public record UserDto(
        Long id,
        String username,
        String firstName,
        String lastName,
        UserRole role,
        Long departmentId,
        String departmentName
) {
}