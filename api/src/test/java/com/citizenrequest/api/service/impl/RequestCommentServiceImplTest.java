package com.citizenrequest.api.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.citizenrequest.api.domain.RequestComment;
import com.citizenrequest.api.domain.RequestStatus;
import com.citizenrequest.api.domain.ServiceRequest;
import com.citizenrequest.api.domain.User;
import com.citizenrequest.api.domain.UserRole;
import com.citizenrequest.api.dto.request.RequestCommentDto;
import com.citizenrequest.api.dto.request.UpdateRequestCommentDto;
import com.citizenrequest.api.repository.RequestCommentRepository;
import com.citizenrequest.api.repository.ServiceRequestRepository;
import com.citizenrequest.api.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RequestCommentServiceImplTest {

  @Mock private RequestCommentRepository requestCommentRepository;

  @Mock private ServiceRequestRepository serviceRequestRepository;

  @Mock private UserRepository userRepository;

  @InjectMocks private RequestCommentServiceImpl requestCommentService;

  @Test
  void addCitizenCommentAllowsCommentingOnAnotherCitizensRequest() {
    User author = User.builder().id(5L).username("commenter").role(UserRole.CITIZEN).build();
    User requestOwner = User.builder().id(7L).username("owner").role(UserRole.CITIZEN).build();
    ServiceRequest request =
        ServiceRequest.builder()
            .id(11L)
            .title("Broken light")
            .description("Street light is out")
            .status(RequestStatus.NEW)
            .citizen(requestOwner)
            .build();
    UpdateRequestCommentDto dto = new UpdateRequestCommentDto();
    dto.setBody("I have the same issue.");

    when(userRepository.findById(author.getId())).thenReturn(Optional.of(author));
    when(serviceRequestRepository.findById(request.getId())).thenReturn(Optional.of(request));
    when(requestCommentRepository.save(any(RequestComment.class)))
        .thenAnswer(
            invocation -> {
              RequestComment comment = invocation.getArgument(0);
              comment.setId(13L);
              return comment;
            });

    RequestCommentDto result =
        requestCommentService.addCitizenComment(request.getId(), author.getId(), dto);

    ArgumentCaptor<RequestComment> commentCaptor = ArgumentCaptor.forClass(RequestComment.class);
    verify(requestCommentRepository).save(commentCaptor.capture());

    RequestComment savedComment = commentCaptor.getValue();
    assertThat(savedComment.getRequest()).isSameAs(request);
    assertThat(savedComment.getAuthor()).isSameAs(author);
    assertThat(savedComment.getBody()).isEqualTo(dto.getBody());
    assertThat(result)
        .isEqualTo(
            new RequestCommentDto(
                13L,
                request.getId(),
                author.getId(),
                author.getUsername(),
                author.getRole(),
                dto.getBody()));
  }

  @Test
  void deleteCitizenCommentAllowsDeletingOwnCommentOnAnotherCitizensRequest() {
    User author = User.builder().id(5L).username("commenter").role(UserRole.CITIZEN).build();
    User requestOwner = User.builder().id(7L).username("owner").role(UserRole.CITIZEN).build();
    ServiceRequest request =
        ServiceRequest.builder()
            .id(11L)
            .title("Broken light")
            .description("Street light is out")
            .status(RequestStatus.NEW)
            .citizen(requestOwner)
            .build();
    RequestComment comment =
        RequestComment.builder()
            .id(13L)
            .request(request)
            .author(author)
            .body("I have the same issue.")
            .build();

    when(userRepository.findById(author.getId())).thenReturn(Optional.of(author));
    when(serviceRequestRepository.findById(request.getId())).thenReturn(Optional.of(request));
    when(requestCommentRepository.findById(comment.getId())).thenReturn(Optional.of(comment));

    requestCommentService.deleteCitizenComment(request.getId(), comment.getId(), author.getId());

    verify(requestCommentRepository).delete(comment);
  }

  @Test
  void deleteCitizenCommentRejectsDeletingAnotherCitizensComment() {
    User citizen = User.builder().id(5L).username("commenter").role(UserRole.CITIZEN).build();
    User requestOwner = User.builder().id(7L).username("owner").role(UserRole.CITIZEN).build();
    User otherAuthor = User.builder().id(8L).username("other").role(UserRole.CITIZEN).build();
    ServiceRequest request =
        ServiceRequest.builder()
            .id(11L)
            .title("Broken light")
            .description("Street light is out")
            .status(RequestStatus.NEW)
            .citizen(requestOwner)
            .build();
    RequestComment comment =
        RequestComment.builder()
            .id(13L)
            .request(request)
            .author(otherAuthor)
            .body("I have the same issue.")
            .build();

    when(userRepository.findById(citizen.getId())).thenReturn(Optional.of(citizen));
    when(serviceRequestRepository.findById(request.getId())).thenReturn(Optional.of(request));
    when(requestCommentRepository.findById(comment.getId())).thenReturn(Optional.of(comment));

    assertThatThrownBy(
            () ->
                requestCommentService.deleteCitizenComment(
                    request.getId(), comment.getId(), citizen.getId()))
        .isInstanceOf(RuntimeException.class)
        .hasMessage("Citizens can only delete their own comments.");
  }
}
