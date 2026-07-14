package com.apexpay.dto.admin;

import jakarta.validation.constraints.NotBlank;

public record PlatformSettingDto(
    @NotBlank(message = "Key is required")
    String key,
    String value,
    String description
) {}
