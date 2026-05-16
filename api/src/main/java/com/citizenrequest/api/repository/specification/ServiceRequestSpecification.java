package com.citizenrequest.api.repository.specification;

import com.citizenrequest.api.domain.RequestStatus;
import com.citizenrequest.api.domain.ServiceRequest;
import java.time.LocalDate;
import org.springframework.data.jpa.domain.Specification;

public class ServiceRequestSpecification {

  public static Specification<ServiceRequest> hasStatus(RequestStatus status) {
    return (root, query, criteriaBuilder) -> {
      if (status == null) {
        return null;
      }

      return criteriaBuilder.equal(root.get("status"), status);
    };
  }

  public static Specification<ServiceRequest> hasDepartment(Long departmentId) {
    return (root, query, criteriaBuilder) -> {
      if (departmentId == null) {
        return null;
      }

      return criteriaBuilder.equal(root.get("department").get("id"), departmentId);
    };
  }

  public static Specification<ServiceRequest> belongsToCitizen(Long citizenId) {
    return (root, query, criteriaBuilder) -> {
      if (citizenId == null) {
        return null;
      }

      return criteriaBuilder.equal(root.get("citizen").get("id"), citizenId);
    };
  }

  public static Specification<ServiceRequest> containsKeyword(String keyword) {
    return (root, query, criteriaBuilder) -> {
      if (keyword == null || keyword.isBlank()) {
        return null;
      }

      String pattern = "%" + keyword.toLowerCase() + "%";

      return criteriaBuilder.or(
          criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), pattern),
          criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), pattern),
          criteriaBuilder.like(criteriaBuilder.lower(root.get("address")), pattern));
    };
  }

  public static Specification<ServiceRequest> createdBetween(LocalDate from, LocalDate to) {
    return (root, query, criteriaBuilder) -> {
      if (from == null && to == null) {
        return null;
      }
      if (from != null && to != null) {
        return criteriaBuilder.between(
            root.get("createdAt").as(java.time.LocalDate.class), from, to);
      }
      if (from != null) {
        return criteriaBuilder.greaterThanOrEqualTo(
            root.get("createdAt").as(java.time.LocalDate.class), from);
      }
      return criteriaBuilder.lessThanOrEqualTo(
          root.get("createdAt").as(java.time.LocalDate.class), to);
    };
  }
}
