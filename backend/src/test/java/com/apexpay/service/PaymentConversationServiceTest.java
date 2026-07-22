package com.apexpay.service;

import com.apexpay.dto.SendMoneyRequest;
import com.apexpay.dto.SendMoneyResponse;
import com.apexpay.dto.chat.PaymentMessageResponse;
import com.apexpay.dto.chat.SendPaymentChatRequest;
import com.apexpay.entity.User;
import com.apexpay.entity.chat.Conversation;
import com.apexpay.entity.chat.PaymentMessage;
import com.apexpay.entity.enums.ConversationType;
import com.apexpay.entity.enums.PaymentMethod;
import com.apexpay.entity.enums.TransactionStatus;
import com.apexpay.exception.BusinessException;
import com.apexpay.repository.TransactionRepository;
import com.apexpay.repository.UserRepository;
import com.apexpay.repository.chat.BlockedUserRepository;
import com.apexpay.repository.chat.ConversationRepository;
import com.apexpay.repository.chat.PaymentConversationRepository;
import com.apexpay.repository.chat.PaymentMessageRepository;
import com.apexpay.service.chat.impl.PaymentConversationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PaymentConversationServiceTest {

    @Mock
    private PaymentService paymentService;

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BlockedUserRepository blockedUserRepository;

    @Mock
    private PaymentMessageRepository paymentMessageRepository;

    @Mock
    private PaymentConversationRepository paymentConversationRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private PaymentConversationServiceImpl paymentConversationService;

    private User sender;
    private User receiver;
    private Conversation conversation;
    private UUID senderId;
    private UUID receiverId;
    private UUID conversationId;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        senderId = UUID.randomUUID();
        receiverId = UUID.randomUUID();
        conversationId = UUID.randomUUID();

        sender = new User();
        sender.setId(senderId);
        sender.setFullName("Alice Sender");
        sender.setUsername("alice");

        receiver = new User();
        receiver.setId(receiverId);
        receiver.setFullName("Bob Receiver");
        receiver.setUsername("bob");

        conversation = new Conversation();
        conversation.setId(conversationId);
        conversation.setType(ConversationType.PRIVATE);
    }

    @Test
    void testSendMoneyInChat_Success() {
        SendPaymentChatRequest request = new SendPaymentChatRequest();
        request.setConversationId(conversationId);
        request.setReceiverId(receiverId);
        request.setAmount(new BigDecimal("50.00"));
        request.setCurrency("USD");
        request.setPaymentMethod(PaymentMethod.WALLET);

        when(conversationRepository.findById(conversationId)).thenReturn(Optional.of(conversation));
        when(userRepository.findById(senderId)).thenReturn(Optional.of(sender));
        when(userRepository.findById(receiverId)).thenReturn(Optional.of(receiver));
        when(blockedUserRepository.existsByUserIdAndBlockedUserId(senderId, receiverId)).thenReturn(false);
        when(blockedUserRepository.existsByUserIdAndBlockedUserId(receiverId, senderId)).thenReturn(false);

        UUID txnId = UUID.randomUUID();
        SendMoneyResponse transferResp = new SendMoneyResponse(
                "TXN-12345",
                txnId,
                "SUCCESS",
                new BigDecimal("50.00"),
                "USD",
                "W-111",
                "W-222",
                LocalDateTime.now(),
                "Chat payment"
        );

        when(paymentService.processTransfer(eq(senderId), any(SendMoneyRequest.class))).thenReturn(transferResp);

        PaymentMessage savedMessage = new PaymentMessage();
        savedMessage.setId(UUID.randomUUID());
        savedMessage.setConversation(conversation);
        savedMessage.setSender(sender);
        savedMessage.setReceiver(receiver);
        savedMessage.setAmount(new BigDecimal("50.00"));
        savedMessage.setCurrency("USD");
        savedMessage.setPaymentMethod(PaymentMethod.WALLET);
        savedMessage.setStatus(TransactionStatus.SUCCESS);
        savedMessage.setReferenceNumber("TXN-12345");

        when(paymentMessageRepository.save(any(PaymentMessage.class))).thenReturn(savedMessage);

        PaymentMessageResponse response = paymentConversationService.sendMoneyInChat(senderId, request);

        assertNotNull(response);
        assertEquals(new BigDecimal("50.00"), response.getAmount());
        assertEquals("TXN-12345", response.getReferenceNumber());
        verify(paymentService, times(1)).processTransfer(eq(senderId), any(SendMoneyRequest.class));
    }

    @Test
    void testSendMoneyInChat_SelfPayment_ThrowsException() {
        SendPaymentChatRequest request = new SendPaymentChatRequest();
        request.setConversationId(conversationId);
        request.setReceiverId(senderId);
        request.setAmount(new BigDecimal("10.00"));

        assertThrows(BusinessException.class, () -> paymentConversationService.sendMoneyInChat(senderId, request));
    }
}
