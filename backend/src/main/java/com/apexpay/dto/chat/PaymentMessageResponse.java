package com.apexpay.dto.chat;

import com.apexpay.entity.enums.PaymentMethod;
import com.apexpay.entity.enums.TransactionStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
public class PaymentMessageResponse {

    private UUID id;
    private UUID conversationId;
    private UUID transactionId;
    private UUID senderId;
    private String senderName;
    private UUID receiverId;
    private String receiverName;
    private BigDecimal amount;
    private String currency;
    private PaymentMethod paymentMethod;
    private TransactionStatus status;
    private String referenceNumber;
    private String receiptUrl;
    private LocalDateTime createdAt;
}
