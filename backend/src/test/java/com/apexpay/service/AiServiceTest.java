package com.apexpay.service;

import com.apexpay.dto.ChatRequest;
import com.apexpay.dto.ChatResponse;
import com.apexpay.dto.FinancialHealthResponse;
import com.apexpay.dto.FinancialSummaryResponse;
import com.apexpay.entity.*;
import com.apexpay.entity.enums.PaymentMethod;
import com.apexpay.entity.enums.TransactionType;
import com.apexpay.repository.*;
import com.apexpay.repository.admin.FraudAlertRepository;
import com.apexpay.service.impl.AiServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
public class AiServiceTest {

    @Mock
    private ChatHistoryRepository chatHistoryRepository;
    @Mock
    private FinancialInsightRepository financialInsightRepository;
    @Mock
    private BudgetRecommendationRepository budgetRecommendationRepository;
    @Mock
    private FinancialScoreRepository financialScoreRepository;
    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private BudgetRepository budgetRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private FraudAlertRepository fraudAlertRepository;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private AiServiceImpl aiService;

    private User user;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = new User();
        user.setId(userId);
        user.setUsername("johndoe");
        user.setFullName("John Doe");
    }

    @Test
    void testChat_Success() {
        ChatRequest request = new ChatRequest("How much did I spend this month?");
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        
        // Mock save behavior
        when(chatHistoryRepository.save(any(ChatHistory.class))).thenAnswer(invocation -> {
            ChatHistory c = invocation.getArgument(0);
            c.setId(UUID.randomUUID());
            c.setCreatedAt(LocalDateTime.now());
            return c;
        });

        ChatResponse response = aiService.chat(userId, request);

        assertNotNull(response);
        assertTrue(response.response().contains("spent"));
        verify(chatHistoryRepository, times(2)).save(any(ChatHistory.class));
        verify(auditService, times(1)).log(anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void testGetSummary_Success() {
        Wallet senderWallet = new Wallet();
        senderWallet.setUser(user);

        Transaction tx = new Transaction();
        tx.setSenderWallet(senderWallet);
        tx.setAmount(BigDecimal.valueOf(1200));
        tx.setTransactionType(TransactionType.TRANSFER);
        tx.setPaymentMethod(PaymentMethod.UPI);
        tx.setCategory("FOOD");
        tx.setCreatedAt(LocalDateTime.now());

        when(transactionRepository.findSuccessTransactionsByUserId(userId))
                .thenReturn(Collections.singletonList(tx));

        FinancialSummaryResponse summary = aiService.getSummary(userId);

        assertNotNull(summary);
        assertEquals(BigDecimal.valueOf(1200), summary.totalExpenses());
        assertEquals("FOOD", summary.categoryBreakdown().keySet().iterator().next());
    }

    @Test
    void testGetFinancialHealthScore_Success() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(transactionRepository.findSuccessTransactionsByUserId(userId))
                .thenReturn(Collections.emptyList());
        when(budgetRepository.findByUserIdAndMonth(eq(userId), anyString()))
                .thenReturn(Collections.emptyList());
        when(fraudAlertRepository.findByUserId(userId))
                .thenReturn(Collections.emptyList());

        // Mock score repository saving
        when(financialScoreRepository.findFirstByUserIdOrderByCreatedAtDesc(userId))
                .thenReturn(Optional.empty());
        when(financialScoreRepository.save(any(FinancialScore.class))).thenAnswer(invocation -> {
            FinancialScore fs = invocation.getArgument(0);
            fs.setId(UUID.randomUUID());
            fs.setUpdatedAt(LocalDateTime.now());
            return fs;
        });

        FinancialHealthResponse health = aiService.getFinancialHealthScore(userId);

        assertNotNull(health);
        // Default score with no spending: savings rate points (15) + default no-budget points (20) + no fraud points (10) = 45
        assertEquals(45, health.score());
    }
}
