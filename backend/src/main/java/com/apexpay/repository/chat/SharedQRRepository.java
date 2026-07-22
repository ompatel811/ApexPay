package com.apexpay.repository.chat;

import com.apexpay.entity.chat.SharedQR;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SharedQRRepository extends JpaRepository<SharedQR, UUID> {

    List<SharedQR> findByConversationIdOrderByCreatedAtDesc(UUID conversationId);
}
