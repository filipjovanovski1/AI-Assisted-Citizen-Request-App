package com.citizenrequest.api.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class ServiceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 50)
    private String title;
    @Enumerated(EnumType.STRING)
    private RequestStatus status;
    @Column(nullable = false, length = 300)
    private String description;
    @ManyToOne
    @JoinColumn(name="citizen_id")
    private User citizen;
    private String address;
    private Double latitude;
    private Double longitude;
    @Column(nullable = true)
    private String imageUrl;
    @ManyToOne
    @JoinColumn(name = "department_id")
    private Department department;
    @JsonIgnore
    @OneToMany(mappedBy = "request")
    private List<RequestVote> votes;
    @JsonIgnore
    @OneToMany(mappedBy = "request")
    private List<RequestComment> comments;
    @JsonIgnore
    @OneToMany(mappedBy = "serviceRequest")
    private List<RequestStatusHistory> statusHistory;
    @JsonIgnore
    @OneToOne(mappedBy = "serviceRequest")
    private AiTriageResult aiTriageResult;
    private Boolean anonymousSubmission;
    private String guestDisplayName;

    @PrePersist
    public void prePersist() {
        if (this.status == null) {
            this.status = RequestStatus.NEW;
        }
        if (this.anonymousSubmission == null) {
            this.anonymousSubmission = false;
        }
    }
}
