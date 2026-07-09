package com.apexpay.service;

import com.apexpay.dto.SettlementResponse;
import java.util.List;
import java.util.UUID;

public interface SettlementService {
    List<SettlementResponse> getSettlements(UUID currentUserId);
    SettlementResponse triggerManualSettlement(UUID currentUserId);
    void simulateSettlementsJob();
}
