package com.apexpay.repository.chat;

import com.apexpay.entity.chat.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    @Query("SELECT m FROM Message m WHERE m.conversation.id = :conversationId ORDER BY m.createdAt ASC")
    Page<Message> findByConversationId(@Param("conversationId") UUID conversationId, Pageable pageable);

    @Query("SELECT m FROM Message m JOIN m.conversation c JOIN c.participants p WHERE p.user.id = :userId AND LOWER(m.content) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY m.createdAt DESC")
    List<Message> searchMessages(@Param("userId") UUID userId, @Param("query") String query);

    @Query("SELECT m FROM Message m JOIN m.conversation c JOIN c.participants p WHERE p.user.id = :userId AND m.createdAt BETWEEN :startDate AND :endDate ORDER BY m.createdAt DESC")
    List<Message> searchMessagesByDate(@Param("userId") UUID userId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT m FROM Message m JOIN m.conversation c JOIN c.participants p WHERE p.user.id = :userId AND m.sender.id = :senderId ORDER BY m.createdAt DESC")
    List<Message> searchMessagesBySender(@Param("userId") UUID userId, @Param("senderId") UUID senderId);
}
