package com.citizenrequest.api.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(uniqueConstraints = {@UniqueConstraint(columnNames = {"user_id", "request_id"})})
public class RequestVote {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long Id;

  @ManyToOne
  @JoinColumn(name = "request_id", nullable = false)
  private ServiceRequest request;

  @ManyToOne
  @JoinColumn(name = "user_id", nullable = false)
  private User user;
}
