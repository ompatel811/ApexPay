package com.apexpay.dto;

import java.math.BigDecimal;

public record CategorySpendingItem(
    String category,
    BigDecimal amount,
    BigDecimal percentage
) {}
