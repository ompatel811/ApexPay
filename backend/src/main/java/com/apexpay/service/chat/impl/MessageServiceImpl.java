package com.apexpay.service.chat.impl;

import com.apexpay.dto.chat.MessageRequest;
import com.apexpay.dto.chat.MessageResponse;
import com.apexpay.entity.User;
import com.apexpay.entity.chat.*;
import com.apexpay.entity.enums.MessageType;
import com.apexpay.exception.BusinessException;
import com.apexpay.exception.ForbiddenException;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.UserRepository;
import com.apexpay.repository.chat.*;
import com.apexpay.service.chat.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final MessageStatusRepository messageStatusRepository;
    private final ReactionRepository reactionRepository;
    private final BlockedUserRepository blockedUserRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public MessageResponse sendMessage(UUID senderId, MessageRequest request) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender user not found: " + senderId));

        Conversation conversation = conversationRepository.findById(request.getConversationId())
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found: " + request.getConversationId()));

        boolean isParticipant = participantRepository.existsByConversationIdAndUserId(conversation.getId(), senderId);
        if (!isParticipant) {
            throw new ForbiddenException("Sender is not a participant in this conversation");
        }

        // Check block list for participants
        List<ConversationParticipant> participants = participantRepository.findByConversationId(conversation.getId());
        for (ConversationParticipant p : participants) {
            if (!p.getUser().getId().equals(senderId)) {
                if (blockedUserRepository.existsByUserIdAndBlockedUserId(p.getUser().getId(), senderId) ||
                    blockedUserRepository.existsByUserIdAndBlockedUserId(senderId, p.getUser().getId())) {
                    throw new BusinessException("Cannot send message: user relationship is blocked");
                }
            }
        }

        Message message = new Message();
        message.setConversation(conversation);
        message.setSender(sender);
        message.setContent(request.getContent());
        message.setMessageType(request.getMessageType() != null ? request.getMessageType() : MessageType.TEXT);

        if (request.getReplyToId() != null) {
            Message replyTarget = messageRepository.findById(request.getReplyToId())
                    .orElseThrow(() -> new ResourceNotFoundException("Reply target message not found: " + request.getReplyToId()));
            message.setReplyTo(replyTarget);
        }

        List<MessageStatus> statusList = new ArrayList<>();
        for (ConversationParticipant p : participants) {
            MessageStatus status = new MessageStatus();
            status.setMessage(message);
            status.setUser(p.getUser());
            if (p.getUser().getId().equals(senderId)) {
                status.setDelivered(true);
                status.setDeliveredAt(LocalDateTime.now());
                status.setSeen(true);
                status.setSeenAt(LocalDateTime.now());
            }
            statusList.add(status);
        }

        message.setStatuses(statusList);
        Message saved = messageRepository.save(message);

        // Update conversation last message snippet
        conversation.setLastMessageContent(saved.getContent());
        conversation.setLastMessageTime(saved.getCreatedAt());
        conversationRepository.save(conversation);

        MessageResponse response = mapToResponse(saved, senderId);

        // Broadcast to WebSocket topic for conversation
        messagingTemplate.convertAndSend("/topic/conversation." + conversation.getId(), response);

        log.info("Message sent in conversation {} by user {}", conversation.getId(), senderId);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MessageResponse> getMessages(UUID conversationId, UUID userId, int page, int size) {
        boolean isParticipant = participantRepository.existsByConversationIdAndUserId(conversationId, userId);
        if (!isParticipant) {
            throw new ForbiddenException("You are not a participant in this conversation");
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").ascending());
        Page<Message> messagePage = messageRepository.findByConversationId(conversationId, pageable);

        return messagePage.map(m -> mapToResponse(m, userId));
    }

    @Override
    @Transactional
    public MessageResponse editMessage(UUID messageId, UUID userId, String newContent) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found: " + messageId));

        if (!message.getSender().getId().equals(userId)) {
            throw new ForbiddenException("You can only edit your own messages");
        }

        if (message.isDeletedForEveryone()) {
            throw new BusinessException("Cannot edit a deleted message");
        }

        message.setContent(newContent);
        message.setEdited(true);
        Message updated = messageRepository.save(message);

        MessageResponse response = mapToResponse(updated, userId);
        messagingTemplate.convertAndSend("/topic/conversation." + updated.getConversation().getId(), response);
        return response;
    }

    @Override
    @Transactional
    public void deleteMessageForMe(UUID messageId, UUID userId) {
        MessageStatus status = messageStatusRepository.findByMessageIdAndUserId(messageId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Message status not found"));

        status.setHiddenForUser(true);
        messageStatusRepository.save(status);
        log.info("Message {} hidden for user {}", messageId, userId);
    }

    @Override
    @Transactional
    public MessageResponse deleteMessageForEveryone(UUID messageId, UUID userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found: " + messageId));

        if (!message.getSender().getId().equals(userId)) {
            throw new ForbiddenException("You can only delete your own messages for everyone");
        }

        message.setDeletedForEveryone(true);
        message.setContent("This message was deleted.");
        Message updated = messageRepository.save(message);

        MessageResponse response = mapToResponse(updated, userId);
        messagingTemplate.convertAndSend("/topic/conversation." + updated.getConversation().getId(), response);
        return response;
    }

    @Override
    @Transactional
    public MessageResponse forwardMessage(UUID senderId, UUID messageId, UUID targetConversationId) {
        Message original = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Original message not found: " + messageId));

        MessageRequest req = new MessageRequest();
        req.setConversationId(targetConversationId);
        req.setContent(original.getContent());
        req.setMessageType(original.getMessageType());

        return sendMessage(senderId, req);
    }

    @Override
    @Transactional
    public MessageResponse addReaction(UUID messageId, UUID userId, String reactionStr) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found: " + messageId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        Optional<MessageReaction> existingOpt = reactionRepository.findByMessageIdAndUserId(messageId, userId);
        if (existingOpt.isPresent()) {
            MessageReaction existing = existingOpt.get();
            if (existing.getReaction().equalsIgnoreCase(reactionStr)) {
                // Remove if toggled
                reactionRepository.delete(existing);
            } else {
                existing.setReaction(reactionStr);
                reactionRepository.save(existing);
            }
        } else {
            MessageReaction reaction = new MessageReaction();
            reaction.setMessage(message);
            reaction.setUser(user);
            reaction.setReaction(reactionStr);
            reactionRepository.save(reaction);
        }

        Message updated = messageRepository.findById(messageId).orElse(message);
        MessageResponse response = mapToResponse(updated, userId);
        messagingTemplate.convertAndSend("/topic/conversation." + updated.getConversation().getId(), response);
        return response;
    }

    @Override
    @Transactional
    public MessageResponse pinMessage(UUID messageId, UUID userId, boolean pin) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found: " + messageId));

        message.setPinned(pin);
        Message updated = messageRepository.save(message);
        MessageResponse response = mapToResponse(updated, userId);
        messagingTemplate.convertAndSend("/topic/conversation." + updated.getConversation().getId(), response);
        return response;
    }

    @Override
    @Transactional
    public MessageResponse starMessage(UUID messageId, UUID userId, boolean star) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found: " + messageId));

        message.setStarred(star);
        Message updated = messageRepository.save(message);
        return mapToResponse(updated, userId);
    }

    @Override
    @Transactional
    public void markMessagesAsRead(UUID conversationId, UUID userId) {
        List<ConversationParticipant> participants = participantRepository.findByConversationId(conversationId);
        Optional<ConversationParticipant> myPart = participants.stream()
                .filter(p -> p.getUser().getId().equals(userId))
                .findFirst();

        if (myPart.isPresent()) {
            ConversationParticipant p = myPart.get();
            p.setLastReadAt(LocalDateTime.now());
            participantRepository.save(p);
        }

        Page<Message> messages = messageRepository.findByConversationId(conversationId, PageRequest.of(0, 100));
        for (Message m : messages.getContent()) {
            Optional<MessageStatus> statusOpt = messageStatusRepository.findByMessageIdAndUserId(m.getId(), userId);
            if (statusOpt.isPresent()) {
                MessageStatus status = statusOpt.get();
                if (!status.isSeen()) {
                    status.setSeen(true);
                    status.setSeenAt(LocalDateTime.now());
                    messageStatusRepository.save(status);
                }
            }
        }
        log.info("Marked messages as read for conversation {} user {}", conversationId, userId);
    }

    private MessageResponse mapToResponse(Message message, UUID currentUserId) {
        boolean delivered = message.getStatuses().stream().anyMatch(MessageStatus::isDelivered);
        boolean seen = message.getStatuses().stream()
                .filter(s -> !s.getUser().getId().equals(message.getSender().getId()))
                .anyMatch(MessageStatus::isSeen);

        List<MessageResponse.ReactionDTO> reactionDTOs = message.getReactions().stream()
                .map(r -> MessageResponse.ReactionDTO.builder()
                        .id(r.getId())
                        .userId(r.getUser().getId())
                        .userName(r.getUser().getFullName())
                        .reaction(r.getReaction())
                        .build())
                .collect(Collectors.toList());

        return MessageResponse.builder()
                .id(message.getId())
                .conversationId(message.getConversation().getId())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getFullName())
                .senderPhoto(message.getSender().getProfilePhoto())
                .messageType(message.getMessageType())
                .content(message.isDeletedForEveryone() ? "This message was deleted." : message.getContent())
                .replyToId(message.getReplyTo() != null ? message.getReplyTo().getId() : null)
                .replyToContent(message.getReplyTo() != null ? message.getReplyTo().getContent() : null)
                .edited(message.isEdited())
                .deletedForEveryone(message.isDeletedForEveryone())
                .pinned(message.isPinned())
                .starred(message.isStarred())
                .delivered(delivered)
                .seen(seen)
                .reactions(reactionDTOs)
                .createdAt(message.getCreatedAt())
                .updatedAt(message.getUpdatedAt())
                .build();
    }
}
