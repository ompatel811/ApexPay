package com.apexpay.service;

import com.apexpay.dto.chat.ConversationRequest;
import com.apexpay.dto.chat.ConversationResponse;
import com.apexpay.entity.User;
import com.apexpay.entity.chat.Conversation;
import com.apexpay.entity.chat.ConversationParticipant;
import com.apexpay.entity.enums.ConversationType;
import com.apexpay.exception.BusinessException;
import com.apexpay.repository.UserRepository;
import com.apexpay.repository.chat.BlockedUserRepository;
import com.apexpay.repository.chat.ConversationParticipantRepository;
import com.apexpay.repository.chat.ConversationRepository;
import com.apexpay.repository.chat.MessageStatusRepository;
import com.apexpay.service.chat.PresenceService;
import com.apexpay.service.chat.impl.ConversationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ConversationServiceTest {

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private ConversationParticipantRepository participantRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BlockedUserRepository blockedUserRepository;

    @Mock
    private MessageStatusRepository messageStatusRepository;

    @Mock
    private PresenceService presenceService;

    @InjectMocks
    private ConversationServiceImpl conversationService;

    private User currentUser;
    private User targetUser;
    private UUID currentUserId;
    private UUID targetUserId;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        currentUserId = UUID.randomUUID();
        targetUserId = UUID.randomUUID();

        currentUser = new User();
        currentUser.setId(currentUserId);
        currentUser.setFullName("User One");
        currentUser.setUsername("user1");

        targetUser = new User();
        targetUser.setId(targetUserId);
        targetUser.setFullName("User Two");
        targetUser.setUsername("user2");
    }

    @Test
    void testCreateConversation_Success() {
        ConversationRequest request = new ConversationRequest();
        request.setType(ConversationType.PRIVATE);
        request.setParticipantUserIds(List.of(targetUserId));

        when(userRepository.findById(currentUserId)).thenReturn(Optional.of(currentUser));
        when(userRepository.findById(targetUserId)).thenReturn(Optional.of(targetUser));
        when(blockedUserRepository.existsByUserIdAndBlockedUserId(currentUserId, targetUserId)).thenReturn(false);
        when(blockedUserRepository.existsByUserIdAndBlockedUserId(targetUserId, currentUserId)).thenReturn(false);
        when(presenceService.getUserPresence(any())).thenReturn(com.apexpay.dto.chat.PresenceDTO.builder().userId(targetUserId).online(true).build());
        when(conversationRepository.findDirectConversation(ConversationType.PRIVATE, currentUserId, targetUserId)).thenReturn(Optional.empty());

        Conversation saved = new Conversation();
        saved.setId(UUID.randomUUID());
        saved.setType(ConversationType.PRIVATE);

        ConversationParticipant p1 = new ConversationParticipant();
        p1.setUser(currentUser);
        ConversationParticipant p2 = new ConversationParticipant();
        p2.setUser(targetUser);
        saved.setParticipants(List.of(p1, p2));

        when(conversationRepository.save(any(Conversation.class))).thenReturn(saved);

        ConversationResponse response = conversationService.createConversation(currentUserId, request);

        assertNotNull(response);
        assertEquals(saved.getId(), response.getId());
        verify(conversationRepository, times(1)).save(any(Conversation.class));
    }

    @Test
    void testCreateConversation_SelfChat_ThrowsException() {
        ConversationRequest request = new ConversationRequest();
        request.setType(ConversationType.PRIVATE);
        request.setParticipantUserIds(List.of(currentUserId));

        when(userRepository.findById(currentUserId)).thenReturn(Optional.of(currentUser));

        assertThrows(BusinessException.class, () -> conversationService.createConversation(currentUserId, request));
    }

    @Test
    void testCreateConversation_BlockedUser_ThrowsException() {
        ConversationRequest request = new ConversationRequest();
        request.setType(ConversationType.PRIVATE);
        request.setParticipantUserIds(List.of(targetUserId));

        when(userRepository.findById(currentUserId)).thenReturn(Optional.of(currentUser));
        when(blockedUserRepository.existsByUserIdAndBlockedUserId(currentUserId, targetUserId)).thenReturn(true);

        assertThrows(BusinessException.class, () -> conversationService.createConversation(currentUserId, request));
    }
}
