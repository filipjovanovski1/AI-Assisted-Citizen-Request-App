package com.citizenrequest.api.service.impl;

import lombok.RequiredArgsConstructor;
import com.citizenrequest.api.domain.RequestVote;
import com.citizenrequest.api.domain.ServiceRequest;
import com.citizenrequest.api.domain.User;
import com.citizenrequest.api.dto.request.ServiceRequestDto;
import com.citizenrequest.api.repository.RequestVoteRepository;
import com.citizenrequest.api.repository.ServiceRequestRepository;
import com.citizenrequest.api.repository.UserRepository;
import com.citizenrequest.api.service.RequestVoteService;
import com.citizenrequest.api.service.ServiceRequestService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RequestVoteServiceImpl implements RequestVoteService {

    private final RequestVoteRepository requestVoteRepository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final UserRepository userRepository;
    private final ServiceRequestService serviceRequestService;

    @Override
    @Transactional
    public ServiceRequestDto toggleVote(Long requestId, Long userId) {
        if (userId == null) {
            throw new RuntimeException("Only registered users can vote.");
        }

        ServiceRequest request = serviceRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Service request not found."));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));

        Optional<RequestVote> existingVote = requestVoteRepository.findByRequestIdAndUserId(
                request.getId(),
                user.getId()
        );

        if (existingVote.isPresent()) {
            requestVoteRepository.delete(existingVote.get());
        } else {
            RequestVote vote = new RequestVote();
            vote.setRequest(request);
            vote.setUser(user);

            requestVoteRepository.save(vote);
        }

        return serviceRequestService.findById(requestId, userId);
    }
}