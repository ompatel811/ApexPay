package com.apexpay.service;

import com.apexpay.dto.CreatePaymentLinkRequest;
import com.apexpay.dto.PaymentLinkResponse;
import com.apexpay.dto.SendMoneyResponse;
import java.util.List;
import java.util.UUID;

public interface PaymentLinkService {
    PaymentLinkResponse createPaymentLink(UUID currentUserId, CreatePaymentLinkRequest request);
    List<PaymentLinkResponse> getPaymentLinks(UUID currentUserId);
    PaymentLinkResponse getPaymentLinkByReference(String referenceNumber);
    SendMoneyResponse payPaymentLink(String referenceNumber, UUID customerUserId, String idempotencyKey);
}
