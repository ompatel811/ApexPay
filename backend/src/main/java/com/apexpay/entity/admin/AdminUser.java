package com.apexpay.entity.admin;

import com.apexpay.entity.enums.AccountStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.Set;
import java.util.HashSet;

@Getter
@Setter
@Entity
@Table(name = "admin_users")
public class AdminUser {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @NotBlank(message = "Full name is required")
    @Size(max = 255, message = "Full name must be less than 255 characters")
    @Column(name = "full_name", nullable = false)
    private String fullName;

    @NotBlank(message = "Username is required")
    @Size(max = 100, message = "Username must be less than 100 characters")
    @Column(name = "username", nullable = false, unique = true)
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    @Size(max = 150, message = "Email must be less than 150 characters")
    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @NotBlank(message = "Password hash is required")
    @Size(max = 255, message = "Password hash must be less than 255 characters")
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @NotNull(message = "Account status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private AccountStatus status = AccountStatus.ACTIVE;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "admin_user_roles",
        joinColumns = @JoinColumn(name = "admin_user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<AdminRole> roles = new HashSet<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
