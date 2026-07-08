package com.apexpay.service;

import com.apexpay.dto.NotificationResponse;
import com.apexpay.entity.Notification;
import com.apexpay.entity.User;
import com.apexpay.entity.enums.NotificationType;

import java.util.List;
import java.util.UUID;

public interface NotificationService {
    Notification sendNotification(User user, String title, String message, NotificationType type);
    List<NotificationResponse> getNotificationsForUser(UUID userId);
    List<NotificationResponse> getUnreadNotificationsForUser(UUID userId);
    NotificationResponse markAsRead(UUID notificationId, UUID userId);
    void markAllAsRead(UUID userId);
    void deleteNotification(UUID notificationId, UUID userId);
}
