package com.apexpay.service;

import java.math.BigDecimal;

public interface EmailService {
    void sendPaymentSuccessEmail(String toEmail, String recipientName, String refNumber, BigDecimal amount);
    void sendPaymentFailedEmail(String toEmail, String recipientName, String refNumber, BigDecimal amount, String reason);
    void sendMoneyReceivedEmail(String toEmail, String senderName, String refNumber, BigDecimal amount);
    void sendRequestMoneyEmail(String toEmail, String requesterName, BigDecimal amount, String remarks);
    void sendBankLinkedEmail(String toEmail, String bankName, String accountNumber);
    void sendSecurityAlertEmail(String toEmail, String alertMessage);
}
