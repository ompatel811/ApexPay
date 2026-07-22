package com.apexpay.service.chat.impl;

import com.apexpay.dto.chat.ConversationResponse;
import com.apexpay.dto.chat.MessageResponse;
import com.apexpay.dto.chat.SearchResponse;
import com.apexpay.entity.User;
import com.apexpay.entity.chat.Conversation;
import com.apexpay.entity.chat.Message;
import com.apexpay.repository.UserRepository;
import com.apexpay.repository.chat.ConversationRepository;
import com.apexpay.repository.chat.MessageRepository;
import com.apexpay.service.chat.ConversationService;
import com.apexpay.service.chat.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SearchServiceImpl implements SearchService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ConversationService conversationService;

    @Override
    @Transactional(readOnly = true)
    public SearchResponse searchAll(UUID userId, String query) {
        SearchResponse convRes = searchConversations(userId, query);
        SearchResponse msgRes = searchMessages(userId, query, null, null, null);
        SearchResponse userRes = searchUsers(userId, query);

        return SearchResponse.builder()
                .conversations(convRes.getConversations())
                .messages(msgRes.getMessages())
                .users(userRes.getUsers())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public SearchResponse searchMessages(UUID userId, String query, LocalDateTime startDate, LocalDateTime endDate, UUID senderId) {
        List<Message> results;
        if (startDate != null && endDate != null) {
            results = messageRepository.searchMessagesByDate(userId, startDate, endDate);
        } else if (senderId != null) {
            results = messageRepository.searchMessagesBySender(userId, senderId);
        } else if (query != null && !query.isBlank()) {
            results = messageRepository.searchMessages(userId, query);
        } else {
            results = new ArrayList<>();
        }

        List<MessageResponse> messageDTOs = results.stream()
                .map(m -> MessageResponse.builder()
                        .id(m.getId())
                        .conversationId(m.getConversation().getId())
                        .senderId(m.getSender().getId())
                        .senderName(m.getSender().getFullName())
                        .senderPhoto(m.getSender().getProfilePhoto())
                        .messageType(m.getMessageType())
                        .content(m.getContent())
                        .edited(m.isEdited())
                        .deletedForEveryone(m.isDeletedForEveryone())
                        .createdAt(m.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return SearchResponse.builder()
                .messages(messageDTOs)
                .conversations(new ArrayList<>())
                .users(new ArrayList<>())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public SearchResponse searchConversations(UUID userId, String query) {
        if (query == null || query.isBlank()) {
            return SearchResponse.builder()
                    .conversations(new ArrayList<>())
                    .messages(new ArrayList<>())
                    .users(new ArrayList<>())
                    .build();
        }

        List<Conversation> conversations = conversationRepository.searchConversations(userId, query);
        List<ConversationResponse> responses = conversations.stream()
                .map(c -> conversationService.getConversationById(c.getId(), userId))
                .collect(Collectors.toList());

        return SearchResponse.builder()
                .conversations(responses)
                .messages(new ArrayList<>())
                .users(new ArrayList<>())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public SearchResponse searchUsers(UUID userId, String query) {
        if (query == null || query.isBlank()) {
            return SearchResponse.builder()
                    .users(new ArrayList<>())
                    .conversations(new ArrayList<>())
                    .messages(new ArrayList<>())
                    .build();
        }

        List<User> users = userRepository.findByFullNameContainingIgnoreCaseOrUsernameContainingIgnoreCaseOrMobileNumberContaining(query, query, query);
        List<SearchResponse.UserSearchDTO> userDTOs = users.stream()
                .filter(u -> !u.getId().equals(userId))
                .map(u -> SearchResponse.UserSearchDTO.builder()
                        .id(u.getId().toString())
                        .fullName(u.getFullName())
                        .username(u.getUsername())
                        .profilePhoto(u.getProfilePhoto())
                        .mobileNumber(u.getMobileNumber())
                        .build())
                .collect(Collectors.toList());

        return SearchResponse.builder()
                .users(userDTOs)
                .conversations(new ArrayList<>())
                .messages(new ArrayList<>())
                .build();
    }
}
