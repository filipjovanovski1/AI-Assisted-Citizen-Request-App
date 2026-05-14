package com.citizenrequest.api.service;

import com.citizenrequest.api.domain.Department;
import com.citizenrequest.api.domain.ServiceRequest;
import com.citizenrequest.api.dto.ai.AiDepartmentPrediction;

import java.util.List;

public interface AiTriageClient {

    AiDepartmentPrediction classify(
            ServiceRequest request,
            List<Department> availableDepartments
    );
}