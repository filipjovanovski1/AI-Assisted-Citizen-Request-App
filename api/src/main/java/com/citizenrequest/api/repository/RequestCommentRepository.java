package com.citizenrequest.api.repository;

import com.citizenrequest.api.domain.RequestComment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RequestCommentRepository extends JpaRepository<RequestComment, Long> {

  List<RequestComment> findByRequestIdOrderByIdDesc(Long requestId);

  List<RequestComment> findByAuthorIdOrderByIdDesc(Long authorId);

  long countByRequestId(Long requestId);
}
