package com.apexpay.controller.chat;

import com.apexpay.dto.ApiResponse;
import com.apexpay.dto.chat.SearchResponse;
import com.apexpay.security.UserPrincipal;
import com.apexpay.service.chat.SearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Tag(name = "Chat Search", description = "Endpoints for searching messages, conversations, and users")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/chat/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @Operation(summary = "Unified search across messages, conversations, and users")
    @GetMapping
    public ResponseEntity<ApiResponse<SearchResponse>> searchAll(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam("q") String query) {
        SearchResponse response = searchService.searchAll(currentUser.getId(), query);
        return ResponseEntity.ok(ApiResponse.success("Search completed", response));
    }

    @Operation(summary = "Search messages by text, date, or sender")
    @GetMapping("/messages")
    public ResponseEntity<ApiResponse<SearchResponse>> searchMessages(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(name = "q", required = false) String query,
            @RequestParam(name = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(name = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(name = "senderId", required = false) UUID senderId) {
        SearchResponse response = searchService.searchMessages(currentUser.getId(), query, startDate, endDate, senderId);
        return ResponseEntity.ok(ApiResponse.success("Message search completed", response));
    }

    @Operation(summary = "Search conversations by name or participant")
    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<SearchResponse>> searchConversations(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam("q") String query) {
        SearchResponse response = searchService.searchConversations(currentUser.getId(), query);
        return ResponseEntity.ok(ApiResponse.success("Conversation search completed", response));
    }

    @Operation(summary = "Search registered users to start new chat")
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<SearchResponse>> searchUsers(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam("q") String query) {
        SearchResponse response = searchService.searchUsers(currentUser.getId(), query);
        return ResponseEntity.ok(ApiResponse.success("User search completed", response));
    }
}
