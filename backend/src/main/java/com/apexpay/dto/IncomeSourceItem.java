package com.apexpay.dto;

import java.math.BigDecimal;

public record IncomeSourceItem(
    String source,
    BigDecimal amount,
    BigDecimal percentage
) {}
