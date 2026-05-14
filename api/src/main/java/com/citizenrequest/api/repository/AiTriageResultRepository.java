package com.citizenrequest.api.repository;

import com.citizenrequest.api.domain.AiTriageResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AiTriageResultRepository extends JpaRepository<AiTriageResult, Long> {

    Optional<AiTriageResult> findByServiceRequestId(Long serviceRequestId);

    boolean existsByServiceRequestId(Long serviceRequestId);

    List<AiTriageResult> findBySuggestedDepartmentId(Long departmentId);

    List<AiTriageResult> findByAdminRevisedFalse();

    List<AiTriageResult> findByMisclassificationTrue();

    List<AiTriageResult> findByAccepted(Boolean accepted);

    List<AiTriageResult> findByAcceptedFalseAndAdminRevisedFalse();
}