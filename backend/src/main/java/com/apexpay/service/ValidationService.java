package com.apexpay.service;

import java.util.UUID;

import com.apexpay.dto.SendMoneyRequest;

/**
 * Service managing transactional validations for wallet-to-wallet transfers.
 */
public interface ValidationService {
    void validateTransfer(UUID senderUserId, SendMoneyRequest request);
    void validateIdempotency(String idempotencyKey);
}
