package com.apexpay.dto.media;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Builder
public class UploadResponse {

    private UUID mediaFileId;
    private UUID attachmentId;
    private String originalName;
    private String storedName;
    private String mimeType;
    private Long size;
    private String fileUrl;
    private String thumbnailUrl;
}
