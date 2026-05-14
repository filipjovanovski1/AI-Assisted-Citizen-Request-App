package com.citizenrequest.api.service;

import com.citizenrequest.api.dto.request.RequestCommentDto;
import com.citizenrequest.api.dto.request.UpdateRequestCommentDto;
import java.util.List;

public interface RequestCommentService {

  List<RequestCommentDto> findRequestComments(Long requestId);

  List<RequestCommentDto> findMyRequestComments(Long requestId, Long citizenId);

  RequestCommentDto addCitizenComment(Long requestId, Long citizenId, UpdateRequestCommentDto dto);
}
