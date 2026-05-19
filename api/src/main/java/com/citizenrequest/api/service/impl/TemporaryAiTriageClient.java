package com.citizenrequest.api.service.impl;

import com.citizenrequest.api.domain.Department;
import com.citizenrequest.api.domain.ServiceRequest;
import com.citizenrequest.api.dto.ai.AiDepartmentPrediction;
import com.citizenrequest.api.service.AiTriageClient;
import java.util.List;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnMissingBean(AiTriageClient.class)
public class TemporaryAiTriageClient implements AiTriageClient {

  @Override
  public AiDepartmentPrediction classify(
      ServiceRequest request, List<Department> availableDepartments) {
    if (availableDepartments == null || availableDepartments.isEmpty()) {
      throw new RuntimeException("No departments available for AI.");
    }
    return new AiDepartmentPrediction(availableDepartments.get(0).getId(), 0.50);
  }
}
