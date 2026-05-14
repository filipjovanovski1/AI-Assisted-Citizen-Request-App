package com.citizenrequest.api.service;

import com.citizenrequest.api.dto.auth.LoginRequestDto;
import com.citizenrequest.api.dto.auth.RegisterRequestDto;
import com.citizenrequest.api.dto.user.UserDto;

public interface AuthService {

  UserDto register(RegisterRequestDto dto);

  UserDto login(LoginRequestDto dto);
}
