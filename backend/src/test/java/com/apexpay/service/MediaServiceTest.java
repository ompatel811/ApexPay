package com.apexpay.service;

import com.apexpay.dto.media.UploadResponse;
import com.apexpay.entity.User;
import com.apexpay.entity.media.MediaFile;
import com.apexpay.exception.BusinessException;
import com.apexpay.repository.UserRepository;
import com.apexpay.repository.chat.MessageRepository;
import com.apexpay.repository.media.AttachmentRepository;
import com.apexpay.repository.media.MediaRepository;
import com.apexpay.repository.media.UploadSessionRepository;
import com.apexpay.service.media.StorageService;
import com.apexpay.service.media.ThumbnailService;
import com.apexpay.service.media.impl.UploadServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.mock.web.MockMultipartFile;

import java.util.HashMap;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class MediaServiceTest {

    @Mock
    private StorageService storageService;

    @Mock
    private ThumbnailService thumbnailService;

    @Mock
    private MediaRepository mediaRepository;

    @Mock
    private AttachmentRepository attachmentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private UploadSessionRepository uploadSessionRepository;

    @InjectMocks
    private UploadServiceImpl uploadService;

    private User uploader;
    private UUID uploaderId;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        uploaderId = UUID.randomUUID();
        uploader = new User();
        uploader.setId(uploaderId);
        uploader.setFullName("Alice Uploader");
    }

    @Test
    void testUploadSingleFile_Success() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "sample.jpg",
                "image/jpeg",
                "Test Image Content".getBytes()
        );

        when(userRepository.findById(uploaderId)).thenReturn(Optional.of(uploader));
        when(storageService.storeFile(eq(file), anyString())).thenReturn("/uploads/sample.jpg");
        when(storageService.calculateChecksum(file)).thenReturn("sha256-hash-sample");
        when(thumbnailService.generateThumbnail(eq(file), anyString())).thenReturn("/api/media/thumbnail/sample.jpg");
        when(thumbnailService.extractDimensions(file)).thenReturn(new HashMap<>() {{ put("width", 800); put("height", 600); }});

        MediaFile savedMedia = new MediaFile();
        savedMedia.setId(UUID.randomUUID());
        savedMedia.setOriginalName("sample.jpg");
        savedMedia.setStoredName("sample-stored.jpg");
        savedMedia.setMimeType("image/jpeg");
        savedMedia.setSize(100L);

        when(mediaRepository.save(any(MediaFile.class))).thenReturn(savedMedia);

        UploadResponse response = uploadService.uploadSingleFile(uploaderId, file, null, null);

        assertNotNull(response);
        assertEquals("sample.jpg", response.getOriginalName());
        verify(storageService, times(1)).storeFile(eq(file), anyString());
    }

    @Test
    void testUploadSingleFile_EmptyFile_ThrowsException() {
        MockMultipartFile emptyFile = new MockMultipartFile("file", "", "image/jpeg", new byte[0]);

        assertThrows(BusinessException.class, () ->
                uploadService.uploadSingleFile(uploaderId, emptyFile, null, null));
    }
}
