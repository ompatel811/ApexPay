package com.apexpay.dto.chat;

import com.apexpay.entity.enums.MessageType;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
public class MessageResponse {

    private UUID id;
    private UUID conversationId;
    private UUID senderId;
    private String senderName;
    private String senderPhoto;
    private MessageType messageType;
    private String content;
    private UUID replyToId;
    private String replyToContent;
    private boolean edited;
    private boolean deletedForEveryone;
    private boolean pinned;
    private boolean starred;
    private boolean delivered;
    private boolean seen;
    private List<ReactionDTO> reactions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Getter
    @Setter
    @Builder
    public static class ReactionDTO {
        private UUID id;
        private UUID userId;
        private String userName;
        private String reaction;
    }
}
