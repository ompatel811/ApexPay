package com.apexpay.entity.admin;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "blacklists")
public class Blacklist {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @NotBlank(message = "Blacklist type is required")
    @Size(max = 50)
    @Column(name = "type", nullable = false)
    private String type; // IP, DEVICE, USER, WALLET, MERCHANT, UPI

    @NotBlank(message = "Blacklisted item value is required")
    @Size(max = 255)
    @Column(name = "item_value", nullable = false)
    private String itemValue;

    @Size(max = 255)
    @Column(name = "reason")
    private String reason;

    @NotNull
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
