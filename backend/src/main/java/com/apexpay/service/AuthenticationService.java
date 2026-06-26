package com.apexpay.service;

import com.apexpay.dto.*;

/**
 * Service interface coordinating authentication logic.
 */
public interface AuthenticationService {
    RegisterResponse register(RegisterRequest request);
    LoginResponse login(LoginRequest request, String deviceName, String browser, String operatingSystem, String ipAddress);
    void logout(String refreshToken);
    RefreshTokenResponse refresh(RefreshTokenRequest request);
}
