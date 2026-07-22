package com.apexpay.controller.chat;

import com.apexpay.dto.ApiResponse;
import com.apexpay.dto.chat.ConversationRequest;
import com.apexpay.dto.chat.ConversationResponse;
import com.apexpay.security.UserPrincipal;
import com.apexpay.service.chat.ConversationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Chat Conversations", description = "Endpoints for managing chat conversations")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/chat/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;

    @Operation(summary = "Create a new conversation")
    @PostMapping
    public ResponseEntity<ApiResponse<ConversationResponse>> createConversation(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody ConversationRequest request) {
        ConversationResponse response = conversationService.createConversation(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Conversation created successfully", response));
    }

    @Operation(summary = "Get all active conversations for current user")
    @GetMapping
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> getUserConversations(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<ConversationResponse> response = conversationService.getUserConversations(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Conversations retrieved successfully", response));
    }

    @Operation(summary = "Get archived conversations for current user")
    @GetMapping("/archived")
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> getArchivedConversations(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<ConversationResponse> response = conversationService.getArchivedConversations(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Archived conversations retrieved successfully", response));
    }

    @Operation(summary = "Get conversation details by ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ConversationResponse>> getConversationById(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable("id") UUID id) {
        ConversationResponse response = conversationService.getConversationById(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Conversation retrieved successfully", response));
    }

    @Operation(summary = "Delete / Leave a conversation")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteConversation(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable("id") UUID id) {
        conversationService.deleteConversation(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Conversation deleted successfully", null));
    }

    @Operation(summary = "Archive or unarchive a conversation")
    @PutMapping("/{id}/archive")
    public ResponseEntity<ApiResponse<ConversationResponse>> archiveConversation(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable("id") UUID id,
            @RequestParam(name = "archive", defaultValue = "true") boolean archive) {
        ConversationResponse response = conversationService.archiveConversation(id, currentUser.getId(), archive);
        return ResponseEntity.ok(ApiResponse.success("Conversation archive status updated", response));
    }

    @Operation(summary = "Mute or unmute a conversation")
    @PutMapping("/{id}/mute")
    public ResponseEntity<ApiResponse<ConversationResponse>> muteConversation(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable("id") UUID id,
            @RequestParam(name = "mute", defaultValue = "true") boolean mute) {
        ConversationResponse response = conversationService.muteConversation(id, currentUser.getId(), mute);
        return ResponseEntity.ok(ApiResponse.success("Conversation mute status updated", response));
    }

    @Operation(summary = "Pin or unpin a conversation")
    @PutMapping("/{id}/pin")
    public ResponseEntity<ApiResponse<ConversationResponse>> pinConversation(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable("id") UUID id,
            @RequestParam(name = "pin", defaultValue = "true") boolean pin) {
        ConversationResponse response = conversationService.pinConversation(id, currentUser.getId(), pin);
        return ResponseEntity.ok(ApiResponse.success("Conversation pin status updated", response));
    }
}
