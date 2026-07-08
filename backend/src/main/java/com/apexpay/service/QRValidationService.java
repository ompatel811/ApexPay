package com.apexpay.service;

import com.apexpay.entity.QRCode;

/**
 * Service managing database and signature verification for scanned QR Codes.
 */
public interface QRValidationService {
    void validateQRCode(String signedJson);
    void validateQRCodeStatus(QRCode qrCode);
}
