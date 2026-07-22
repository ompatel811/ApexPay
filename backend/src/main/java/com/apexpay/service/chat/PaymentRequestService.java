package com.apexpay.service.chat;

import com.apexpay.dto.chat.PaymentMessageResponse;
import com.apexpay.dto.chat.PaymentRequestResponse;
import com.apexpay.dto.chat.RequestMoneyChatRequest;

import java.util.UUID;

public interface PaymentRequestService {

    PaymentRequestResponse createRequest(UUID requesterId, RequestMoneyChatRequest request);

    PaymentMessageResponse acceptRequest(UUID userId, UUID requestId);

    PaymentRequestResponse rejectRequest(UUID userId, UUID requestId);

    PaymentRequestResponse cancelRequest(UUID userId, UUID requestId);

    PaymentRequestResponse getRequestById(UUID requestId, UUID userId);
}
