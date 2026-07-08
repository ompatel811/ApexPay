package com.apexpay.service;

import com.apexpay.dto.BudgetRequest;
import com.apexpay.dto.BudgetResponse;
import com.apexpay.dto.FinancialGoalRequest;
import com.apexpay.dto.FinancialGoalResponse;
import com.apexpay.entity.Budget;
import com.apexpay.entity.FinancialGoal;
import com.apexpay.entity.User;
import com.apexpay.entity.enums.NotificationType;
import com.apexpay.repository.BudgetRepository;
import com.apexpay.repository.FinancialGoalRepository;
import com.apexpay.repository.UserRepository;
import com.apexpay.service.impl.BudgetServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BudgetServiceTest {

    @Mock
    private BudgetRepository budgetRepository;

    @Mock
    private FinancialGoalRepository financialGoalRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private BudgetServiceImpl budgetService;

    private User user;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = new User();
        user.setId(userId);
        user.setUsername("johndoe");
    }

    @Test
    void createBudget_Success() {
        BudgetRequest request = new BudgetRequest("FOOD", new BigDecimal("500.00"), "2026-07");

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(budgetRepository.findByUserIdAndCategoryAndMonth(userId, "FOOD", "2026-07")).thenReturn(Optional.empty());
        when(budgetRepository.save(any(Budget.class))).thenAnswer(invocation -> {
            Budget saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        BudgetResponse response = budgetService.createBudget(userId, request);

        assertNotNull(response);
        assertEquals("FOOD", response.category());
        assertEquals(new BigDecimal("500.00"), response.amountLimit());
        assertEquals("2026-07", response.month());

        verify(auditService).log(eq("BUDGET_CREATED"), eq(userId), eq("Budget"), any());
    }

    @Test
    void checkAndUpdateBudgetsOnTransaction_ThresholdExceeded_AlertTriggered() {
        Budget budget = new Budget();
        budget.setUser(user);
        budget.setCategory("FOOD");
        budget.setAmountLimit(new BigDecimal("100.00"));
        budget.setSpent(new BigDecimal("70.00"));
        budget.setMonth("2026-07");

        when(budgetRepository.findByUserIdAndCategoryAndMonth(userId, "FOOD", "2026-07")).thenReturn(Optional.of(budget));

        // Spending $15 triggers 85% limit warning
        budgetService.checkAndUpdateBudgetsOnTransaction(userId, "FOOD", new BigDecimal("15.00"), "2026-07");

        assertEquals(new BigDecimal("85.00"), budget.getSpent());
        verify(notificationService).sendNotification(
                eq(user),
                eq("Budget Threshold Warning"),
                contains("reached 85%"),
                eq(NotificationType.SYSTEM_NOTIFICATION)
        );
    }

    @Test
    void createFinancialGoal_Success() {
        FinancialGoalRequest request = new FinancialGoalRequest(
                "Buy iPad",
                new BigDecimal("600.00"),
                new BigDecimal("120.00"),
                LocalDate.now().plusMonths(6)
        );

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(financialGoalRepository.save(any(FinancialGoal.class))).thenAnswer(invocation -> {
            FinancialGoal saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        FinancialGoalResponse response = budgetService.createGoal(userId, request);

        assertNotNull(response);
        assertEquals("Buy iPad", response.name());
        assertEquals(new BigDecimal("600.00"), response.targetAmount());
        assertEquals(new BigDecimal("120.00"), response.currentAmount());
        assertEquals(new BigDecimal("20.00"), response.percentageProgress());
        assertTrue(response.estimatedCompletionText().contains("Save $80.00/month"));
    }
}
