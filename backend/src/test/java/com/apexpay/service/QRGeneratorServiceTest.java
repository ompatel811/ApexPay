package com.apexpay.service;

import com.apexpay.service.impl.QRGeneratorServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class QRGeneratorServiceTest {

    private QRGeneratorService qrGeneratorService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        // Instantiate using a dummy secret key
        qrGeneratorService = new QRGeneratorServiceImpl("9a72635df0a693c091d3f44e18d96e57a0bc077bdfa67b2d56a31c518d6a8b79", objectMapper);
    }

    @Test
    void signPayload_ShouldAddValidSignature() throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", "b062723b-6dc2-42d0-82e3-da0c578b0ab0");
        payload.put("walletId", "51c518d6-a8b7-9a72-635d-f0a693c091d3");
        payload.put("type", "PERSONAL");

        String rawJson = objectMapper.writeValueAsString(payload);
        String signedJson = qrGeneratorService.signPayload(rawJson);

        assertNotNull(signedJson);
        assertTrue(signedJson.contains("signature"));

        // Verify signature check passes
        assertTrue(qrGeneratorService.verifySignature(signedJson));
    }

    @Test
    void verifySignature_ShouldReturnFalse_WhenPayloadIsTampered() throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", "b062723b-6dc2-42d0-82e3-da0c578b0ab0");
        payload.put("walletId", "51c518d6-a8b7-9a72-635d-f0a693c091d3");
        payload.put("type", "DYNAMIC");
        payload.put("amount", "100.00");

        String rawJson = objectMapper.writeValueAsString(payload);
        String signedJson = qrGeneratorService.signPayload(rawJson);

        // Tamper with the amount
        String tamperedJson = signedJson.replace("\"amount\":\"100.00\"", "\"amount\":\"200.00\"");

        assertFalse(qrGeneratorService.verifySignature(tamperedJson), "Tampered amount must fail signature checks.");
    }

    @Test
    void generateQRCodeBase64_ShouldReturnValidImage() {
        assertDoesNotThrow(() -> {
            String base64 = qrGeneratorService.generateQRCodeBase64("ApexPay Verification", 200, 200);
            assertNotNull(base64);
            assertFalse(base64.trim().isEmpty());
        });
    }
}
