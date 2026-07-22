package com.apexpay.dto.chat;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReactionRequest {

    @NotBlank(message = "Reaction emoji/string is required")
    private String reaction;
}
