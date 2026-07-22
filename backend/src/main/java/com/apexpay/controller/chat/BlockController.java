package com.apexpay.controller.chat;

import com.apexpay.dto.ApiResponse;
import com.apexpay.dto.chat.BlockRequest;
import com.apexpay.entity.User;
import com.apexpay.entity.chat.BlockedUser;
import com.apexpay.exception.BusinessException;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.UserRepository;
import com.apexpay.repository.chat.BlockedUserRepository;
import com.apexpay.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Tag(name = "Block & Moderation", description = "Endpoints for blocking users and managing blocklist")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/chat/block")
@RequiredArgsConstructor
public class BlockController {

    private final BlockedUserRepository blockedUserRepository;
    private final UserRepository userRepository;

    @Operation(summary = "Block a user")
    @PostMapping
    @Transactional
    public ResponseEntity<ApiResponse<BlockedUserDTO>> blockUser(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody BlockRequest request) {
        if (currentUser.getId().equals(request.getBlockedUserId())) {
            throw new BusinessException("You cannot block yourself");
        }

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUser.getId()));

        User targetUser = userRepository.findById(request.getBlockedUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Target user not found: " + request.getBlockedUserId()));

        if (blockedUserRepository.existsByUserIdAndBlockedUserId(user.getId(), targetUser.getId())) {
            throw new BusinessException("User is already blocked");
        }

        BlockedUser record = new BlockedUser();
        record.setUser(user);
        record.setBlockedUser(targetUser);
        record.setReason(request.getReason());

        BlockedUser saved = blockedUserRepository.save(record);

        BlockedUserDTO dto = BlockedUserDTO.builder()
                .id(saved.getId())
                .userId(saved.getUser().getId())
                .blockedUserId(saved.getBlockedUser().getId())
                .blockedUserName(saved.getBlockedUser().getFullName())
                .blockedUserPhoto(saved.getBlockedUser().getProfilePhoto())
                .reason(saved.getReason())
                .createdAt(saved.getCreatedAt())
                .build();

        return ResponseEntity.ok(ApiResponse.success("User blocked successfully", dto));
    }

    @Operation(summary = "Unblock a user")
    @DeleteMapping("/{blockedUserId}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> unblockUser(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable("blockedUserId") UUID blockedUserId) {
        BlockedUser record = blockedUserRepository.findByUserIdAndBlockedUserId(currentUser.getId(), blockedUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Block record not found"));

        blockedUserRepository.delete(record);
        return ResponseEntity.ok(ApiResponse.success("User unblocked successfully", null));
    }

    @Operation(summary = "Get list of blocked users")
    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<BlockedUserDTO>>> getBlockedUsers(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<BlockedUser> list = blockedUserRepository.findByUserId(currentUser.getId());
        List<BlockedUserDTO> dtos = list.stream()
                .map(b -> BlockedUserDTO.builder()
                        .id(b.getId())
                        .userId(b.getUser().getId())
                        .blockedUserId(b.getBlockedUser().getId())
                        .blockedUserName(b.getBlockedUser().getFullName())
                        .blockedUserPhoto(b.getBlockedUser().getProfilePhoto())
                        .reason(b.getReason())
                        .createdAt(b.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success("Blocked users retrieved", dtos));
    }

    @Getter
    @Setter
    @Builder
    public static class BlockedUserDTO {
        private UUID id;
        private UUID userId;
        private UUID blockedUserId;
        private String blockedUserName;
        private String blockedUserPhoto;
        private String reason;
        private LocalDateTime createdAt;
    }
}
