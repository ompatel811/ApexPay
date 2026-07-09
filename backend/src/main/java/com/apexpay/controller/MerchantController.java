package com.apexpay.controller;

import com.apexpay.dto.*;
import com.apexpay.security.UserPrincipal;
import com.apexpay.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/merchant")
@PreAuthorize("isAuthenticated()")
@Tag(name = "Merchant Portal", description = "Endpoints for business accounts, KYC, team roster, payment links, refunds, and settlements.")
@SecurityRequirement(name = "Bearer Authentication")
public class MerchantController {

    private final MerchantService merchantService;
    private final PaymentLinkService paymentLinkService;
    private final RefundService refundService;
    private final SettlementService settlementService;
    private final TeamManagementService teamManagementService;

    public MerchantController(MerchantService merchantService,
                              PaymentLinkService paymentLinkService,
                              RefundService refundService,
                              SettlementService settlementService,
                              TeamManagementService teamManagementService) {
        this.merchantService = merchantService;
        this.paymentLinkService = paymentLinkService;
        this.refundService = refundService;
        this.settlementService = settlementService;
        this.teamManagementService = teamManagementService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register Business Account", description = "Creates a new merchant account profile, associates the owner user, and provisions a MCH business wallet.")
    public ResponseEntity<ApiResponse<MerchantProfileResponse>> registerMerchant(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody BusinessRegisterRequest request) {
        MerchantProfileResponse profile = merchantService.registerMerchant(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Business account registered successfully.", profile));
    }

    @GetMapping("/profile")
    @Operation(summary = "Get Business Profile", description = "Retrieves profile settings and KYC details of the business associated with the authenticated user.")
    public ResponseEntity<ApiResponse<MerchantProfileResponse>> getProfile(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        MerchantProfileResponse profile = merchantService.getMerchantProfile(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Merchant profile retrieved successfully.", profile));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update Business Profile", description = "Updates details like name, email, mobile, and address. Requires Merchant Owner or Admin permissions.")
    public ResponseEntity<ApiResponse<MerchantProfileResponse>> updateProfile(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody BusinessProfileUpdateRequest request) {
        MerchantProfileResponse profile = merchantService.updateMerchantProfile(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Merchant profile updated successfully.", profile));
    }

    @PostMapping("/kyc/submit")
    @Operation(summary = "Submit KYC Documents", description = "Submits PAN, GST, business proofs, and address proofs mock locations for compliance verification.")
    public ResponseEntity<ApiResponse<MerchantProfileResponse>> submitKyc(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody KycSubmitRequest request) {
        MerchantProfileResponse profile = merchantService.submitKyc(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("KYC documentation submitted successfully for review.", profile));
    }

    @PostMapping("/kyc/verify-simulate")
    @Operation(summary = "Simulate KYC Verification Review", description = "Simulates backoffice approval/rejection of business compliance review. Sends live WebSocket alert on change.")
    public ResponseEntity<ApiResponse<MerchantProfileResponse>> simulateKyc(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody KycVerifySimulateRequest request) {
        MerchantProfileResponse profile = merchantService.simulateKycVerification(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Simulated KYC verification completed successfully.", profile));
    }

    @PostMapping("/payment-link")
    @Operation(summary = "Generate Payment Link", description = "Creates an invoice-based payment reference code allowing customers to check out and pay.")
    public ResponseEntity<ApiResponse<PaymentLinkResponse>> generatePaymentLink(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody CreatePaymentLinkRequest request) {
        PaymentLinkResponse link = paymentLinkService.createPaymentLink(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Payment link generated successfully.", link));
    }

    @GetMapping("/payment-links")
    @Operation(summary = "List Generated Payment Links", description = "Retrieves all created invoice links sorted by descending creation time.")
    public ResponseEntity<ApiResponse<List<PaymentLinkResponse>>> getPaymentLinks(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<PaymentLinkResponse> links = paymentLinkService.getPaymentLinks(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Payment links retrieved successfully.", links));
    }

    @PostMapping("/refund")
    @Operation(summary = "Request Transaction Refund", description = "Creates a pending refund draft request. Reuses Module 6 Transaction Ledger checks.")
    public ResponseEntity<ApiResponse<RefundResponse>> createRefund(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody CreateRefundRequest request) {
        RefundResponse refund = refundService.createRefund(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Refund request created successfully.", refund));
    }

    @PostMapping("/refund/{id}/approve")
    @Operation(summary = "Approve and Process Refund", description = "Approves a pending refund, executing the ledger reversal transfer of funds from merchant to customer. Requires Owner/Admin/Manager roles.")
    public ResponseEntity<ApiResponse<RefundResponse>> approveRefund(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id) {
        RefundResponse refund = refundService.approveRefund(userPrincipal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Refund processed and funds reversed successfully.", refund));
    }

    @PostMapping("/refund/{id}/reject")
    @Operation(summary = "Reject Refund Request", description = "Rejects a pending refund draft. Requires Owner/Admin/Manager roles.")
    public ResponseEntity<ApiResponse<RefundResponse>> rejectRefund(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id,
            @RequestParam String reason) {
        RefundResponse refund = refundService.rejectRefund(userPrincipal.getId(), id, reason);
        return ResponseEntity.ok(ApiResponse.success("Refund request rejected successfully.", refund));
    }

    @GetMapping("/refunds")
    @Operation(summary = "List Business Refunds", description = "Retrieves history log of all refund transactions.")
    public ResponseEntity<ApiResponse<List<RefundResponse>>> getRefunds(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<RefundResponse> refunds = refundService.getRefunds(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Refund log retrieved successfully.", refunds));
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Get Dashboard Metrics Summary", description = "Calculates Sales metrics (Today/Week/Month), total revenue, pending links, refunds count, and wallet balance.")
    public ResponseEntity<ApiResponse<MerchantDashboardResponse>> getDashboard(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        MerchantDashboardResponse dashboard = merchantService.getDashboardMetrics(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Dashboard metrics summary loaded successfully.", dashboard));
    }

    @GetMapping("/analytics")
    @Operation(summary = "Get Business Analytics Charts Data", description = "Retrieves sales daily trends, customer count, success rates, average order values, and 6-month revenues.")
    public ResponseEntity<ApiResponse<MerchantAnalyticsResponse>> getAnalytics(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        MerchantAnalyticsResponse analytics = merchantService.getMerchantAnalytics(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Business analytics data loaded successfully.", analytics));
    }

    @GetMapping("/settlements")
    @Operation(summary = "List Settlements Ledger", description = "Retrieves log records of all manual/automatic payout settlements.")
    public ResponseEntity<ApiResponse<List<SettlementResponse>>> getSettlements(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<SettlementResponse> list = settlementService.getSettlements(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Settlements log retrieved successfully.", list));
    }

    @PostMapping("/settlements/trigger")
    @Operation(summary = "Trigger Payout Settlement", description = "Initiates a manual settlement of available merchant balance, transferring funds to linked bank.")
    public ResponseEntity<ApiResponse<SettlementResponse>> triggerSettlement(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        SettlementResponse settlement = settlementService.triggerManualSettlement(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Settlement payout processed successfully.", settlement));
    }

    @PostMapping("/settlements/simulate-job")
    @PreAuthorize("hasRole('ADMIN') or isAuthenticated()")
    @Operation(summary = "Simulate Settlement Cron Job", description = "Simulates background processing job settling balances of all verified merchants. For test purposes.")
    public ResponseEntity<ApiResponse<String>> simulateJob() {
        settlementService.simulateSettlementsJob();
        return ResponseEntity.ok(ApiResponse.success("Simulated background settlement job completed successfully.", null));
    }

    @PostMapping("/team/invite")
    @Operation(summary = "Invite Team Employee", description = "Invites a registered user to join the merchant team by email. Requires Owner/Admin roles.")
    public ResponseEntity<ApiResponse<EmployeeResponse>> inviteEmployee(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody InviteEmployeeRequest request) {
        EmployeeResponse employee = teamManagementService.inviteEmployee(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Employee invited successfully to team.", employee));
    }

    @PutMapping("/team/{id}")
    @Operation(summary = "Update Employee Roster Status", description = "Modifies a team member's role or access status. Requires Owner/Admin roles.")
    public ResponseEntity<ApiResponse<EmployeeResponse>> updateEmployee(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateEmployeeRequest request) {
        EmployeeResponse employee = teamManagementService.updateEmployee(userPrincipal.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Employee updated successfully.", employee));
    }

    @DeleteMapping("/team/{id}")
    @Operation(summary = "Remove Employee mapping", description = "Removes employee association from business team. Requires Owner/Admin roles.")
    public ResponseEntity<ApiResponse<String>> removeEmployee(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable UUID id) {
        teamManagementService.removeEmployee(userPrincipal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Employee removed successfully from team.", null));
    }

    @GetMapping("/team")
    @Operation(summary = "List Team Members", description = "Retrieves roster mapping list of all cashiers, managers, and admins.")
    public ResponseEntity<ApiResponse<List<EmployeeResponse>>> getTeam(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<EmployeeResponse> members = teamManagementService.getTeamMembers(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Team roster retrieved successfully.", members));
    }
}
