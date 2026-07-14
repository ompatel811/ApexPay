package com.apexpay.service.admin;

import com.apexpay.dto.admin.*;
import com.apexpay.entity.User;
import java.util.List;
import java.util.UUID;

public interface FraudService {
    List<FraudAlertResponse> getAllAlerts();
    List<User> getHighRiskUsers();
    FraudAlertResponse reviewAlert(FraudReviewRequest request, String performedBy);
    void blockEntity(BlacklistRequest request, String performedBy);
    void freezeEntity(String type, UUID entityId, String performedBy);
    void whitelistEntity(WhitelistRequest request, String performedBy);
    InvestigationResponse getInvestigation(UUID id);
    InvestigationResponse updateInvestigation(UUID id, String status, String notes, String performedBy);
}
