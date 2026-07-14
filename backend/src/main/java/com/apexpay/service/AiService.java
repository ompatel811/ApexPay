package com.apexpay.service;

import com.apexpay.dto.*;
import java.util.List;
import java.util.UUID;

public interface AiService {
    ChatResponse chat(UUID userId, ChatRequest request);
    List<ChatHistoryResponse> getChatHistory(UUID userId);
    List<FinancialInsightResponse> getInsights(UUID userId);
    FinancialSummaryResponse getSummary(UUID userId);
    List<BudgetRecommendationResponse> getBudgetRecommendations(UUID userId);
    BudgetRecommendationResponse applyBudgetRecommendation(UUID userId, UUID recommendationId);
    FinancialHealthResponse getFinancialHealthScore(UUID userId);
}
