package com.apexpay.repository.media;

import com.apexpay.entity.media.MessageAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AttachmentRepository extends JpaRepository<MessageAttachment, UUID> {

    List<MessageAttachment> findByMessageId(UUID messageId);

    @Query("SELECT ma FROM MessageAttachment ma WHERE ma.message.conversation.id = :conversationId ORDER BY ma.createdAt DESC")
    List<MessageAttachment> findByConversationId(@Param("conversationId") UUID conversationId);
}
