package com.apexpay.dto;

import java.math.BigDecimal;
import java.util.List;

public record AccountStatementResponse(
    BigDecimal openingBalance,
    BigDecimal closingBalance,
    BigDecimal creditsSum,
    BigDecimal debitsSum,
    List<TransactionStatementItem> transactions,
    String summaryPeriod
) {}
