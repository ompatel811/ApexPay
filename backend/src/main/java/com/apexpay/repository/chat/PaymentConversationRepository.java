package com.apexpay.repository.chat;

import com.apexpay.entity.chat.PaymentConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentConversationRepository extends JpaRepository<PaymentConversation, UUID> {

    Optional<PaymentConversation> findByConversationId(UUID conversationId);
}
