package com.apexpay.service;

import com.apexpay.dto.AddBeneficiaryRequest;
import com.apexpay.dto.BeneficiaryResponse;
import com.apexpay.dto.UserProfileResponse;

import java.util.List;
import java.util.UUID;

/**
 * Service managing user beneficiaries and searches for peers.
 */
public interface BeneficiaryService {
    BeneficiaryResponse addBeneficiary(UUID userId, AddBeneficiaryRequest request);
    List<BeneficiaryResponse> getBeneficiaries(UUID userId);
    List<BeneficiaryResponse> searchBeneficiaries(UUID userId, String nicknameQuery);
    List<UserProfileResponse> searchPlatformUsers(UUID currentUserId, String searchQuery);
}
