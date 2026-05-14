package com.citizenrequest.api.repository;

import com.citizenrequest.api.domain.User;
import com.citizenrequest.api.domain.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    Optional<User> findByEmbg(String embg);

    boolean existsByEmbg(String embg);

    List<User> findByRole(UserRole role);

    List<User> findByDepartmentId(Long departmentId);

    List<User> findByRoleAndDepartmentId(UserRole role, Long departmentId);
}
