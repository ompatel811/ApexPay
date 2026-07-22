package com.apexpay.service.chat.impl;

import com.apexpay.dto.SendMoneyRequest;
import com.apexpay.dto.SendMoneyResponse;
import com.apexpay.dto.chat.PaymentMessageResponse;
import com.apexpay.dto.chat.SendPaymentChatRequest;
import com.apexpay.entity.Transaction;
import com.apexpay.entity.User;
import com.apexpay.entity.chat.Conversation;
import com.apexpay.entity.chat.PaymentConversation;
import com.apexpay.entity.chat.PaymentMessage;
import com.apexpay.entity.enums.TransactionStatus;
import com.apexpay.exception.BusinessException;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.TransactionRepository;
import com.apexpay.repository.UserRepository;
import com.apexpay.repository.chat.BlockedUserRepository;
import com.apexpay.repository.chat.ConversationRepository;
import com.apexpay.repository.chat.PaymentConversationRepository;
import com.apexpay.repository.chat.PaymentMessageRepository;
import com.apexpay.service.PaymentService;
import com.apexpay.service.chat.PaymentConversationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentConversationServiceImpl implements PaymentConversationService {

    private final PaymentService paymentService;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final BlockedUserRepository blockedUserRepository;
    private final PaymentMessageRepository paymentMessageRepository;
    private final PaymentConversationRepository paymentConversationRepository;
    private final TransactionRepository transactionRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public PaymentMessageResponse sendMoneyInChat(UUID senderId, SendPaymentChatRequest request) {
        if (senderId.equals(request.getReceiverId())) {
            throw new BusinessException("Cannot send money to yourself");
        }

        Conversation conversation = conversationRepository.findById(request.getConversationId())
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found: " + request.getConversationId()));

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender user not found: " + senderId));

        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new ResourceNotFoundException("Receiver user not found: " + request.getReceiverId()));

        if (blockedUserRepository.existsByUserIdAndBlockedUserId(senderId, request.getReceiverId()) ||
            blockedUserRepository.existsByUserIdAndBlockedUserId(request.getReceiverId(), senderId)) {
            throw new BusinessException("Cannot send payment to a blocked user");
        }

        // Generate idempotency key for this chat payment
        String idempotencyKey = "CHAT-PAY-" + UUID.randomUUID().toString();

        // Delegate payment execution to Module 6 Payment Engine using record constructor
        SendMoneyRequest transferReq = new SendMoneyRequest(
                receiver.getUsername(),
                request.getAmount(),
                request.getNote() != null ? request.getNote() : "Chat payment",
                idempotencyKey
        );

        SendMoneyResponse transferResp = paymentService.processTransfer(senderId, transferReq);

        Transaction transaction = null;
        if (transferResp.transactionId() != null) {
            transaction = transactionRepository.findById(transferResp.transactionId()).orElse(null);
        }

        PaymentMessage pm = new PaymentMessage();
        pm.setConversation(conversation);
        pm.setSender(sender);
        pm.setReceiver(receiver);
        pm.setTransaction(transaction);
        pm.setAmount(request.getAmount());
        pm.setCurrency(request.getCurrency() != null ? request.getCurrency() : "USD");
        pm.setPaymentMethod(request.getPaymentMethod());
        pm.setStatus(TransactionStatus.SUCCESS);
        pm.setReferenceNumber(transferResp.referenceNumber());
        pm.setReceiptUrl("/api/transactions/" + transferResp.transactionId() + "/receipt");

        PaymentMessage saved = paymentMessageRepository.save(pm);

        // Update PaymentConversation metadata
        PaymentConversation pc = paymentConversationRepository.findByConversationId(conversation.getId())
                .orElseGet(() -> {
                    PaymentConversation newPc = new PaymentConversation();
                    newPc.setConversation(conversation);
                    return newPc;
                });
        pc.setLastPaymentId(saved.getId());
        pc.setLastPaymentStatus(TransactionStatus.SUCCESS.name());
        paymentConversationRepository.save(pc);

        PaymentMessageResponse response = PaymentMessageResponse.builder()
                .id(saved.getId())
                .conversationId(conversation.getId())
                .transactionId(transaction != null ? transaction.getId() : null)
                .senderId(sender.getId())
                .senderName(sender.getFullName())
                .receiverId(receiver.getId())
                .receiverName(receiver.getFullName())
                .amount(saved.getAmount())
                .currency(saved.getCurrency())
                .paymentMethod(saved.getPaymentMethod())
                .status(saved.getStatus())
                .referenceNumber(saved.getReferenceNumber())
                .receiptUrl(saved.getReceiptUrl())
                .createdAt(saved.getCreatedAt())
                .build();

        // Broadcast to WebSocket topic
        messagingTemplate.convertAndSend("/topic/conversation." + conversation.getId() + ".payment", response);
        log.info("Payment message created for conversation {} transfer {}", conversation.getId(), transferResp.referenceNumber());
        return response;
    }
}
