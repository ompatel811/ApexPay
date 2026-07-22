package com.apexpay.service;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;

import com.apexpay.dto.RegisterRequest;
import com.apexpay.dto.RegisterResponse;
import com.apexpay.entity.Role;
import com.apexpay.entity.User;
import com.apexpay.entity.enums.RoleName;
import com.apexpay.exception.BusinessException;
import com.apexpay.exception.DuplicateUserException;
import com.apexpay.repository.UserRepository;
import com.apexpay.repository.WalletRepository;
import com.apexpay.service.impl.AuthenticationServiceImpl;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private WalletRepository walletRepository;

    @Mock
    private RoleService roleService;

    @Mock
    private PasswordService passwordService;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private AuthenticationServiceImpl authenticationService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void register_ShouldRegisterUser_WhenRequestIsValid() {
        RegisterRequest request = new RegisterRequest(
                "John Doe",
                "johndoe",
                "john@example.com",
                "+1234567890",
                "StrongPass123!",
                "StrongPass123!"
        );

        when(userRepository.existsByEmail(request.email())).thenReturn(false);
        when(userRepository.existsByUsername(request.username())).thenReturn(false);
        when(userRepository.existsByMobileNumber(request.mobileNumber())).thenReturn(false);
        when(passwordService.hashPassword(request.password())).thenReturn("hashedPassword");
        
        Role userRole = new Role(RoleName.ROLE_USER);
        when(roleService.findByName(RoleName.ROLE_USER)).thenReturn(userRole);

        User savedUser = new User();
        savedUser.setId(UUID.randomUUID());
        savedUser.setFullName(request.fullName());
        savedUser.setUsername(request.username());
        savedUser.setEmail(request.email());
        savedUser.setMobileNumber(request.mobileNumber());
        savedUser.setPasswordHash("hashedPassword");

        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        RegisterResponse response = authenticationService.register(request);

        assertNotNull(response);
        assertEquals(savedUser.getId(), response.id());
        assertEquals("johndoe", response.username());
        verify(walletRepository, times(1)).save(any());
        verify(auditService, times(1)).log(eq("USER_REGISTER"), eq(savedUser.getId()), eq("User"), eq(savedUser.getId()));
    }

    @Test
    void register_ShouldThrowException_WhenPasswordsDoNotMatch() {
        RegisterRequest request = new RegisterRequest(
                "John Doe",
                "johndoe",
                "john@example.com",
                "+1234567890",
                "StrongPass123!",
                "DifferentPass123!"
        );

        assertThrows(BusinessException.class, () -> authenticationService.register(request));
    }

    @Test
    void register_ShouldThrowException_WhenEmailIsTaken() {
        RegisterRequest request = new RegisterRequest(
                "John Doe",
                "johndoe",
                "john@example.com",
                "+1234567890",
                "StrongPass123!",
                "StrongPass123!"
        );

        when(userRepository.existsByEmail(request.email())).thenReturn(true);

        assertThrows(DuplicateUserException.class, () -> authenticationService.register(request));
    }
}
