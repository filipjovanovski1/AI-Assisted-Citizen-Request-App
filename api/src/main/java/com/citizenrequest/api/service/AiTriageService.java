package com.citizenrequest.api.service;

import com.citizenrequest.api.dto.ai.AiTriageResultDto;
import com.citizenrequest.api.dto.ai.UpdateAiTriageDto;

public interface AiTriageService {

  AiTriageResultDto triageRequest(Long requestId);

  AiTriageResultDto findByRequestId(Long requestId);

  AiTriageResultDto acceptSuggestedDepartment(
      Long requestId, Long employeeId, UpdateAiTriageDto dto);

  AiTriageResultDto declineSuggestedDepartment(
      Long requestId, Long employeeId, UpdateAiTriageDto dto);

  AiTriageResultDto adminReviseDepartment(Long requestId, Long adminId, UpdateAiTriageDto dto);
}
