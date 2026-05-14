package com.citizenrequest.api.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RequestStatusHistory {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne
  @JoinColumn(name = "service_request_id", nullable = false)
  private ServiceRequest serviceRequest;

  @Enumerated(EnumType.STRING)
  private RequestStatus oldStatus;

  @Enumerated(EnumType.STRING)
  private RequestStatus newStatus;

  @ManyToOne
  @JoinColumn(name = "old_department_id")
  private Department oldDepartment;

  @ManyToOne
  @JoinColumn(name = "new_department_id")
  private Department newDepartment;

  @ManyToOne
  @JoinColumn(name = "changed_by_id")
  private User changedBy;

  private String note;

  private LocalDateTime changedAt;
}
