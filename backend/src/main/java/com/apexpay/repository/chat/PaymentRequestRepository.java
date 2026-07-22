package com.apexpay.repository.chat;

import com.apexpay.entity.chat.PaymentRequest;
import com.apexpay.entity.enums.PaymentRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PaymentRequestRepository extends JpaRepository<PaymentRequest, UUID> {

    List<PaymentRequest> findByConversationIdOrderByCreatedAtDesc(UUID conversationId);

    List<PaymentRequest> findByConversationIdAndStatus(UUID conversationId, PaymentRequestStatus status);
}
