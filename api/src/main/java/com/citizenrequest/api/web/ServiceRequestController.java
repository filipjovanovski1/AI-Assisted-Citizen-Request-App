package com.citizenrequest.api.web;

import com.citizenrequest.api.domain.RequestStatus;
import com.citizenrequest.api.dto.ai.AiTriageResultDto;
import com.citizenrequest.api.dto.ai.UpdateAiTriageDto;
import com.citizenrequest.api.dto.request.*;
import com.citizenrequest.api.service.AiTriageService;
import com.citizenrequest.api.service.RequestCommentService;
import com.citizenrequest.api.service.RequestStatusHistoryService;
import com.citizenrequest.api.service.RequestVoteService;
import com.citizenrequest.api.service.ServiceRequestService;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ServiceRequestController {

  private final ServiceRequestService serviceRequestService;
  private final RequestStatusHistoryService requestStatusHistoryService;
  private final RequestVoteService requestVoteService;
  private final RequestCommentService requestCommentService;
  private final AiTriageService aiTriageService;

  @GetMapping("/public/requests")
  public List<ServiceRequestDto> findPublicRequests(
      @RequestParam(required = false) Long currentUserId,
      @RequestParam(required = false) RequestStatus status,
      @RequestParam(required = false) Long departmentId,
      @RequestParam(required = false) String keyword,
      @RequestParam(required = false) LocalDate from,
      @RequestParam(required = false) LocalDate to) {
    return serviceRequestService.findPublicRequests(
        currentUserId, status, departmentId, keyword, from, to);
  }

  @GetMapping("/public/requests/{requestId}")
  public ServiceRequestDto findPublicRequestById(
      @PathVariable Long requestId, @RequestParam(required = false) Long currentUserId) {
    return serviceRequestService.findPublicRequestById(requestId, currentUserId);
  }

  @GetMapping("/public/requests/{requestId}/history")
  public List<RequestStatusHistoryDto> findPublicRequestHistory(@PathVariable Long requestId) {
    return requestStatusHistoryService.findPublicHistoryByRequestId(requestId);
  }

  @GetMapping("/public/requests/{requestId}/comments")
  public List<RequestCommentDto> findRequestComments(@PathVariable Long requestId) {
    return requestCommentService.findRequestComments(requestId);
  }

  @PostMapping("/requests")
  public ServiceRequestDto createRequest(
      @RequestBody UpdateServiceRequestDto dto, @RequestParam(required = false) Long citizenId) {
    return serviceRequestService.createRequest(dto, citizenId);
  }

  @PostMapping("/requests/{requestId}/vote")
  public ServiceRequestDto toggleVote(@PathVariable Long requestId, @RequestParam Long userId) {
    return requestVoteService.toggleVote(requestId, userId);
  }

  @GetMapping("/citizens/{citizenId}/requests/{requestId}/history")
  public List<RequestStatusHistoryDto> findMyRequestHistory(
      @PathVariable Long citizenId, @PathVariable Long requestId) {
    return requestStatusHistoryService.findMyRequestHistory(requestId, citizenId);
  }

  @GetMapping("/citizens/{citizenId}/requests")
  public List<ServiceRequestDto> findMyRequests(@PathVariable Long citizenId) {
    return serviceRequestService.findMyRequests(citizenId);
  }

  @GetMapping("/citizens/{citizenId}/requests/{requestId}")
  public ServiceRequestDto findMyRequestById(
      @PathVariable Long citizenId, @PathVariable Long requestId) {
    return serviceRequestService.findMyRequestById(requestId, citizenId);
  }

  @PutMapping("/citizens/{citizenId}/requests/{requestId}")
  public ServiceRequestDto citizenUpdateRequest(
      @PathVariable Long citizenId,
      @PathVariable Long requestId,
      @RequestBody UpdateServiceRequestDto dto) {
    return serviceRequestService.citizenUpdateRequest(requestId, citizenId, dto);
  }

  @DeleteMapping("/citizens/{citizenId}/requests/{requestId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void citizenDeleteRequest(@PathVariable Long citizenId, @PathVariable Long requestId) {
    serviceRequestService.citizenDeleteRequest(requestId, citizenId);
  }

  @GetMapping("/citizens/{citizenId}/requests/{requestId}/comments")
  public List<RequestCommentDto> findMyRequestComments(
      @PathVariable Long citizenId, @PathVariable Long requestId) {
    return requestCommentService.findMyRequestComments(requestId, citizenId);
  }

  @PostMapping("/citizens/{citizenId}/requests/{requestId}/comments")
  public RequestCommentDto addCitizenComment(
      @PathVariable Long citizenId,
      @PathVariable Long requestId,
      @RequestBody UpdateRequestCommentDto dto) {
    return requestCommentService.addCitizenComment(requestId, citizenId, dto);
  }

  @DeleteMapping("/citizens/{citizenId}/requests/{requestId}/comments/{commentId}")
  public void deleteCitizenComment(
      @PathVariable Long citizenId, @PathVariable Long requestId, @PathVariable Long commentId) {
    requestCommentService.deleteCitizenComment(requestId, commentId, citizenId);
  }

  @PostMapping("/employees/{employeeId}/requests/{requestId}/comments")
  public RequestCommentDto addDepartmentComment(
      @PathVariable Long employeeId,
      @PathVariable Long requestId,
      @RequestBody UpdateRequestCommentDto dto) {
    return requestCommentService.addDepartmentComment(requestId, employeeId, dto);
  }

  @GetMapping("/employees/{employeeId}/requests/{requestId}/history")
  public List<RequestStatusHistoryDto> findDepartmentRequestHistory(
      @PathVariable Long employeeId, @PathVariable Long requestId) {
    return requestStatusHistoryService.findDepartmentRequestHistory(requestId, employeeId);
  }

  @GetMapping("/employees/{employeeId}/requests")
  public List<ServiceRequestDto> findDepartmentRequests(@PathVariable Long employeeId) {
    return serviceRequestService.findDepartmentRequests(employeeId);
  }

  @PutMapping("/employees/{employeeId}/requests/{requestId}/status")
  public ServiceRequestDto departmentUpdateStatus(
      @PathVariable Long employeeId,
      @PathVariable Long requestId,
      @RequestBody UpdateServiceRequestDto dto) {
    return serviceRequestService.departmentUpdateStatus(requestId, employeeId, dto);
  }

  @PutMapping("/employees/{employeeId}/requests/{requestId}")
  public ServiceRequestDto departmentUpdateRequestDetails(
      @PathVariable Long employeeId,
      @PathVariable Long requestId,
      @RequestBody UpdateServiceRequestDto dto) {
    return serviceRequestService.departmentUpdateRequestDetails(requestId, employeeId, dto);
  }

  // =========================
  // AI TRIAGE
  // =========================

  @PostMapping("/requests/{requestId}/ai-triage")
  public AiTriageResultDto triageRequest(@PathVariable Long requestId) {
    return aiTriageService.triageRequest(requestId);
  }

  @GetMapping("/requests/{requestId}/ai-triage")
  public AiTriageResultDto findAiTriageByRequestId(@PathVariable Long requestId) {
    return aiTriageService.findByRequestId(requestId);
  }

  @PutMapping("/employees/{employeeId}/requests/{requestId}/ai-triage/accept")
  public AiTriageResultDto acceptSuggestedDepartment(
      @PathVariable Long employeeId,
      @PathVariable Long requestId,
      @RequestBody(required = false) UpdateAiTriageDto dto) {
    return aiTriageService.acceptSuggestedDepartment(requestId, employeeId, dto);
  }

  @PutMapping("/employees/{employeeId}/requests/{requestId}/ai-triage/decline")
  public AiTriageResultDto declineSuggestedDepartment(
      @PathVariable Long employeeId,
      @PathVariable Long requestId,
      @RequestBody(required = false) UpdateAiTriageDto dto) {
    return aiTriageService.declineSuggestedDepartment(requestId, employeeId, dto);
  }

  @PutMapping("/admin/requests/{requestId}/ai-triage/revise")
  public AiTriageResultDto adminReviseDepartment(
      @PathVariable Long requestId,
      @RequestParam Long adminId,
      @RequestBody UpdateAiTriageDto dto) {
    return aiTriageService.adminReviseDepartment(requestId, adminId, dto);
  }
}
