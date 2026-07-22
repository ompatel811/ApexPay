package com.apexpay.repository.chat;

import com.apexpay.entity.chat.SharedReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SharedReceiptRepository extends JpaRepository<SharedReceipt, UUID> {

    List<SharedReceipt> findByConversationIdOrderByCreatedAtDesc(UUID conversationId);
}
