package com.apexpay.service;

import com.apexpay.dto.TransactionDetailsResponse;
import com.apexpay.dto.TransactionHistoryResponse;
import com.apexpay.entity.Transaction;
import com.apexpay.entity.Wallet;
import com.apexpay.entity.enums.TransactionStatus;
import com.apexpay.entity.enums.TransactionType;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Service managing platform payment Transactions recording and lookups.
 */
public interface TransactionService {
    Transaction createTransaction(Wallet senderWallet, Wallet receiverWallet, BigDecimal amount, 
                                  TransactionType type, TransactionStatus status, String remarks);
    TransactionDetailsResponse getTransactionDetails(UUID transactionId, UUID currentUserId);
    TransactionHistoryResponse getTransactionHistory(UUID userId, Pageable pageable);
    Transaction updateTransactionStatus(UUID transactionId, TransactionStatus status);
}
