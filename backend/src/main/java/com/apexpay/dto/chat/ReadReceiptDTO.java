package com.apexpay.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadReceiptDTO {
    private UUID conversationId;
    private UUID userId;
    private UUID lastReadMessageId;
    private LocalDateTime readAt;
}
