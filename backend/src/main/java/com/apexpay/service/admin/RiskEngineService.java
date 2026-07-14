package com.apexpay.service.admin;

import com.apexpay.dto.SendMoneyRequest;
import com.apexpay.entity.admin.FraudAlert;
import java.util.UUID;

public interface RiskEngineService {
    FraudAlert evaluateTransaction(UUID senderUserId, SendMoneyRequest request);
}
