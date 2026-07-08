package com.apexpay.service;

/**
 * Service managing QR Code cryptographic signing and image rendering (PNG, Base64).
 */
public interface QRGeneratorService {
    byte[] generateQRCodeImage(String text, int width, int height) throws Exception;
    String generateQRCodeBase64(String text, int width, int height) throws Exception;
    String signPayload(String jsonPayload);
    boolean verifySignature(String signedJson);
}
