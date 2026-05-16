package com.citizenrequest.api.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.List;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Department {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String name;

  private String description;
  private String contactEmail;

  @Column(nullable = false)
  @Builder.Default
  private boolean active = true;

  @JsonIgnore
  @OneToMany(mappedBy = "department")
  private List<ServiceRequest> serviceRequests;
}
