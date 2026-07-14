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
@Table(name = "fraud_rules")
public class FraudRule {

    @Id
    @UuidGenerator
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @NotBlank(message = "Rule key is required")
    @Size(max = 100)
    @Column(name = "rule_key", nullable = false, unique = true)
    private String ruleKey;

    @NotBlank(message = "Rule name is required")
    @Size(max = 255)
    @Column(name = "name", nullable = false)
    private String name;

    @Size(max = 255)
    @Column(name = "description")
    private String description;

    @NotNull
    @Column(name = "is_enabled", nullable = false)
    private Boolean isEnabled = true;

    @NotBlank(message = "Threshold value is required")
    @Size(max = 255)
    @Column(name = "threshold_value", nullable = false)
    private String thresholdValue;

    @NotBlank(message = "Action is required")
    @Size(max = 50)
    @Column(name = "action", nullable = false)
    private String action;
}
