package com.apexpay.service.chat.impl;

import com.apexpay.dto.chat.PresenceDTO;
import com.apexpay.dto.chat.ReadReceiptDTO;
import com.apexpay.dto.chat.TypingIndicatorDTO;
import com.apexpay.service.chat.ChatService;
import com.apexpay.service.chat.MessageService;
import com.apexpay.service.chat.PresenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final SimpMessagingTemplate messagingTemplate;
    private final PresenceService presenceService;
    private final MessageService messageService;

    @Override
    public void handleTypingIndicator(UUID userId, TypingIndicatorDTO typingDTO) {
        typingDTO.setUserId(userId);
        messagingTemplate.convertAndSend("/topic/conversation." + typingDTO.getConversationId() + ".typing", typingDTO);
    }

    @Override
    public void handleReadReceipt(UUID userId, ReadReceiptDTO readReceiptDTO) {
        readReceiptDTO.setUserId(userId);
        messageService.markMessagesAsRead(readReceiptDTO.getConversationId(), userId);
        messagingTemplate.convertAndSend("/topic/conversation." + readReceiptDTO.getConversationId() + ".read", readReceiptDTO);
    }

    @Override
    public void handleUserConnect(UUID userId) {
        presenceService.markUserOnline(userId);
        PresenceDTO presence = presenceService.getUserPresence(userId);
        messagingTemplate.convertAndSend("/topic/presence", presence);
    }

    @Override
    public void handleUserDisconnect(UUID userId) {
        presenceService.markUserOffline(userId);
        PresenceDTO presence = presenceService.getUserPresence(userId);
        messagingTemplate.convertAndSend("/topic/presence", presence);
    }
}
