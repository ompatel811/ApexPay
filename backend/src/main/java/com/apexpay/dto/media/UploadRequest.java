package com.apexpay.dto.media;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class UploadRequest {

    private UUID conversationId;
    private UUID messageId;
}
