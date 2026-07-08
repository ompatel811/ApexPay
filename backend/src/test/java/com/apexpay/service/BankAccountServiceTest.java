package com.apexpay.service;

import com.apexpay.dto.BankAccountResponse;
import com.apexpay.dto.LinkBankAccountRequest;
import com.apexpay.entity.BankAccount;
import com.apexpay.entity.User;
import com.apexpay.entity.enums.AccountStatus;
import com.apexpay.entity.enums.BankAccountType;
import com.apexpay.entity.enums.NotificationType;
import com.apexpay.entity.enums.VerificationStatus;
import com.apexpay.exception.BusinessException;
import com.apexpay.repository.BankAccountRepository;
import com.apexpay.repository.UserRepository;
import com.apexpay.service.impl.BankAccountServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BankAccountServiceTest {

    @Mock
    private BankAccountRepository bankAccountRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private BankAccountServiceImpl bankAccountService;

    private User testUser;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        testUser = new User();
        testUser.setId(userId);
        testUser.setFullName("John Doe");
        testUser.setUsername("johndoe");
        testUser.setEmail("johndoe@example.com");
        testUser.setMobileNumber("+1234567890");
        testUser.setAccountStatus(AccountStatus.ACTIVE);
    }

    @Test
    void linkBankAccount_Success() {
        LinkBankAccountRequest request = new LinkBankAccountRequest(
                "Chase Bank",
                "John Doe",
                "123456789012",
                "CHAS0123456",
                "Downtown Branch",
                BankAccountType.SAVINGS
        );

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(bankAccountRepository.existsByUserIdAndAccountNumber(userId, request.accountNumber())).thenReturn(false);
        when(bankAccountRepository.findByUserId(userId)).thenReturn(new ArrayList<>());
        when(bankAccountRepository.save(any(BankAccount.class))).thenAnswer(invocation -> {
            BankAccount saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        BankAccountResponse response = bankAccountService.linkBankAccount(userId, request);

        assertNotNull(response);
        assertEquals("Chase Bank", response.bankName());
        assertEquals("XXXX-XXXX-9012", response.maskedAccountNumber());
        assertTrue(response.isPrimary());
        assertEquals(VerificationStatus.VERIFIED, response.verificationStatus());
        
        verify(auditService).log(eq("BANK_ACCOUNT_LINKED"), eq(userId), eq("BankAccount"), any());
        verify(notificationService).sendNotification(eq(testUser), anyString(), anyString(), eq(NotificationType.BANK_LINKED));
    }

    @Test
    void linkBankAccount_DuplicateAccountNumber_ThrowsBusinessException() {
        LinkBankAccountRequest request = new LinkBankAccountRequest(
                "Chase Bank",
                "John Doe",
                "123456789012",
                "CHAS0123456",
                "Downtown Branch",
                BankAccountType.SAVINGS
        );

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(bankAccountRepository.existsByUserIdAndAccountNumber(userId, request.accountNumber())).thenReturn(true);

        assertThrows(BusinessException.class, () -> bankAccountService.linkBankAccount(userId, request));
        verify(bankAccountRepository, never()).save(any());
    }

    @Test
    void setPrimaryBankAccount_Success() {
        UUID accountId = UUID.randomUUID();
        BankAccount account = new BankAccount();
        account.setId(accountId);
        account.setUser(testUser);
        account.setIsPrimary(false);
        account.setBankName("Chase");

        BankAccount currentPrimary = new BankAccount();
        currentPrimary.setId(UUID.randomUUID());
        currentPrimary.setUser(testUser);
        currentPrimary.setIsPrimary(true);

        when(bankAccountRepository.findById(accountId)).thenReturn(Optional.of(account));
        when(bankAccountRepository.findByUserIdAndIsPrimaryTrue(userId)).thenReturn(Optional.of(currentPrimary));
        
        when(bankAccountRepository.save(any(BankAccount.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BankAccountResponse response = bankAccountService.setPrimaryBankAccount(accountId, userId);

        assertNotNull(response);
        assertTrue(response.isPrimary());
        
        verify(bankAccountRepository).save(account);
        verify(bankAccountRepository).save(currentPrimary);
        assertFalse(currentPrimary.getIsPrimary());
        verify(auditService).log(eq("BANK_PRIMARY_UPDATED"), eq(userId), eq("BankAccount"), eq(accountId));
    }
}
