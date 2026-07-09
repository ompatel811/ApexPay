package com.apexpay.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.MockitoAnnotations;

import com.apexpay.entity.User;
import com.apexpay.entity.Wallet;
import com.apexpay.entity.enums.AccountStatus;
import com.apexpay.entity.enums.WalletStatus;
import com.apexpay.exception.BusinessException;
import com.apexpay.repository.QRCodeRepository;
import com.apexpay.repository.UserRepository;
import com.apexpay.repository.WalletRepository;
import com.apexpay.service.impl.QRValidationServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;

public class QRValidationServiceTest {

    @Mock
    private QRGeneratorService qrGeneratorService;

    @Mock
    private QRCodeRepository qrCodeRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private WalletRepository walletRepository;

    private QRValidationService qrValidationService;
    private ObjectMapper objectMapper;

    @BeforeEach
    @SuppressWarnings("unused")
    void setUp() {
        MockitoAnnotations.openMocks(this);
        objectMapper = new ObjectMapper();
        qrValidationService = new QRValidationServiceImpl(
                qrGeneratorService, qrCodeRepository, userRepository, walletRepository, objectMapper
        );
    }

    @Test
    void validateQRCode_ShouldThrowException_WhenSignatureIsInvalid() {
        String invalidPayload = "{\"signature\":\"invalid\"}";
        when(qrGeneratorService.verifySignature(invalidPayload)).thenReturn(false);

        BusinessException exception = assertThrows(BusinessException.class, () ->
                qrValidationService.validateQRCode(invalidPayload));
        assertTrue(exception.getMessage().contains("signature verification failed"));
    }

    @Test
    void validateQRCode_ShouldThrowException_WhenQRIsExpired() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID walletId = UUID.randomUUID();
        LocalDateTime pastTime = LocalDateTime.now().minusMinutes(5);

        Map<String, Object> payload = new HashMap<>();
        payload.put("userId", userId.toString());
        payload.put("walletId", walletId.toString());
        payload.put("type", "DYNAMIC");
        payload.put("expiration", pastTime.toString());

        String json = objectMapper.writeValueAsString(payload);

        when(qrGeneratorService.verifySignature(json)).thenReturn(true);
        when(userRepository.findById(userId)).thenReturn(Optional.of(new User() {{
            setAccountStatus(AccountStatus.ACTIVE);
        }}));
        when(walletRepository.findById(walletId)).thenReturn(Optional.of(new Wallet() {{
            setWalletStatus(WalletStatus.ACTIVE);
        }}));

        BusinessException exception = assertThrows(BusinessException.class, () ->
                qrValidationService.validateQRCode(json));
        assertEquals("QR Code has expired.", exception.getMessage());
    }
}
