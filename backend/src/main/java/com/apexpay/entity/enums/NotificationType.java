package com.apexpay.entity.enums;

/**
 * Represents the type of notification sent to a user.
 */
public enum NotificationType {
    PAYMENT_SUCCESS,
    PAYMENT_FAILED,
    PAYMENT_RECEIVED,
    BANK_LINKED,
    BANK_REMOVED,
    UPI_CREATED,
    UPI_UPDATED,
    REQUEST_RECEIVED,
    REQUEST_ACCEPTED,
    REQUEST_REJECTED,
    SECURITY_ALERT,
    SYSTEM_NOTIFICATION
}
