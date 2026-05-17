package com.citizenrequest.api.repository;

import com.citizenrequest.api.domain.AiTriageResult;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiTriageResultRepository extends JpaRepository<AiTriageResult, Long> {

  Optional<AiTriageResult> findByServiceRequestId(Long serviceRequestId);

  void deleteByServiceRequestId(Long serviceRequestId);

  boolean existsByServiceRequestId(Long serviceRequestId);

  List<AiTriageResult> findBySuggestedDepartmentId(Long departmentId);

  List<AiTriageResult> findByAdminRevisedFalse();

  List<AiTriageResult> findByMisclassificationTrue();

  List<AiTriageResult> findByAccepted(Boolean accepted);

  List<AiTriageResult> findByAcceptedFalseAndAdminRevisedFalse();
}
