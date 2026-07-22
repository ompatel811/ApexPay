package com.apexpay.service.media;

import com.apexpay.dto.media.UploadResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface UploadService {

    UploadResponse uploadSingleFile(UUID userId, MultipartFile file, UUID conversationId, UUID messageId);

    List<UploadResponse> uploadMultipleFiles(UUID userId, List<MultipartFile> files, UUID conversationId, UUID messageId);
}
