package com.apexpay.entity.chat;

import com.apexpay.entity.BaseEntity;
import com.apexpay.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "message_statuses")
public class MessageStatus extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    private Message message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "delivered", nullable = false)
    private boolean delivered = false;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @Column(name = "seen", nullable = false)
    private boolean seen = false;

    @Column(name = "seen_at")
    private LocalDateTime seenAt;

    @Column(name = "hidden_for_user", nullable = false)
    private boolean hiddenForUser = false;
}
