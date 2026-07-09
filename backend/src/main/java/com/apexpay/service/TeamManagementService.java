package com.apexpay.service;

import com.apexpay.dto.EmployeeResponse;
import com.apexpay.dto.InviteEmployeeRequest;
import com.apexpay.dto.UpdateEmployeeRequest;
import java.util.List;
import java.util.UUID;

public interface TeamManagementService {
    EmployeeResponse inviteEmployee(UUID currentUserId, InviteEmployeeRequest request);
    EmployeeResponse updateEmployee(UUID currentUserId, UUID employeeMappingId, UpdateEmployeeRequest request);
    void removeEmployee(UUID currentUserId, UUID employeeMappingId);
    List<EmployeeResponse> getTeamMembers(UUID currentUserId);
}
