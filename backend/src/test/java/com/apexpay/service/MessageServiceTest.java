package com.apexpay.service;

import com.apexpay.dto.chat.MessageRequest;
import com.apexpay.dto.chat.MessageResponse;
import com.apexpay.entity.User;
import com.apexpay.entity.chat.Conversation;
import com.apexpay.entity.chat.ConversationParticipant;
import com.apexpay.entity.chat.Message;
import com.apexpay.entity.enums.ConversationType;
import com.apexpay.entity.enums.MessageType;
import com.apexpay.repository.UserRepository;
import com.apexpay.repository.chat.*;
import com.apexpay.service.chat.impl.MessageServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class MessageServiceTest {

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private ConversationParticipantRepository participantRepository;

    @Mock
    private MessageStatusRepository messageStatusRepository;

    @Mock
    private ReactionRepository reactionRepository;

    @Mock
    private BlockedUserRepository blockedUserRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private MessageServiceImpl messageService;

    private User sender;
    private Conversation conversation;
    private UUID senderId;
    private UUID conversationId;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        senderId = UUID.randomUUID();
        conversationId = UUID.randomUUID();

        sender = new User();
        sender.setId(senderId);
        sender.setFullName("Alice Sender");

        conversation = new Conversation();
        conversation.setId(conversationId);
        conversation.setType(ConversationType.PRIVATE);
    }

    @Test
    void testSendMessage_Success() {
        MessageRequest request = new MessageRequest();
        request.setConversationId(conversationId);
        request.setContent("Hello Google Pay Chat!");
        request.setMessageType(MessageType.TEXT);

        when(userRepository.findById(senderId)).thenReturn(Optional.of(sender));
        when(conversationRepository.findById(conversationId)).thenReturn(Optional.of(conversation));
        when(participantRepository.existsByConversationIdAndUserId(conversationId, senderId)).thenReturn(true);

        ConversationParticipant part = new ConversationParticipant();
        part.setUser(sender);
        when(participantRepository.findByConversationId(conversationId)).thenReturn(List.of(part));

        Message saved = new Message();
        saved.setId(UUID.randomUUID());
        saved.setConversation(conversation);
        saved.setSender(sender);
        saved.setContent("Hello Google Pay Chat!");
        saved.setMessageType(MessageType.TEXT);
        saved.setStatuses(List.of());
        saved.setReactions(List.of());

        when(messageRepository.save(any(Message.class))).thenReturn(saved);

        MessageResponse response = messageService.sendMessage(senderId, request);

        assertNotNull(response);
        assertEquals("Hello Google Pay Chat!", response.getContent());
        verify(messageRepository, times(1)).save(any(Message.class));
    }
}
