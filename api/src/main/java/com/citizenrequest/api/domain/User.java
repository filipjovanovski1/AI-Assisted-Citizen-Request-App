package com.citizenrequest.api.domain;

import jakarta.persistence.*;
import java.util.List;
import lombok.*;

@Entity
@Table(name = "\"user\"")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(unique = true)
  private String embg;

  @Enumerated(EnumType.STRING)
  private UserRole role;

  @Column(unique = true, nullable = false)
  private String username;

  private String firstName;
  private String lastName;

  @OneToMany(mappedBy = "citizen")
  private List<ServiceRequest> requests;

  private String password;

  @ManyToOne
  @JoinColumn(name = "department_id", nullable = true)
  private Department department;
}
