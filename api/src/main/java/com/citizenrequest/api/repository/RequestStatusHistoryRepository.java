package com.citizenrequest.api.repository;

import com.citizenrequest.api.domain.RequestStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RequestStatusHistoryRepository extends JpaRepository<RequestStatusHistory, Long> {

    List<RequestStatusHistory> findByServiceRequestIdOrderByChangedAtAsc(Long requestId);

    List<RequestStatusHistory> findByChangedByIdOrderByIdDesc(Long userId);


}