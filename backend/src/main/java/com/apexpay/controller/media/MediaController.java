package com.apexpay.controller.media;

import com.apexpay.dto.ApiResponse;
import com.apexpay.dto.media.*;
import com.apexpay.security.UserPrincipal;
import com.apexpay.service.media.MediaService;
import com.apexpay.service.media.UploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Tag(name = "Media & File Sharing Platform", description = "APIs for uploading, viewing, downloading, searching, and managing shared chat media files")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaController {

    private final UploadService uploadService;
    private final MediaService mediaService;

    @Operation(summary = "Upload single media or document file")
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<UploadResponse>> uploadSingleFile(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "conversationId", required = false) UUID conversationId,
            @RequestParam(value = "messageId", required = false) UUID messageId) {
        UploadResponse response = uploadService.uploadSingleFile(currentUser.getId(), file, conversationId, messageId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("File uploaded successfully", response));
    }

    @Operation(summary = "Upload batch of multiple files (Up to 20 files)")
    @PostMapping(value = "/upload/multiple", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<List<UploadResponse>>> uploadMultipleFiles(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "conversationId", required = false) UUID conversationId,
            @RequestParam(value = "messageId", required = false) UUID messageId) {
        List<UploadResponse> responses = uploadService.uploadMultipleFiles(currentUser.getId(), files, conversationId, messageId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Files uploaded successfully", responses));
    }

    @Operation(summary = "Get media file metadata by ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MediaResponse>> getMediaById(@PathVariable("id") UUID id) {
        MediaResponse response = mediaService.getMediaById(id);
        return ResponseEntity.ok(ApiResponse.success("Media metadata retrieved", response));
    }

    @Operation(summary = "Download or stream media file by ID")
    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> downloadFile(@PathVariable("id") UUID id) {
        MediaResponse mediaInfo = mediaService.getMediaById(id);
        Resource resource = mediaService.loadMediaAsResource(id);

        String contentType = mediaInfo.getMimeType();
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + mediaInfo.getOriginalName() + "\"")
                .body(resource);
    }

    @Operation(summary = "Search media files by query string")
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<SearchMediaResponse>> searchMedia(@RequestParam("query") String query) {
        SearchMediaResponse response = mediaService.searchMedia(query);
        return ResponseEntity.ok(ApiResponse.success("Media search completed", response));
    }

    @Operation(summary = "Get all shared media attachments for a conversation")
    @GetMapping("/conversation/{conversationId}")
    public ResponseEntity<ApiResponse<List<AttachmentResponse>>> getMediaForConversation(
            @PathVariable("conversationId") UUID conversationId) {
        List<AttachmentResponse> response = mediaService.getMediaForConversation(conversationId);
        return ResponseEntity.ok(ApiResponse.success("Conversation media retrieved", response));
    }

    @Operation(summary = "Delete media file by ID")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteMedia(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable("id") UUID id) {
        mediaService.deleteMedia(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Media file deleted successfully", null));
    }
}
