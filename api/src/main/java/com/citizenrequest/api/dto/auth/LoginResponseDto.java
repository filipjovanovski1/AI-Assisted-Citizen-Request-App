package com.citizenrequest.api.dto.auth;

import com.citizenrequest.api.dto.user.UserDto;

public record LoginResponseDto(UserDto user, String token) {}
