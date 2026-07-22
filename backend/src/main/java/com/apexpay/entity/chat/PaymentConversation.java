package com.apexpay.entity.chat;

import com.apexpay.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "payment_conversations")
public class PaymentConversation extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false, unique = true)
    private Conversation conversation;

    @Column(name = "last_payment_id")
    private UUID lastPaymentId;

    @Column(name = "last_payment_status", length = 50)
    private String lastPaymentStatus;
}
