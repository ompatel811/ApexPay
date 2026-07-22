package com.apexpay.service.chat.impl;

import com.apexpay.dto.chat.PaymentMessageResponse;
import com.apexpay.dto.chat.PaymentRequestResponse;
import com.apexpay.dto.chat.PaymentTimelineResponse;
import com.apexpay.entity.chat.PaymentMessage;
import com.apexpay.entity.chat.PaymentRequest;
import com.apexpay.exception.ForbiddenException;
import com.apexpay.repository.chat.ConversationParticipantRepository;
import com.apexpay.repository.chat.PaymentMessageRepository;
import com.apexpay.repository.chat.PaymentRequestRepository;
import com.apexpay.service.chat.PaymentTimelineService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentTimelineServiceImpl implements PaymentTimelineService {

    private final PaymentMessageRepository paymentMessageRepository;
    private final PaymentRequestRepository paymentRequestRepository;
    private final ConversationParticipantRepository participantRepository;

    @Override
    @Transactional(readOnly = true)
    public PaymentTimelineResponse getPaymentTimeline(UUID conversationId, UUID userId) {
        boolean isParticipant = participantRepository.existsByConversationIdAndUserId(conversationId, userId);
        if (!isParticipant) {
            throw new ForbiddenException("You are not a participant in this conversation");
        }

        List<PaymentMessage> pmList = paymentMessageRepository.findByConversationIdOrderByCreatedAtDesc(conversationId);
        List<PaymentRequest> prList = paymentRequestRepository.findByConversationIdOrderByCreatedAtDesc(conversationId);

        List<PaymentMessageResponse> pmDTOs = pmList.stream()
                .map(m -> PaymentMessageResponse.builder()
                        .id(m.getId())
                        .conversationId(m.getConversation().getId())
                        .transactionId(m.getTransaction() != null ? m.getTransaction().getId() : null)
                        .senderId(m.getSender().getId())
                        .senderName(m.getSender().getFullName())
                        .receiverId(m.getReceiver().getId())
                        .receiverName(m.getReceiver().getFullName())
                        .amount(m.getAmount())
                        .currency(m.getCurrency())
                        .paymentMethod(m.getPaymentMethod())
                        .status(m.getStatus())
                        .referenceNumber(m.getReferenceNumber())
                        .receiptUrl(m.getReceiptUrl())
                        .createdAt(m.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        List<PaymentRequestResponse> prDTOs = prList.stream()
                .map(pr -> PaymentRequestResponse.builder()
                        .id(pr.getId())
                        .conversationId(pr.getConversation().getId())
                        .requesterId(pr.getRequester().getId())
                        .requesterName(pr.getRequester().getFullName())
                        .receiverId(pr.getReceiver().getId())
                        .receiverName(pr.getReceiver().getFullName())
                        .amount(pr.getAmount())
                        .reason(pr.getReason())
                        .status(pr.getStatus())
                        .expiresAt(pr.getExpiresAt())
                        .createdAt(pr.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return PaymentTimelineResponse.builder()
                .conversationId(conversationId)
                .paymentMessages(pmDTOs)
                .paymentRequests(prDTOs)
                .build();
    }
}
