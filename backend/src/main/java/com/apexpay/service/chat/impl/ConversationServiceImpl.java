package com.apexpay.service.chat.impl;

import com.apexpay.dto.chat.ConversationRequest;
import com.apexpay.dto.chat.ConversationResponse;
import com.apexpay.dto.chat.PresenceDTO;
import com.apexpay.entity.User;
import com.apexpay.entity.chat.Conversation;
import com.apexpay.entity.chat.ConversationParticipant;
import com.apexpay.entity.enums.ConversationRole;
import com.apexpay.entity.enums.ConversationType;
import com.apexpay.exception.BusinessException;
import com.apexpay.exception.ForbiddenException;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.UserRepository;
import com.apexpay.repository.chat.BlockedUserRepository;
import com.apexpay.repository.chat.ConversationParticipantRepository;
import com.apexpay.repository.chat.ConversationRepository;
import com.apexpay.repository.chat.MessageStatusRepository;
import com.apexpay.service.chat.ConversationService;
import com.apexpay.service.chat.PresenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
public class ConversationServiceImpl implements ConversationService {

    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final BlockedUserRepository blockedUserRepository;
    private final MessageStatusRepository messageStatusRepository;
    private final PresenceService presenceService;

    @Override
    @Transactional
    public ConversationResponse createConversation(UUID currentUserId, ConversationRequest request) {
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUserId));

        if (request.getParticipantUserIds() == null || request.getParticipantUserIds().isEmpty()) {
            throw new BusinessException("At least one target participant is required");
        }

        // Prevent self chat
        if (request.getParticipantUserIds().size() == 1 && request.getParticipantUserIds().contains(currentUserId)) {
            throw new BusinessException("Cannot start a conversation with yourself");
        }

        // Handle private 1-on-1 direct conversation duplication check
        if (request.getType() == ConversationType.PRIVATE && request.getParticipantUserIds().size() == 1) {
            UUID targetUserId = request.getParticipantUserIds().get(0);
            
            // Check block status
            if (blockedUserRepository.existsByUserIdAndBlockedUserId(currentUserId, targetUserId) ||
                blockedUserRepository.existsByUserIdAndBlockedUserId(targetUserId, currentUserId)) {
                throw new BusinessException("Cannot create conversation with a blocked user");
            }

            Optional<Conversation> existing = conversationRepository.findDirectConversation(ConversationType.PRIVATE, currentUserId, targetUserId);
            if (existing.isPresent()) {
                return mapToResponse(existing.get(), currentUserId);
            }
        }

        Conversation conversation = new Conversation();
        conversation.setType(request.getType());
        conversation.setTitle(request.getTitle());
        conversation.setAvatarUrl(request.getAvatarUrl());

        List<ConversationParticipant> participants = new ArrayList<>();

        // Add creator
        ConversationParticipant creatorPart = new ConversationParticipant();
        creatorPart.setConversation(conversation);
        creatorPart.setUser(currentUser);
        creatorPart.setRole(ConversationRole.ADMIN);
        creatorPart.setJoinedAt(LocalDateTime.now());
        participants.add(creatorPart);

        // Add other participants
        for (UUID targetId : request.getParticipantUserIds()) {
            if (targetId.equals(currentUserId)) continue;
            User targetUser = userRepository.findById(targetId)
                    .orElseThrow(() -> new ResourceNotFoundException("Participant user not found: " + targetId));
            
            ConversationParticipant part = new ConversationParticipant();
            part.setConversation(conversation);
            part.setUser(targetUser);
            part.setRole(ConversationRole.MEMBER);
            part.setJoinedAt(LocalDateTime.now());
            participants.add(part);
        }

        conversation.setParticipants(participants);
        Conversation saved = conversationRepository.save(conversation);
        log.info("Created new conversation ID: {} type: {}", saved.getId(), saved.getType());
        return mapToResponse(saved, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConversationResponse> getUserConversations(UUID userId) {
        List<Conversation> conversations = conversationRepository.findActiveConversationsByUserId(userId);
        return conversations.stream()
                .map(c -> mapToResponse(c, userId))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConversationResponse> getArchivedConversations(UUID userId) {
        List<Conversation> conversations = conversationRepository.findArchivedConversationsByUserId(userId);
        return conversations.stream()
                .map(c -> mapToResponse(c, userId))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ConversationResponse getConversationById(UUID conversationId, UUID userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found: " + conversationId));

        boolean isParticipant = participantRepository.existsByConversationIdAndUserId(conversationId, userId);
        if (!isParticipant) {
            throw new ForbiddenException("You are not a participant in this conversation");
        }

        return mapToResponse(conversation, userId);
    }

    @Override
    @Transactional
    public void deleteConversation(UUID conversationId, UUID userId) {
        ConversationParticipant participant = participantRepository.findByConversationIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Participant record not found"));
        participantRepository.delete(participant);
        log.info("User {} left/deleted conversation {}", userId, conversationId);
    }

    @Override
    @Transactional
    public ConversationResponse archiveConversation(UUID conversationId, UUID userId, boolean archive) {
        ConversationParticipant participant = participantRepository.findByConversationIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Participant record not found"));
        participant.setArchived(archive);
        participantRepository.save(participant);
        Conversation conversation = participant.getConversation();
        return mapToResponse(conversation, userId);
    }

    @Override
    @Transactional
    public ConversationResponse muteConversation(UUID conversationId, UUID userId, boolean mute) {
        ConversationParticipant participant = participantRepository.findByConversationIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Participant record not found"));
        participant.setMuted(mute);
        participantRepository.save(participant);
        Conversation conversation = participant.getConversation();
        return mapToResponse(conversation, userId);
    }

    @Override
    @Transactional
    public ConversationResponse pinConversation(UUID conversationId, UUID userId, boolean pin) {
        ConversationParticipant participant = participantRepository.findByConversationIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Participant record not found"));
        participant.setPinned(pin);
        participantRepository.save(participant);
        Conversation conversation = participant.getConversation();
        return mapToResponse(conversation, userId);
    }

    private ConversationResponse mapToResponse(Conversation conversation, UUID currentUserId) {
        Optional<ConversationParticipant> myPartOpt = conversation.getParticipants().stream()
                .filter(p -> p.getUser().getId().equals(currentUserId))
                .findFirst();

        boolean muted = myPartOpt.map(ConversationParticipant::isMuted).orElse(false);
        boolean archived = myPartOpt.map(ConversationParticipant::isArchived).orElse(false);
        boolean pinned = myPartOpt.map(ConversationParticipant::isPinned).orElse(false);
        long unread = messageStatusRepository.countUnreadMessages(currentUserId, conversation.getId());

        List<ConversationResponse.ParticipantDTO> participantDTOs = conversation.getParticipants().stream()
                .map(p -> {
                    User u = p.getUser();
                    boolean online = presenceService != null && presenceService.isUserOnline(u.getId());
                    PresenceDTO presenceDTO = presenceService != null ? presenceService.getUserPresence(u.getId()) : null;
                    return ConversationResponse.ParticipantDTO.builder()
                            .userId(u.getId())
                            .fullName(u.getFullName())
                            .username(u.getUsername())
                            .profilePhoto(u.getProfilePhoto())
                            .role(p.getRole().name())
                            .online(online)
                            .lastSeen(presenceDTO != null ? presenceDTO.getLastSeen() : null)
                            .build();
                }).collect(Collectors.toList());

        String displayTitle = conversation.getTitle();
        String displayAvatar = conversation.getAvatarUrl();

        if ((displayTitle == null || displayTitle.isBlank()) && conversation.getType() == ConversationType.PRIVATE) {
            for (ConversationParticipant p : conversation.getParticipants()) {
                if (p.getUser() != null && !p.getUser().getId().equals(currentUserId)) {
                    if (displayTitle == null || displayTitle.isBlank()) {
                        displayTitle = p.getUser().getFullName();
                    }
                    if (displayAvatar == null) {
                        displayAvatar = p.getUser().getProfilePhoto();
                    }
                }
            }
            if (displayTitle == null || displayTitle.isBlank()) {
                displayTitle = "Chat";
            }
        }

        return ConversationResponse.builder()
                .id(conversation.getId())
                .type(conversation.getType())
                .title(displayTitle)
                .avatarUrl(displayAvatar)
                .lastMessageContent(conversation.getLastMessageContent())
                .lastMessageTime(conversation.getLastMessageTime())
                .muted(muted)
                .archived(archived)
                .pinned(pinned)
                .unreadCount(unread)
                .participants(participantDTOs)
                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .build();
    }
}
