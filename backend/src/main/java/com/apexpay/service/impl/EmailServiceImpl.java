package com.apexpay.service.impl;

import com.apexpay.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Slf4j
@Service
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Autowired(required = false)
    public EmailServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    @Override
    public void sendPaymentSuccessEmail(String toEmail, String recipientName, String refNumber, BigDecimal amount) {
        String subject = "Payment Success Confirmation - ApexPay";
        String body = String.format(
                "Hello,\n\nYour payment of $%s to %s was successful.\nReference Number: %s\n\nThank you for using ApexPay!",
                amount.toString(), recipientName, refNumber
        );
        sendEmail(toEmail, subject, body);
    }

    @Async
    @Override
    public void sendPaymentFailedEmail(String toEmail, String recipientName, String refNumber, BigDecimal amount, String reason) {
        String subject = "Payment Failed Alert - ApexPay";
        String body = String.format(
                "Hello,\n\nYour payment of $%s to %s failed.\nReference Number: %s\nReason: %s\n\nPlease try again or contact support if the issue persists.",
                amount.toString(), recipientName, refNumber, reason
        );
        sendEmail(toEmail, subject, body);
    }

    @Async
    @Override
    public void sendMoneyReceivedEmail(String toEmail, String senderName, String refNumber, BigDecimal amount) {
        String subject = "Money Received Alert - ApexPay";
        String body = String.format(
                "Hello,\n\nYou have received $%s from %s.\nReference Number: %s\n\nThe amount has been credited to your ApexPay wallet.",
                amount.toString(), senderName, refNumber
        );
        sendEmail(toEmail, subject, body);
    }

    @Async
    @Override
    public void sendRequestMoneyEmail(String toEmail, String requesterName, BigDecimal amount, String remarks) {
        String subject = "Payment Request Received - ApexPay";
        String body = String.format(
                "Hello,\n\n%s has requested $%s from you on ApexPay.\nRemarks: %s\n\nPlease open your ApexPay app to Accept or Reject this request.",
                requesterName, amount.toString(), (remarks != null && !remarks.isEmpty()) ? remarks : "N/A"
        );
        sendEmail(toEmail, subject, body);
    }

    @Async
    @Override
    public void sendBankLinkedEmail(String toEmail, String bankName, String accountNumber) {
        String subject = "Bank Account Linked Successfully - ApexPay";
        String body = String.format(
                "Hello,\n\nYour bank account (%s, Account ending in %s) has been successfully linked to your ApexPay profile.",
                bankName, accountNumber.substring(Math.max(0, accountNumber.length() - 4))
        );
        sendEmail(toEmail, subject, body);
    }

    @Async
    @Override
    public void sendSecurityAlertEmail(String toEmail, String alertMessage) {
        String subject = "Security Alert - ApexPay";
        String body = String.format(
                "Hello,\n\nThis is a security alert regarding your ApexPay account:\n\n%s\n\nIf you did not perform this action, please change your password immediately or contact support.",
                alertMessage
        );
        sendEmail(toEmail, subject, body);
    }

    private void sendEmail(String toEmail, String subject, String body) {
        log.info("Preparing to send email to: {}, Subject: {}", toEmail, subject);
        log.info("Email body content:\n{}", body);
        
        if (mailSender == null) {
            log.warn("JavaMailSender is not configured. Email will only be logged.");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);
            message.setFrom("noreply@apexpay.com");
            mailSender.send(message);
            log.info("Email sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send email to {}. Exception: {}", toEmail, e.getMessage());
        }
    }
}
