package com.apexpay.dto;

import java.util.List;

public record TrendsResponse(
    List<TrendItem> trends
) {}
