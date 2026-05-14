package com.citizenrequest.api.web;

import com.citizenrequest.api.dto.department.DepartmentDto;
import com.citizenrequest.api.service.DepartmentService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
public class DepartmentController {

  private final DepartmentService departmentService;

  @GetMapping
  public List<DepartmentDto> findAll() {
    return departmentService.findAll();
  }

  @GetMapping("/{id}")
  public DepartmentDto findById(@PathVariable Long id) {
    return departmentService.findById(id);
  }
}
