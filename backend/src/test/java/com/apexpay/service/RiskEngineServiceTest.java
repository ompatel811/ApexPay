package com.apexpay.service;

import com.apexpay.dto.SendMoneyRequest;
import com.apexpay.entity.User;
import com.apexpay.entity.Wallet;
import com.apexpay.entity.admin.FraudAlert;
import com.apexpay.entity.admin.FraudRule;
import com.apexpay.entity.enums.WalletStatus;
import com.apexpay.repository.TransactionRepository;
import com.apexpay.repository.UserRepository;
import com.apexpay.repository.WalletRepository;
import com.apexpay.repository.admin.BlacklistRepository;
import com.apexpay.repository.admin.FraudAlertRepository;
import com.apexpay.repository.admin.FraudRuleRepository;
import com.apexpay.repository.admin.WhitelistRepository;
import com.apexpay.service.admin.RiskEngineServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings({"null", "unused"})
public class RiskEngineServiceTest {

    @Mock
    private FraudRuleRepository fraudRuleRepository;

    @Mock
    private BlacklistRepository blacklistRepository;

    @Mock
    private WhitelistRepository whitelistRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private WalletRepository walletRepository;

    @Mock
    private FraudAlertRepository fraudAlertRepository;

    @InjectMocks
    private RiskEngineServiceImpl riskEngineService;

    private UUID userId;
    private User testUser;
    private Wallet testWallet;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        testUser = new User();
        testUser.setId(userId);
        testUser.setUsername("frauduser");

        testWallet = new Wallet();
        testWallet.setId(UUID.randomUUID());
        testWallet.setUser(testUser);
        testWallet.setWalletNumber("APXWAL_7728");
        testWallet.setBalance(new BigDecimal("1000.00"));
        testWallet.setWalletStatus(WalletStatus.ACTIVE);
    }

    @Test
    void testEvaluateTransaction_LowRisk_Success() {
        SendMoneyRequest request = new SendMoneyRequest("APXWAL_9921", new BigDecimal("100.00"), "Lunch", "idem-1");

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(walletRepository.findByUserId(userId)).thenReturn(Optional.of(testWallet));
        when(blacklistRepository.existsByTypeAndItemValue(anyString(), anyString())).thenReturn(false);
        when(whitelistRepository.existsByTypeAndItemValue(anyString(), anyString())).thenReturn(false);
        when(fraudRuleRepository.findByRuleKey(anyString())).thenReturn(Optional.empty());

        FraudAlert alert = riskEngineService.evaluateTransaction(userId, request);

        assertNotNull(alert);
        assertEquals("LOW", alert.getRiskLevel());
        assertEquals("ALLOW", alert.getAction());
        assertEquals(0, alert.getRiskScore());
    }

    @Test
    void testEvaluateTransaction_SingleLimitExceeded_MediumRisk() {
        SendMoneyRequest request = new SendMoneyRequest("APXWAL_9921", new BigDecimal("2000.00"), "Luxury purchase", "idem-2");

        FraudRule rule = new FraudRule();
        rule.setRuleKey("TX_LIMIT");
        rule.setName("Transaction Limit");
        rule.setIsEnabled(true);
        rule.setThresholdValue("1000.00");
        rule.setAction("BLOCK");

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(walletRepository.findByUserId(userId)).thenReturn(Optional.of(testWallet));
        when(blacklistRepository.existsByTypeAndItemValue(anyString(), anyString())).thenReturn(false);
        when(whitelistRepository.existsByTypeAndItemValue(anyString(), anyString())).thenReturn(false);
        when(fraudAlertRepository.save(any(FraudAlert.class))).thenAnswer(invocation -> invocation.getArgument(0));
        
        when(fraudRuleRepository.findByRuleKey("TX_LIMIT")).thenReturn(Optional.of(rule));

        FraudAlert alert = riskEngineService.evaluateTransaction(userId, request);

        assertNotNull(alert);
        assertEquals("MEDIUM", alert.getRiskLevel());
        assertEquals("REVIEW", alert.getAction());
        assertEquals(35, alert.getRiskScore());
    }

    @Test
    void testEvaluateTransaction_BlacklistedIP_CriticalBlock() {
        SendMoneyRequest request = new SendMoneyRequest("APXWAL_9921", new BigDecimal("50.00"), "Rent", "idem-3");

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(walletRepository.findByUserId(userId)).thenReturn(Optional.of(testWallet));
        when(fraudAlertRepository.save(any(FraudAlert.class))).thenAnswer(invocation -> invocation.getArgument(0));
        
        // Mock IP blacklist matches
        when(blacklistRepository.existsByTypeAndItemValue("IP", "127.0.0.1")).thenReturn(true);

        FraudAlert alert = riskEngineService.evaluateTransaction(userId, request);

        assertNotNull(alert);
        assertEquals("CRITICAL", alert.getRiskLevel());
        assertEquals("FREEZE_USER", alert.getAction());
        assertEquals(100, alert.getRiskScore());
    }
}
