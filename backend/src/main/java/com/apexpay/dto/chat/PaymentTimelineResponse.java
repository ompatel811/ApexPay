package com.apexpay.dto.chat;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
public class PaymentTimelineResponse {

    private UUID conversationId;
    private List<PaymentMessageResponse> paymentMessages;
    private List<PaymentRequestResponse> paymentRequests;
}
