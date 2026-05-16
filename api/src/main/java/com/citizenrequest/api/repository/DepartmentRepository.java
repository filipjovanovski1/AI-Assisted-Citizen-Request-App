package com.citizenrequest.api.repository;

import com.citizenrequest.api.domain.Department;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DepartmentRepository extends JpaRepository<Department, Long> {

  Optional<Department> findByName(String name);

  boolean existsByName(String name);

  List<Department> findAllByActiveTrue();
}
