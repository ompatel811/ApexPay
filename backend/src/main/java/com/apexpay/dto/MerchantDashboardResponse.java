package com.apexpay.dto;

import java.math.BigDecimal;
import java.util.List;

public record MerchantDashboardResponse(
    BigDecimal todaySales,
    BigDecimal weeklySales,
    BigDecimal monthlySales,
    BigDecimal totalRevenue,
    BigDecimal totalRefunds,
    long totalTransactionsCount,
    long pendingPaymentsCount,
    BigDecimal settlementAmount,
    List<PaymentLinkResponse> recentPayments,
    String verificationStatus
) {}
