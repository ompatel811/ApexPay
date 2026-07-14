package com.apexpay.dto;

import java.time.LocalDateTime;

public record ChatResponse(
    String response,
    LocalDateTime timestamp
) {}
