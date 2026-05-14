package com.citizenrequest.api.repository;

import com.citizenrequest.api.domain.RequestStatus;
import com.citizenrequest.api.domain.ServiceRequest;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ServiceRequestRepository
    extends JpaRepository<ServiceRequest, Long>, JpaSpecificationExecutor<ServiceRequest> {

  List<ServiceRequest> findByCitizenIdOrderByIdDesc(Long citizenId);

  List<ServiceRequest> findByDepartmentIdOrderByIdDesc(Long departmentId);

  List<ServiceRequest> findByStatusOrderByIdDesc(RequestStatus status);

  List<ServiceRequest> findByDepartmentIdAndStatusOrderByIdDesc(
      Long departmentId, RequestStatus status);

  Page<ServiceRequest> findByStatus(RequestStatus status, Pageable pageable);

  Page<ServiceRequest> findByDepartmentId(Long departmentId, Pageable pageable);

  Page<ServiceRequest> findByDepartmentIdAndStatus(
      Long departmentId, RequestStatus status, Pageable pageable);
}
