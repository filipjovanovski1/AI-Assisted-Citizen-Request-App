package com.citizenrequest.api.web;

import lombok.RequiredArgsConstructor;
import com.citizenrequest.api.dto.department.DepartmentDto;
import com.citizenrequest.api.service.DepartmentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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