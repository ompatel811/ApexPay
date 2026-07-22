package com.apexpay.dto.media;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
public class MediaResponse {

    private UUID id;
    private String originalName;
    private String storedName;
    private String mimeType;
    private String extension;
    private Long size;
    private String checksum;
    private String fileUrl;
    private String thumbnailUrl;
    private Integer width;
    private Integer height;
    private Integer duration;
    private LocalDateTime createdAt;
}
