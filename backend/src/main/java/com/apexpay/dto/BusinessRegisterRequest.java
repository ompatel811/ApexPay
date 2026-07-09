package com.apexpay.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record BusinessRegisterRequest(
    @NotBlank(message = "Business name is required")
    String businessName,

    @NotBlank(message = "Business type is required")
    String businessType,

    @NotBlank(message = "Business email is required")
    @Email(message = "Invalid business email format")
    String businessEmail,

    @NotBlank(message = "Business mobile number is required")
    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Please provide a valid E.164 mobile number")
    String businessMobile,

    @NotBlank(message = "Business address is required")
    String businessAddress,

    String gstNumber,
    String panNumber
) {}
