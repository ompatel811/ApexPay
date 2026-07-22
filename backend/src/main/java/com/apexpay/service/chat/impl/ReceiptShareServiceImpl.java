package com.apexpay.service.chat.impl;

import com.apexpay.dto.chat.ShareReceiptRequest;
import com.apexpay.entity.Transaction;
import com.apexpay.entity.User;
import com.apexpay.entity.chat.Conversation;
import com.apexpay.entity.chat.SharedReceipt;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.TransactionRepository;
import com.apexpay.repository.UserRepository;
import com.apexpay.repository.chat.ConversationRepository;
import com.apexpay.repository.chat.SharedReceiptRepository;
import com.apexpay.service.chat.ReceiptShareService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReceiptShareServiceImpl implements ReceiptShareService {

    private final SharedReceiptRepository sharedReceiptRepository;
    private final ConversationRepository conversationRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public Map<String, Object> shareReceipt(UUID senderId, ShareReceiptRequest request) {
        Conversation conversation = conversationRepository.findById(request.getConversationId())
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found: " + request.getConversationId()));

        Transaction transaction = transactionRepository.findById(request.getTransactionId())
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + request.getTransactionId()));

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender user not found: " + senderId));

        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new ResourceNotFoundException("Receiver user not found: " + request.getReceiverId()));

        String receiptUrl = "/api/transactions/" + transaction.getId() + "/receipt";

        SharedReceipt sr = new SharedReceipt();
        sr.setConversation(conversation);
        sr.setTransaction(transaction);
        sr.setSender(sender);
        sr.setReceiver(receiver);
        sr.setReceiptUrl(receiptUrl);

        SharedReceipt saved = sharedReceiptRepository.save(sr);

        Map<String, Object> payload = new HashMap<>();
        payload.put("id", saved.getId());
        payload.put("conversationId", conversation.getId());
        payload.put("transactionId", transaction.getId());
        payload.put("transactionReference", transaction.getTransactionReference());
        payload.put("amount", transaction.getAmount());
        payload.put("receiptUrl", receiptUrl);
        payload.put("senderName", sender.getFullName());
        payload.put("createdAt", saved.getCreatedAt());

        messagingTemplate.convertAndSend("/topic/conversation." + conversation.getId() + ".receipt", payload);

        return payload;
    }
}
