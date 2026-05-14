package com.citizenrequest.api.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiTriageResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "service_request_id", nullable = false)
    private ServiceRequest serviceRequest;

    @ManyToOne
    @JoinColumn(name = "suggested_department_id")
    private Department suggestedDepartment;

    private Double confidence;

    private Boolean adminRevised;

    private Boolean accepted;

    private Boolean misclassification;


    @PrePersist
    public void onCreate() {

        if (this.adminRevised == null) {
            this.adminRevised = false;
        }

        if (this.misclassification == null) {
            this.misclassification = false;
        }

    }
}
