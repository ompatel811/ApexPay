package com.apexpay.dto.admin;

import jakarta.validation.constraints.NotBlank;

public record WhitelistRequest(
    @NotBlank(message = "Whitelist type is required")
    String type, // WALLET, MERCHANT, DEVICE
    
    @NotBlank(message = "Item value is required")
    String itemValue,
    
    String description
) {}
