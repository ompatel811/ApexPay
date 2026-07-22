package com.apexpay.service.chat;

import com.apexpay.dto.chat.MessageRequest;
import com.apexpay.dto.chat.MessageResponse;
import org.springframework.data.domain.Page;

import java.util.UUID;

public interface MessageService {

    MessageResponse sendMessage(UUID senderId, MessageRequest request);

    Page<MessageResponse> getMessages(UUID conversationId, UUID userId, int page, int size);

    MessageResponse editMessage(UUID messageId, UUID userId, String newContent);

    void deleteMessageForMe(UUID messageId, UUID userId);

    MessageResponse deleteMessageForEveryone(UUID messageId, UUID userId);

    MessageResponse forwardMessage(UUID senderId, UUID messageId, UUID targetConversationId);

    MessageResponse addReaction(UUID messageId, UUID userId, String reaction);

    MessageResponse pinMessage(UUID messageId, UUID userId, boolean pin);

    MessageResponse starMessage(UUID messageId, UUID userId, boolean star);

    void markMessagesAsRead(UUID conversationId, UUID userId);
}
