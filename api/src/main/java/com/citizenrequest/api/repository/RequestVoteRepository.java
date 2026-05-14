package com.citizenrequest.api.repository;

import com.citizenrequest.api.domain.RequestVote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RequestVoteRepository extends JpaRepository<RequestVote, Long> {

    long countByRequestId(Long requestId);

    boolean existsByRequestIdAndUserId(Long requestId, Long userId);

    Optional<RequestVote> findByRequestIdAndUserId(Long requestId, Long userId);

    void deleteByRequestIdAndUserId(Long requestId, Long userId);
}