package com.apexpay.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateCategoryRequest(
    @NotBlank(message = "Category is required")
    String category
) {}
