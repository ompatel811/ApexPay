package com.apexpay.service;

import com.apexpay.dto.GenerateQRCodeRequest;
import com.apexpay.dto.GenerateQRCodeResponse;
import com.apexpay.dto.QRHistoryResponse;
import com.apexpay.entity.QRCode;

import java.util.List;
import java.util.UUID;

/**
 * Service managing generated QR Code entities, lookups and history.
 */
public interface QRCodeService {
    GenerateQRCodeResponse generatePersonalQR(UUID userId);
    GenerateQRCodeResponse generateDynamicQR(UUID userId, GenerateQRCodeRequest request);
    GenerateQRCodeResponse generateRequestQR(UUID userId, GenerateQRCodeRequest request);
    QRCode getQRDetails(UUID id, UUID currentUserId);
    List<QRHistoryResponse> getQRHistory(UUID userId);
    void revokeQR(UUID id, UUID currentUserId);
}
