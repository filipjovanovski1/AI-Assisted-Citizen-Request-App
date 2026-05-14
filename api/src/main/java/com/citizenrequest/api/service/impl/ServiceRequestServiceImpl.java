package com.citizenrequest.api.service.impl;

import lombok.RequiredArgsConstructor;
import com.citizenrequest.api.domain.Department;
import com.citizenrequest.api.domain.RequestStatus;
import com.citizenrequest.api.domain.ServiceRequest;
import com.citizenrequest.api.domain.User;
import com.citizenrequest.api.domain.UserRole;
import com.citizenrequest.api.dto.request.ServiceRequestDto;
import com.citizenrequest.api.dto.request.UpdateServiceRequestDto;
import com.citizenrequest.api.repository.DepartmentRepository;
import com.citizenrequest.api.repository.RequestCommentRepository;
import com.citizenrequest.api.repository.RequestVoteRepository;
import com.citizenrequest.api.repository.ServiceRequestRepository;
import com.citizenrequest.api.repository.UserRepository;
import com.citizenrequest.api.service.AiTriageService;
import com.citizenrequest.api.service.RequestStatusHistoryService;
import com.citizenrequest.api.service.ServiceRequestService;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ServiceRequestServiceImpl implements ServiceRequestService {

    private final ServiceRequestRepository serviceRequestRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final RequestVoteRepository requestVoteRepository;
    private final RequestCommentRepository requestCommentRepository;
    private final RequestStatusHistoryService requestStatusHistoryService;
    private final AiTriageService aiTriageService;

    @Override
    @Transactional
    public ServiceRequestDto createRequest(UpdateServiceRequestDto dto, Long citizenId) {
        ServiceRequest request = new ServiceRequest();

        request.setTitle(dto.getTitle());
        request.setDescription(dto.getDescription());
        request.setAddress(dto.getAddress());
        request.setLatitude(dto.getLatitude());
        request.setLongitude(dto.getLongitude());
        request.setImageUrl(dto.getImageUrl());
        request.setStatus(RequestStatus.NEW);
        request.setDepartment(null);

        User citizen = null;

        if (citizenId != null) {
            citizen = userRepository.findById(citizenId)
                    .orElseThrow(() -> new RuntimeException("Citizen not found."));

            if (citizen.getRole() != UserRole.CITIZEN) {
                throw new RuntimeException("Only citizens can submit citizen service requests.");
            }

            request.setCitizen(citizen);
            request.setAnonymousSubmission(Boolean.TRUE.equals(dto.getAnonymousSubmission()));
            request.setGuestDisplayName(null);
        } else {
            request.setCitizen(null);
            request.setAnonymousSubmission(true);

            if (dto.getGuestDisplayName() != null && !dto.getGuestDisplayName().isBlank()) {
                request.setGuestDisplayName(dto.getGuestDisplayName());
            } else {
                request.setGuestDisplayName("Guest");
            }
        }

        ServiceRequest savedRequest = serviceRequestRepository.save(request);

        requestStatusHistoryService.recordChange(
                savedRequest,
                null,
                RequestStatus.NEW,
                null,
                null,
                citizen,
                dto.getNote()
        );

       // return mapToDto(savedRequest, citizenId);
        aiTriageService.triageRequest(savedRequest.getId());

        ServiceRequest triagedRequest = findEntityById(savedRequest.getId());

        return mapToDto(triagedRequest, citizenId);
    }

    @Override
    public List<ServiceRequestDto> findPublicRequests(Long currentUserId) {
        return serviceRequestRepository
                .findAll(Sort.by(Sort.Direction.DESC, "id"))
                .stream()
                .map(request -> mapToDto(request, currentUserId))
                .toList();
    }

    @Override
    public ServiceRequestDto findPublicRequestById(Long requestId, Long currentUserId) {
        ServiceRequest request = findEntityById(requestId);
        return mapToDto(request, currentUserId);
    }

    @Override
    public List<ServiceRequestDto> findMyRequests(Long citizenId) {
        User citizen = userRepository.findById(citizenId)
                .orElseThrow(() -> new RuntimeException("Citizen not found."));

        if (citizen.getRole() != UserRole.CITIZEN) {
            throw new RuntimeException("Only citizens can view their submitted requests here.");
        }

        return serviceRequestRepository
                .findByCitizenIdOrderByIdDesc(citizenId)
                .stream()
                .map(request -> mapToDto(request, citizenId))
                .toList();
    }

    @Override
    public ServiceRequestDto findMyRequestById(Long requestId, Long citizenId) {
        User citizen = userRepository.findById(citizenId)
                .orElseThrow(() -> new RuntimeException("Citizen not found."));

        if (citizen.getRole() != UserRole.CITIZEN) {
            throw new RuntimeException("Only citizens can view their submitted requests here.");
        }

        ServiceRequest request = findEntityById(requestId);

        if (request.getCitizen() == null || !request.getCitizen().getId().equals(citizenId)) {
            throw new RuntimeException("This request does not belong to the selected citizen.");
        }

        return mapToDto(request, citizenId);
    }

    @Override
    public List<ServiceRequestDto> findDepartmentRequests(Long employeeId) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found."));

        validateMunicipalEmployee(employee);

        Long departmentId = employee.getDepartment().getId();

        return serviceRequestRepository
                .findByDepartmentIdOrderByIdDesc(departmentId)
                .stream()
                .map(request -> mapToDto(request, employeeId))
                .toList();
    }

    @Override
    public ServiceRequestDto findById(Long requestId, Long currentUserId) {
        ServiceRequest request = findEntityById(requestId);
        return mapToDto(request, currentUserId);
    }

    @Override
    public ServiceRequest findEntityById(Long requestId) {
        return serviceRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Service request not found."));
    }

    @Override
    @Transactional
    public ServiceRequestDto adminAssignDepartment(
            Long requestId,
            Long adminId,
            UpdateServiceRequestDto dto
    ) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found."));

        validateAdmin(admin);

        if (dto.getDepartmentId() == null) {
            throw new RuntimeException("Department id is required.");
        }

        Department newDepartment = departmentRepository.findById(dto.getDepartmentId())
                .orElseThrow(() -> new RuntimeException("Department not found."));

        ServiceRequest request = findEntityById(requestId);

        RequestStatus oldStatus = request.getStatus();
        Department oldDepartment = request.getDepartment();

        request.setDepartment(newDepartment);
        request.setStatus(RequestStatus.ASSIGNED);

        ServiceRequest savedRequest = serviceRequestRepository.save(request);

        requestStatusHistoryService.recordChange(
                savedRequest,
                oldStatus,
                RequestStatus.ASSIGNED,
                oldDepartment,
                newDepartment,
                admin,
                dto.getNote()
        );

        return mapToDto(savedRequest, adminId);
    }

    @Override
    @Transactional
    public ServiceRequestDto adminUpdateStatus(
            Long requestId,
            Long adminId,
            UpdateServiceRequestDto dto
    ) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found."));

        validateAdmin(admin);

        if (dto.getStatus() == null) {
            throw new RuntimeException("New status is required.");
        }

        ServiceRequest request = findEntityById(requestId);

        RequestStatus oldStatus = request.getStatus();
        Department currentDepartment = request.getDepartment();

        request.setStatus(dto.getStatus());

        ServiceRequest savedRequest = serviceRequestRepository.save(request);

        requestStatusHistoryService.recordChange(
                savedRequest,
                oldStatus,
                dto.getStatus(),
                currentDepartment,
                currentDepartment,
                admin,
                dto.getNote()
        );

        return mapToDto(savedRequest, adminId);
    }

    @Override
    @Transactional
    public ServiceRequestDto departmentUpdateStatus(
            Long requestId,
            Long employeeId,
            UpdateServiceRequestDto dto
    ) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found."));

        validateMunicipalEmployee(employee);

        if (dto.getStatus() == null) {
            throw new RuntimeException("New status is required.");
        }

        ServiceRequest request = findEntityById(requestId);

        if (request.getDepartment() == null) {
            throw new RuntimeException("This request is not assigned to any department.");
        }

        if (!request.getDepartment().getId().equals(employee.getDepartment().getId())) {
            throw new RuntimeException("Employee can only update requests assigned to their department.");
        }

        RequestStatus oldStatus = request.getStatus();
        Department currentDepartment = request.getDepartment();

        request.setStatus(dto.getStatus());

        ServiceRequest savedRequest = serviceRequestRepository.save(request);

        requestStatusHistoryService.recordChange(
                savedRequest,
                oldStatus,
                dto.getStatus(),
                currentDepartment,
                currentDepartment,
                employee,
                dto.getNote()
        );

        return mapToDto(savedRequest, employeeId);
    }

    private ServiceRequestDto mapToDto(ServiceRequest request, Long currentUserId) {
        long voteCount = requestVoteRepository.countByRequestId(request.getId());

        boolean likedByCurrentUser = currentUserId != null
                && requestVoteRepository.existsByRequestIdAndUserId(request.getId(), currentUserId);

        long commentCount = requestCommentRepository.countByRequestId(request.getId());

        Long citizenId = request.getCitizen() != null
                ? request.getCitizen().getId()
                : null;

        Long departmentId = request.getDepartment() != null
                ? request.getDepartment().getId()
                : null;

        String departmentName = request.getDepartment() != null
                ? request.getDepartment().getName()
                : null;

        return new ServiceRequestDto(
                request.getId(),
                request.getTitle(),
                request.getDescription(),
                request.getStatus(),
                request.getAddress(),
                request.getLatitude(),
                request.getLongitude(),
                request.getImageUrl(),
                citizenId,
                getSubmitterDisplayName(request),
                request.getAnonymousSubmission(),
                departmentId,
                departmentName,
                voteCount,
                likedByCurrentUser,
                commentCount
        );
    }

    private String getSubmitterDisplayName(ServiceRequest request) {
        if (request.getCitizen() == null) {
            return request.getGuestDisplayName() != null && !request.getGuestDisplayName().isBlank()
                    ? request.getGuestDisplayName()
                    : "Guest";
        }

        if (Boolean.TRUE.equals(request.getAnonymousSubmission())) {
            return "Anonymous";
        }

        return request.getCitizen().getUsername();
    }

    private void validateAdmin(User user) {
        if (user.getRole() != UserRole.ADMIN) {
            throw new RuntimeException("Only admins can perform this action.");
        }
    }

    private void validateMunicipalEmployee(User user) {
        if (user.getRole() != UserRole.MUNICIPAL_EMPLOYEE) {
            throw new RuntimeException("Only municipal employees can perform this action.");
        }

        if (user.getDepartment() == null) {
            throw new RuntimeException("Municipal employee must belong to a department.");
        }
    }
}