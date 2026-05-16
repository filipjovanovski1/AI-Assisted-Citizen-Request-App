package com.citizenrequest.api.web;

import com.citizenrequest.api.dto.request.ImportResultDto;
import com.citizenrequest.api.service.ExportService;
import com.citizenrequest.api.service.ImportService;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
public class ExportController {

  private final ExportService exportService;
  private final ImportService importService;

  @GetMapping("/api/admin/export/report")
  public ResponseEntity<byte[]> exportAdminReport(
      @RequestParam Long adminId,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
    byte[] csv = exportService.exportAdminReport(adminId, from, to);
    String filename =
        "admin-report"
            + (from != null ? "-from-" + from : "")
            + (to != null ? "-to-" + to : "")
            + ".csv";
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
        .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
        .body(csv);
  }

  @GetMapping("/api/admin/export/requests/{requestId}")
  public ResponseEntity<byte[]> exportRequestAdmin(
      @PathVariable Long requestId, @RequestParam Long adminId) {
    byte[] csv = exportService.exportSingleRequest(requestId, adminId);
    return ResponseEntity.ok()
        .header(
            HttpHeaders.CONTENT_DISPOSITION,
            "attachment; filename=\"request-" + requestId + ".csv\"")
        .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
        .body(csv);
  }

  @GetMapping("/api/employees/export/requests/{requestId}")
  public ResponseEntity<byte[]> exportRequestEmployee(
      @PathVariable Long requestId, @RequestParam Long employeeId) {
    byte[] csv = exportService.exportSingleRequest(requestId, employeeId);
    return ResponseEntity.ok()
        .header(
            HttpHeaders.CONTENT_DISPOSITION,
            "attachment; filename=\"request-" + requestId + ".csv\"")
        .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
        .body(csv);
  }

  @GetMapping("/api/employees/export/department")
  public ResponseEntity<byte[]> exportDepartmentRequests(@RequestParam Long employeeId) {
    byte[] csv = exportService.exportDepartmentRequests(employeeId);
    String filename = "department-requests-" + LocalDate.now() + ".csv";
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
        .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
        .body(csv);
  }

  @PostMapping("/api/employees/import/requests")
  public ResponseEntity<ImportResultDto> importDepartmentRequests(
      @RequestParam Long employeeId, @RequestParam("file") MultipartFile file) throws Exception {
    ImportResultDto result =
        importService.importDepartmentRequests(employeeId, file.getInputStream());
    return ResponseEntity.ok(result);
  }
}
