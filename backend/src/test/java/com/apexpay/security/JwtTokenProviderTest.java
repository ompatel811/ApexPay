package com.apexpay.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.core.Authentication;

import java.util.Collections;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;
    // Base64 encoded secret for testing
    private static final String TEST_SECRET = "dGhpcy1pcy1hLXN1cGVyLXNlY3JldC1rZXktZm9yLWFwZXhwYXktcGxhdGZvcm0tcHJvZHVjdGlvbi1yZWFkeS1zdGFja2luZw==";
    private static final long EXPIRATION_MS = 3600000; // 1 hour

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider(TEST_SECRET, EXPIRATION_MS);
    }

    @Test
    void generateAccessToken_ShouldReturnToken_WhenAuthenticationIsValid() {
        UUID userId = UUID.randomUUID();
        UserPrincipal userPrincipal = new UserPrincipal(
                userId,
                "Test User",
                "testuser",
                "test@example.com",
                "+1234567890",
                "passwordHash",
                Collections.emptyList()
        );

        Authentication authentication = Mockito.mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userPrincipal);

        String token = jwtTokenProvider.generateAccessToken(authentication);
        assertNotNull(token);
        assertTrue(jwtTokenProvider.validateToken(token));

        UUID parsedId = jwtTokenProvider.getUserIdFromJWT(token);
        assertEquals(userId, parsedId);
    }

    @Test
    void generateAccessTokenForUser_ShouldReturnToken_WhenParametersAreValid() {
        UUID userId = UUID.randomUUID();
        String token = jwtTokenProvider.generateAccessTokenForUser(userId, "testuser", "test@example.com");

        assertNotNull(token);
        assertTrue(jwtTokenProvider.validateToken(token));

        UUID parsedId = jwtTokenProvider.getUserIdFromJWT(token);
        assertEquals(userId, parsedId);
    }

    @Test
    void validateToken_ShouldReturnFalse_WhenTokenIsMalformed() {
        assertFalse(jwtTokenProvider.validateToken("invalidToken"));
    }
}
