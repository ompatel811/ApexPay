package com.apexpay.repository.chat;

import com.apexpay.entity.chat.BlockedUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BlockedUserRepository extends JpaRepository<BlockedUser, UUID> {

    boolean existsByUserIdAndBlockedUserId(UUID userId, UUID blockedUserId);

    Optional<BlockedUser> findByUserIdAndBlockedUserId(UUID userId, UUID blockedUserId);

    List<BlockedUser> findByUserId(UUID userId);
}
