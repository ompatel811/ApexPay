package com.apexpay.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apexpay.dto.BudgetRequest;
import com.apexpay.dto.BudgetResponse;
import com.apexpay.dto.FinancialGoalRequest;
import com.apexpay.dto.FinancialGoalResponse;
import com.apexpay.entity.Budget;
import com.apexpay.entity.FinancialGoal;
import com.apexpay.entity.User;
import com.apexpay.entity.enums.NotificationType;
import com.apexpay.exception.BusinessException;
import com.apexpay.exception.ForbiddenException;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.BudgetRepository;
import com.apexpay.repository.FinancialGoalRepository;
import com.apexpay.repository.UserRepository;
import com.apexpay.service.AuditService;
import com.apexpay.service.BudgetService;
import com.apexpay.service.NotificationService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class BudgetServiceImpl implements BudgetService {

    private final BudgetRepository budgetRepository;
    private final FinancialGoalRepository financialGoalRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;

    @Autowired
    public BudgetServiceImpl(BudgetRepository budgetRepository,
                             FinancialGoalRepository financialGoalRepository,
                             UserRepository userRepository,
                             NotificationService notificationService,
                             AuditService auditService) {
        this.budgetRepository = budgetRepository;
        this.financialGoalRepository = financialGoalRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    @Override    @Transactional
    public BudgetResponse createBudget(UUID userId, BudgetRequest request) {
        log.info("Creating budget for user: {}, Category: {}, Month: {}", userId, request.category(), request.month());
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        Optional<Budget> existing = budgetRepository.findByUserIdAndCategoryAndMonth(userId, request.category().toUpperCase(), request.month());
        if (existing.isPresent()) {
            throw new BusinessException("Budget already exists for category " + request.category() + " in month " + request.month());
        }

        Budget budget = new Budget();
        budget.setUser(user);
        budget.setCategory(request.category().toUpperCase());
        budget.setAmountLimit(request.amountLimit());
        budget.setMonth(request.month());
        budget.setCreatedAt(LocalDateTime.now());
        budget.setUpdatedAt(LocalDateTime.now());

        budget = budgetRepository.save(budget);
        auditService.log("BUDGET_CREATED", userId, "Budget", budget.getId());

        return mapToResponse(budget);
    }

    @Override
    @Transactional
    public BudgetResponse updateBudget(UUID id, UUID userId, BudgetRequest request) {
        log.info("Updating budget: {}", id);
        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found."));

        if (!budget.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You are not authorized to modify this budget.");
        }

        budget.setAmountLimit(request.amountLimit());
        budget.setUpdatedAt(LocalDateTime.now());
        
        Budget updated = budgetRepository.save(budget);
        auditService.log("BUDGET_UPDATED", userId, "Budget", id);

        return mapToResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BudgetResponse> getBudgets(UUID userId, String month) {
        log.info("Retrieving budgets for user: {}, Month: {}", userId, month);
        return budgetRepository.findByUserIdAndMonth(userId, month.toUpperCase()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteBudget(UUID id, UUID userId) {
        log.info("Deleting budget: {}", id);
        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found."));

        if (!budget.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You are not authorized to delete this budget.");
        }

        budgetRepository.delete(budget);
        auditService.log("BUDGET_DELETED", userId, "Budget", id);
    }

    @Override
    @Transactional
    public void checkAndUpdateBudgetsOnTransaction(UUID userId, String category, BigDecimal amount, String month) {
        log.info("Updating budget spent for user {} category {} amount {}", userId, category, amount);

        Optional<Budget> budgetOpt = budgetRepository.findByUserIdAndCategoryAndMonth(userId, category.toUpperCase(), month);
        if (budgetOpt.isPresent()) {
            Budget budget = budgetOpt.get();
            BigDecimal prevSpent = budget.getSpent();
            BigDecimal newSpent = prevSpent.add(amount);
            budget.setSpent(newSpent);
            budget.setUpdatedAt(LocalDateTime.now());
            budgetRepository.save(budget);

            BigDecimal limit = budget.getAmountLimit();
            BigDecimal ratio = newSpent.divide(limit, 4, RoundingMode.HALF_UP);
            BigDecimal prevRatio = prevSpent.divide(limit, 4, RoundingMode.HALF_UP);

            // Exceeds 100%
            if (ratio.compareTo(BigDecimal.ONE) >= 0 && prevRatio.compareTo(BigDecimal.ONE) < 0) {
                notificationService.sendNotification(
                        budget.getUser(),
                        "Budget Exceeded Alert",
                        "Warning: You spent $" + newSpent + " exceeding your limit of $" + limit + " for category: " + category + ".",
                        NotificationType.SECURITY_ALERT
                );
            } 
            // Exceeds 80%
            else if (ratio.compareTo(BigDecimal.valueOf(0.8)) >= 0 && prevRatio.compareTo(BigDecimal.valueOf(0.8)) < 0) {
                BigDecimal pct = ratio.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP);
                notificationService.sendNotification(
                        budget.getUser(),
                        "Budget Threshold Warning",
                        "Notice: You reached " + pct + "% of your limit of $" + limit + " for category: " + category + ".",
                        NotificationType.SYSTEM_NOTIFICATION
                );
            }
        }
    }

    @Override
    @Transactional
    public FinancialGoalResponse createGoal(UUID userId, FinancialGoalRequest request) {
        log.info("Creating financial savings goal for user: {}", userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        FinancialGoal goal = new FinancialGoal();
        goal.setUser(user);
        goal.setName(request.name());
        goal.setTargetAmount(request.targetAmount());
        goal.setCurrentAmount(request.currentAmount());
        goal.setTargetDate(request.targetDate());
        goal.setStatus(request.currentAmount().compareTo(request.targetAmount()) >= 0 ? "COMPLETED" : "IN_PROGRESS");
        goal.setCreatedAt(LocalDateTime.now());
        goal.setUpdatedAt(LocalDateTime.now());

        goal = financialGoalRepository.save(goal);
        auditService.log("FINANCIAL_GOAL_CREATED", userId, "FinancialGoal", goal.getId());

        return mapToGoalResponse(goal);
    }

    @Override
    @Transactional
    public FinancialGoalResponse updateGoal(UUID id, UUID userId, FinancialGoalRequest request) {
        log.info("Updating financial savings goal: {}", id);
        FinancialGoal goal = financialGoalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Financial goal not found."));

        if (!goal.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You are not authorized to modify this goal.");
        }

        goal.setName(request.name());
        goal.setTargetAmount(request.targetAmount());
        goal.setCurrentAmount(request.currentAmount());
        goal.setTargetDate(request.targetDate());
        goal.setStatus(request.currentAmount().compareTo(request.targetAmount()) >= 0 ? "COMPLETED" : "IN_PROGRESS");
        goal.setUpdatedAt(LocalDateTime.now());

        FinancialGoal updated = financialGoalRepository.save(goal);
        auditService.log("FINANCIAL_GOAL_UPDATED", userId, "FinancialGoal", id);

        return mapToGoalResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FinancialGoalResponse> getGoals(UUID userId) {
        log.info("Retrieving savings goals for user: {}", userId);
        return financialGoalRepository.findByUserId(userId).stream()
                .map(this::mapToGoalResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteGoal(UUID id, UUID userId) {
        log.info("Deleting financial goal: {}", id);
        FinancialGoal goal = financialGoalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Financial goal not found."));

        if (!goal.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You are not authorized to delete this goal.");
        }

        financialGoalRepository.delete(goal);
        auditService.log("FINANCIAL_GOAL_DELETED", userId, "FinancialGoal", id);
    }

    private BudgetResponse mapToResponse(Budget b) {
        return new BudgetResponse(
                b.getId(),
                b.getCategory(),
                b.getAmountLimit(),
                b.getSpent(),
                b.getMonth(),
                b.getCreatedAt()
        );
    }

    private FinancialGoalResponse mapToGoalResponse(FinancialGoal g) {
        BigDecimal target = g.getTargetAmount();
        BigDecimal current = g.getCurrentAmount();
        BigDecimal progress = BigDecimal.ZERO;
        
        if (target.compareTo(BigDecimal.ZERO) > 0) {
            progress = current.multiply(BigDecimal.valueOf(100)).divide(target, 2, RoundingMode.HALF_UP).min(BigDecimal.valueOf(100));
        }

        long daysLeft = ChronoUnit.DAYS.between(LocalDate.now(), g.getTargetDate());
        String estimatedText;
        if (g.getStatus().equalsIgnoreCase("COMPLETED")) {
            estimatedText = "Goal completed successfully!";
        } else if (daysLeft <= 0) {
            estimatedText = "Target date reached!";
        } else {
            BigDecimal remaining = target.subtract(current);
            long monthsLeft = Math.max(1, daysLeft / 30);
            BigDecimal monthlySavingsNeeded = remaining.divide(BigDecimal.valueOf(monthsLeft), 2, RoundingMode.HALF_UP);
            estimatedText = String.format("Save $%s/month for %s months to achieve goal", monthlySavingsNeeded, monthsLeft);
        }

        return new FinancialGoalResponse(
                g.getId(),
                g.getName(),
                target,
                current,
                progress,
                g.getTargetDate(),
                g.getStatus(),
                estimatedText,
                g.getCreatedAt()
        );
    }
}
