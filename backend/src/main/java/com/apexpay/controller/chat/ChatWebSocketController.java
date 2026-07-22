package com.apexpay.controller.chat;

import com.apexpay.dto.chat.MessageRequest;
import com.apexpay.dto.chat.ReadReceiptDTO;
import com.apexpay.dto.chat.TypingIndicatorDTO;
import com.apexpay.security.UserPrincipal;
import com.apexpay.service.chat.ChatService;
import com.apexpay.service.chat.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.UUID;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;
    private final MessageService messageService;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload MessageRequest request, Principal principal) {
        UUID senderId = extractUserId(principal);
        if (senderId != null) {
            messageService.sendMessage(senderId, request);
            log.info("WebSocket message processed for sender: {}", senderId);
        }
    }

    @MessageMapping("/chat.typing")
    public void handleTyping(@Payload TypingIndicatorDTO typingDTO, Principal principal) {
        UUID userId = extractUserId(principal);
        if (userId != null) {
            chatService.handleTypingIndicator(userId, typingDTO);
        }
    }

    @MessageMapping("/chat.readReceipt")
    public void handleReadReceipt(@Payload ReadReceiptDTO readReceiptDTO, Principal principal) {
        UUID userId = extractUserId(principal);
        if (userId != null) {
            chatService.handleReadReceipt(userId, readReceiptDTO);
        }
    }

    @EventListener
    public void handleSessionConnected(SessionConnectedEvent event) {
        Principal principal = event.getUser();
        UUID userId = extractUserId(principal);
        if (userId != null) {
            chatService.handleUserConnect(userId);
        }
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        Principal principal = event.getUser();
        UUID userId = extractUserId(principal);
        if (userId != null) {
            chatService.handleUserDisconnect(userId);
        }
    }

    private UUID extractUserId(Principal principal) {
        if (principal instanceof UsernamePasswordAuthenticationToken token) {
            if (token.getPrincipal() instanceof UserPrincipal userPrincipal) {
                return userPrincipal.getId();
            }
        }
        return null;
    }
}
