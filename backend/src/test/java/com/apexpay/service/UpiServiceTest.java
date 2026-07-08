package com.apexpay.service;

import com.apexpay.dto.*;
import com.apexpay.entity.BankAccount;
import com.apexpay.entity.UpiId;
import com.apexpay.entity.UpiRequest;
import com.apexpay.entity.User;
import com.apexpay.entity.enums.AccountStatus;
import com.apexpay.entity.enums.NotificationType;
import com.apexpay.exception.BusinessException;
import com.apexpay.repository.BankAccountRepository;
import com.apexpay.repository.UpiIdRepository;
import com.apexpay.repository.UpiRequestRepository;
import com.apexpay.repository.UserRepository;
import com.apexpay.service.impl.UpiServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UpiServiceTest {

    @Mock
    private UpiIdRepository upiIdRepository;

    @Mock
    private UpiRequestRepository upiRequestRepository;

    @Mock
    private BankAccountRepository bankAccountRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PaymentService paymentService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private UpiServiceImpl upiService;

    private User requester;
    private User payer;
    private UUID requesterId;
    private UUID payerId;

    @BeforeEach
    void setUp() {
        requesterId = UUID.randomUUID();
        requester = new User();
        requester.setId(requesterId);
        requester.setFullName("Requester Name");
        requester.setUsername("requester");
        requester.setEmail("requester@example.com");
        requester.setMobileNumber("+1111111111");
        requester.setAccountStatus(AccountStatus.ACTIVE);

        payerId = UUID.randomUUID();
        payer = new User();
        payer.setId(payerId);
        payer.setFullName("Payer Name");
        payer.setUsername("payer");
        payer.setEmail("payer@example.com");
        payer.setMobileNumber("+2222222222");
        payer.setAccountStatus(AccountStatus.ACTIVE);
    }

    @Test
    void createUpiId_Success() {
        CreateUpiRequest request = new CreateUpiRequest("personal");
        
        when(userRepository.findById(requesterId)).thenReturn(Optional.of(requester));
        when(bankAccountRepository.findByUserId(requesterId)).thenReturn(Collections.singletonList(new BankAccount()));
        when(upiIdRepository.existsByUpiId("personal@apexpay")).thenReturn(false);
        when(upiIdRepository.findByUserId(requesterId)).thenReturn(new ArrayList<>());
        when(upiIdRepository.save(any(UpiId.class))).thenAnswer(invocation -> {
            UpiId saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        UpiResponse response = upiService.createUpiId(requesterId, request);

        assertNotNull(response);
        assertEquals("personal@apexpay", response.upiId());
        assertTrue(response.isPrimary());
        assertEquals("ACTIVE", response.status());

        verify(notificationService).sendNotification(eq(requester), anyString(), anyString(), eq(NotificationType.UPI_CREATED));
    }

    @Test
    void createUpiId_NoLinkedBankAccount_ThrowsBusinessException() {
        CreateUpiRequest request = new CreateUpiRequest("personal");

        when(userRepository.findById(requesterId)).thenReturn(Optional.of(requester));
        when(bankAccountRepository.findByUserId(requesterId)).thenReturn(new ArrayList<>());

        assertThrows(BusinessException.class, () -> upiService.createUpiId(requesterId, request));
        verify(upiIdRepository, never()).save(any());
    }

    @Test
    void payUsingUpi_Success() {
        UpiPayRequest request = new UpiPayRequest(
                "sender@apexpay",
                "recipient@apexpay",
                new BigDecimal("50.00"),
                "Gift",
                "idemp-key-123"
        );

        UpiId senderUpi = new UpiId();
        senderUpi.setUser(requester);
        senderUpi.setUpiId("sender@apexpay");

        UpiId recipientUpi = new UpiId();
        recipientUpi.setUser(payer);
        recipientUpi.setUpiId("recipient@apexpay");

        when(upiIdRepository.findByUpiId("sender@apexpay")).thenReturn(Optional.of(senderUpi));
        when(upiIdRepository.findByUpiId("recipient@apexpay")).thenReturn(Optional.of(recipientUpi));

        SendMoneyResponse mockResponse = new SendMoneyResponse(
                "REF123",
                UUID.randomUUID(),
                "SUCCESS",
                new BigDecimal("50.00"),
                "USD",
                "WALLET1",
                "WALLET2",
                LocalDateTime.now(),
                "Gift"
        );

        when(paymentService.processTransfer(eq(requesterId), any(SendMoneyRequest.class))).thenReturn(mockResponse);

        SendMoneyResponse response = upiService.payUsingUpi(requesterId, request);

        assertNotNull(response);
        assertEquals("SUCCESS", response.status());
        assertEquals(new BigDecimal("50.00"), response.amount());

        verify(notificationService).sendNotification(eq(requester), anyString(), anyString(), eq(NotificationType.PAYMENT_SUCCESS));
        verify(notificationService).sendNotification(eq(payer), anyString(), anyString(), eq(NotificationType.PAYMENT_RECEIVED));
    }

    @Test
    void requestMoney_Success() {
        RequestMoneyRequest request = new RequestMoneyRequest(
                "requester@apexpay",
                "payer@apexpay",
                new BigDecimal("25.00"),
                "Dinner bill split"
        );

        UpiId reqUpi = new UpiId();
        reqUpi.setUser(requester);
        reqUpi.setUpiId("requester@apexpay");

        UpiId payUpi = new UpiId();
        payUpi.setUser(payer);
        payUpi.setUpiId("payer@apexpay");

        when(upiIdRepository.findByUpiId("requester@apexpay")).thenReturn(Optional.of(reqUpi));
        when(upiIdRepository.findByUpiId("payer@apexpay")).thenReturn(Optional.of(payUpi));
        when(upiRequestRepository.save(any(UpiRequest.class))).thenAnswer(invocation -> {
            UpiRequest saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        UpiRequestResponse response = upiService.requestMoney(requesterId, request);

        assertNotNull(response);
        assertEquals("requester@apexpay", response.requesterUpi());
        assertEquals("payer@apexpay", response.payerUpi());
        assertEquals("PENDING", response.status());

        verify(notificationService).sendNotification(eq(payer), anyString(), anyString(), eq(NotificationType.REQUEST_RECEIVED));
    }
}
