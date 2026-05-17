package com.citizenrequest.api.service.impl;

import com.citizenrequest.api.domain.AiTriageResult;
import com.citizenrequest.api.domain.RequestStatus;
import com.citizenrequest.api.domain.RequestStatusHistory;
import com.citizenrequest.api.domain.ServiceRequest;
import com.citizenrequest.api.domain.User;
import com.citizenrequest.api.domain.UserRole;
import com.citizenrequest.api.repository.AiTriageResultRepository;
import com.citizenrequest.api.repository.RequestStatusHistoryRepository;
import com.citizenrequest.api.repository.ServiceRequestRepository;
import com.citizenrequest.api.repository.UserRepository;
import com.citizenrequest.api.service.ExportService;
import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.OptionalDouble;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ExportServiceImpl implements ExportService {

  private final ServiceRequestRepository serviceRequestRepository;
  private final RequestStatusHistoryRepository requestStatusHistoryRepository;
  private final AiTriageResultRepository aiTriageResultRepository;
  private final UserRepository userRepository;

  @Override
  @Transactional(readOnly = true)
  public byte[] exportAdminReport(Long adminId, LocalDate from, LocalDate to) {
    User admin =
        userRepository
            .findById(adminId)
            .orElseThrow(() -> new RuntimeException("Admin not found."));

    if (admin.getRole() != UserRole.ADMIN) {
      throw new RuntimeException("Only admins can export reports.");
    }

    List<ServiceRequest> allRequests = serviceRequestRepository.findAll();
    List<RequestStatusHistory> allHistory = requestStatusHistoryRepository.findAll();

    Map<Long, List<RequestStatusHistory>> historyByRequest =
        allHistory.stream().collect(Collectors.groupingBy(h -> h.getServiceRequest().getId()));

    List<ServiceRequest> filtered =
        allRequests.stream()
            .filter(
                r -> {
                  if (from == null && to == null) return true;
                  LocalDateTime submittedAt = r.getCreatedAt();
                  if (submittedAt == null) return true;
                  LocalDate submissionDate = submittedAt.toLocalDate();
                  if (from != null && submissionDate.isBefore(from)) return false;
                  if (to != null && submissionDate.isAfter(to)) return false;
                  return true;
                })
            .toList();

    int total = filtered.size();

    Map<String, Long> byDepartment =
        filtered.stream()
            .collect(
                Collectors.groupingBy(
                    r -> r.getDepartment() != null ? r.getDepartment().getName() : "Unassigned",
                    Collectors.counting()));

    long unresolved =
        filtered.stream()
            .filter(
                r ->
                    r.getStatus() != RequestStatus.RESOLVED
                        && r.getStatus() != RequestStatus.CLOSED)
            .count();

    LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
    long overdue =
        filtered.stream()
            .filter(
                r ->
                    r.getStatus() != RequestStatus.RESOLVED
                        && r.getStatus() != RequestStatus.CLOSED)
            .filter(r -> r.getCreatedAt() != null && r.getCreatedAt().isBefore(thirtyDaysAgo))
            .count();

    OptionalDouble avgFirstResponse =
        filtered.stream()
            .mapToLong(
                r -> {
                  List<RequestStatusHistory> hist =
                      historyByRequest.getOrDefault(r.getId(), List.of());
                  Optional<RequestStatusHistory> firstChange =
                      hist.stream()
                          .filter(
                              h ->
                                  h.getOldStatus() == RequestStatus.NEW && h.getChangedAt() != null)
                          .min(Comparator.comparing(RequestStatusHistory::getChangedAt));
                  LocalDateTime submittedAt = r.getCreatedAt();
                  if (firstChange.isPresent() && submittedAt != null) {
                    return Duration.between(submittedAt, firstChange.get().getChangedAt())
                        .toHours();
                  }
                  return -1L;
                })
            .filter(v -> v >= 0)
            .average();

    OptionalDouble avgResolution =
        filtered.stream()
            .mapToLong(
                r -> {
                  List<RequestStatusHistory> hist =
                      historyByRequest.getOrDefault(r.getId(), List.of());
                  Optional<RequestStatusHistory> resolved =
                      hist.stream()
                          .filter(
                              h ->
                                  (h.getNewStatus() == RequestStatus.RESOLVED
                                          || h.getNewStatus() == RequestStatus.CLOSED)
                                      && h.getChangedAt() != null)
                          .min(Comparator.comparing(RequestStatusHistory::getChangedAt));
                  LocalDateTime submittedAt = r.getCreatedAt();
                  if (resolved.isPresent() && submittedAt != null) {
                    return Duration.between(submittedAt, resolved.get().getChangedAt()).toHours();
                  }
                  return -1L;
                })
            .filter(v -> v >= 0)
            .average();

    LocalDateTime generatedAt = LocalDateTime.now();

    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    PrintWriter pw = new PrintWriter(baos, true, StandardCharsets.UTF_8);

    pw.println("ADMINISTRATIVE REPORT");
    pw.println("Generated at: " + generatedAt);
    if (from != null || to != null) {
      pw.println(
          "Period: " + (from != null ? from : "Start") + " to " + (to != null ? to : "Today"));
    }
    pw.println();
    pw.println("SUMMARY");
    pw.println("Metric,Value");
    pw.println("Total Requests," + total);
    pw.println("Unresolved (Backlog)," + unresolved);
    pw.println("Overdue (>30 days unresolved)," + overdue);
    pw.println(
        "Average First Response (hours),"
            + (avgFirstResponse.isPresent()
                ? String.format("%.1f", avgFirstResponse.getAsDouble())
                : "N/A"));
    pw.println(
        "Average Resolution Time (hours),"
            + (avgResolution.isPresent()
                ? String.format("%.1f", avgResolution.getAsDouble())
                : "N/A"));
    pw.println();
    pw.println("REQUESTS BY DEPARTMENT");
    pw.println("Department,Count");
    byDepartment.entrySet().stream()
        .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
        .forEach(e -> pw.println(csvEscape(e.getKey()) + "," + e.getValue()));

    pw.flush();
    return baos.toByteArray();
  }

  @Override
  @Transactional(readOnly = true)
  public byte[] exportSingleRequest(Long requestId, Long requestorId) {
    User requestor =
        userRepository
            .findById(requestorId)
            .orElseThrow(() -> new RuntimeException("User not found."));

    if (requestor.getRole() != UserRole.ADMIN
        && requestor.getRole() != UserRole.MUNICIPAL_EMPLOYEE) {
      throw new RuntimeException("Only admin and staff can export request details.");
    }

    ServiceRequest request =
        serviceRequestRepository
            .findById(requestId)
            .orElseThrow(() -> new RuntimeException("Service request not found."));

    if (requestor.getRole() == UserRole.MUNICIPAL_EMPLOYEE) {
      if (request.getDepartment() == null
          || requestor.getDepartment() == null
          || !request.getDepartment().getId().equals(requestor.getDepartment().getId())) {
        throw new RuntimeException("Staff can only export requests assigned to their department.");
      }
    }

    Optional<AiTriageResult> aiResult = aiTriageResultRepository.findByServiceRequestId(requestId);
    List<RequestStatusHistory> history =
        requestStatusHistoryRepository.findByServiceRequestIdOrderByChangedAtAsc(requestId);

    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    PrintWriter pw = new PrintWriter(baos, true, StandardCharsets.UTF_8);

    pw.println("REQUEST CASE EXPORT");
    pw.println();
    pw.println("REQUEST DETAILS");
    pw.println("Field,Value");
    pw.println("ID," + request.getId());
    pw.println("Title," + csvEscape(request.getTitle()));
    pw.println("Description," + csvEscape(request.getDescription()));
    pw.println("Status," + request.getStatus());
    pw.println(
        "Department,"
            + (request.getDepartment() != null
                ? csvEscape(request.getDepartment().getName())
                : "Unassigned"));
    pw.println(
        "Submitted At," + (request.getCreatedAt() != null ? request.getCreatedAt() : "Unknown"));
    pw.println("Address," + csvEscape(request.getAddress() != null ? request.getAddress() : ""));
    pw.println("Latitude," + (request.getLatitude() != null ? request.getLatitude() : ""));
    pw.println("Longitude," + (request.getLongitude() != null ? request.getLongitude() : ""));

    if (requestor.getRole() == UserRole.ADMIN) {
      String submitter;
      if (Boolean.TRUE.equals(request.getAnonymousSubmission())) {
        submitter = "Anonymous";
      } else if (request.getCitizen() != null) {
        submitter = request.getCitizen().getUsername();
      } else {
        submitter = request.getGuestDisplayName() != null ? request.getGuestDisplayName() : "Guest";
      }
      pw.println("Submitter," + csvEscape(submitter));
    }
    pw.println("Anonymous Submission," + request.getAnonymousSubmission());
    pw.println();

    pw.println("ATTACHMENTS");
    pw.println("Reference");
    if (request.getImageUrl() != null && !request.getImageUrl().isBlank()) {
      pw.println(csvEscape(request.getImageUrl()));
    } else {
      pw.println("(no attachments)");
    }
    pw.println();

    pw.println("AI CLASSIFICATION");
    pw.println("Field,Value");
    if (aiResult.isPresent()) {
      AiTriageResult ai = aiResult.get();
      pw.println(
          "Suggested Department,"
              + (ai.getSuggestedDepartment() != null
                  ? csvEscape(ai.getSuggestedDepartment().getName())
                  : "None"));
      pw.println(
          "Confidence,"
              + (ai.getConfidence() != null ? String.format("%.2f", ai.getConfidence()) : "N/A"));
      pw.println("Admin Revised," + ai.getAdminRevised());
      pw.println("Accepted," + ai.getAccepted());
    } else {
      pw.println("Status,No AI classification available");
    }
    pw.println();

    pw.println("STATUS HISTORY");
    pw.println("Changed At,Old Status,New Status,Old Department,New Department,Changed By,Note");
    for (RequestStatusHistory h : history) {
      pw.println(
          csvEscape(h.getChangedAt() != null ? h.getChangedAt().toString() : "")
              + ","
              + csvEscape(h.getOldStatus() != null ? h.getOldStatus().toString() : "")
              + ","
              + csvEscape(h.getNewStatus() != null ? h.getNewStatus().toString() : "")
              + ","
              + csvEscape(h.getOldDepartment() != null ? h.getOldDepartment().getName() : "")
              + ","
              + csvEscape(h.getNewDepartment() != null ? h.getNewDepartment().getName() : "")
              + ","
              + csvEscape(h.getChangedBy() != null ? h.getChangedBy().getUsername() : "")
              + ","
              + csvEscape(h.getNote() != null ? h.getNote() : ""));
    }
    pw.println();

    pw.println("FINAL RESOLUTION");
    pw.println("Field,Value");
    pw.println("Final Status," + request.getStatus());
    if (request.getStatus() == RequestStatus.RESOLVED
        || request.getStatus() == RequestStatus.CLOSED) {
      history.stream()
          .filter(
              h ->
                  h.getNewStatus() == RequestStatus.RESOLVED
                      || h.getNewStatus() == RequestStatus.CLOSED)
          .max(
              Comparator.comparing(
                  h -> h.getChangedAt() != null ? h.getChangedAt() : LocalDateTime.MIN))
          .ifPresent(
              h -> {
                pw.println("Resolved At," + (h.getChangedAt() != null ? h.getChangedAt() : "N/A"));
                pw.println(
                    "Resolved By,"
                        + (h.getChangedBy() != null
                            ? csvEscape(h.getChangedBy().getUsername())
                            : "N/A"));
                if (h.getNote() != null && !h.getNote().isBlank()) {
                  pw.println("Resolution Note," + csvEscape(h.getNote()));
                }
              });
    }

    pw.flush();
    return baos.toByteArray();
  }

  @Override
  @Transactional(readOnly = true)
  public byte[] exportDepartmentRequests(Long employeeId) {
    User employee =
        userRepository
            .findById(employeeId)
            .orElseThrow(() -> new RuntimeException("User not found."));

    if (employee.getRole() != UserRole.MUNICIPAL_EMPLOYEE) {
      throw new RuntimeException("Only municipal employees can export department requests.");
    }

    if (employee.getDepartment() == null) {
      throw new RuntimeException("Employee is not assigned to a department.");
    }

    List<ServiceRequest> requests =
        serviceRequestRepository.findByDepartmentIdOrderByIdDesc(employee.getDepartment().getId());

    return buildBulkCsv(requests);
  }

  /**
   * Builds a uniform bulk CSV: header row + one data row per request. Columns 0-4
   * (title,description,address,latitude,longitude) match the importer format so the file can be
   * re-imported without modification.
   */
  private byte[] buildBulkCsv(List<ServiceRequest> requests) {
    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    PrintWriter pw = new PrintWriter(baos, true, StandardCharsets.UTF_8);

    pw.println("title,description,address,latitude,longitude,status,department,submitted_at");

    for (ServiceRequest r : requests) {
      pw.println(
          csvEscape(r.getTitle())
              + ","
              + csvEscape(r.getDescription())
              + ","
              + csvEscape(r.getAddress() != null ? r.getAddress() : "")
              + ","
              + (r.getLatitude() != null ? r.getLatitude() : "")
              + ","
              + (r.getLongitude() != null ? r.getLongitude() : "")
              + ","
              + r.getStatus()
              + ","
              + csvEscape(r.getDepartment() != null ? r.getDepartment().getName() : "")
              + ","
              + (r.getCreatedAt() != null ? r.getCreatedAt().toLocalDate() : ""));
    }

    pw.flush();
    return baos.toByteArray();
  }

  private String csvEscape(String value) {
    if (value == null) return "";
    if (value.contains(",")
        || value.contains("\"")
        || value.contains("\n")
        || value.contains("\r")) {
      return "\"" + value.replace("\"", "\"\"") + "\"";
    }
    return value;
  }
}
