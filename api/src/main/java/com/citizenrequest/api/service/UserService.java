package com.citizenrequest.api.service;

import com.citizenrequest.api.domain.User;
import com.citizenrequest.api.domain.UserRole;
import com.citizenrequest.api.dto.user.UpdateUserDto;
import com.citizenrequest.api.dto.user.UserDto;
import java.util.List;

public interface UserService {

  List<UserDto> findAll();

  UserDto findById(Long id);

  User findEntityById(Long id);

  List<UserDto> findByRole(UserRole role);

  List<UserDto> findByDepartmentId(Long departmentId);

  UserDto updateOwnProfile(Long userId, UpdateUserDto dto);

  UserDto adminUpdateUser(Long userId, UpdateUserDto dto);

  UserDto adminCreateMunicipalEmployee(UpdateUserDto dto);

  void adminDeleteUser(Long userId);
}
