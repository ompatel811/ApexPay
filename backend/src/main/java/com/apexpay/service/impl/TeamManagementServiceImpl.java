package com.apexpay.service.impl;

import com.apexpay.dto.EmployeeResponse;
import com.apexpay.dto.InviteEmployeeRequest;
import com.apexpay.dto.UpdateEmployeeRequest;
import com.apexpay.entity.*;
import com.apexpay.entity.enums.NotificationType;
import com.apexpay.entity.enums.EmployeeStatus;
import com.apexpay.entity.enums.MerchantRoleName;
import com.apexpay.exception.BusinessException;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.MerchantEmployeeRepository;
import com.apexpay.repository.MerchantRoleRepository;
import com.apexpay.repository.UserRepository;
import com.apexpay.service.MerchantService;
import com.apexpay.service.NotificationService;
import com.apexpay.service.TeamManagementService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
public class TeamManagementServiceImpl implements TeamManagementService {

    private final MerchantEmployeeRepository merchantEmployeeRepository;
    private final MerchantRoleRepository merchantRoleRepository;
    private final UserRepository userRepository;
    private final MerchantService merchantService;
    private final NotificationService notificationService;

    public TeamManagementServiceImpl(MerchantEmployeeRepository merchantEmployeeRepository,
                                     MerchantRoleRepository merchantRoleRepository,
                                     UserRepository userRepository,
                                     MerchantService merchantService,
                                     NotificationService notificationService) {
        this.merchantEmployeeRepository = merchantEmployeeRepository;
        this.merchantRoleRepository = merchantRoleRepository;
        this.userRepository = userRepository;
        this.merchantService = merchantService;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional
    public EmployeeResponse inviteEmployee(UUID currentUserId, InviteEmployeeRequest request) {
        Merchant merchant = merchantService.getActiveMerchantForUser(currentUserId);
        validateRole(merchant.getId(), currentUserId, MerchantRoleName.MERCHANT_OWNER, MerchantRoleName.MERCHANT_ADMIN);

        User invitee = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResourceNotFoundException("Target user email does not exist on ApexPay. Employees must register first."));

        if (merchantEmployeeRepository.findByMerchantIdAndUserId(merchant.getId(), invitee.getId()).isPresent()) {
            throw new BusinessException("User is already a team member or has a pending invitation.");
        }

        MerchantRoleName targetRoleName = MerchantRoleName.valueOf(request.role().toUpperCase());
        if (targetRoleName == MerchantRoleName.MERCHANT_OWNER) {
            throw new BusinessException("Cannot invite another employee as Merchant Owner.");
        }

        MerchantRole role = merchantRoleRepository.findByName(targetRoleName)
                .orElseGet(() -> merchantRoleRepository.save(new MerchantRole(targetRoleName)));

        MerchantEmployee emp = new MerchantEmployee();
        emp.setMerchant(merchant);
        emp.setUser(invitee);
        emp.setRole(role);
        emp.setStatus(EmployeeStatus.ACTIVE); // Auto-active for mock simplicity
        emp = merchantEmployeeRepository.save(emp);

        try {
            notificationService.sendNotification(
                    invitee,
                    "Added to Business Team",
                    String.format("You have been added as %s for business '%s'.", targetRoleName.name(), merchant.getBusinessName()),
                    NotificationType.SYSTEM_NOTIFICATION
            );
        } catch (Exception e) {
            log.error("Failed to notify invited employee", e);
        }

        return mapToResponse(emp);
    }

    @Override
    @Transactional
    public EmployeeResponse updateEmployee(UUID currentUserId, UUID employeeMappingId, UpdateEmployeeRequest request) {
        Merchant merchant = merchantService.getActiveMerchantForUser(currentUserId);
        validateRole(merchant.getId(), currentUserId, MerchantRoleName.MERCHANT_OWNER, MerchantRoleName.MERCHANT_ADMIN);

        MerchantEmployee emp = merchantEmployeeRepository.findById(employeeMappingId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee mapping not found."));

        if (!emp.getMerchant().getId().equals(merchant.getId())) {
            throw new BusinessException("Employee does not belong to your merchant.");
        }

        if (emp.getRole().getName() == MerchantRoleName.MERCHANT_OWNER) {
            throw new BusinessException("Cannot change Owner role settings.");
        }

        MerchantRoleName targetRoleName = MerchantRoleName.valueOf(request.role().toUpperCase());
        if (targetRoleName == MerchantRoleName.MERCHANT_OWNER) {
            throw new BusinessException("Cannot change employee role to Owner.");
        }

        MerchantRole role = merchantRoleRepository.findByName(targetRoleName)
                .orElseGet(() -> merchantRoleRepository.save(new MerchantRole(targetRoleName)));

        emp.setRole(role);
        emp.setStatus(EmployeeStatus.valueOf(request.status().toUpperCase()));
        emp = merchantEmployeeRepository.save(emp);

        return mapToResponse(emp);
    }

    @Override
    @Transactional
    public void removeEmployee(UUID currentUserId, UUID employeeMappingId) {
        Merchant merchant = merchantService.getActiveMerchantForUser(currentUserId);
        validateRole(merchant.getId(), currentUserId, MerchantRoleName.MERCHANT_OWNER, MerchantRoleName.MERCHANT_ADMIN);

        MerchantEmployee emp = merchantEmployeeRepository.findById(employeeMappingId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee mapping not found."));

        if (!emp.getMerchant().getId().equals(merchant.getId())) {
            throw new BusinessException("Employee does not belong to your merchant.");
        }

        if (emp.getRole().getName() == MerchantRoleName.MERCHANT_OWNER) {
            throw new BusinessException("Cannot remove the Owner of the business.");
        }

        merchantEmployeeRepository.delete(emp);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EmployeeResponse> getTeamMembers(UUID currentUserId) {
        Merchant merchant = merchantService.getActiveMerchantForUser(currentUserId);
        return merchantEmployeeRepository.findByMerchantId(merchant.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private EmployeeResponse mapToResponse(MerchantEmployee emp) {
        return new EmployeeResponse(
                emp.getId(),
                emp.getUser().getId(),
                emp.getUser().getFullName(),
                emp.getUser().getEmail(),
                emp.getRole().getName().name(),
                emp.getStatus().name(),
                emp.getCreatedAt()
        );
    }

    private void validateRole(UUID merchantId, UUID userId, MerchantRoleName... allowedRoles) {
        MerchantEmployee emp = merchantEmployeeRepository.findByMerchantIdAndUserId(merchantId, userId)
                .orElseThrow(() -> new BusinessException("You are not an employee of this business."));
        
        boolean authorized = java.util.Arrays.stream(allowedRoles)
                .anyMatch(r -> emp.getRole().getName() == r);
        
        if (!authorized) {
            throw new BusinessException("Unauthorized action for your role.");
        }
    }
}
