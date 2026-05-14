package com.citizenrequest.api.service;

import com.citizenrequest.api.dto.request.ServiceRequestDto;

public interface RequestVoteService {

  ServiceRequestDto toggleVote(Long requestId, Long userId);
}
