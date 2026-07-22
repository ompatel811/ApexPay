package com.apexpay.dto.chat;

import com.apexpay.entity.enums.PaymentRequestStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
public class PaymentRequestResponse {

    private UUID id;
    private UUID conversationId;
    private UUID requesterId;
    private String requesterName;
    private UUID receiverId;
    private String receiverName;
    private BigDecimal amount;
    private String reason;
    private PaymentRequestStatus status;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
}
