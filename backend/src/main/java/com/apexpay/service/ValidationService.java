package com.apexpay.service;

import com.apexpay.dto.SendMoneyRequest;
import com.apexpay.entity.Wallet;
import java.util.UUID;

/**
 * Service managing transactional validations for wallet-to-wallet transfers.
 */
public interface ValidationService {
    void validateTransfer(UUID senderUserId, SendMoneyRequest request);
    void validateIdempotency(String idempotencyKey);
}
