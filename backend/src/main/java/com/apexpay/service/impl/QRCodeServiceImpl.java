package com.apexpay.service.impl;

import com.apexpay.dto.GenerateQRCodeRequest;
import com.apexpay.dto.GenerateQRCodeResponse;
import com.apexpay.dto.QRHistoryResponse;
import com.apexpay.entity.QRCode;
import com.apexpay.entity.User;
import com.apexpay.entity.Wallet;
import com.apexpay.exception.BusinessException;
import com.apexpay.exception.ForbiddenException;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.QRCodeRepository;
import com.apexpay.repository.UserRepository;
import com.apexpay.repository.WalletRepository;
import com.apexpay.service.QRCodeService;
import com.apexpay.service.QRGeneratorService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class QRCodeServiceImpl implements QRCodeService {

    private final QRCodeRepository qrCodeRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final QRGeneratorService qrGeneratorService;
    private final ObjectMapper objectMapper;

    public QRCodeServiceImpl(QRCodeRepository qrCodeRepository,
                             UserRepository userRepository,
                             WalletRepository walletRepository,
                             QRGeneratorService qrGeneratorService,
                             ObjectMapper objectMapper) {
        this.qrCodeRepository = qrCodeRepository;
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
        this.qrGeneratorService = qrGeneratorService;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public GenerateQRCodeResponse generatePersonalQR(UUID userId) {
        log.info("Generating Personal QR for user UUID: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found."));

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("userId", user.getId().toString());
            payload.put("walletId", wallet.getId().toString());
            payload.put("type", "PERSONAL");
            payload.put("username", user.getUsername());
            payload.put("displayName", user.getFullName());

            String rawJson = objectMapper.writeValueAsString(payload);
            String signedJson = qrGeneratorService.signPayload(rawJson);
            String base64 = qrGeneratorService.generateQRCodeBase64(signedJson, 300, 300);

            return new GenerateQRCodeResponse(
                    null, "PERSONAL", signedJson, base64, null,
                    BigDecimal.ZERO, wallet.getCurrency(), null, "ACTIVE"
            );
        } catch (Exception e) {
            log.error("Failed to generate personal QR", e);
            throw new BusinessException("Personal QR Code generation failed.");
        }
    }

    @Override
    @Transactional
    public GenerateQRCodeResponse generateDynamicQR(UUID userId, GenerateQRCodeRequest request) {
        log.info("Generating Dynamic QR for user UUID: {}. Amount: {}", userId, request.amount());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found."));

        if (request.amount() == null || request.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Dynamic payment QR must specify a positive amount.");
        }

        String ref = "QR" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
        int expiryMin = request.expirationMinutes() != null ? request.expirationMinutes() : 10;
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(expiryMin);

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("userId", user.getId().toString());
            payload.put("walletId", wallet.getId().toString());
            payload.put("type", "DYNAMIC");
            payload.put("amount", request.amount().toString());
            payload.put("currency", wallet.getCurrency());
            payload.put("reference", ref);
            payload.put("remarks", request.remarks() != null ? request.remarks() : "Dynamic Pay");
            payload.put("expiration", expiry.toString());

            String rawJson = objectMapper.writeValueAsString(payload);
            String signedJson = qrGeneratorService.signPayload(rawJson);
            String base64 = qrGeneratorService.generateQRCodeBase64(signedJson, 300, 300);

            // Save QRCode entity
            QRCode qrCode = new QRCode();
            qrCode.setUser(user);
            qrCode.setQrType("DYNAMIC");
            qrCode.setQrValue(signedJson); // legacy compatibility
            qrCode.setQrData(signedJson);
            qrCode.setReferenceNumber(ref);
            qrCode.setWallet(wallet);
            qrCode.setAmount(request.amount());
            qrCode.setCurrency(wallet.getCurrency());
            qrCode.setExpirationDate(expiry);
            qrCode.setStatus("ACTIVE");
            qrCode.setCreatedAt(LocalDateTime.now());
            qrCode.setUpdatedAt(LocalDateTime.now());

            QRCode saved = qrCodeRepository.save(qrCode);

            return new GenerateQRCodeResponse(
                    saved.getId(), "DYNAMIC", signedJson, base64, ref,
                    request.amount(), wallet.getCurrency(), expiry, "ACTIVE"
            );

        } catch (Exception e) {
            log.error("Failed to generate dynamic QR", e);
            throw new BusinessException("Dynamic QR Code generation failed.");
        }
    }

    @Override
    @Transactional
    public GenerateQRCodeResponse generateRequestQR(UUID userId, GenerateQRCodeRequest request) {
        log.info("Generating Request Money QR for user UUID: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found."));

        String ref = "REQ" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
        int expiryMin = request.expirationMinutes() != null ? request.expirationMinutes() : 60; // Requests stay longer
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(expiryMin);

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("userId", user.getId().toString());
            payload.put("walletId", wallet.getId().toString());
            payload.put("type", "REQUEST");
            payload.put("amount", request.amount() != null ? request.amount().toString() : "0.0");
            payload.put("currency", wallet.getCurrency());
            payload.put("reference", ref);
            payload.put("remarks", request.remarks() != null ? request.remarks() : "Request payment");
            payload.put("expiration", expiry.toString());

            String rawJson = objectMapper.writeValueAsString(payload);
            String signedJson = qrGeneratorService.signPayload(rawJson);
            String base64 = qrGeneratorService.generateQRCodeBase64(signedJson, 300, 300);

            // Save QRCode entity
            QRCode qrCode = new QRCode();
            qrCode.setUser(user);
            qrCode.setQrType("REQUEST");
            qrCode.setQrValue(signedJson);
            qrCode.setQrData(signedJson);
            qrCode.setReferenceNumber(ref);
            qrCode.setWallet(wallet);
            qrCode.setAmount(request.amount());
            qrCode.setCurrency(wallet.getCurrency());
            qrCode.setExpirationDate(expiry);
            qrCode.setStatus("ACTIVE");
            qrCode.setCreatedAt(LocalDateTime.now());
            qrCode.setUpdatedAt(LocalDateTime.now());

            QRCode saved = qrCodeRepository.save(qrCode);

            return new GenerateQRCodeResponse(
                    saved.getId(), "REQUEST", signedJson, base64, ref,
                    request.amount(), wallet.getCurrency(), expiry, "ACTIVE"
            );

        } catch (Exception e) {
            log.error("Failed to generate request QR", e);
            throw new BusinessException("Request QR Code generation failed.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public QRCode getQRDetails(UUID id, UUID currentUserId) {
        QRCode qrCode = qrCodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("QR Code record not found."));

        if (!qrCode.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("You are not authorized to view this QR record.");
        }
        return qrCode;
    }

    @Override
    @Transactional(readOnly = true)
    public List<QRHistoryResponse> getQRHistory(UUID userId) {
        log.info("Fetching QR code histories for user UUID: {}", userId);
        return qrCodeRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(qr -> new QRHistoryResponse(
                        qr.getId(),
                        qr.getQrType(),
                        qr.getReferenceNumber(),
                        qr.getAmount(),
                        qr.getCurrency(),
                        qr.getExpirationDate(),
                        qr.getStatus(),
                        qr.getCreatedAt()
                ))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void revokeQR(UUID id, UUID currentUserId) {
        QRCode qrCode = qrCodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("QR Code record not found."));

        if (!qrCode.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("You are not authorized to revoke this QR.");
        }

        qrCode.setStatus("CANCELLED");
        qrCode.setUpdatedAt(LocalDateTime.now());
        qrCodeRepository.save(qrCode);
        log.info("QR Code successfully cancelled/revoked. Ref: {}", qrCode.getReferenceNumber());
    }
}
