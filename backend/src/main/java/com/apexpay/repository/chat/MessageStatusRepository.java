package com.apexpay.repository.chat;

import com.apexpay.entity.chat.MessageStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MessageStatusRepository extends JpaRepository<MessageStatus, UUID> {

    Optional<MessageStatus> findByMessageIdAndUserId(UUID messageId, UUID userId);

    List<MessageStatus> findByMessageId(UUID messageId);

    @Query("SELECT COUNT(ms) FROM MessageStatus ms JOIN ms.message m WHERE ms.user.id = :userId AND m.conversation.id = :conversationId AND ms.seen = false AND ms.hiddenForUser = false")
    long countUnreadMessages(@Param("userId") UUID userId, @Param("conversationId") UUID conversationId);
}
