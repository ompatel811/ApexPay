package com.apexpay.service;

import com.apexpay.entity.RefreshToken;
import com.apexpay.entity.User;

import java.util.Optional;
import java.util.UUID;

/**
 * Service interface for managing refresh tokens.
 */
public interface TokenService {
    RefreshToken createRefreshToken(User user);
    RefreshToken verifyExpiration(RefreshToken token);
    Optional<RefreshToken> findByToken(String token);
    void revokeToken(RefreshToken token);
    void deleteByUserId(UUID userId);
}
