package com.apexpay.service.chat;

import com.apexpay.dto.chat.ReadReceiptDTO;
import com.apexpay.dto.chat.TypingIndicatorDTO;

import java.util.UUID;

public interface ChatService {

    void handleTypingIndicator(UUID userId, TypingIndicatorDTO typingDTO);

    void handleReadReceipt(UUID userId, ReadReceiptDTO readReceiptDTO);

    void handleUserConnect(UUID userId);

    void handleUserDisconnect(UUID userId);
}
