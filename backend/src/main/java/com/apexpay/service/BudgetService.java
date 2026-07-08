package com.apexpay.service;

import com.apexpay.dto.BudgetRequest;
import com.apexpay.dto.BudgetResponse;
import com.apexpay.dto.FinancialGoalRequest;
import com.apexpay.dto.FinancialGoalResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface BudgetService {
    BudgetResponse createBudget(UUID userId, BudgetRequest request);
    BudgetResponse updateBudget(UUID id, UUID userId, BudgetRequest request);
    List<BudgetResponse> getBudgets(UUID userId, String month);
    void deleteBudget(UUID id, UUID userId);
    void checkAndUpdateBudgetsOnTransaction(UUID userId, String category, BigDecimal amount, String month);
    
    FinancialGoalResponse createGoal(UUID userId, FinancialGoalRequest request);
    FinancialGoalResponse updateGoal(UUID id, UUID userId, FinancialGoalRequest request);
    List<FinancialGoalResponse> getGoals(UUID userId);
    void deleteGoal(UUID id, UUID userId);
}
