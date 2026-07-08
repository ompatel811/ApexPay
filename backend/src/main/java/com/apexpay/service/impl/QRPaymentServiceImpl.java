package com.apexpay.service.impl;

import com.apexpay.dto.QRPaymentRequest;
import com.apexpay.dto.QRPaymentResponse;
import com.apexpay.dto.ScanQRRequest;
import com.apexpay.dto.ScanQRResponse;
import com.apexpay.entity.QRCode;
import com.apexpay.entity.Transaction;
import com.apexpay.entity.User;
import com.apexpay.entity.Wallet;
import com.apexpay.exception.BusinessException;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.QRCodeRepository;
import com.apexpay.repository.UserRepository;
import com.apexpay.repository.WalletRepository;
import com.apexpay.service.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
public class QRPaymentServiceImpl implements QRPaymentService {

    private final QRScannerService qrScannerService;
    private final QRValidationService qrValidationService;
    private final PaymentIntegrationService paymentIntegrationService;
    private final QRCodeRepository qrCodeRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final ObjectMapper objectMapper;

    public QRPaymentServiceImpl(QRScannerService qrScannerService,
                                QRValidationService qrValidationService,
                                PaymentIntegrationService paymentIntegrationService,
                                QRCodeRepository qrCodeRepository,
                                UserRepository userRepository,
                                WalletRepository walletRepository,
                                ObjectMapper objectMapper) {
        this.qrScannerService = qrScannerService;
        this.qrValidationService = qrValidationService;
        this.paymentIntegrationService = paymentIntegrationService;
        this.qrCodeRepository = qrCodeRepository;
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public ScanQRResponse scanQRCode(ScanQRRequest request) {
        log.info("Request received to decode and scan QR Code.");
        String decodedPayload;

        try {
            if (request.qrImageBase64() != null && !request.qrImageBase64().trim().isEmpty()) {
                // Strip header if present
                String base64Data = request.qrImageBase64();
                if (base64Data.contains(",")) {
                    base64Data = base64Data.split(",")[1];
                }
                byte[] imageBytes = Base64.getDecoder().decode(base64Data.trim());
                decodedPayload = qrScannerService.decodeQRCodeImage(imageBytes);
            } else {
                decodedPayload = qrScannerService.decodeQRCodeText(request.qrString());
            }

            // Run cryptographically signatures and expiration validations
            qrValidationService.validateQRCode(decodedPayload);

            // Parse metadata
            Map<String, Object> map = objectMapper.readValue(decodedPayload, new TypeReference<Map<String, Object>>() {});
            String userIdStr = (String) map.get("userId");
            String walletIdStr = (String) map.get("walletId");
            String type = (String) map.get("type");
            String amountStr = (String) map.get("amount");
            String currency = (String) map.get("currency");
            String remarks = (String) map.get("remarks");
            String reference = (String) map.get("reference");

            UUID userId = UUID.fromString(userIdStr);
            User recipient = userRepository.findById(userId).orElseThrow();
            Wallet wallet = walletRepository.findByUserId(userId).orElseThrow();

            BigDecimal amount = (amountStr != null) ? new BigDecimal(amountStr) : BigDecimal.ZERO;
            UUID qrCodeId = null;

            if (reference != null && !reference.trim().isEmpty()) {
                Optional<QRCode> dbQrOpt = qrCodeRepository.findByReferenceNumber(reference);
                if (dbQrOpt.isPresent()) {
                    qrCodeId = dbQrOpt.get().getId();
                }
            }

            return new ScanQRResponse(
                    qrCodeId,
                    type,
                    recipient.getId(),
                    wallet.getId(),
                    recipient.getFullName(),
                    recipient.getUsername(),
                    wallet.getWalletNumber(),
                    amount,
                    currency,
                    remarks,
                    reference,
                    true,
                    "QR verified successfully",
                    true
            );

        } catch (BusinessException | ResourceNotFoundException e) {
            log.warn("QR Scan validation failed: {}", e.getMessage());
            return new ScanQRResponse(
                    null, null, null, null, null, null, null,
                    BigDecimal.ZERO, null, null, null,
                    false, e.getMessage(), false
            );
        } catch (Exception e) {
            log.error("Failed to decode scanned QR code", e);
            return new ScanQRResponse(
                    null, null, null, null, null, null, null,
                    BigDecimal.ZERO, null, null, null,
                    false, "Failed to decode scanned QR code: " + e.getMessage(), false
            );
        }
    }

    @Override
    @Transactional
    public QRPaymentResponse executeQRPayment(UUID senderUserId, QRPaymentRequest request) {
        log.info("Executing payment via scanned QR. Sender: {}, QR IdempotencyKey: {}", senderUserId, request.idempotencyKey());

        // 1. Run signature checks, payload verification
        qrValidationService.validateQRCode(request.qrData());

        try {
            Map<String, Object> map = objectMapper.readValue(request.qrData(), new TypeReference<Map<String, Object>>() {});
            String type = (String) map.get("type");
            String recipientUserIdStr = (String) map.get("userId");
            String amountStr = (String) map.get("amount");
            String reference = (String) map.get("reference");
            String currency = (String) map.get("currency");
            String payloadRemarks = (String) map.get("remarks");

            UUID recipientUserId = UUID.fromString(recipientUserIdStr);
            Wallet receiverWallet = walletRepository.findByUserId(recipientUserId)
                    .orElseThrow(() -> new ResourceNotFoundException("Recipient wallet not found."));

            BigDecimal finalAmount;
            if ("PERSONAL".equalsIgnoreCase(type)) {
                // Personal QR: Amount must be supplied by the sender in the request
                if (request.amount() == null || request.amount().compareTo(BigDecimal.ZERO) <= 0) {
                    throw new BusinessException("Amount must be specified for Personal QR transfers.");
                }
                finalAmount = request.amount();
            } else {
                // Dynamic QR/Request: Amount is locked in signed JSON payload to prevent tamper attempts
                if (amountStr == null || new BigDecimal(amountStr).compareTo(BigDecimal.ZERO) <= 0) {
                    throw new BusinessException("QR payload does not contain a valid payment amount.");
                }
                finalAmount = new BigDecimal(amountStr);
            }

            String finalRemarks = request.remarks() != null && !request.remarks().trim().isEmpty() 
                    ? request.remarks() 
                    : (payloadRemarks != null ? payloadRemarks : "QR Code Payment");

            // 2. Delegate execution to Module 6 PaymentService
            Transaction tx = paymentIntegrationService.delegateTransfer(
                    senderUserId, receiverWallet.getWalletNumber(), finalAmount, finalRemarks, request.idempotencyKey()
            );

            // 3. Update dynamic database QR Status to USED
            if (reference != null && !reference.trim().isEmpty()) {
                qrCodeRepository.findByReferenceNumber(reference).ifPresent(qr -> {
                    if ("DYNAMIC".equalsIgnoreCase(qr.getQrType()) || "REQUEST".equalsIgnoreCase(qr.getQrType())) {
                        qr.setStatus("USED");
                        qr.setUpdatedAt(LocalDateTime.now());
                        qrCodeRepository.save(qr);
                        log.info("Dynamic QR code reference {} updated to status USED.", reference);
                    }
                });
            }

            return new QRPaymentResponse(
                    tx.getTransactionReference(),
                    tx.getId(),
                    tx.getPaymentStatus().name(),
                    tx.getAmount(),
                    currency != null ? currency : receiverWallet.getCurrency(),
                    receiverWallet.getUser().getFullName(),
                    tx.getCreatedAt(),
                    tx.getRemarks()
            );

        } catch (BusinessException | ResourceNotFoundException ex) {
            throw ex;
        } catch (Exception e) {
            log.error("Failed executing QR payment", e);
            throw new BusinessException("QR Payment transaction failed: " + e.getMessage());
        }
    }
}
