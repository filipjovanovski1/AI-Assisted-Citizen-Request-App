package com.citizenrequest.api.dto.ai;

import lombok.Data;

@Data
public class UpdateAiTriageDto {

  private Long departmentId;

  private String note;
}
