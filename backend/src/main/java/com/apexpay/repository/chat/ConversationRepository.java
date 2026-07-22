package com.apexpay.repository.chat;

import com.apexpay.entity.chat.Conversation;
import com.apexpay.entity.enums.ConversationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    @Query("SELECT DISTINCT c FROM Conversation c JOIN c.participants p WHERE p.user.id = :userId AND p.archived = false ORDER BY c.updatedAt DESC")
    List<Conversation> findActiveConversationsByUserId(@Param("userId") UUID userId);

    @Query("SELECT DISTINCT c FROM Conversation c JOIN c.participants p WHERE p.user.id = :userId AND p.archived = true ORDER BY c.updatedAt DESC")
    List<Conversation> findArchivedConversationsByUserId(@Param("userId") UUID userId);

    @Query("SELECT c FROM Conversation c JOIN c.participants p1 JOIN c.participants p2 WHERE c.type = :type AND p1.user.id = :user1Id AND p2.user.id = :user2Id")
    Optional<Conversation> findDirectConversation(@Param("type") ConversationType type, @Param("user1Id") UUID user1Id, @Param("user2Id") UUID user2Id);

    @Query("SELECT DISTINCT c FROM Conversation c JOIN c.participants p JOIN p.user u WHERE p.user.id = :userId AND (LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Conversation> searchConversations(@Param("userId") UUID userId, @Param("query") String query);
}
