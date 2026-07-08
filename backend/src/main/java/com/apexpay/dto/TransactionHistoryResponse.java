package com.apexpay.dto;

import java.util.List;

/**
 * DTO representing user transaction history with pagination info.
 */
public record TransactionHistoryResponse(
        List<TransactionDetailsResponse> transactions,
        int currentPage,
        long totalItems,
        int totalPages
) {}
