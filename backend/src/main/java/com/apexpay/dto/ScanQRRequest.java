package com.apexpay.dto;

/**
 * DTO representing scan request (with raw text or uploaded image base64).
 */
public record ScanQRRequest(
        String qrString,
        String qrImageBase64 // Base64 encoded PNG/JPEG image upload fallback
) {}
