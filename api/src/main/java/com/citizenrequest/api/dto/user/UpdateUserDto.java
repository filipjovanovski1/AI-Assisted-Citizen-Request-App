package com.citizenrequest.api.dto.user;

import lombok.Data;
import com.citizenrequest.api.domain.UserRole;

@Data
public class UpdateUserDto {

    private String username;

    private String embg;

    private String firstName;

    private String lastName;

    private String password;

    private UserRole role;

    private Long departmentId;
}