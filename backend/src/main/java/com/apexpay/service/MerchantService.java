package com.apexpay.service;

import com.apexpay.dto.*;
import com.apexpay.entity.Merchant;
import java.util.UUID;

public interface MerchantService {
    MerchantProfileResponse registerMerchant(UUID ownerUserId, BusinessRegisterRequest request);
    MerchantProfileResponse getMerchantProfile(UUID currentUserId);
    MerchantProfileResponse updateMerchantProfile(UUID currentUserId, BusinessProfileUpdateRequest request);
    MerchantProfileResponse submitKyc(UUID currentUserId, KycSubmitRequest request);
    MerchantProfileResponse simulateKycVerification(UUID currentUserId, KycVerifySimulateRequest request);
    Merchant getActiveMerchantForUser(UUID userId);
    MerchantDashboardResponse getDashboardMetrics(UUID currentUserId);
    MerchantAnalyticsResponse getMerchantAnalytics(UUID currentUserId);
}
