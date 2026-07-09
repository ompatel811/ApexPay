package com.apexpay.controller;

import com.apexpay.dto.ApiResponse;
import com.apexpay.dto.PaymentLinkResponse;
import com.apexpay.dto.SendMoneyResponse;
import com.apexpay.security.UserPrincipal;
import com.apexpay.service.PaymentLinkService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/public/payment-links")
@Tag(name = "Payment Gateway Simulator", description = "Public endpoints for checkout page loading and customer payment processing.")
public class PublicPaymentLinkController {

    private final PaymentLinkService paymentLinkService;

    public PublicPaymentLinkController(PaymentLinkService paymentLinkService) {
        this.paymentLinkService = paymentLinkService;
    }

    @GetMapping("/{ref}")
    @Operation(summary = "Get Payment Link Invoice Details", description = "Public endpoint to query invoice amount and business metadata before prompting payment authentication.")
    public ResponseEntity<ApiResponse<PaymentLinkResponse>> getInvoiceDetails(@PathVariable String ref) {
        PaymentLinkResponse response = paymentLinkService.getPaymentLinkByReference(ref);
        return ResponseEntity.ok(ApiResponse.success("Invoice details retrieved successfully.", response));
    }

    @PostMapping("/{ref}/pay")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Pay Invoice", description = "Debits the authenticated customer's wallet and credits the merchant's business wallet in a secure pessimistic locked transaction.")
    public ResponseEntity<ApiResponse<SendMoneyResponse>> payInvoice(
            @PathVariable String ref,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        
        SendMoneyResponse response = paymentLinkService.payPaymentLink(ref, userPrincipal.getId(), idempotencyKey);
        return ResponseEntity.ok(ApiResponse.success("Invoice paid successfully.", response));
    }
}
