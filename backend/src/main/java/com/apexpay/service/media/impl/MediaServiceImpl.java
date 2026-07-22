package com.apexpay.service.media.impl;

import com.apexpay.dto.media.AttachmentResponse;
import com.apexpay.dto.media.MediaResponse;
import com.apexpay.dto.media.SearchMediaResponse;
import com.apexpay.entity.media.MediaFile;
import com.apexpay.entity.media.MessageAttachment;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.media.AttachmentRepository;
import com.apexpay.repository.media.MediaRepository;
import com.apexpay.service.media.MediaService;
import com.apexpay.service.media.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.core.io.Resource;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MediaServiceImpl implements MediaService {

    private final MediaRepository mediaRepository;
    private final AttachmentRepository attachmentRepository;
    private final StorageService storageService;

    @Override
    @Transactional(readOnly = true)
    public MediaResponse getMediaById(UUID id) {
        MediaFile mf = mediaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Media file not found: " + id));
        return mapToResponse(mf);
    }

    @Override
    @Transactional(readOnly = true)
    public Resource loadMediaAsResource(UUID id) {
        MediaFile mf = mediaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Media file not found: " + id));
        try {
            Path path = storageService.loadFileAsPath(mf.getStoragePath());
            Resource resource = new UrlResource(path.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("File is not readable or does not exist");
            }
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("Invalid file path for media: " + id);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public SearchMediaResponse searchMedia(String query) {
        List<MediaFile> files = mediaRepository.searchMedia(query);
        List<MediaResponse> responses = files.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return SearchMediaResponse.builder()
                .query(query)
                .totalResults(responses.size())
                .files(responses)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttachmentResponse> getMediaForConversation(UUID conversationId) {
        List<MessageAttachment> attachments = attachmentRepository.findByConversationId(conversationId);
        return attachments.stream()
                .map(att -> AttachmentResponse.builder()
                        .attachmentId(att.getId())
                        .messageId(att.getMessage().getId())
                        .uploaderId(att.getUploader().getId())
                        .uploaderName(att.getUploader().getFullName())
                        .attachmentType(att.getAttachmentType())
                        .mediaFile(mapToResponse(att.getMediaFile()))
                        .createdAt(att.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteMedia(UUID id, UUID userId) {
        MediaFile mf = mediaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Media file not found: " + id));
        storageService.deleteFile(mf.getStoragePath());
        mediaRepository.delete(mf);
    }

    private MediaResponse mapToResponse(MediaFile mf) {
        return MediaResponse.builder()
                .id(mf.getId())
                .originalName(mf.getOriginalName())
                .storedName(mf.getStoredName())
                .mimeType(mf.getMimeType())
                .extension(mf.getExtension())
                .size(mf.getSize())
                .checksum(mf.getChecksum())
                .fileUrl("/api/media/download/" + mf.getId())
                .thumbnailUrl(mf.getThumbnailPath())
                .width(mf.getWidth())
                .height(mf.getHeight())
                .duration(mf.getDuration())
                .createdAt(mf.getCreatedAt())
                .build();
    }
}
