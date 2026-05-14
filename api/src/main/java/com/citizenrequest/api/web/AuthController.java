package com.citizenrequest.api.web;

import lombok.RequiredArgsConstructor;
import com.citizenrequest.api.dto.user.UserDto;
import com.citizenrequest.api.dto.auth.LoginRequestDto;
import com.citizenrequest.api.dto.auth.RegisterRequestDto;
import com.citizenrequest.api.service.AuthService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public UserDto register(@RequestBody RegisterRequestDto dto) {
        return authService.register(dto);
    }

    @PostMapping("/login")
    public UserDto login(@RequestBody LoginRequestDto dto) {
        return authService.login(dto);
    }
}