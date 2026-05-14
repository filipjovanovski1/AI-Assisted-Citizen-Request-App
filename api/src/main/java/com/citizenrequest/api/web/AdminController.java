package com.citizenrequest.api.web;

import lombok.RequiredArgsConstructor;
import com.citizenrequest.api.domain.UserRole;
import com.citizenrequest.api.dto.department.DepartmentDto;
import com.citizenrequest.api.dto.department.UpdateDepartmentDto;
import com.citizenrequest.api.dto.request.ServiceRequestDto;
import com.citizenrequest.api.dto.request.UpdateServiceRequestDto;
import com.citizenrequest.api.dto.user.UpdateUserDto;
import com.citizenrequest.api.dto.user.UserDto;
import com.citizenrequest.api.service.DepartmentService;
import com.citizenrequest.api.service.ServiceRequestService;
import com.citizenrequest.api.service.UserService;
import com.citizenrequest.api.dto.request.RequestStatusHistoryDto;
import com.citizenrequest.api.service.RequestStatusHistoryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;
    private final DepartmentService departmentService;
    private final ServiceRequestService serviceRequestService;
    private final RequestStatusHistoryService requestStatusHistoryService;

    // =========================
    // USERS
    // =========================

    @GetMapping("/users")
    public List<UserDto> findAll() {
        return userService.findAll();
    }

    @GetMapping("/users/{id}")
    public UserDto findById(@PathVariable Long id) {
        return userService.findById(id);
    }

    @GetMapping("/users/role/{role}")
    public List<UserDto> findByRole(@PathVariable UserRole role) {
        return userService.findByRole(role);
    }

    @GetMapping("/users/department/{departmentId}")
    public List<UserDto> findByDepartmentId(@PathVariable Long departmentId) {
        return userService.findByDepartmentId(departmentId);
    }

    @PostMapping("/users/municipal-employees")
    public UserDto createMunicipalEmployee(
            @RequestBody UpdateUserDto dto
    ) {
        return userService.adminCreateMunicipalEmployee(dto);
    }

    @PutMapping("/users/{id}")
    public UserDto adminUpdateUser(
            @PathVariable Long id,
            @RequestBody UpdateUserDto dto
    ) {
        return userService.adminUpdateUser(id, dto);
    }

    // =========================
    // DEPARTMENTS
    // =========================

    @GetMapping("/departments")
    public List<DepartmentDto> findAllDepartments() {
        return departmentService.findAll();
    }

    @GetMapping("/departments/{id}")
    public DepartmentDto findDepartmentById(@PathVariable Long id) {
        return departmentService.findById(id);
    }

    @PostMapping("/departments")
    public DepartmentDto createDepartment(@RequestBody UpdateDepartmentDto dto) {
        return departmentService.create(dto);
    }

    @PutMapping("/departments/{id}")
    public DepartmentDto updateDepartment(
            @PathVariable Long id,
            @RequestBody UpdateDepartmentDto dto
    ) {
        return departmentService.update(id, dto);
    }

    @DeleteMapping("/departments/{id}")
    public void deleteDepartment(@PathVariable Long id) {
        departmentService.delete(id);
    }

    // =========================
    // REQUESTS
    // =========================

    @GetMapping("/requests")
    public List<ServiceRequestDto> findAllRequests(
            @RequestParam(required = false) Long adminId
    ) {
        return serviceRequestService.findPublicRequests(adminId);
    }

    @GetMapping("/requests/{requestId}")
    public ServiceRequestDto findRequestById(
            @PathVariable Long requestId,
            @RequestParam(required = false) Long adminId
    ) {
        return serviceRequestService.findById(requestId, adminId);
    }

    @GetMapping("/requests/{requestId}/history")
    public List<RequestStatusHistoryDto> findAdminRequestHistory(
            @PathVariable Long requestId,
            @RequestParam Long adminId
    ) {
        return requestStatusHistoryService.findAdminRequestHistory(requestId, adminId);
    }

    @PutMapping("/requests/{requestId}/assign")
    public ServiceRequestDto assignDepartment(
            @PathVariable Long requestId,
            @RequestParam Long adminId,
            @RequestBody UpdateServiceRequestDto dto
    ) {
        return serviceRequestService.adminAssignDepartment(requestId, adminId, dto);
    }

    @PutMapping("/requests/{requestId}/status")
    public ServiceRequestDto updateRequestStatus(
            @PathVariable Long requestId,
            @RequestParam Long adminId,
            @RequestBody UpdateServiceRequestDto dto
    ) {
        return serviceRequestService.adminUpdateStatus(requestId, adminId, dto);
    }
}