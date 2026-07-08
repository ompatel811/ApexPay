package com.apexpay.controller;

import com.apexpay.dto.*;
import com.apexpay.security.UserPrincipal;
import com.apexpay.service.BudgetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/budget")
@PreAuthorize("isAuthenticated()")
@Tag(name = "Budgets & Savings Goals", description = "Endpoints for configuring category budgets, limits warnings, and saving goals")
@SecurityRequirement(name = "Bearer Authentication")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @PostMapping
    @Operation(summary = "Create Category Budget", description = "Creates a monthly spending limit threshold for a specific category.")
    public ResponseEntity<ApiResponse<BudgetResponse>> createBudget(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody BudgetRequest request) {
        BudgetResponse response = budgetService.createBudget(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Category budget configured successfully", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update Category Budget", description = "Updates limits on an existing monthly category budget.")
    public ResponseEntity<ApiResponse<BudgetResponse>> updateBudget(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable("id") UUID budgetId,
            @Valid @RequestBody BudgetRequest request) {
        BudgetResponse response = budgetService.updateBudget(budgetId, userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Category budget updated successfully", response));
    }

    @GetMapping
    @Operation(summary = "Get Category Budgets", description = "Retrieves all configured limits for a target month (YYYY-MM).")
    public ResponseEntity<ApiResponse<List<BudgetResponse>>> getBudgets(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(value = "month", required = false) String month) {
        String queryMonth = month != null ? month : DateTimeFormatter.ofPattern("yyyy-MM").format(LocalDate.now());
        List<BudgetResponse> budgets = budgetService.getBudgets(userPrincipal.getId(), queryMonth);
        return ResponseEntity.ok(ApiResponse.success("Monthly budgets retrieved", budgets));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete Category Budget", description = "Permanently deletes a configured category budget.")
    public ResponseEntity<ApiResponse<Void>> deleteBudget(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable("id") UUID budgetId) {
        budgetService.deleteBudget(budgetId, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Category budget deleted successfully", null));
    }

    @PostMapping("/goal")
    @Operation(summary = "Create Savings Goal", description = "Creates a savings financial goal with a future target completion date.")
    public ResponseEntity<ApiResponse<FinancialGoalResponse>> createGoal(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody FinancialGoalRequest request) {
        FinancialGoalResponse response = budgetService.createGoal(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Savings goal set successfully", response));
    }

    @PutMapping("/goal/{id}")
    @Operation(summary = "Update Savings Goal", description = "Modifies targets or increments progress amounts on a savings goal.")
    public ResponseEntity<ApiResponse<FinancialGoalResponse>> updateGoal(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable("id") UUID goalId,
            @Valid @RequestBody FinancialGoalRequest request) {
        FinancialGoalResponse response = budgetService.updateGoal(goalId, userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Savings goal progress updated", response));
    }

    @GetMapping("/goal")
    @Operation(summary = "Get Savings Goals", description = "Retrieves all active and completed savings goals for the user.")
    public ResponseEntity<ApiResponse<List<FinancialGoalResponse>>> getGoals(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<FinancialGoalResponse> goals = budgetService.getGoals(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Savings goals retrieved", goals));
    }

    @DeleteMapping("/goal/{id}")
    @Operation(summary = "Delete Savings Goal", description = "Permanently deletes a savings goal.")
    public ResponseEntity<ApiResponse<Void>> deleteGoal(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable("id") UUID goalId) {
        budgetService.deleteGoal(goalId, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Savings goal deleted successfully", null));
    }
}
