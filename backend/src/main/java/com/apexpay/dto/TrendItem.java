package com.apexpay.dto;

import java.math.BigDecimal;

public record TrendItem(
    String label,
    BigDecimal credits,
    BigDecimal debits
) {}
