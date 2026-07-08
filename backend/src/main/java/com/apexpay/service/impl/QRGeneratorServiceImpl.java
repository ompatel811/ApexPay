package com.apexpay.service.impl;

import com.apexpay.service.QRGeneratorService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Slf4j
@Service
public class QRGeneratorServiceImpl implements QRGeneratorService {

    private final String hmacSecret;
    private final ObjectMapper objectMapper;

    public QRGeneratorServiceImpl(
            @Value("${app.security.jwt.secret}") String jwtSecret,
            ObjectMapper objectMapper) {
        this.hmacSecret = jwtSecret; // Reuse JWT secret for HMAC signing
        this.objectMapper = objectMapper;
    }

    @Override
    public byte[] generateQRCodeImage(String text, int width, int height) throws Exception {
        log.debug("Rendering QR Code image using ZXing. Text size: {}", text.length());
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrCodeWriter.encode(text, BarcodeFormat.QR_CODE, width, height);

        ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
        return pngOutputStream.toByteArray();
    }

    @Override
    public String generateQRCodeBase64(String text, int width, int height) throws Exception {
        byte[] imageBytes = this.generateQRCodeImage(text, width, height);
        return Base64.getEncoder().encodeToString(imageBytes);
    }

    @Override
    public String signPayload(String jsonPayload) {
        try {
            Map<String, Object> map = objectMapper.readValue(jsonPayload, new TypeReference<Map<String, Object>>() {});
            // Remove any signature before signing
            map.remove("signature");

            // Canonical serialize by sorting keys
            String canonicalString = getCanonicalString(map);
            String signature = calculateHmac(canonicalString);

            map.put("signature", signature);
            return objectMapper.writeValueAsString(map);
        } catch (Exception e) {
            log.error("Failed to sign QR payload", e);
            throw new RuntimeException("QR Code signing failed", e);
        }
    }

    @Override
    public boolean verifySignature(String signedJson) {
        try {
            Map<String, Object> map = objectMapper.readValue(signedJson, new TypeReference<Map<String, Object>>() {});
            String signature = (String) map.get("signature");
            if (signature == null) {
                return false;
            }

            map.remove("signature");
            String canonicalString = getCanonicalString(map);
            String calculatedSignature = calculateHmac(canonicalString);

            return signature.equals(calculatedSignature);
        } catch (Exception e) {
            log.error("Failed to verify signature for QR payload", e);
            return false;
        }
    }

    private String getCanonicalString(Map<String, Object> map) {
        SortedMap<String, Object> sortedMap = new TreeMap<>(map);
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, Object> entry : sortedMap.entrySet()) {
            if (entry.getValue() != null) {
                sb.append(entry.getKey()).append("=").append(entry.getValue().toString()).append("&");
            }
        }
        return sb.toString();
    }

    private String calculateHmac(String data) throws Exception {
        Mac sha256Hmac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(hmacSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        sha256Hmac.init(secretKey);
        byte[] hash = sha256Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        
        // Convert to hex
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
