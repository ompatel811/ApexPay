package com.apexpay.controller;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.MockitoAnnotations;
import org.springframework.http.ResponseEntity;

import com.apexpay.dto.ApiResponse;
import com.apexpay.dto.AuditLogResponse;
import com.apexpay.dto.DeviceSessionResponse;
import com.apexpay.dto.UpdateProfileRequest;
import com.apexpay.dto.UserProfileResponse;
import com.apexpay.security.UserPrincipal;
import com.apexpay.service.UserService;

@SuppressWarnings({"null", "unused"})
class UserControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    private UserPrincipal userPrincipal;
    private UUID userId;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        userId = UUID.randomUUID();
        userPrincipal = new UserPrincipal(
                userId,
                "John Doe",
                "johndoe",
                "john@example.com",
                "+1234567890",
                "passwordHash",
                Collections.emptyList()
        );
    }

    @Test
    void getProfile_ShouldReturnProfile_WhenUserIsAuthenticated() {
        UserProfileResponse mockProfile = new UserProfileResponse(
                userId,
                "John Doe",
                "johndoe",
                "john@example.com",
                "+1234567890",
                null,
                null,
                "ACTIVE",
                Collections.singleton("ROLE_USER")
        );

        when(userService.getProfile(userId)).thenReturn(mockProfile);

        ResponseEntity<ApiResponse<UserProfileResponse>> response = userController.getProfile(userPrincipal);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().success());
        assertEquals("John Doe", response.getBody().data().fullName());
        verify(userService, times(1)).getProfile(userId);
    }

    @Test
    void updateProfile_ShouldReturnUpdatedProfile_WhenRequestIsValid() {
        UpdateProfileRequest request = new UpdateProfileRequest("John updated", null, null, null, null);
        UserProfileResponse mockProfile = new UserProfileResponse(
                userId,
                "John updated",
                "johndoe",
                "john@example.com",
                "+1234567890",
                null,
                null,
                "ACTIVE",
                Collections.singleton("ROLE_USER")
        );

        when(userService.updateProfile(eq(userId), any(UpdateProfileRequest.class))).thenReturn(mockProfile);

        ResponseEntity<ApiResponse<UserProfileResponse>> response = userController.updateProfile(userPrincipal, request);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().success());
        assertEquals("John updated", response.getBody().data().fullName());
        verify(userService, times(1)).updateProfile(eq(userId), any(UpdateProfileRequest.class));
    }

    @Test
    void getSessions_ShouldReturnDeviceSessions_WhenRequested() {
        DeviceSessionResponse mockSession = new DeviceSessionResponse(
                UUID.randomUUID(),
                "Macbook Pro",
                "Chrome",
                "macOS",
                "127.0.0.1",
                LocalDateTime.now(),
                true
        );

        when(userService.getUserSessions(userId)).thenReturn(List.of(mockSession));

        ResponseEntity<ApiResponse<List<DeviceSessionResponse>>> response = userController.getSessions(userPrincipal);

        assertNotNull(response);
        assertNotNull(response.getBody());
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().success());
        assertEquals(1, response.getBody().data().size());
        assertEquals("Macbook Pro", response.getBody().data().get(0).deviceName());
        verify(userService, times(1)).getUserSessions(userId);
    }

    @Test
    void revokeSession_ShouldRevokeSession_WhenSessionIdIsValid() {
        UUID sessionId = UUID.randomUUID();

        doNothing().when(userService).revokeSession(userId, sessionId);

        ResponseEntity<ApiResponse<Void>> response = userController.revokeSession(userPrincipal, sessionId);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().success());
        verify(userService, times(1)).revokeSession(userId, sessionId);
    }

    @Test
    void getProfileActivity_ShouldReturnAuditTimeline_WhenRequested() {
        AuditLogResponse mockLog = new AuditLogResponse(
                UUID.randomUUID(),
                "USER_LOGIN",
                userId.toString(),
                "User",
                userId.toString(),
                LocalDateTime.now()
        );

        when(userService.getUserActivity(userId)).thenReturn(List.of(mockLog));

        ResponseEntity<ApiResponse<List<AuditLogResponse>>> response = userController.getProfileActivity(userPrincipal);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().success());
        assertEquals(1, response.getBody().data().size());
        assertEquals("USER_LOGIN", response.getBody().data().get(0).action());
        verify(userService, times(1)).getUserActivity(userId);
    }
}
