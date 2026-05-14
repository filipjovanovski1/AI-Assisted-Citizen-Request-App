package com.citizenrequest.api.service.impl;

import com.citizenrequest.api.domain.Department;
import com.citizenrequest.api.domain.ServiceRequest;
import com.citizenrequest.api.dto.ai.AiDepartmentPrediction;
import com.citizenrequest.api.service.AiTriageClient;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TemporaryAiTriageClient implements AiTriageClient {

  @Override
  public AiDepartmentPrediction classify(
      ServiceRequest request, List<Department> availableDepartments) {
    if (availableDepartments == null || availableDepartments.isEmpty()) {
      throw new RuntimeException("No departments available for AI triage.");
    }

    Department fallbackDepartment = availableDepartments.get(0);

    return new AiDepartmentPrediction(fallbackDepartment.getId(), 0.50);
  }
}
