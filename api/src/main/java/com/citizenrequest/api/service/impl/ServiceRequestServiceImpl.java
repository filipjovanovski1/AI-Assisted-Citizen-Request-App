package com.citizenrequest.api.service.impl;

import com.citizenrequest.api.domain.Department;
import com.citizenrequest.api.domain.RequestStatus;
import com.citizenrequest.api.domain.ServiceRequest;
import com.citizenrequest.api.domain.User;
import com.citizenrequest.api.domain.UserRole;
import com.citizenrequest.api.dto.request.ServiceRequestDto;
import com.citizenrequest.api.dto.request.UpdateServiceRequestDto;
import com.citizenrequest.api.repository.DepartmentRepository;
import com.citizenrequest.api.repository.RequestCommentRepository;
import com.citizenrequest.api.repository.RequestStatusHistoryRepository;
import com.citizenrequest.api.repository.RequestVoteRepository;
import com.citizenrequest.api.repository.ServiceRequestRepository;
import com.citizenrequest.api.repository.UserRepository;
import com.citizenrequest.api.repository.specification.ServiceRequestSpecification;
import com.citizenrequest.api.service.AiTriageService;
import com.citizenrequest.api.service.RequestStatusHistoryService;
import com.citizenrequest.api.service.ServiceRequestService;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ServiceRequestServiceImpl implements ServiceRequestService {

  private final ServiceRequestRepository serviceRequestRepository;
  private final UserRepository userRepository;
  private final DepartmentRepository departmentRepository;
  private final RequestVoteRepository requestVoteRepository;
  private final RequestCommentRepository requestCommentRepository;
  private final RequestStatusHistoryRepository requestStatusHistoryRepository;
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
      citizen =
          userRepository
              .findById(citizenId)
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
        savedRequest, null, RequestStatus.NEW, null, null, citizen, dto.getNote());

    if (departmentRepository.count() == 0) {
      // Keep request as NEW when there are no departments to assign via AI triage.
      return mapToDto(savedRequest, citizenId);
    }

    aiTriageService.triageRequest(savedRequest.getId());

    ServiceRequest triagedRequest = findEntityById(savedRequest.getId());

    return mapToDto(triagedRequest, citizenId);
  }

  @Override
  public List<ServiceRequestDto> findPublicRequests(
      Long currentUserId,
      RequestStatus status,
      Long departmentId,
      String keyword,
      LocalDate from,
      LocalDate to) {
    Specification<ServiceRequest> spec =
        Specification.where(ServiceRequestSpecification.hasStatus(status))
            .and(ServiceRequestSpecification.hasDepartment(departmentId))
            .and(ServiceRequestSpecification.containsKeyword(keyword))
            .and(ServiceRequestSpecification.createdBetween(from, to));
    return serviceRequestRepository
        .findAll(
            spec,
            org.springframework.data.domain.Sort.by(
                org.springframework.data.domain.Sort.Direction.DESC, "id"))
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
    User citizen =
        userRepository
            .findById(citizenId)
            .orElseThrow(() -> new RuntimeException("Citizen not found."));

    if (citizen.getRole() != UserRole.CITIZEN) {
      throw new RuntimeException("Only citizens can view their submitted requests here.");
    }

    return serviceRequestRepository.findByCitizenIdOrderByIdDesc(citizenId).stream()
        .map(request -> mapToDto(request, citizenId))
        .toList();
  }

  @Override
  public ServiceRequestDto findMyRequestById(Long requestId, Long citizenId) {
    User citizen =
        userRepository
            .findById(citizenId)
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
    User employee =
        userRepository
            .findById(employeeId)
            .orElseThrow(() -> new RuntimeException("Employee not found."));

    validateMunicipalEmployee(employee);

    Long departmentId = employee.getDepartment().getId();

    return serviceRequestRepository.findByDepartmentIdOrderByIdDesc(departmentId).stream()
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
    return serviceRequestRepository
        .findById(requestId)
        .orElseThrow(() -> new RuntimeException("Service request not found."));
  }

  @Override
  @Transactional
  public ServiceRequestDto adminAssignDepartment(
      Long requestId, Long adminId, UpdateServiceRequestDto dto) {
    User admin =
        userRepository
            .findById(adminId)
            .orElseThrow(() -> new RuntimeException("Admin not found."));

    validateAdmin(admin);

    if (dto.getDepartmentId() == null) {
      throw new RuntimeException("Department id is required.");
    }

    Department newDepartment =
        departmentRepository
            .findById(dto.getDepartmentId())
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
        dto.getNote());

    return mapToDto(savedRequest, adminId);
  }

  @Override
  @Transactional
  public ServiceRequestDto adminUpdateStatus(
      Long requestId, Long adminId, UpdateServiceRequestDto dto) {
    User admin =
        userRepository
            .findById(adminId)
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
        dto.getNote());

    return mapToDto(savedRequest, adminId);
  }

  @Override
  @Transactional
  public ServiceRequestDto adminUpdateRequestDetails(
      Long requestId, Long adminId, UpdateServiceRequestDto dto) {
    User admin =
        userRepository
            .findById(adminId)
            .orElseThrow(() -> new RuntimeException("Admin not found."));

    validateAdmin(admin);

    ServiceRequest request = findEntityById(requestId);

    RequestStatus oldStatus = request.getStatus();
    Department currentDepartment = request.getDepartment();

    applyEditableFields(request, dto, true);

    ServiceRequest savedRequest = serviceRequestRepository.save(request);

    if (dto.getStatus() != null && dto.getStatus() != oldStatus) {
      requestStatusHistoryService.recordChange(
          savedRequest,
          oldStatus,
          dto.getStatus(),
          currentDepartment,
          currentDepartment,
          admin,
          dto.getNote());
    }

    return mapToDto(savedRequest, adminId);
  }

  @Override
  @Transactional
  public ServiceRequestDto departmentUpdateStatus(
      Long requestId, Long employeeId, UpdateServiceRequestDto dto) {
    User employee =
        userRepository
            .findById(employeeId)
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
        dto.getNote());

    return mapToDto(savedRequest, employeeId);
  }

  @Override
  @Transactional
  public ServiceRequestDto departmentUpdateRequestDetails(
      Long requestId, Long employeeId, UpdateServiceRequestDto dto) {
    User employee =
        userRepository
            .findById(employeeId)
            .orElseThrow(() -> new RuntimeException("Employee not found."));

    validateMunicipalEmployee(employee);

    ServiceRequest request = findEntityById(requestId);

    if (request.getDepartment() == null) {
      throw new RuntimeException("This request is not assigned to any department.");
    }

    if (!request.getDepartment().getId().equals(employee.getDepartment().getId())) {
      throw new RuntimeException("Employee can only edit requests assigned to their department.");
    }

    RequestStatus oldStatus = request.getStatus();
    Department currentDepartment = request.getDepartment();

    applyEditableFields(request, dto, false);

    ServiceRequest savedRequest = serviceRequestRepository.save(request);

    if (dto.getStatus() != null && dto.getStatus() != oldStatus) {
      requestStatusHistoryService.recordChange(
          savedRequest,
          oldStatus,
          dto.getStatus(),
          currentDepartment,
          currentDepartment,
          employee,
          dto.getNote());
    }

    return mapToDto(savedRequest, employeeId);
  }

  @Override
  @Transactional
  public ServiceRequestDto citizenUpdateRequest(
      Long requestId, Long citizenId, UpdateServiceRequestDto dto) {
    User citizen =
        userRepository
            .findById(citizenId)
            .orElseThrow(() -> new RuntimeException("Citizen not found."));
    validateCitizen(citizen);

    ServiceRequest request = findEntityById(requestId);

    if (request.getCitizen() == null || !request.getCitizen().getId().equals(citizenId)) {
      throw new RuntimeException("You can only edit your own requests.");
    }

    if (request.getStatus() != RequestStatus.NEW
        && request.getStatus() != RequestStatus.IN_REVIEW) {
      throw new RuntimeException("You can only edit requests that are in New or In Review status.");
    }

    applyEditableFields(request, dto, true);
    return mapToDto(serviceRequestRepository.save(request), citizenId);
  }

  @Override
  @Transactional
  public void citizenDeleteRequest(Long requestId, Long citizenId) {
    User citizen =
        userRepository
            .findById(citizenId)
            .orElseThrow(() -> new RuntimeException("Citizen not found."));
    validateCitizen(citizen);

    ServiceRequest request = findEntityById(requestId);

    if (request.getCitizen() == null || !request.getCitizen().getId().equals(citizenId)) {
      throw new RuntimeException("You can only delete your own requests.");
    }

    if (request.getStatus() != RequestStatus.NEW
        && request.getStatus() != RequestStatus.IN_REVIEW) {
      throw new RuntimeException(
          "You can only delete requests that are in New or In Review status.");
    }

    deleteWithDependencies(request);
  }

  @Override
  @Transactional
  public void adminDeleteRequest(Long requestId, Long adminId) {
    User admin =
        userRepository
            .findById(adminId)
            .orElseThrow(() -> new RuntimeException("Admin not found."));
    validateAdmin(admin);
    ServiceRequest request = findEntityById(requestId);
    deleteWithDependencies(request);
  }

  /** Delete all child rows first to avoid FK constraint failures, then delete the request. */
  private void deleteWithDependencies(ServiceRequest request) {
    Long id = request.getId();
    requestStatusHistoryRepository.deleteByServiceRequestId(id);
    requestCommentRepository.deleteByRequestId(id);
    requestVoteRepository.deleteByRequestId(id);
    serviceRequestRepository.delete(request);
  }

  private void applyEditableFields(
      ServiceRequest request, UpdateServiceRequestDto dto, boolean allowAnonymousChange) {
    if (dto.getTitle() != null && !dto.getTitle().isBlank()) {
      request.setTitle(dto.getTitle());
    }

    if (dto.getDescription() != null && !dto.getDescription().isBlank()) {
      request.setDescription(dto.getDescription());
    }

    if (dto.getAddress() != null) {
      request.setAddress(dto.getAddress());
    }

    if (dto.getLatitude() != null) {
      request.setLatitude(dto.getLatitude());
    }

    if (dto.getLongitude() != null) {
      request.setLongitude(dto.getLongitude());
    }

    if (dto.getImageUrl() != null) {
      request.setImageUrl(dto.getImageUrl());
    }

    if (dto.getStatus() != null) {
      request.setStatus(dto.getStatus());
    }

    if (allowAnonymousChange && dto.getAnonymousSubmission() != null) {
      request.setAnonymousSubmission(dto.getAnonymousSubmission());
    }
  }

  private ServiceRequestDto mapToDto(ServiceRequest request, Long currentUserId) {
    long voteCount = requestVoteRepository.countByRequestId(request.getId());

    boolean likedByCurrentUser =
        currentUserId != null
            && requestVoteRepository.existsByRequestIdAndUserId(request.getId(), currentUserId);

    long commentCount = requestCommentRepository.countByRequestId(request.getId());

    Long citizenId = request.getCitizen() != null ? request.getCitizen().getId() : null;

    Long departmentId = request.getDepartment() != null ? request.getDepartment().getId() : null;

    String departmentName =
        request.getDepartment() != null ? request.getDepartment().getName() : null;

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
        commentCount,
        request.getCreatedAt());
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

  private void validateCitizen(User user) {
    if (user.getRole() != UserRole.CITIZEN) {
      throw new RuntimeException("Only citizens can perform this action.");
    }
  }
}
