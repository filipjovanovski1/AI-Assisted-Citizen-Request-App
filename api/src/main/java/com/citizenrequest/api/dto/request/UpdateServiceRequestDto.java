package com.citizenrequest.api.dto.request;

import com.citizenrequest.api.domain.RequestStatus;
import lombok.Data;

@Data
public class UpdateServiceRequestDto {

  private String title;

  private String description;

  private String address;

  private Double latitude;

  private Double longitude;

  private String imageUrl;

  private Boolean anonymousSubmission;

  private String guestDisplayName;

  private Long departmentId;

  private RequestStatus status;

  private String note;
}
