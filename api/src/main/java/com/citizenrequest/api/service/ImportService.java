package com.citizenrequest.api.service;

import com.citizenrequest.api.dto.request.ImportResultDto;
import java.io.InputStream;

public interface ImportService {

  ImportResultDto importRequests(Long adminId, InputStream csvStream);

  ImportResultDto importDepartmentRequests(Long employeeId, InputStream csvStream);
}
