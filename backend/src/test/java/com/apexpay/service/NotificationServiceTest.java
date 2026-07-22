package com.apexpay.service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.apexpay.dto.NotificationResponse;
import com.apexpay.entity.Notification;
import com.apexpay.entity.User;
import com.apexpay.entity.enums.AccountStatus;
import com.apexpay.entity.enums.NotificationType;
import com.apexpay.repository.NotificationRepository;
import com.apexpay.service.impl.NotificationServiceImpl;

@ExtendWith(MockitoExtension.class)
public class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    private User testUser;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        testUser = new User();
        testUser.setId(userId);
        testUser.setUsername("johndoe");
        testUser.setEmail("johndoe@example.com");
        testUser.setAccountStatus(AccountStatus.ACTIVE);
    }

    @Test
    void sendNotification_Success() {
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> {
            Notification n = invocation.getArgument(0);
            n.setId(UUID.randomUUID());
            return n;
        });

        Notification saved = notificationService.sendNotification(
                testUser,
                "Bank Account Linked",
                "Your Chase account has been linked.",
                NotificationType.BANK_LINKED
        );

        assertNotNull(saved);
        assertEquals("Bank Account Linked", saved.getTitle());
        assertEquals(NotificationType.BANK_LINKED, saved.getNotificationType());

        verify(messagingTemplate).convertAndSendToUser(
                eq(testUser.getUsername()),
                eq("/queue/notifications"),
                any(NotificationResponse.class)
        );

        verify(emailService).sendBankLinkedEmail(eq(testUser.getEmail()), anyString(), anyString());
    }

    @Test
    void markAsRead_Success() {
        UUID notificationId = UUID.randomUUID();
        Notification n = new Notification();
        n.setId(notificationId);
        n.setUser(testUser);
        n.setTitle("Title");
        n.setMessage("Message");
        n.setNotificationType(NotificationType.SECURITY_ALERT);
        n.setIsRead(false);
        n.setCreatedAt(LocalDateTime.now());

        when(notificationRepository.findById(notificationId)).thenReturn(Optional.of(n));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NotificationResponse response = notificationService.markAsRead(notificationId, userId);

        assertNotNull(response);
        assertTrue(response.read());
        verify(notificationRepository).save(n);
    }
}
