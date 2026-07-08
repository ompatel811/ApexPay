package com.apexpay.service.impl;

import com.apexpay.entity.QRCode;
import com.apexpay.entity.User;
import com.apexpay.entity.Wallet;
import com.apexpay.entity.enums.AccountStatus;
import com.apexpay.entity.enums.WalletStatus;
import com.apexpay.exception.BusinessException;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.QRCodeRepository;
import com.apexpay.repository.UserRepository;
import com.apexpay.repository.WalletRepository;
import com.apexpay.service.QRGeneratorService;
import com.apexpay.service.QRValidationService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class QRValidationServiceImpl implements QRValidationService {

    private final QRGeneratorService qrGeneratorService;
    private final QRCodeRepository qrCodeRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final ObjectMapper objectMapper;

    public QRValidationServiceImpl(QRGeneratorService qrGeneratorService,
                                   QRCodeRepository qrCodeRepository,
                                   UserRepository userRepository,
                                   WalletRepository walletRepository,
                                   ObjectMapper objectMapper) {
        this.qrGeneratorService = qrGeneratorService;
        this.qrCodeRepository = qrCodeRepository;
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public void validateQRCode(String signedJson) {
        log.info("Running validation checks on scanned QR payload.");

        // 1. Validate QR Integrity / Signature
        if (!qrGeneratorService.verifySignature(signedJson)) {
            throw new BusinessException("QR Code signature verification failed. Payload might be tampered.");
        }

        try {
            Map<String, Object> map = objectMapper.readValue(signedJson, new TypeReference<Map<String, Object>>() {});
            
            String userIdStr = (String) map.get("userId");
            String walletIdStr = (String) map.get("walletId");
            String type = (String) map.get("type");
            String reference = (String) map.get("reference");
            String expirationStr = (String) map.get("expiration");

            UUID userId = UUID.fromString(userIdStr);
            UUID walletId = UUID.fromString(walletIdStr);

            // 2. Validate Receiver status
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Receiver profile associated with QR not found."));
            if (user.getAccountStatus() != AccountStatus.ACTIVE) {
                throw new BusinessException("Receiver profile is inactive or blocked. Status: " + user.getAccountStatus());
            }

            Wallet wallet = walletRepository.findById(walletId)
                    .orElseThrow(() -> new ResourceNotFoundException("Receiver wallet associated with QR not found."));
            if (wallet.getWalletStatus() != WalletStatus.ACTIVE) {
                throw new BusinessException("Receiver wallet is frozen or inactive. Status: " + wallet.getWalletStatus());
            }

            // 3. Database Status checks (for Dynamic / Request QRs that register in DB)
            if (reference != null && !reference.trim().isEmpty()) {
                qrCodeRepository.findByReferenceNumber(reference).ifPresent(this::validateQRCodeStatus);
            }

            // 4. Payload-level Expiration checks
            if (expirationStr != null && !expirationStr.trim().isEmpty()) {
                LocalDateTime expiration = LocalDateTime.parse(expirationStr);
                if (LocalDateTime.now().isAfter(expiration)) {
                    throw new BusinessException("QR Code has expired.");
                }
            }

        } catch (BusinessException | ResourceNotFoundException ex) {
            throw ex;
        } catch (Exception e) {
            log.error("Failed to parse and validate QR JSON content", e);
            throw new BusinessException("Scanned QR contains invalid format parameters.");
        }
    }

    @Override
    public void validateQRCodeStatus(QRCode qrCode) {
        log.debug("Validating stored QRCode status. Current status: {}", qrCode.getStatus());
        if (!"ACTIVE".equalsIgnoreCase(qrCode.getStatus())) {
            throw new BusinessException("QR Code is no longer active. Current status: " + qrCode.getStatus());
        }

        if (qrCode.getExpirationDate() != null && LocalDateTime.now().isAfter(qrCode.getExpirationDate())) {
            qrCode.setStatus("EXPIRED");
            qrCodeRepository.save(qrCode);
            throw new BusinessException("QR Code has expired.");
        }
    }
}
