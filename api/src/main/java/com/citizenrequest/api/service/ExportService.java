package com.citizenrequest.api.service;

import java.time.LocalDate;

public interface ExportService {

  byte[] exportAdminReport(Long adminId, LocalDate from, LocalDate to);

  byte[] exportSingleRequest(Long requestId, Long requestorId);

  byte[] exportDepartmentRequests(Long employeeId);
}
