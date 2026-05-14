package com.citizenrequest.api.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RequestComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @ManyToOne
    @JoinColumn(name = "request_id", nullable = false)
    private ServiceRequest request;

    @ManyToOne
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

}
