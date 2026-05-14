package com.citizenrequest.api.dto.department;

import lombok.Data;

@Data
public class UpdateDepartmentDto {

    private String name;

    private String description;

    private String contactEmail;
}