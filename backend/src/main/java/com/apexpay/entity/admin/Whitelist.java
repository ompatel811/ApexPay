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
@Table(name = "whitelists")
public class Whitelist {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @NotBlank(message = "Whitelist type is required")
    @Size(max = 50)
    @Column(name = "type", nullable = false)
    private String type; // WALLET, MERCHANT, DEVICE

    @NotBlank(message = "Whitelisted item value is required")
    @Size(max = 255)
    @Column(name = "item_value", nullable = false)
    private String itemValue;

    @Size(max = 255)
    @Column(name = "description")
    private String description;

    @NotNull
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
