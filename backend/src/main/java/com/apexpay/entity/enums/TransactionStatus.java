package com.apexpay.entity.enums;

/**
 * Represents the execution state of a transaction.
 */
public enum TransactionStatus {
    PENDING,
    PROCESSING,
    SUCCESS,
    FAILED,
    CANCELLED,
    REVERSED
}
