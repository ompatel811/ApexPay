package com.apexpay.controller;

import com.apexpay.dto.*;
import com.apexpay.entity.QRCode;
import com.apexpay.security.UserPrincipal;
import com.apexpay.service.QRCodeService;
import com.apexpay.service.QRPaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/qr")
@PreAuthorize("isAuthenticated()")
@Tag(name = "QR Payment System", description = "Endpoints for generating, scanning, validating, and settling payments using QR Codes")
@SecurityRequirement(name = "Bearer Authentication")
public class QRCodeController {

    private final QRCodeService qrCodeService;
    private final QRPaymentService qrPaymentService;

    public QRCodeController(QRCodeService qrCodeService,
                            QRPaymentService qrPaymentService) {
        this.qrCodeService = qrCodeService;
        this.qrPaymentService = qrPaymentService;
    }

    @PostMapping("/generate")
    @Operation(summary = "Generate Personal QR Code", description = "Generates a static personal QR containing receiver account coordinates. Can be saved to receive funds.")
    public ResponseEntity<ApiResponse<GenerateQRCodeResponse>> generatePersonalQR(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        GenerateQRCodeResponse response = qrCodeService.generatePersonalQR(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Personal QR generated successfully", response));
    }

    @PostMapping("/generate-dynamic")
    @Operation(summary = "Generate Dynamic QR Code", description = "Generates a dynamic payment QR code with a pre-set amount, expiration date, and signature.")
    public ResponseEntity<ApiResponse<GenerateQRCodeResponse>> generateDynamicQR(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody GenerateQRCodeRequest request) {
        GenerateQRCodeResponse response = qrCodeService.generateDynamicQR(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Dynamic QR generated successfully", response));
    }

    @PostMapping("/request-money")
    @Operation(summary = "Generate Request Money QR", description = "Generates a request money QR code containing payment message details.")
    public ResponseEntity<ApiResponse<GenerateQRCodeResponse>> generateRequestQR(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody GenerateQRCodeRequest request) {
        GenerateQRCodeResponse response = qrCodeService.generateRequestQR(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Request QR generated successfully", response));
    }

    @PostMapping("/scan")
    @Operation(summary = "Scan and Decode QR Code", description = "Decodes a scanned QR string or base64 image upload, validates its HMAC signature, and returns recipient details.")
    public ResponseEntity<ApiResponse<ScanQRResponse>> scanQRCode(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody ScanQRRequest request) {
        ScanQRResponse response = qrPaymentService.scanQRCode(request);
        return ResponseEntity.ok(ApiResponse.success("QR scanned and verified successfully", response));
    }

    @PostMapping("/pay")
    @Operation(summary = "Pay Scanned QR Code", description = "Executes the balance settlement transfer using scanned QR signed payload. Invokes Module 6 PaymentService underneath.")
    public ResponseEntity<ApiResponse<QRPaymentResponse>> executeQRPayment(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody QRPaymentRequest request) {
        QRPaymentResponse response = qrPaymentService.executeQRPayment(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("QR Payment completed successfully", response));
    }

    @GetMapping("/history")
    @Operation(summary = "Get Generated QR History", description = "Retrieves history of generated dynamic and request QR codes for the authenticated user.")
    public ResponseEntity<ApiResponse<List<QRHistoryResponse>>> getHistory(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<QRHistoryResponse> list = qrCodeService.getQRHistory(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("QR history retrieved successfully", list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get QR Details", description = "Retrieves metadata of a specific QR code record. Authorized for owner user only.")
    public ResponseEntity<ApiResponse<QRCode>> getQRDetails(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id) {
        QRCode qrCode = qrCodeService.getQRDetails(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("QR details retrieved successfully", qrCode));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Revoke/Cancel QR Code", description = "Revokes an active dynamic or request QR code by changing its status to CANCELLED.")
    public ResponseEntity<ApiResponse<Void>> revokeQR(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id) {
        qrCodeService.revokeQR(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("QR Code cancelled successfully", null));
    }
}
