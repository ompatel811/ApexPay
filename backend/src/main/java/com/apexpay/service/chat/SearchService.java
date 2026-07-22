package com.apexpay.service.chat;

import com.apexpay.dto.chat.SearchResponse;

import java.time.LocalDateTime;
import java.util.UUID;

public interface SearchService {

    SearchResponse searchAll(UUID userId, String query);

    SearchResponse searchMessages(UUID userId, String query, LocalDateTime startDate, LocalDateTime endDate, UUID senderId);

    SearchResponse searchConversations(UUID userId, String query);

    SearchResponse searchUsers(UUID userId, String query);
}
