package com.apexpay.service;

import com.apexpay.dto.*;

import java.util.List;
import java.util.UUID;

public interface AnalyticsService {
    AnalyticsDashboardResponse getDashboardMetrics(UUID userId);
    SpendingAnalyticsResponse getSpendingAnalytics(UUID userId);
    IncomeAnalyticsResponse getIncomeAnalytics(UUID userId);
    List<CategorySpendingItem> getCategoryAnalytics(UUID userId);
    TrendsResponse getTrendAnalytics(UUID userId, String period);
    CategoryUpdateResponse updateTransactionCategory(UUID transactionId, UUID userId, String category);
}
