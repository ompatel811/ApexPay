package com.apexpay.service;

import com.apexpay.dto.QRPaymentRequest;
import com.apexpay.dto.QRPaymentResponse;
import com.apexpay.dto.ScanQRRequest;
import com.apexpay.dto.ScanQRResponse;
import java.util.UUID;

/**
 * Service managing scan decoding validation and executing payments via Module 6 engines.
 */
public interface QRPaymentService {
    ScanQRResponse scanQRCode(ScanQRRequest request);
    QRPaymentResponse executeQRPayment(UUID senderUserId, QRPaymentRequest request);
}
