package com.citizenrequest.api.repository;

import com.citizenrequest.api.domain.RequestStatusHistory;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RequestStatusHistoryRepository extends JpaRepository<RequestStatusHistory, Long> {

  List<RequestStatusHistory> findByServiceRequestIdOrderByChangedAtAsc(Long requestId);

  List<RequestStatusHistory> findByChangedByIdOrderByIdDesc(Long userId);

  void deleteByServiceRequestId(Long serviceRequestId);
}
