package com.apexpay.controller;

import com.apexpay.dto.*;
import com.apexpay.security.UserPrincipal;
import com.apexpay.service.AnalyticsService;
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
@RequestMapping("/api/analytics")
@PreAuthorize("isAuthenticated()")
@Tag(name = "Transaction Analytics", description = "Endpoints for retrieving spending behavior, income analyses, and trends")
@SecurityRequirement(name = "Bearer Authentication")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Get Dashboard Metrics", description = "Retrieves current balance, income, expense, and transaction summaries.")
    public ResponseEntity<ApiResponse<AnalyticsDashboardResponse>> getDashboardMetrics(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        AnalyticsDashboardResponse data = analyticsService.getDashboardMetrics(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Dashboard metrics loaded", data));
    }

    @GetMapping("/spending")
    @Operation(summary = "Get Spending Analytics", description = "Retrieves spending totals across daily, weekly, monthly, and yearly ranges.")
    public ResponseEntity<ApiResponse<SpendingAnalyticsResponse>> getSpendingAnalytics(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        SpendingAnalyticsResponse data = analyticsService.getSpendingAnalytics(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Spending analytics loaded", data));
    }

    @GetMapping("/income")
    @Operation(summary = "Get Income Analytics", description = "Retrieves income summaries, averages, and source breakdowns.")
    public ResponseEntity<ApiResponse<IncomeAnalyticsResponse>> getIncomeAnalytics(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        IncomeAnalyticsResponse data = analyticsService.getIncomeAnalytics(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Income analytics loaded", data));
    }

    @GetMapping("/category")
    @Operation(summary = "Get Category Spending", description = "Retrieves categorical spending distribution with percentage splits.")
    public ResponseEntity<ApiResponse<List<CategorySpendingItem>>> getCategorySpending(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<CategorySpendingItem> data = analyticsService.getCategoryAnalytics(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Category spending loaded", data));
    }

    @GetMapping("/trends")
    @Operation(summary = "Get Trend Analytics", description = "Retrieves credit vs debit timeline sets grouped daily, weekly, or monthly.")
    public ResponseEntity<ApiResponse<TrendsResponse>> getTrends(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(value = "period", defaultValue = "DAILY") String period) {
        TrendsResponse data = analyticsService.getTrendAnalytics(userPrincipal.getId(), period);
        return ResponseEntity.ok(ApiResponse.success("Trend analytics loaded", data));
    }

    @PutMapping("/transaction/{id}/category")
    @Operation(summary = "Edit Transaction Category", description = "Updates the spending category tags on a platform payment transaction.")
    public ResponseEntity<ApiResponse<CategoryUpdateResponse>> updateCategory(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable("id") UUID transactionId,
            @Valid @RequestBody UpdateCategoryRequest request) {
        CategoryUpdateResponse response = analyticsService.updateTransactionCategory(transactionId, userPrincipal.getId(), request.category());
        return ResponseEntity.ok(ApiResponse.success("Transaction category updated", response));
    }
}
