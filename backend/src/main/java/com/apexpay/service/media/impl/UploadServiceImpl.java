package com.apexpay.service.media.impl;

import com.apexpay.dto.media.UploadResponse;
import com.apexpay.entity.User;
import com.apexpay.entity.chat.Message;
import com.apexpay.entity.enums.AttachmentType;
import com.apexpay.entity.media.MediaFile;
import com.apexpay.entity.media.MessageAttachment;
import com.apexpay.entity.media.UploadSession;
import com.apexpay.exception.BusinessException;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.UserRepository;
import com.apexpay.repository.chat.MessageRepository;
import com.apexpay.repository.media.AttachmentRepository;
import com.apexpay.repository.media.MediaRepository;
import com.apexpay.repository.media.UploadSessionRepository;
import com.apexpay.service.media.StorageService;
import com.apexpay.service.media.ThumbnailService;
import com.apexpay.service.media.UploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UploadServiceImpl implements UploadService {

    private final StorageService storageService;
    private final ThumbnailService thumbnailService;
    private final MediaRepository mediaRepository;
    private final AttachmentRepository attachmentRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final UploadSessionRepository uploadSessionRepository;

    @Override
    @Transactional
    public UploadResponse uploadSingleFile(UUID userId, MultipartFile file, UUID conversationId, UUID messageId) {
        validateFile(file);

        User uploader = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        Message message = null;
        if (messageId != null) {
            message = messageRepository.findById(messageId).orElse(null);
        }

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unnamed_file";
        String extension = getFileExtension(originalName);
        String storedName = UUID.randomUUID().toString() + (extension.isEmpty() ? "" : "." + extension);
        String mimeType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";

        String storagePath = storageService.storeFile(file, storedName);
        String checksum = storageService.calculateChecksum(file);

        AttachmentType type = determineAttachmentType(mimeType, extension);

        String thumbnailUrl = null;
        Integer width = null;
        Integer height = null;

        if (type == AttachmentType.IMAGE) {
            thumbnailUrl = thumbnailService.generateThumbnail(file, storedName);
            Map<String, Integer> dims = thumbnailService.extractDimensions(file);
            width = dims.get("width");
            height = dims.get("height");
        }

        MediaFile mediaFile = new MediaFile();
        mediaFile.setOriginalName(originalName);
        mediaFile.setStoredName(storedName);
        mediaFile.setMimeType(mimeType);
        mediaFile.setExtension(extension);
        mediaFile.setSize(file.getSize());
        mediaFile.setChecksum(checksum);
        mediaFile.setStoragePath(storagePath);
        mediaFile.setThumbnailPath(thumbnailUrl);
        mediaFile.setWidth(width);
        mediaFile.setHeight(height);

        MediaFile savedMedia = mediaRepository.save(mediaFile);

        UUID attachmentId = null;
        if (message != null) {
            MessageAttachment attachment = new MessageAttachment();
            attachment.setMessage(message);
            attachment.setMediaFile(savedMedia);
            attachment.setUploader(uploader);
            attachment.setAttachmentType(type);
            MessageAttachment savedAtt = attachmentRepository.save(attachment);
            attachmentId = savedAtt.getId();
        }

        log.info("Uploaded file {} (size: {} bytes) for user {}", storedName, file.getSize(), userId);

        return UploadResponse.builder()
                .mediaFileId(savedMedia.getId())
                .attachmentId(attachmentId)
                .originalName(originalName)
                .storedName(storedName)
                .mimeType(mimeType)
                .size(file.getSize())
                .fileUrl("/api/media/download/" + savedMedia.getId())
                .thumbnailUrl(thumbnailUrl)
                .build();
    }

    @Override
    @Transactional
    public List<UploadResponse> uploadMultipleFiles(UUID userId, List<MultipartFile> files, UUID conversationId, UUID messageId) {
        if (files == null || files.isEmpty()) {
            throw new BusinessException("No files provided for upload");
        }
        if (files.size() > 20) {
            throw new BusinessException("Cannot upload more than 20 files in a single batch");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        UploadSession session = new UploadSession();
        session.setUser(user);
        session.setStatus("IN_PROGRESS");
        session.setProgress(0);
        UploadSession savedSession = uploadSessionRepository.save(session);

        List<UploadResponse> responses = new ArrayList<>();
        int count = 0;
        for (MultipartFile file : files) {
            UploadResponse resp = uploadSingleFile(userId, file, conversationId, messageId);
            responses.add(resp);
            count++;
            savedSession.setProgress((int) (((double) count / files.size()) * 100));
        }

        savedSession.setStatus("COMPLETED");
        savedSession.setCompletedAt(LocalDateTime.now());
        uploadSessionRepository.save(savedSession);

        return responses;
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BusinessException("File cannot be empty");
        }

        long size = file.getSize();
        String mime = file.getContentType() != null ? file.getContentType().toLowerCase() : "";

        if (mime.startsWith("image/") && size > 20 * 1024 * 1024) {
            throw new BusinessException("Image size exceeds maximum limit of 20MB");
        } else if (mime.startsWith("video/") && size > 500 * 1024 * 1024) {
            throw new BusinessException("Video size exceeds maximum limit of 500MB");
        } else if (size > 200 * 1024 * 1024) {
            throw new BusinessException("File size exceeds maximum limit of 200MB");
        }
    }

    private String getFileExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        return (dotIndex == -1) ? "" : fileName.substring(dotIndex + 1).toLowerCase();
    }

    private AttachmentType determineAttachmentType(String mimeType, String extension) {
        if (mimeType.startsWith("image/")) return AttachmentType.IMAGE;
        if (mimeType.startsWith("video/")) return AttachmentType.VIDEO;
        if (extension.equals("pdf") || extension.equals("doc") || extension.equals("docx") || extension.equals("txt")) return AttachmentType.DOCUMENT;
        if (extension.equals("xls") || extension.equals("xlsx") || extension.equals("csv")) return AttachmentType.SPREADSHEET;
        if (extension.equals("ppt") || extension.equals("pptx")) return AttachmentType.PRESENTATION;
        if (extension.equals("zip") || extension.equals("rar") || extension.equals("7z")) return AttachmentType.ARCHIVE;
        return AttachmentType.DOCUMENT;
    }
}
