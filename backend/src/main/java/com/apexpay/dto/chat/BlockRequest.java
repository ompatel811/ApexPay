package com.apexpay.dto.chat;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class BlockRequest {

    @NotNull(message = "Target user ID to block is required")
    private UUID blockedUserId;

    private String reason;
}
