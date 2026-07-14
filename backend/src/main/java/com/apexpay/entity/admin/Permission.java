package com.apexpay.entity.admin;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "admin_permissions")
public class Permission {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @NotBlank(message = "Permission name is required")
    @Size(max = 100, message = "Permission name must be less than 100 characters")
    @Column(name = "name", nullable = false, unique = true)
    private String name;

    @Size(max = 255, message = "Description must be less than 255 characters")
    @Column(name = "description")
    private String description;
}
