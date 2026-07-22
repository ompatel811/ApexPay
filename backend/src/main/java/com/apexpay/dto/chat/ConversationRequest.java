package com.apexpay.dto.chat;

import com.apexpay.entity.enums.ConversationType;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class ConversationRequest {

    @NotNull(message = "Conversation type is required")
    private ConversationType type;

    private String title;

    private String avatarUrl;

    @NotNull(message = "Participant user IDs are required")
    private List<UUID> participantUserIds;
}
