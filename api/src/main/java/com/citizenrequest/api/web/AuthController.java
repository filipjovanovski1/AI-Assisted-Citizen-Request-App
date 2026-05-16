package com.citizenrequest.api.web;

import com.citizenrequest.api.config.JwtUtil;
import com.citizenrequest.api.dto.auth.LoginRequestDto;
import com.citizenrequest.api.dto.auth.RegisterRequestDto;
import com.citizenrequest.api.dto.user.UserDto;
import com.citizenrequest.api.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;
  private final JwtUtil jwtUtil;

  @Value("${jwt.expiration-ms}")
  private long expirationMs;

  @PostMapping("/register")
  public UserDto register(@RequestBody RegisterRequestDto dto) {
    return authService.register(dto);
  }

  @PostMapping("/login")
  public UserDto login(@RequestBody LoginRequestDto dto, HttpServletResponse response) {
    UserDto user = authService.login(dto);
    String token = jwtUtil.generateToken(user.id(), user.role().name());
    response.setHeader(HttpHeaders.SET_COOKIE, buildJwtCookie(token).build().toString());
    return user;
  }

  @PostMapping("/logout")
  public void logout(HttpServletResponse response) {
    response.setHeader(HttpHeaders.SET_COOKIE, buildJwtCookie("").maxAge(0).build().toString());
  }

  private ResponseCookie.ResponseCookieBuilder buildJwtCookie(String value) {
    return ResponseCookie.from("jwt", value)
        .httpOnly(true)
        .path("/")
        .maxAge(expirationMs / 1000)
        .sameSite("Lax");
  }
}
