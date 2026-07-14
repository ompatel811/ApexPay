package com.apexpay.dto.admin;

public record AdminLoginResponse(
    String accessToken,
    String tokenType,
    AdminProfileResponse profile
) {}
