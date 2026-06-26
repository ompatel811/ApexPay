package com.apexpay.service.impl;

import com.apexpay.entity.PasswordResetToken;
import com.apexpay.entity.User;
import com.apexpay.exception.BusinessException;
import com.apexpay.exception.InvalidTokenException;
import com.apexpay.exception.TokenExpiredException;
import com.apexpay.repository.PasswordResetTokenRepository;
import com.apexpay.repository.UserRepository;
import com.apexpay.service.AuditService;
import com.apexpay.service.PasswordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * Service implementation for password validations and token resets.
 */
@Service
public class PasswordServiceImpl implements PasswordService {

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private PasswordResetTokenRepository resetTokenRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditService auditService;

    private static final String PASSWORD_PATTERN = 
            "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\\S+$).{8,}$";

    @Override
    public void validatePasswordStrength(String password) {
        if (password == null || !password.matches(PASSWORD_PATTERN)) {
            throw new BusinessException("Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one digit, and one special character.");
        }
    }

    @Override
    @Transactional
    public String generateResetToken(User user) {
        // Invalidate any existing active token
        resetTokenRepository.findByUserAndUsedFalse(user).ifPresent(t -> {
            t.setUsed(true);
            resetTokenRepository.save(t);
        });

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(user);
        resetToken.setToken(UUID.randomUUID().toString());
        resetToken.setExpiryDate(Instant.now().plus(15, ChronoUnit.MINUTES)); // 15 mins expiry
        resetToken.setUsed(false);

        resetTokenRepository.save(resetToken);
        return resetToken.getToken();
    }

    @Override
    @Transactional
    public void verifyResetTokenAndChange(String token, String newPassword) {
        PasswordResetToken resetToken = resetTokenRepository.findByToken(token)
                .orElseThrow(() -> new InvalidTokenException("Invalid password reset token."));

        if (resetToken.getUsed()) {
            throw new InvalidTokenException("This reset token has already been used.");
        }

        if (resetToken.isExpired()) {
            throw new TokenExpiredException("This reset token has expired.");
        }

        validatePasswordStrength(newPassword);

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setUsed(true);
        resetTokenRepository.save(resetToken);

        auditService.log("PASSWORD_RESET", user.getId(), "User", user.getId());
    }

    @Override
    public boolean verifyCurrentPassword(User user, String rawPassword) {
        return passwordEncoder.matches(rawPassword, user.getPasswordHash());
    }

    @Override
    public String hashPassword(String password) {
        return passwordEncoder.encode(password);
    }
}
