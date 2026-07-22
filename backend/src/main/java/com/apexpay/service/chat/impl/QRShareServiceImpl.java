package com.apexpay.service.chat.impl;

import com.apexpay.dto.chat.ShareQRRequest;
import com.apexpay.entity.User;
import com.apexpay.entity.chat.Conversation;
import com.apexpay.entity.chat.SharedQR;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.UserRepository;
import com.apexpay.repository.chat.ConversationRepository;
import com.apexpay.repository.chat.SharedQRRepository;
import com.apexpay.service.chat.QRShareService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class QRShareServiceImpl implements QRShareService {

    private final SharedQRRepository sharedQRRepository;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public Map<String, Object> shareQR(UUID senderId, ShareQRRequest request) {
        Conversation conversation = conversationRepository.findById(request.getConversationId())
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found: " + request.getConversationId()));

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender user not found: " + senderId));

        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new ResourceNotFoundException("Receiver user not found: " + request.getReceiverId()));

        SharedQR sqr = new SharedQR();
        sqr.setConversation(conversation);
        sqr.setSender(sender);
        sqr.setReceiver(receiver);
        sqr.setQrCodeContent(request.getQrCodeContent());

        SharedQR saved = sharedQRRepository.save(sqr);

        Map<String, Object> payload = new HashMap<>();
        payload.put("id", saved.getId());
        payload.put("conversationId", conversation.getId());
        payload.put("senderId", sender.getId());
        payload.put("senderName", sender.getFullName());
        payload.put("receiverId", receiver.getId());
        payload.put("qrCodeContent", saved.getQrCodeContent());
        payload.put("createdAt", saved.getCreatedAt());

        messagingTemplate.convertAndSend("/topic/conversation." + conversation.getId() + ".qr", payload);

        return payload;
    }
}
