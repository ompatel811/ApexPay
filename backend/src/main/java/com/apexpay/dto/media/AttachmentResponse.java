package com.apexpay.dto.media;

import com.apexpay.entity.enums.AttachmentType;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
public class AttachmentResponse {

    private UUID attachmentId;
    private UUID messageId;
    private UUID uploaderId;
    private String uploaderName;
    private AttachmentType attachmentType;
    private MediaResponse mediaFile;
    private LocalDateTime createdAt;
}
