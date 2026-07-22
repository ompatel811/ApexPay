package com.apexpay.controller.chat;

import com.apexpay.dto.ApiResponse;
import com.apexpay.dto.chat.MessageRequest;
import com.apexpay.dto.chat.MessageResponse;
import com.apexpay.dto.chat.ReactionRequest;
import com.apexpay.security.UserPrincipal;
import com.apexpay.service.chat.MessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Tag(name = "Chat Messages", description = "Endpoints for sending, editing, deleting, reacting to messages")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/chat/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @Operation(summary = "Send a new message")
    @PostMapping
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody MessageRequest request) {
        MessageResponse response = messageService.sendMessage(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Message sent successfully", response));
    }

    @Operation(summary = "Get paginated messages for a conversation")
    @GetMapping("/{conversationId}")
    public ResponseEntity<ApiResponse<Page<MessageResponse>>> getMessages(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable("conversationId") UUID conversationId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "50") int size) {
        Page<MessageResponse> response = messageService.getMessages(conversationId, currentUser.getId(), page, size);
        return ResponseEntity.ok(ApiResponse.success("Messages retrieved successfully", response));
    }

    @Operation(summary = "Edit an existing message")
    @PutMapping("/{messageId}")
    public ResponseEntity<ApiResponse<MessageResponse>> editMessage(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable("messageId") UUID messageId,
            @RequestBody MessageRequest request) {
        MessageResponse response = messageService.editMessage(messageId, currentUser.getId(), request.getContent());
        return ResponseEntity.ok(ApiResponse.success("Message edited successfully", response));
    }

    @Operation(summary = "Delete message for me")
    @DeleteMapping("/{messageId}/for-me")
    public ResponseEntity<ApiResponse<Void>> deleteMessageForMe(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable("messageId") UUID messageId) {
        messageService.deleteMessageForMe(messageId, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Message deleted for me", null));
    }

    @Operation(summary = "Delete message for everyone")
    @DeleteMapping("/{messageId}")
    public ResponseEntity<ApiResponse<MessageResponse>> deleteMessageForEveryone(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable("messageId") UUID messageId) {
        MessageResponse response = messageService.deleteMessageForEveryone(messageId, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Message deleted for everyone", response));
    }

    @Operation(summary = "Forward a message to another conversation")
    @PostMapping("/{messageId}/forward")
    public ResponseEntity<ApiResponse<MessageResponse>> forwardMessage(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable("messageId") UUID messageId,
            @RequestParam("targetConversationId") UUID targetConversationId) {
        MessageResponse response = messageService.forwardMessage(currentUser.getId(), messageId, targetConversationId);
        return ResponseEntity.ok(ApiResponse.success("Message forwarded successfully", response));
    }

    @Operation(summary = "Add or update emoji reaction on a message")
    @PostMapping("/{messageId}/reactions")
    public ResponseEntity<ApiResponse<MessageResponse>> addReaction(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable("messageId") UUID messageId,
            @Valid @RequestBody ReactionRequest request) {
        MessageResponse response = messageService.addReaction(messageId, currentUser.getId(), request.getReaction());
        return ResponseEntity.ok(ApiResponse.success("Reaction updated successfully", response));
    }

    @Operation(summary = "Pin or unpin a message")
    @PutMapping("/{messageId}/pin")
    public ResponseEntity<ApiResponse<MessageResponse>> pinMessage(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable("messageId") UUID messageId,
            @RequestParam(name = "pin", defaultValue = "true") boolean pin) {
        MessageResponse response = messageService.pinMessage(messageId, currentUser.getId(), pin);
        return ResponseEntity.ok(ApiResponse.success("Message pin status updated", response));
    }

    @Operation(summary = "Star or unstar a message")
    @PutMapping("/{messageId}/star")
    public ResponseEntity<ApiResponse<MessageResponse>> starMessage(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable("messageId") UUID messageId,
            @RequestParam(name = "star", defaultValue = "true") boolean star) {
        MessageResponse response = messageService.starMessage(messageId, currentUser.getId(), star);
        return ResponseEntity.ok(ApiResponse.success("Message star status updated", response));
    }

    @Operation(summary = "Mark messages as read in conversation")
    @PostMapping("/read/{conversationId}")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable("conversationId") UUID conversationId) {
        messageService.markMessagesAsRead(conversationId, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Messages marked as read", null));
    }
}
