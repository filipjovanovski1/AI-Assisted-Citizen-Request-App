package com.citizenrequest.api.repository;

import com.citizenrequest.api.domain.RequestComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RequestCommentRepository extends JpaRepository<RequestComment, Long> {

    List<RequestComment> findByRequestIdOrderByIdDesc(Long requestId);

    List<RequestComment> findByAuthorIdOrderByIdDesc(Long authorId);

    long countByRequestId(Long requestId);
}