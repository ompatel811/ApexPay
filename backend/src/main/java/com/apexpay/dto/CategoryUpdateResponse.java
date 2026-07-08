package com.apexpay.dto;

import java.util.UUID;

public record CategoryUpdateResponse(
    UUID transactionId,
    String category
) {}
