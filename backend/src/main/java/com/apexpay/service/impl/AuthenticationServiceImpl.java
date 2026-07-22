package com.apexpay.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apexpay.dto.LoginRequest;
import com.apexpay.dto.LoginResponse;
import com.apexpay.dto.RefreshTokenRequest;
import com.apexpay.dto.RefreshTokenResponse;
import com.apexpay.dto.RegisterRequest;
import com.apexpay.dto.RegisterResponse;
import com.apexpay.dto.UserProfileResponse;
import com.apexpay.entity.DeviceSession;
import com.apexpay.entity.RefreshToken;
import com.apexpay.entity.Role;
import com.apexpay.entity.User;
import com.apexpay.entity.Wallet;
import com.apexpay.entity.enums.AccountStatus;
import com.apexpay.entity.enums.RoleName;
import com.apexpay.entity.enums.WalletStatus;
import com.apexpay.exception.BusinessException;
import com.apexpay.exception.DuplicateUserException;
import com.apexpay.exception.InvalidCredentialsException;
import com.apexpay.exception.InvalidTokenException;
import com.apexpay.repository.DeviceSessionRepository;
import com.apexpay.repository.UserRepository;
import com.apexpay.repository.WalletRepository;
import com.apexpay.security.JwtTokenProvider;
import com.apexpay.security.UserPrincipal;
import com.apexpay.service.AuditService;
import com.apexpay.service.AuthenticationService;
import com.apexpay.service.PasswordService;
import com.apexpay.service.RoleService;
import com.apexpay.service.TokenService;

/**
 * Service implementation coordinating user registration, login, logout, and token rotation.
 */
@Service
public class AuthenticationServiceImpl implements AuthenticationService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private DeviceSessionRepository deviceSessionRepository;

    @Autowired
    private RoleService roleService;

    @Autowired
    private PasswordService passwordService;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private AuditService auditService;

    @Override
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        if (!request.password().equals(request.confirmPassword())) {
            throw new BusinessException("Passwords do not match.");
        }

        // Validate password strength
        passwordService.validatePasswordStrength(request.password());

        // Check if unique fields are taken
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateUserException("Email address is already in use.");
        }
        if (userRepository.existsByUsername(request.username())) {
            throw new DuplicateUserException("Username is already in use.");
        }
        if (userRepository.existsByMobileNumber(request.mobileNumber())) {
            throw new DuplicateUserException("Mobile number is already in use.");
        }

        // Create User Entity
        User user = new User();
        user.setFullName(request.fullName());
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setMobileNumber(request.mobileNumber());
        user.setPasswordHash(passwordService.hashPassword(request.password()));
        user.setAccountStatus(AccountStatus.ACTIVE);

        // Assign Default ROLE_USER
        Role userRole = roleService.findByName(RoleName.ROLE_USER);
        user.setRoles(Collections.singleton(userRole));

        // Save User
        User savedUser = userRepository.save(user);

        // Seed Initial Wallet
        Wallet wallet = new Wallet();
        wallet.setUser(savedUser);
        // Generate unique wallet number
        String walletNum = "APX" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
        wallet.setWalletNumber(walletNum);
        wallet.setBalance(BigDecimal.ZERO);
        wallet.setCurrency("USD");
        wallet.setWalletStatus(WalletStatus.ACTIVE);
        
        walletRepository.save(wallet);

        // Audit log
        auditService.log("USER_REGISTER", savedUser.getId(), "User", savedUser.getId());

        return new RegisterResponse(
                savedUser.getId(),
                savedUser.getFullName(),
                savedUser.getUsername(),
                savedUser.getEmail(),
                savedUser.getMobileNumber(),
                "User registered successfully."
        );
    }

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request, String deviceName, String browser, String operatingSystem, String ipAddress) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.identifier(), request.password()));
        } catch (BadCredentialsException ex) {
            // Audit Log Login Failure (requires loading user to find ID if available, otherwise log identifier)
            auditService.log("LOGIN_FAILURE", request.identifier(), "User", null);
            throw new InvalidCredentialsException("Invalid email/mobile or password.");
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new InvalidCredentialsException("User not found after authentication."));

        // Generate tokens
        String accessToken = tokenProvider.generateAccessToken(authentication);
        RefreshToken refreshToken = tokenService.createRefreshToken(user);

        // Record Device Session
        DeviceSession session = new DeviceSession();
        session.setUser(user);
        session.setDeviceName(deviceName != null ? deviceName : "Unknown Device");
        session.setBrowser(browser != null ? browser : "Unknown Browser");
        session.setOperatingSystem(operatingSystem != null ? operatingSystem : "Unknown OS");
        session.setIpAddress(ipAddress != null ? ipAddress : "0.0.0.0");
        session.setLastLogin(LocalDateTime.now());
        session.setIsActive(true);
        deviceSessionRepository.save(session);

        // Audit success log
        auditService.log("USER_LOGIN", user.getId(), "User", user.getId());

        Set<String> roleNames = userPrincipal.getAuthorities().stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());

        UserProfileResponse profile = new UserProfileResponse(
                user.getId(),
                user.getFullName(),
                user.getUsername(),
                user.getEmail(),
                user.getMobileNumber(),
                user.getProfilePhoto(),
                user.getDateOfBirth(),
                user.getAccountStatus().name(),
                roleNames
        );

        return new LoginResponse(
                accessToken,
                refreshToken.getToken(),
                tokenProvider.getJwtExpirationInMs(),
                profile
        );
    }

    @Override
    @Transactional
    public void logout(String refreshTokenStr) {
        RefreshToken refreshToken = tokenService.findByToken(refreshTokenStr)
                .orElseThrow(() -> new InvalidTokenException("Refresh token not found."));

        tokenService.revokeToken(refreshToken);

        User user = refreshToken.getUser();
        auditService.log("USER_LOGOUT", user.getId(), "User", user.getId());
    }

    @Override
    @Transactional
    public RefreshTokenResponse refresh(RefreshTokenRequest request) {
        RefreshToken refreshToken = tokenService.findByToken(request.refreshToken())
                .orElseThrow(() -> new InvalidTokenException("Refresh token not found."));

        // Verifies expiry and revoked fields
        tokenService.verifyExpiration(refreshToken);

        User user = refreshToken.getUser();

        // Generate new Access and Refresh tokens
        String newAccessToken = tokenProvider.generateAccessTokenForUser(
                user.getId(), user.getUsername(), user.getEmail());
        
        // Rotate refresh token
        RefreshToken rotatedRefreshToken = tokenService.createRefreshToken(user);

        return new RefreshTokenResponse(
                newAccessToken,
                rotatedRefreshToken.getToken(),
                tokenProvider.getJwtExpirationInMs()
        );
    }
}
