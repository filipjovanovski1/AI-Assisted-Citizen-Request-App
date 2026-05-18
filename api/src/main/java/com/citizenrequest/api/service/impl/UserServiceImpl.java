package com.citizenrequest.api.service.impl;

import com.citizenrequest.api.domain.Department;
import com.citizenrequest.api.domain.User;
import com.citizenrequest.api.domain.UserRole;
import com.citizenrequest.api.dto.user.UpdateUserDto;
import com.citizenrequest.api.dto.user.UserDto;
import com.citizenrequest.api.repository.DepartmentRepository;
import com.citizenrequest.api.repository.UserRepository;
import com.citizenrequest.api.service.UserService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

  private final UserRepository userRepository;
  private final DepartmentRepository departmentRepository;
  private final PasswordEncoder passwordEncoder;

  @Override
  public List<UserDto> findAll() {
    return userRepository.findAll().stream().map(this::mapToUserDto).toList();
  }

  @Override
  public UserDto findById(Long id) {
    return mapToUserDto(findEntityById(id));
  }

  @Override
  public User findEntityById(Long id) {
    return userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found."));
  }

  @Override
  public List<UserDto> findByRole(UserRole role) {
    return userRepository.findByRole(role).stream().map(this::mapToUserDto).toList();
  }

  @Override
  public List<UserDto> findByDepartmentId(Long departmentId) {
    if (!departmentRepository.existsById(departmentId)) {
      throw new RuntimeException("Department not found.");
    }

    return userRepository.findByDepartmentId(departmentId).stream()
        .map(this::mapToUserDto)
        .toList();
  }

  @Override
  public UserDto updateOwnProfile(Long userId, UpdateUserDto dto) {
    User user = findEntityById(userId);

    updateBasicProfileFields(user, dto);

    /*
     * Normal users cannot update:
     * - role
     * - department
     * - password here
     * - EMBG here
     *
     * Those fields are intentionally ignored in this method.
     */

    User savedUser = userRepository.save(user);

    return mapToUserDto(savedUser);
  }

  @Override
  public UserDto adminUpdateUser(Long userId, UpdateUserDto dto) {
    User user = findEntityById(userId);

    updateBasicProfileFields(user, dto);

    if (dto.getEmbg() != null && !dto.getEmbg().isBlank()) {
      validateEmbgForUpdate(dto.getEmbg(), user.getId());
      user.setEmbg(dto.getEmbg());
    }

    if (dto.getRole() != null) {
      Department department = resolveDepartmentForRole(dto.getRole(), dto.getDepartmentId());

      user.setRole(dto.getRole());
      user.setDepartment(department);
    }

    User savedUser = userRepository.save(user);

    return mapToUserDto(savedUser);
  }

  @Override
  public UserDto adminCreateMunicipalEmployee(UpdateUserDto dto) {
    validateRequiredForMunicipalEmployeeCreation(dto);
    String embg = normalizeOptional(dto.getEmbg());

    Department department =
        departmentRepository
            .findById(dto.getDepartmentId())
            .orElseThrow(() -> new RuntimeException("Department not found."));

    User existingUser = userRepository.findByUsername(dto.getUsername()).orElse(null);

    if (existingUser != null) {
      if (existingUser.getRole() != UserRole.CITIZEN) {
        throw new RuntimeException("Username already exists.");
      }

      if (embg != null) {
        validateEmbgForUpdate(embg, existingUser.getId());
      }

      existingUser.setFirstName(dto.getFirstName());
      existingUser.setLastName(dto.getLastName());
      existingUser.setPassword(passwordEncoder.encode(dto.getPassword()));
      existingUser.setEmbg(embg);
      existingUser.setRole(UserRole.MUNICIPAL_EMPLOYEE);
      existingUser.setDepartment(department);

      User upgradedUser = userRepository.save(existingUser);
      return mapToUserDto(upgradedUser);
    }

    if (embg != null && userRepository.existsByEmbg(embg)) {
      throw new RuntimeException("EMBG already exists.");
    }

    User employee =
        User.builder()
            .username(dto.getUsername())
            .embg(embg)
            .firstName(dto.getFirstName())
            .lastName(dto.getLastName())
            .password(passwordEncoder.encode(dto.getPassword()))
            .role(UserRole.MUNICIPAL_EMPLOYEE)
            .department(department)
            .build();

    User savedEmployee = userRepository.save(employee);

    return mapToUserDto(savedEmployee);
  }

  @Override
  public void adminDeleteUser(Long userId) {
    User user = findEntityById(userId);

    if (user.getRole() == UserRole.ADMIN) {
      throw new RuntimeException("Admin accounts cannot be deleted.");
    }

    userRepository.delete(user);
  }

  private void updateBasicProfileFields(User user, UpdateUserDto dto) {
    if (dto.getUsername() != null && !dto.getUsername().isBlank()) {
      validateUsernameForUpdate(dto.getUsername(), user.getId());
      user.setUsername(dto.getUsername());
    }

    if (dto.getFirstName() != null && !dto.getFirstName().isBlank()) {
      user.setFirstName(dto.getFirstName());
    }

    if (dto.getLastName() != null && !dto.getLastName().isBlank()) {
      user.setLastName(dto.getLastName());
    }
    if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
      user.setPassword(passwordEncoder.encode(dto.getPassword()));
    }
  }

  private void validateRequiredForMunicipalEmployeeCreation(UpdateUserDto dto) {
    if (dto.getUsername() == null || dto.getUsername().isBlank()) {
      throw new RuntimeException("Username is required.");
    }

    if (dto.getFirstName() == null || dto.getFirstName().isBlank()) {
      throw new RuntimeException("First name is required.");
    }

    if (dto.getLastName() == null || dto.getLastName().isBlank()) {
      throw new RuntimeException("Last name is required.");
    }

    if (dto.getPassword() == null || dto.getPassword().isBlank()) {
      throw new RuntimeException("Password is required.");
    }

    if (dto.getDepartmentId() == null) {
      throw new RuntimeException("Department is required for municipal employee.");
    }
  }

  private Department resolveDepartmentForRole(UserRole role, Long departmentId) {
    if (role == UserRole.MUNICIPAL_EMPLOYEE) {
      if (departmentId == null) {
        throw new RuntimeException("Municipal employee must belong to a department.");
      }

      return departmentRepository
          .findById(departmentId)
          .orElseThrow(() -> new RuntimeException("Department not found."));
    }

    if (departmentId != null) {
      throw new RuntimeException(role + " users should not be assigned to a department.");
    }

    return null;
  }

  private void validateUsernameForUpdate(String username, Long currentUserId) {
    userRepository
        .findByUsername(username)
        .ifPresent(
            existingUser -> {
              if (!existingUser.getId().equals(currentUserId)) {
                throw new RuntimeException("Username already exists.");
              }
            });
  }

  private void validateEmbgForUpdate(String embg, Long currentUserId) {
    userRepository
        .findByEmbg(embg)
        .ifPresent(
            existingUser -> {
              if (!existingUser.getId().equals(currentUserId)) {
                throw new RuntimeException("EMBG already exists.");
              }
            });
  }

  private String normalizeOptional(String value) {
    if (value == null) {
      return null;
    }

    String trimmedValue = value.trim();
    return trimmedValue.isEmpty() ? null : trimmedValue;
  }

  private UserDto mapToUserDto(User user) {
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
