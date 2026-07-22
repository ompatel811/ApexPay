package com.apexpay.service.chat;

import com.apexpay.dto.chat.ConversationRequest;
import com.apexpay.dto.chat.ConversationResponse;

import java.util.List;
import java.util.UUID;

public interface ConversationService {

    ConversationResponse createConversation(UUID currentUserId, ConversationRequest request);

    List<ConversationResponse> getUserConversations(UUID userId);

    List<ConversationResponse> getArchivedConversations(UUID userId);

    ConversationResponse getConversationById(UUID conversationId, UUID userId);

    void deleteConversation(UUID conversationId, UUID userId);

    ConversationResponse archiveConversation(UUID conversationId, UUID userId, boolean archive);

    ConversationResponse muteConversation(UUID conversationId, UUID userId, boolean mute);

    ConversationResponse pinConversation(UUID conversationId, UUID userId, boolean pin);
}
