package com.apexpay.dto.admin;

import jakarta.validation.constraints.NotBlank;

public record BlacklistRequest(
    @NotBlank(message = "Blacklist type is required")
    String type, // IP, DEVICE, USER, WALLET, MERCHANT, UPI
    
    @NotBlank(message = "Item value is required")
    String itemValue,
    
    String reason
) {}
