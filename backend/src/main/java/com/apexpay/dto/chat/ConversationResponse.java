package com.apexpay.dto.chat;

import com.apexpay.entity.enums.ConversationType;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
public class ConversationResponse {

    private UUID id;
    private ConversationType type;
    private String title;
    private String avatarUrl;
    private String lastMessageContent;
    private LocalDateTime lastMessageTime;
    private boolean muted;
    private boolean archived;
    private boolean pinned;
    private long unreadCount;
    private List<ParticipantDTO> participants;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Getter
    @Setter
    @Builder
    public static class ParticipantDTO {
        private UUID userId;
        private String fullName;
        private String username;
        private String profilePhoto;
        private String role;
        private boolean online;
        private LocalDateTime lastSeen;
    }
}
