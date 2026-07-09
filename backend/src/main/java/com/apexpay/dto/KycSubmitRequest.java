package com.apexpay.dto;

import jakarta.validation.constraints.NotBlank;

public record KycSubmitRequest(
    @NotBlank(message = "PAN upload is required")
    String panUpload,

    @NotBlank(message = "GST upload is required")
    String gstUpload,

    @NotBlank(message = "Business proof is required")
    String businessProof,

    @NotBlank(message = "Identity proof is required")
    String identityProof,

    @NotBlank(message = "Address proof is required")
    String addressProof
) {}
