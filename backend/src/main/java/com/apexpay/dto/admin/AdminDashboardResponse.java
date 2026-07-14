package com.apexpay.dto.admin;

import java.math.BigDecimal;

public record AdminDashboardResponse(
    long totalUsers,
    long activeUsers,
    long blockedUsers,
    long totalMerchants,
    long totalWallets,
    long todayTransactions,
    long pendingTransactions,
    long failedTransactions,
    long qrPayments,
    long upiPayments,
    BigDecimal totalRevenue,
    BigDecimal platformBalance
) {}
