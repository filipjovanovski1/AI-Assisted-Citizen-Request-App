package com.citizenrequest.api.dto.request;

import java.util.List;

public record ImportResultDto(int totalRows, int imported, int failed, List<String> errors) {}
