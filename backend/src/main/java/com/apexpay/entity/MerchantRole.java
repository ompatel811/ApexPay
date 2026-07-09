package com.apexpay.entity;

import com.apexpay.entity.enums.MerchantRoleName;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

/**
 * Entity representing a merchant business-level role.
 */
@Getter
@Setter
@Entity
@Table(name = "merchant_roles")
public class MerchantRole {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @NotNull(message = "Role name is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "name", nullable = false, unique = true, length = 50)
    private MerchantRoleName name;

    public MerchantRole() {}

    public MerchantRole(MerchantRoleName name) {
        this.name = name;
    }
}
