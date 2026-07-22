package com.apexpay.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ShareQRRequest {

    @NotNull(message = "Conversation ID is required")
    private UUID conversationId;

    @NotNull(message = "Recipient ID is required")
    private UUID receiverId;

    @NotBlank(message = "QR code payload content is required")
    private String qrCodeContent;
}
