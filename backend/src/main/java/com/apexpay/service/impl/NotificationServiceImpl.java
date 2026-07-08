package com.apexpay.service.impl;

import com.apexpay.dto.NotificationResponse;
import com.apexpay.entity.Notification;
import com.apexpay.entity.User;
import com.apexpay.entity.enums.NotificationType;
import com.apexpay.exception.ForbiddenException;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.NotificationRepository;
import com.apexpay.service.EmailService;
import com.apexpay.service.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final EmailService emailService;

    @Autowired
    public NotificationServiceImpl(NotificationRepository notificationRepository,
                                   SimpMessagingTemplate messagingTemplate,
                                   EmailService emailService) {
        this.notificationRepository = notificationRepository;
        this.messagingTemplate = messagingTemplate;
        this.emailService = emailService;
    }

    @Override
    @Transactional
    public Notification sendNotification(User user, String title, String message, NotificationType type) {
        log.info("Creating notification for user: {}, Title: {}, Type: {}", user.getUsername(), title, type);

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setNotificationType(type);
        notification.setIsRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setUpdatedAt(LocalDateTime.now());

        notification = notificationRepository.save(notification);
        NotificationResponse response = mapToResponse(notification);

        // 1. WebSocket Broadcast to User's private destination
        try {
            log.info("Sending live WebSocket frame to /user/{}/queue/notifications", user.getUsername());
            messagingTemplate.convertAndSendToUser(user.getUsername(), "/queue/notifications", response);
        } catch (Exception e) {
            log.error("Failed to broadcast WebSocket notification: {}", e.getMessage());
        }

        // 2. Email Dispatch integration based on Notification Type
        try {
            dispatchEmail(user.getEmail(), title, message, type);
        } catch (Exception e) {
            log.error("Failed to dispatch transactional email: {}", e.getMessage());
        }

        return notification;
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotificationsForUser(UUID userId) {
        log.info("Fetching all notifications for user: {}", userId);
        return notificationRepository.findByUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getUnreadNotificationsForUser(UUID userId) {
        log.info("Fetching unread notifications for user: {}", userId);
        return notificationRepository.findByUserIdAndIsReadFalse(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(UUID notificationId, UUID userId) {
        log.info("Marking notification {} as read for user {}", notificationId, userId);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found."));

        if (!notification.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not own this notification.");
        }

        notification.setIsRead(true);
        notification.setUpdatedAt(LocalDateTime.now());
        return mapToResponse(notificationRepository.save(notification));
    }

    @Override
    @Transactional
    public void markAllAsRead(UUID userId) {
        log.info("Marking all notifications as read for user {}", userId);
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalse(userId);
        for (Notification n : unread) {
            n.setIsRead(true);
            n.setUpdatedAt(LocalDateTime.now());
        }
        notificationRepository.saveAll(unread);
    }

    @Override
    @Transactional
    public void deleteNotification(UUID notificationId, UUID userId) {
        log.info("Deleting notification {} for user {}", notificationId, userId);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found."));

        if (!notification.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not own this notification.");
        }

        notificationRepository.delete(notification);
    }

    private NotificationResponse mapToResponse(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getTitle(),
                n.getMessage(),
                n.getNotificationType(),
                n.getIsRead(),
                n.getCreatedAt()
        );
    }

    private void dispatchEmail(String email, String title, String message, NotificationType type) {
        switch (type) {
            case BANK_LINKED:
                emailService.sendBankLinkedEmail(email, "Bank Account", "XXXX");
                break;
            case SECURITY_ALERT:
                emailService.sendSecurityAlertEmail(email, message);
                break;
            case PAYMENT_SUCCESS:
                emailService.sendPaymentSuccessEmail(email, "Merchant/Recipient", "REF-N/A", java.math.BigDecimal.ZERO);
                break;
            case PAYMENT_FAILED:
                emailService.sendPaymentFailedEmail(email, "Recipient", "REF-N/A", java.math.BigDecimal.ZERO, "Failure reason");
                break;
            case PAYMENT_RECEIVED:
                emailService.sendMoneyReceivedEmail(email, "Sender", "REF-N/A", java.math.BigDecimal.ZERO);
                break;
            case REQUEST_RECEIVED:
                emailService.sendRequestMoneyEmail(email, "Requester", java.math.BigDecimal.ZERO, message);
                break;
            default:
                log.debug("No automated email trigger mapped for notification type: {}", type);
                break;
        }
    }
}
