package com.citizenrequest.api.repository.specification;

import com.citizenrequest.api.domain.RequestStatus;
import com.citizenrequest.api.domain.ServiceRequest;
import jakarta.persistence.criteria.JoinType;
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

  public static Specification<ServiceRequest> hasMisclassification(Boolean misclassified) {
    return (root, query, criteriaBuilder) -> {
      if (misclassified == null) {
        return null;
      }

      var triageJoin = root.join("aiTriageResult", JoinType.LEFT);

      if (misclassified) {
        return criteriaBuilder.isTrue(triageJoin.get("misclassification"));
      }

      return criteriaBuilder.or(
          criteriaBuilder.isNull(triageJoin.get("id")),
          criteriaBuilder.isFalse(triageJoin.get("misclassification")));
    };
  }

  public static Specification<ServiceRequest> hasDepartmentMisclassification(
      Boolean misclassified) {
    return (root, query, criteriaBuilder) -> {
      if (misclassified == null) {
        return null;
      }

      var triageJoin = root.join("aiTriageResult", JoinType.LEFT);
      var pendingDepartmentReview =
          criteriaBuilder.and(
              criteriaBuilder.isTrue(triageJoin.get("misclassification")),
              criteriaBuilder.equal(root.get("status"), RequestStatus.IN_REVIEW),
              criteriaBuilder.or(
                  criteriaBuilder.isNull(triageJoin.get("adminRevised")),
                  criteriaBuilder.isFalse(triageJoin.get("adminRevised"))));

      if (misclassified) {
        return pendingDepartmentReview;
      }

      return criteriaBuilder.or(
          criteriaBuilder.isNull(triageJoin.get("id")),
          criteriaBuilder.not(pendingDepartmentReview));
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
