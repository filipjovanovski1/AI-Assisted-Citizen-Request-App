package com.citizenrequest.api.service.impl;

import com.citizenrequest.api.domain.RequestComment;
import com.citizenrequest.api.domain.ServiceRequest;
import com.citizenrequest.api.domain.User;
import com.citizenrequest.api.domain.UserRole;
import com.citizenrequest.api.dto.request.RequestCommentDto;
import com.citizenrequest.api.dto.request.UpdateRequestCommentDto;
import com.citizenrequest.api.repository.RequestCommentRepository;
import com.citizenrequest.api.repository.ServiceRequestRepository;
import com.citizenrequest.api.repository.UserRepository;
import com.citizenrequest.api.service.RequestCommentService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RequestCommentServiceImpl implements RequestCommentService {

  private final RequestCommentRepository requestCommentRepository;
  private final ServiceRequestRepository serviceRequestRepository;
  private final UserRepository userRepository;

  @Override
  public List<RequestCommentDto> findRequestComments(Long requestId) {
    findRequestById(requestId);

    return requestCommentRepository.findByRequestIdOrderByIdDesc(requestId).stream()
        .map(this::mapToDto)
        .toList();
  }

  @Override
  public List<RequestCommentDto> findMyRequestComments(Long requestId, Long citizenId) {
    User citizen = findUserById(citizenId);

    validateCitizen(citizen);

    ServiceRequest request = findRequestById(requestId);

    if (request.getCitizen() == null || !request.getCitizen().getId().equals(citizenId)) {
      throw new RuntimeException("This request does not belong to the selected citizen.");
    }

    return requestCommentRepository.findByRequestIdOrderByIdDesc(requestId).stream()
        .map(this::mapToDto)
        .toList();
  }

  @Override
  @Transactional
  public RequestCommentDto addCitizenComment(
      Long requestId, Long citizenId, UpdateRequestCommentDto dto) {
    User citizen = findUserById(citizenId);

    validateCitizen(citizen);

    ServiceRequest request = findRequestById(requestId);

    if (request.getCitizen() == null || !request.getCitizen().getId().equals(citizenId)) {
      throw new RuntimeException("Citizens can only comment on their own requests.");
    }

    validateBody(dto);

    RequestComment comment = new RequestComment();
    comment.setRequest(request);
    comment.setAuthor(citizen);
    comment.setBody(dto.getBody());

    RequestComment savedComment = requestCommentRepository.save(comment);

    return mapToDto(savedComment);
  }

  private void validateBody(UpdateRequestCommentDto dto) {
    if (dto.getBody() == null || dto.getBody().isBlank()) {
      throw new RuntimeException("Comment body is required.");
    }
  }

  private ServiceRequest findRequestById(Long requestId) {
    return serviceRequestRepository
        .findById(requestId)
        .orElseThrow(() -> new RuntimeException("Service request not found."));
  }

  private User findUserById(Long userId) {
    if (userId == null) {
      throw new RuntimeException("Only registered citizens can comment.");
    }

    return userRepository
        .findById(userId)
        .orElseThrow(() -> new RuntimeException("User not found."));
  }

  private void validateCitizen(User user) {
    if (user.getRole() != UserRole.CITIZEN) {
      throw new RuntimeException("Only citizens can add comments to service requests.");
    }
  }

  private RequestCommentDto mapToDto(RequestComment comment) {
    User author = comment.getAuthor();

    return new RequestCommentDto(
        comment.getId(),
        comment.getRequest().getId(),
        author.getId(),
        author.getUsername(),
        author.getRole(),
        comment.getBody());
  }
}
