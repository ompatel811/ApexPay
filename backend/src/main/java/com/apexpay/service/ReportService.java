package com.apexpay.service;

import com.apexpay.dto.AccountStatementResponse;

import java.time.LocalDate;
import java.util.UUID;

public interface ReportService {
    AccountStatementResponse generateStatement(UUID userId, LocalDate startDate, LocalDate endDate);
    byte[] exportTransactions(UUID userId, String format, LocalDate startDate, LocalDate endDate);
}
