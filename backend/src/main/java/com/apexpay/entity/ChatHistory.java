package com.apexpay.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

/**
 * Entity representing a historical message in the AI Chat.
 */
@Getter
@Setter
@Entity
@Table(name = "chat_histories")
public class ChatHistory extends BaseEntity {

    @NotNull(message = "User association is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotBlank(message = "Role is required")
    @Size(max = 50, message = "Role must be less than 50 characters")
    @Column(name = "role", nullable = false)
    private String role; // USER, ASSISTANT

    @NotBlank(message = "Message content is required")
    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;
}
