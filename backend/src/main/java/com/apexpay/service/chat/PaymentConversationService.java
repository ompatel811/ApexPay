package com.apexpay.service.chat;

import com.apexpay.dto.chat.PaymentMessageResponse;
import com.apexpay.dto.chat.SendPaymentChatRequest;

import java.util.UUID;

public interface PaymentConversationService {

    PaymentMessageResponse sendMoneyInChat(UUID senderId, SendPaymentChatRequest request);
}
