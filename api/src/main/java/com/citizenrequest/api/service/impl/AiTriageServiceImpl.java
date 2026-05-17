package com.citizenrequest.api.service.impl;

import com.citizenrequest.api.domain.AiTriageResult;
import com.citizenrequest.api.domain.Department;
import com.citizenrequest.api.domain.RequestStatus;
import com.citizenrequest.api.domain.ServiceRequest;
import com.citizenrequest.api.domain.User;
import com.citizenrequest.api.domain.UserRole;
import com.citizenrequest.api.dto.ai.AiDepartmentPrediction;
import com.citizenrequest.api.dto.ai.AiTriageResultDto;
import com.citizenrequest.api.dto.ai.UpdateAiTriageDto;
import com.citizenrequest.api.repository.AiTriageResultRepository;
import com.citizenrequest.api.repository.DepartmentRepository;
import com.citizenrequest.api.repository.ServiceRequestRepository;
import com.citizenrequest.api.repository.UserRepository;
import com.citizenrequest.api.service.AiTriageClient;
import com.citizenrequest.api.service.AiTriageService;
import com.citizenrequest.api.service.RequestStatusHistoryService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AiTriageServiceImpl implements AiTriageService {

  private final AiTriageResultRepository aiTriageResultRepository;
  private final ServiceRequestRepository serviceRequestRepository;
  private final DepartmentRepository departmentRepository;
  private final UserRepository userRepository;
  private final RequestStatusHistoryService requestStatusHistoryService;
  private final AiTriageClient aiTriageClient;

  @Override
  @Transactional
  public AiTriageResultDto triageRequest(Long requestId) {
    ServiceRequest request = findRequestById(requestId);

    if (aiTriageResultRepository.existsByServiceRequestId(requestId)) {
      throw new RuntimeException("AI triage already exists for this request.");
    }

    List<Department> departments = departmentRepository.findAllByActiveTrue();

    AiDepartmentPrediction prediction = aiTriageClient.classify(request, departments);

    Department suggestedDepartment =
        departmentRepository
            .findById(prediction.departmentId())
            .orElseThrow(() -> new RuntimeException("Suggested department from AI was not found."));

    RequestStatus oldStatus = request.getStatus();
    Department oldDepartment = request.getDepartment();

    request.setDepartment(suggestedDepartment);
    request.setStatus(RequestStatus.IN_REVIEW);

    ServiceRequest savedRequest = serviceRequestRepository.save(request);

    AiTriageResult result =
        AiTriageResult.builder()
            .serviceRequest(savedRequest)
            .suggestedDepartment(suggestedDepartment)
            .confidence(prediction.confidence())
            .adminRevised(false)
            .accepted(null)
            .misclassification(false)
            .build();

    AiTriageResult savedResult = aiTriageResultRepository.save(result);

    requestStatusHistoryService.recordChange(
        savedRequest,
        oldStatus,
        RequestStatus.IN_REVIEW,
        oldDepartment,
        suggestedDepartment,
        null,
        "AI triage suggested department: "
            + suggestedDepartment.getName()
            + " with confidence: "
            + prediction.confidence());

    return mapToDto(savedResult);
  }

  @Override
  public AiTriageResultDto findByRequestId(Long requestId) {
    AiTriageResult result = findTriageResultByRequestId(requestId);

    return mapToDto(result);
  }

  @Override
  @Transactional
  public AiTriageResultDto acceptSuggestedDepartment(
      Long requestId, Long employeeId, UpdateAiTriageDto dto) {
    User employee = findUserById(employeeId);
    validateMunicipalEmployee(employee);

    ServiceRequest request = findRequestById(requestId);

    if (!request.getDepartment().getId().equals(employee.getDepartment().getId())) {
      throw new RuntimeException("Employee can only accept requests assigned to their department.");
    }

    AiTriageResult result = findTriageResultByRequestId(requestId);

    result.setAccepted(true);

    RequestStatus oldStatus = request.getStatus();
    Department currentDepartment = request.getDepartment();

    request.setStatus(RequestStatus.ASSIGNED);

    ServiceRequest savedRequest = serviceRequestRepository.save(request);
    AiTriageResult savedResult = aiTriageResultRepository.save(result);

    requestStatusHistoryService.recordChange(
        savedRequest,
        oldStatus,
        RequestStatus.ASSIGNED,
        currentDepartment,
        currentDepartment,
        employee,
        dto != null && dto.getNote() != null
            ? dto.getNote()
            : "Department accepted the AI triage assignment.");

    return mapToDto(savedResult);
  }

  @Override
  @Transactional
  public AiTriageResultDto declineSuggestedDepartment(
      Long requestId, Long employeeId, UpdateAiTriageDto dto) {
    User employee = findUserById(employeeId);
    validateMunicipalEmployee(employee);

    ServiceRequest request = findRequestById(requestId);

    if (!request.getDepartment().getId().equals(employee.getDepartment().getId())) {
      throw new RuntimeException(
          "Employee can only decline requests assigned to their department.");
    }

    AiTriageResult result = findTriageResultByRequestId(requestId);

    result.setAccepted(false);
    result.setMisclassification(true);

    RequestStatus oldStatus = request.getStatus();
    Department currentDepartment = request.getDepartment();

    request.setStatus(RequestStatus.IN_REVIEW);

    ServiceRequest savedRequest = serviceRequestRepository.save(request);
    AiTriageResult savedResult = aiTriageResultRepository.save(result);

    requestStatusHistoryService.recordChange(
        savedRequest,
        oldStatus,
        RequestStatus.IN_REVIEW,
        currentDepartment,
        currentDepartment,
        employee,
        dto != null && dto.getNote() != null
            ? dto.getNote()
            : "Department declined the AI triage assignment. Admin review required.");

    return mapToDto(savedResult);
  }

  @Override
  @Transactional
  public AiTriageResultDto adminReviseDepartment(
      Long requestId, Long adminId, UpdateAiTriageDto dto) {
    User admin = findUserById(adminId);
    validateAdmin(admin);

    if (dto.getDepartmentId() == null) {
      throw new RuntimeException("Department id is required.");
    }

    ServiceRequest request = findRequestById(requestId);

    Department newDepartment =
        departmentRepository
            .findById(dto.getDepartmentId())
            .orElseThrow(() -> new RuntimeException("Department not found."));

    AiTriageResult result = findTriageResultByRequestId(requestId);

    RequestStatus oldStatus = request.getStatus();
    Department oldDepartment = request.getDepartment();

    request.setDepartment(newDepartment);
    request.setStatus(RequestStatus.ASSIGNED);

    boolean changedFromAiSuggestion =
        result.getSuggestedDepartment() != null
            && !result.getSuggestedDepartment().getId().equals(newDepartment.getId());

    result.setAdminRevised(true);
    result.setMisclassification(changedFromAiSuggestion);
    result.setAccepted(!changedFromAiSuggestion);

    ServiceRequest savedRequest = serviceRequestRepository.save(request);
    AiTriageResult savedResult = aiTriageResultRepository.save(result);

    requestStatusHistoryService.recordChange(
        savedRequest,
        oldStatus,
        RequestStatus.ASSIGNED,
        oldDepartment,
        newDepartment,
        admin,
        dto.getNote() != null
            ? dto.getNote()
            : "Admin reviewed AI triage and updated the request department.");

    return mapToDto(savedResult);
  }

  private ServiceRequest findRequestById(Long requestId) {
    return serviceRequestRepository
        .findById(requestId)
        .orElseThrow(() -> new RuntimeException("Service request not found."));
  }

  private AiTriageResult findTriageResultByRequestId(Long requestId) {
    return aiTriageResultRepository
        .findByServiceRequestId(requestId)
        .orElseThrow(() -> new RuntimeException("AI triage result not found for this request."));
  }

  private User findUserById(Long userId) {
    if (userId == null) {
      throw new RuntimeException("User id is required.");
    }

    return userRepository
        .findById(userId)
        .orElseThrow(() -> new RuntimeException("User not found."));
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

  private AiTriageResultDto mapToDto(AiTriageResult result) {
    ServiceRequest request = result.getServiceRequest();
    Department suggestedDepartment = result.getSuggestedDepartment();
    Department currentDepartment = request.getDepartment();

    return new AiTriageResultDto(
        result.getId(),
        request.getId(),
        suggestedDepartment != null ? suggestedDepartment.getId() : null,
        suggestedDepartment != null ? suggestedDepartment.getName() : null,
        result.getConfidence(),
        result.getAdminRevised(),
        result.getAccepted(),
        result.getMisclassification(),
        currentDepartment != null ? currentDepartment.getId() : null,
        currentDepartment != null ? currentDepartment.getName() : null,
        request.getStatus());
  }
}
