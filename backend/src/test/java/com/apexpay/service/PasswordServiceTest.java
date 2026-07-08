package com.apexpay.service;

import com.apexpay.entity.PasswordResetToken;
import com.apexpay.entity.User;
import com.apexpay.exception.BusinessException;
import com.apexpay.exception.InvalidTokenException;
import com.apexpay.exception.TokenExpiredException;
import com.apexpay.repository.PasswordResetTokenRepository;
import com.apexpay.repository.UserRepository;
import com.apexpay.service.impl.PasswordServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PasswordServiceTest {

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private PasswordResetTokenRepository resetTokenRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private PasswordServiceImpl passwordService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void validatePasswordStrength_ShouldPass_WhenPasswordIsStrong() {
        assertDoesNotThrow(() -> passwordService.validatePasswordStrength("StrongPass123!"));
    }

    @Test
    void validatePasswordStrength_ShouldThrowException_WhenPasswordIsWeak() {
        assertThrows(BusinessException.class, () -> passwordService.validatePasswordStrength("weak"));
        assertThrows(BusinessException.class, () -> passwordService.validatePasswordStrength("NoDigitNoSpecialPass"));
        assertThrows(BusinessException.class, () -> passwordService.validatePasswordStrength("nocaps1!"));
    }

    @Test
    void generateResetToken_ShouldCreateAndSaveToken() {
        User user = new User();
        when(resetTokenRepository.findByUserAndUsedFalse(user)).thenReturn(Optional.empty());
        when(resetTokenRepository.save(any(PasswordResetToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        String token = passwordService.generateResetToken(user);
        
        assertNotNull(token);
        verify(resetTokenRepository, times(1)).save(any(PasswordResetToken.class));
    }

    @Test
    void verifyResetTokenAndChange_ShouldThrowException_WhenTokenIsUsed() {
        PasswordResetToken tokenObj = new PasswordResetToken();
        tokenObj.setUsed(true);

        when(resetTokenRepository.findByToken("token")).thenReturn(Optional.of(tokenObj));

        assertThrows(InvalidTokenException.class, () -> passwordService.verifyResetTokenAndChange("token", "NewPass123!"));
    }

    @Test
    void verifyResetTokenAndChange_ShouldThrowException_WhenTokenIsExpired() {
        PasswordResetToken tokenObj = new PasswordResetToken();
        tokenObj.setUsed(false);
        tokenObj.setExpiryDate(Instant.now().minus(5, ChronoUnit.MINUTES));

        when(resetTokenRepository.findByToken("token")).thenReturn(Optional.of(tokenObj));

        assertThrows(TokenExpiredException.class, () -> passwordService.verifyResetTokenAndChange("token", "NewPass123!"));
    }
}
