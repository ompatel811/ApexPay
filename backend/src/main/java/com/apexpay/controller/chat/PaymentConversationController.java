package com.apexpay.controller.chat;

import com.apexpay.dto.ApiResponse;
import com.apexpay.dto.chat.*;
import com.apexpay.security.UserPrincipal;
import com.apexpay.service.chat.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@Tag(name = "Payment Conversations & Financial Messaging", description = "Endpoints for sending money, requesting money, accepting/rejecting requests, sharing QR codes and receipts in chat")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/chat/payment")
@RequiredArgsConstructor
public class PaymentConversationController {

    private final PaymentConversationService paymentConversationService;
    private final PaymentRequestService paymentRequestService;
    private final QRShareService qrShareService;
    private final ReceiptShareService receiptShareService;
    private final PaymentTimelineService paymentTimelineService;

    @Operation(summary = "Send money directly inside chat")
    @PostMapping("/send")
    public ResponseEntity<ApiResponse<PaymentMessageResponse>> sendMoney(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody SendPaymentChatRequest request) {
        PaymentMessageResponse response = paymentConversationService.sendMoneyInChat(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Money sent successfully inside chat", response));
    }

    @Operation(summary = "Request money inside chat")
    @PostMapping("/request")
    public ResponseEntity<ApiResponse<PaymentRequestResponse>> requestMoney(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody RequestMoneyChatRequest request) {
        PaymentRequestResponse response = paymentRequestService.createRequest(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Money requested successfully", response));
    }

    @Operation(summary = "Accept a money request and complete transfer")
    @PostMapping("/accept/{id}")
    public ResponseEntity<ApiResponse<PaymentMessageResponse>> acceptRequest(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable("id") UUID id) {
        PaymentMessageResponse response = paymentRequestService.acceptRequest(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Payment request accepted and processed", response));
    }

    @Operation(summary = "Reject a money request")
    @PostMapping("/reject/{id}")
    public ResponseEntity<ApiResponse<PaymentRequestResponse>> rejectRequest(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable("id") UUID id) {
        PaymentRequestResponse response = paymentRequestService.rejectRequest(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Payment request rejected", response));
    }

    @Operation(summary = "Cancel a money request")
    @PostMapping("/cancel/{id}")
    public ResponseEntity<ApiResponse<PaymentRequestResponse>> cancelRequest(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable("id") UUID id) {
        PaymentRequestResponse response = paymentRequestService.cancelRequest(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Payment request cancelled", response));
    }

    @Operation(summary = "Share QR code inside chat")
    @PostMapping("/share-qr")
    public ResponseEntity<ApiResponse<Map<String, Object>>> shareQR(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody ShareQRRequest request) {
        Map<String, Object> response = qrShareService.shareQR(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("QR code shared successfully in chat", response));
    }

    @Operation(summary = "Share transaction receipt inside chat")
    @PostMapping("/share-receipt")
    public ResponseEntity<ApiResponse<Map<String, Object>>> shareReceipt(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody ShareReceiptRequest request) {
        Map<String, Object> response = receiptShareService.shareReceipt(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Receipt shared successfully in chat", response));
    }

    @Operation(summary = "Get payment timeline history for a conversation")
    @GetMapping("/history/{conversationId}")
    public ResponseEntity<ApiResponse<PaymentTimelineResponse>> getPaymentTimeline(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable("conversationId") UUID conversationId) {
        PaymentTimelineResponse response = paymentTimelineService.getPaymentTimeline(conversationId, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Payment timeline retrieved", response));
    }

    @Operation(summary = "Get payment request details by ID")
    @GetMapping("/request/{id}")
    public ResponseEntity<ApiResponse<PaymentRequestResponse>> getRequestById(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable("id") UUID id) {
        PaymentRequestResponse response = paymentRequestService.getRequestById(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Payment request retrieved", response));
    }
}
