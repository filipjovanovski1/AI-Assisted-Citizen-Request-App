package com.citizenrequest.api.dto.auth;

import lombok.Data;

@Data
public class RegisterRequestDto {

    private String username;

    private String firstName;

    private String lastName;

    private String embg;

    private String password;
}