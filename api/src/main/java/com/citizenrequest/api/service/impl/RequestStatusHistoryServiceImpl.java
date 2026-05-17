package com.citizenrequest.api.service.impl;

import com.citizenrequest.api.domain.Department;
import com.citizenrequest.api.domain.RequestStatus;
import com.citizenrequest.api.domain.RequestStatusHistory;
import com.citizenrequest.api.domain.ServiceRequest;
import com.citizenrequest.api.domain.User;
import com.citizenrequest.api.domain.UserRole;
import com.citizenrequest.api.dto.request.RequestStatusHistoryDto;
import com.citizenrequest.api.repository.RequestStatusHistoryRepository;
import com.citizenrequest.api.repository.ServiceRequestRepository;
import com.citizenrequest.api.repository.UserRepository;
import com.citizenrequest.api.service.RequestStatusHistoryService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RequestStatusHistoryServiceImpl implements RequestStatusHistoryService {

  private final RequestStatusHistoryRepository requestStatusHistoryRepository;
  private final ServiceRequestRepository serviceRequestRepository;
  private final UserRepository userRepository;

  @Override
  @Transactional
  public void recordChange(
      ServiceRequest serviceRequest,
      RequestStatus oldStatus,
      RequestStatus newStatus,
      Department oldDepartment,
      Department newDepartment,
      User changedBy,
      String note) {
    RequestStatusHistory history = new RequestStatusHistory();

    history.setServiceRequest(serviceRequest);
    history.setOldStatus(oldStatus);
    history.setNewStatus(newStatus);
    history.setOldDepartment(oldDepartment);
    history.setNewDepartment(newDepartment);
    history.setChangedBy(changedBy);
    history.setNote(note);
    history.setChangedAt(java.time.LocalDateTime.now());

    requestStatusHistoryRepository.save(history);
  }

  @Override
  public List<RequestStatusHistoryDto> findPublicHistoryByRequestId(Long requestId) {
    ServiceRequest request = findRequestById(requestId);

    return requestStatusHistoryRepository
        .findByServiceRequestIdOrderByChangedAtAsc(request.getId())
        .stream()
        .map(this::mapToDto)
        .toList();
  }

  @Override
  public List<RequestStatusHistoryDto> findMyRequestHistory(Long requestId, Long citizenId) {
    User citizen =
        userRepository
            .findById(citizenId)
            .orElseThrow(() -> new RuntimeException("Citizen not found."));

    if (citizen.getRole() != UserRole.CITIZEN) {
      throw new RuntimeException("Only citizens can view their request history here.");
    }

    ServiceRequest request = findRequestById(requestId);

    if (request.getCitizen() == null || !request.getCitizen().getId().equals(citizenId)) {
      throw new RuntimeException("This request does not belong to the selected citizen.");
    }

    return requestStatusHistoryRepository
        .findByServiceRequestIdOrderByChangedAtAsc(requestId)
        .stream()
        .map(this::mapToDto)
        .toList();
  }

  @Override
  public List<RequestStatusHistoryDto> findDepartmentRequestHistory(
      Long requestId, Long employeeId) {
    User employee =
        userRepository
            .findById(employeeId)
            .orElseThrow(() -> new RuntimeException("Employee not found."));

    validateMunicipalEmployee(employee);

    ServiceRequest request = findRequestById(requestId);

    if (request.getDepartment() == null) {
      throw new RuntimeException("This request is not assigned to any department.");
    }

    if (!request.getDepartment().getId().equals(employee.getDepartment().getId())) {
      throw new RuntimeException(
          "Employee can only view history for requests assigned to their department.");
    }

    return requestStatusHistoryRepository
        .findByServiceRequestIdOrderByChangedAtAsc(requestId)
        .stream()
        .map(this::mapToDto)
        .toList();
  }

  @Override
  public List<RequestStatusHistoryDto> findAdminRequestHistory(Long requestId, Long adminId) {
    User admin =
        userRepository
            .findById(adminId)
            .orElseThrow(() -> new RuntimeException("Admin not found."));

    validateAdmin(admin);

    ServiceRequest request = findRequestById(requestId);

    return requestStatusHistoryRepository
        .findByServiceRequestIdOrderByChangedAtAsc(request.getId())
        .stream()
        .map(this::mapToDto)
        .toList();
  }

  private ServiceRequest findRequestById(Long requestId) {
    return serviceRequestRepository
        .findById(requestId)
        .orElseThrow(() -> new RuntimeException("Service request not found."));
  }

  private RequestStatusHistoryDto mapToDto(RequestStatusHistory history) {
    Department oldDepartment = history.getOldDepartment();
    Department newDepartment = history.getNewDepartment();
    User changedBy = history.getChangedBy();

    return new RequestStatusHistoryDto(
        history.getId(),
        history.getServiceRequest().getId(),
        history.getOldStatus(),
        history.getNewStatus(),
        oldDepartment != null ? oldDepartment.getId() : null,
        oldDepartment != null ? oldDepartment.getName() : null,
        newDepartment != null ? newDepartment.getId() : null,
        newDepartment != null ? newDepartment.getName() : null,
        changedBy != null ? changedBy.getId() : null,
        changedBy != null ? changedBy.getUsername() : null,
        history.getNote(),
        history.getChangedAt());
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
