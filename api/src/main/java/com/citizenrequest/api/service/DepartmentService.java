package com.citizenrequest.api.service;

import com.citizenrequest.api.domain.Department;
import com.citizenrequest.api.dto.department.DepartmentDto;
import com.citizenrequest.api.dto.department.UpdateDepartmentDto;

import java.util.List;

public interface DepartmentService {

    List<DepartmentDto> findAll();

    DepartmentDto findById(Long id);

    Department findEntityById(Long id);

    DepartmentDto create(UpdateDepartmentDto dto);

    DepartmentDto update(Long id, UpdateDepartmentDto dto);

    void delete(Long id);
}