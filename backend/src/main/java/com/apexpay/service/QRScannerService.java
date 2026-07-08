package com.apexpay.service;

/**
 * Service managing decoding of QR Codes (from text strings or image uploads).
 */
public interface QRScannerService {
    String decodeQRCodeText(String qrString);
    String decodeQRCodeImage(byte[] imageBytes) throws Exception;
}
