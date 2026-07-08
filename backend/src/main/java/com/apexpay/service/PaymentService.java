package com.apexpay.service;

import com.apexpay.dto.PaymentValidationResponse;
import com.apexpay.dto.SendMoneyRequest;
import com.apexpay.dto.SendMoneyResponse;
import java.util.UUID;

/**
 * Orchestrating service for processing, validating and cancelling payments.
 */
public interface PaymentService {
    SendMoneyResponse processTransfer(UUID senderUserId, SendMoneyRequest request);
    PaymentValidationResponse validateTransferRequest(UUID senderUserId, SendMoneyRequest request);
    void cancelPayment(UUID transactionId, UUID currentUserId);
}
