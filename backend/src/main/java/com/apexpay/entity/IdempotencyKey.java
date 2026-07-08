package com.apexpay.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
2:  * Entity representing an API Idempotency Key record.
3:  */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "idempotency_keys")
public class IdempotencyKey {

    @Id
    @Column(name = "key", nullable = false, unique = true)
    private String key;

    @NotBlank(message = "Response body is required")
    @Column(name = "response_body", nullable = false, columnDefinition = "TEXT")
    private String responseBody;

    @NotNull(message = "Created at timestamp is required")
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public IdempotencyKey(String key, String responseBody) {
        this.key = key;
        this.responseBody = responseBody;
        this.createdAt = LocalDateTime.now();
    }
}
