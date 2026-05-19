package com.citizenrequest.api.web;

import com.citizenrequest.api.config.JwtUtil;
import com.citizenrequest.api.dto.auth.LoginRequestDto;
import com.citizenrequest.api.dto.auth.LoginResponseDto;
import com.citizenrequest.api.dto.auth.RegisterRequestDto;
import com.citizenrequest.api.dto.user.UserDto;
import com.citizenrequest.api.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;
  private final JwtUtil jwtUtil;

  @PostMapping("/register")
  public UserDto register(@RequestBody RegisterRequestDto dto) {
    return authService.register(dto);
  }

  @PostMapping("/login")
  public LoginResponseDto login(@RequestBody LoginRequestDto dto) {
    UserDto user = authService.login(dto);
    String token = jwtUtil.generateToken(user.id(), user.role().name());
    return new LoginResponseDto(user, token);
  }

  @PostMapping("/logout")
  public void logout() {
    // Token is stateless — client discards it
  }
}
