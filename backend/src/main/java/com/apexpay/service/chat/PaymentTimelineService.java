package com.apexpay.service.chat;

import com.apexpay.dto.chat.PaymentTimelineResponse;

import java.util.UUID;

public interface PaymentTimelineService {

    PaymentTimelineResponse getPaymentTimeline(UUID conversationId, UUID userId);
}
