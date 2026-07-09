package com.apexpay.dto;

import java.math.BigDecimal;
import java.util.List;

public record MerchantAnalyticsResponse(
    List<AnalyticsTrendItem> revenueTrend,
    List<AnalyticsTrendItem> customerTrend,
    BigDecimal paymentSuccessRate,
    List<AnalyticsTrendItem> refundTrend,
    BigDecimal averageOrderValue,
    List<AnalyticsTrendItem> monthlyRevenue
) {}
