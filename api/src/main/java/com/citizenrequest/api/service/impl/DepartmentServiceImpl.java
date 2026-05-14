package com.citizenrequest.api.service.impl;

import com.citizenrequest.api.domain.Department;
import com.citizenrequest.api.domain.User;
import com.citizenrequest.api.domain.UserRole;
import com.citizenrequest.api.dto.department.DepartmentDto;
import com.citizenrequest.api.dto.department.UpdateDepartmentDto;
import com.citizenrequest.api.repository.DepartmentRepository;
import com.citizenrequest.api.repository.UserRepository;
import com.citizenrequest.api.service.DepartmentService;
import jakarta.transaction.Transactional;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DepartmentServiceImpl implements DepartmentService {

  private final DepartmentRepository departmentRepository;
  private final UserRepository userRepository;

  @Override
  public List<DepartmentDto> findAll() {
    return departmentRepository.findAll().stream().map(this::mapToDepartmentDto).toList();
  }

  @Override
  public DepartmentDto findById(Long id) {
    return mapToDepartmentDto(findEntityById(id));
  }

  @Override
  public Department findEntityById(Long id) {
    return departmentRepository
        .findById(id)
        .orElseThrow(() -> new RuntimeException("Department not found."));
  }

  @Override
  public DepartmentDto create(UpdateDepartmentDto dto) {
    validateRequiredFields(dto);

    if (departmentRepository.existsByName(dto.getName())) {
      throw new RuntimeException("Department with this name already exists.");
    }

    Department department =
        Department.builder()
            .name(dto.getName())
            .description(dto.getDescription())
            .contactEmail(dto.getContactEmail())
            .build();

    Department savedDepartment = departmentRepository.save(department);

    return mapToDepartmentDto(savedDepartment);
  }

  @Override
  public DepartmentDto update(Long id, UpdateDepartmentDto dto) {
    Department department = findEntityById(id);

    if (dto.getName() != null && !dto.getName().isBlank()) {
      validateNameForUpdate(dto.getName(), department.getId());
      department.setName(dto.getName());
    }

    if (dto.getDescription() != null) {
      department.setDescription(dto.getDescription());
    }

    if (dto.getContactEmail() != null) {
      department.setContactEmail(dto.getContactEmail());
    }

    Department savedDepartment = departmentRepository.save(department);

    return mapToDepartmentDto(savedDepartment);
  }

  @Override
  @Transactional
  public void delete(Long id) {
    Department department = findEntityById(id);

    List<User> usersInDepartment = userRepository.findByDepartmentId(id);

    usersInDepartment.forEach(
        user -> {
          user.setRole(UserRole.CITIZEN);
          user.setDepartment(null);
        });

    userRepository.saveAll(usersInDepartment);

    departmentRepository.delete(department);
  }

  private void validateRequiredFields(UpdateDepartmentDto dto) {
    if (dto.getName() == null || dto.getName().isBlank()) {
      throw new RuntimeException("Department name is required.");
    }
  }

  private void validateNameForUpdate(String name, Long currentDepartmentId) {
    departmentRepository
        .findByName(name)
        .ifPresent(
            existingDepartment -> {
              if (!existingDepartment.getId().equals(currentDepartmentId)) {
                throw new RuntimeException("Department with this name already exists.");
              }
            });
  }

  private DepartmentDto mapToDepartmentDto(Department department) {
    return new DepartmentDto(
        department.getId(),
        department.getName(),
        department.getDescription(),
        department.getContactEmail());
  }
}
