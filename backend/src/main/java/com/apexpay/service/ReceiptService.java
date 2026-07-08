package com.apexpay.service;

import com.apexpay.dto.PaymentReceiptResponse;
import java.util.UUID;

/**
 * Service managing receipt generation, parsing and printable receipts compiling.
 */
public interface ReceiptService {
    PaymentReceiptResponse getReceipt(UUID transactionId, UUID currentUserId);
}
