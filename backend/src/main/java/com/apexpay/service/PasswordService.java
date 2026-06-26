package com.apexpay.service;

import com.apexpay.entity.User;

/**
 * Service interface for password hashing, checks, and reset tokens.
 */
public interface PasswordService {
    void validatePasswordStrength(String password);
    String generateResetToken(User user);
    void verifyResetTokenAndChange(String token, String newPassword);
    boolean verifyCurrentPassword(User user, String rawPassword);
    String hashPassword(String password);
}
