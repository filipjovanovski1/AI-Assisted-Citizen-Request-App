package com.citizenrequest.api.service.impl;

import com.citizenrequest.api.domain.User;
import com.citizenrequest.api.domain.UserRole;
import com.citizenrequest.api.dto.auth.LoginRequestDto;
import com.citizenrequest.api.dto.auth.RegisterRequestDto;
import com.citizenrequest.api.dto.user.UserDto;
import com.citizenrequest.api.repository.UserRepository;
import com.citizenrequest.api.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  @Override
  public UserDto register(RegisterRequestDto dto) {

    if (userRepository.existsByUsername(dto.getUsername())) {
      throw new RuntimeException("Username already exists.");
    }

    if (dto.getEmbg() != null
        && !dto.getEmbg().isBlank()
        && userRepository.existsByEmbg(dto.getEmbg())) {
      throw new RuntimeException("EMBG already exists.");
    }

    User user =
        User.builder()
            .username(dto.getUsername())
            .firstName(dto.getFirstName())
            .lastName(dto.getLastName())
            .embg(dto.getEmbg())
            .password(passwordEncoder.encode(dto.getPassword()))
            .role(UserRole.CITIZEN)
            .department(null)
            .build();

    User savedUser = userRepository.save(user);

    return mapToAuthResponse(savedUser);
  }

  @Override
  public UserDto login(LoginRequestDto dto) {

    User user =
        userRepository
            .findByUsername(dto.getUsername())
            .orElseThrow(() -> new RuntimeException("Invalid username or password."));

    if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
      throw new RuntimeException("Invalid username or password.");
    }

    return mapToAuthResponse(user);
  }

  private UserDto mapToAuthResponse(User user) {
    return new UserDto(
        user.getId(),
        user.getUsername(),
        user.getFirstName(),
        user.getLastName(),
        user.getRole(),
        user.getDepartment() != null ? user.getDepartment().getId() : null,
        user.getDepartment() != null ? user.getDepartment().getName() : null);
  }
}
