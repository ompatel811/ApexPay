package com.apexpay.dto;

import java.math.BigDecimal;

public record AnalyticsTrendItem(
    String label,
    BigDecimal value
) {}
