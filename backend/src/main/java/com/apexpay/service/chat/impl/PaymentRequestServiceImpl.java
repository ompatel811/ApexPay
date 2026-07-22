package com.apexpay.service.chat.impl;

import com.apexpay.dto.chat.PaymentMessageResponse;
import com.apexpay.dto.chat.PaymentRequestResponse;
import com.apexpay.dto.chat.RequestMoneyChatRequest;
import com.apexpay.dto.chat.SendPaymentChatRequest;
import com.apexpay.entity.User;
import com.apexpay.entity.chat.Conversation;
import com.apexpay.entity.chat.PaymentRequest;
import com.apexpay.entity.enums.PaymentMethod;
import com.apexpay.entity.enums.PaymentRequestStatus;
import com.apexpay.exception.BusinessException;
import com.apexpay.exception.ForbiddenException;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.UserRepository;
import com.apexpay.repository.chat.BlockedUserRepository;
import com.apexpay.repository.chat.ConversationRepository;
import com.apexpay.repository.chat.PaymentRequestRepository;
import com.apexpay.service.chat.PaymentConversationService;
import com.apexpay.service.chat.PaymentRequestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentRequestServiceImpl implements PaymentRequestService {

    private final PaymentRequestRepository paymentRequestRepository;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final BlockedUserRepository blockedUserRepository;
    private final PaymentConversationService paymentConversationService;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public PaymentRequestResponse createRequest(UUID requesterId, RequestMoneyChatRequest request) {
        if (requesterId.equals(request.getReceiverId())) {
            throw new BusinessException("Cannot request money from yourself");
        }

        Conversation conversation = conversationRepository.findById(request.getConversationId())
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found: " + request.getConversationId()));

        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new ResourceNotFoundException("Requester user not found: " + requesterId));

        User receiver = userRepository.findById(request.getReceiverId())
                .orElseThrow(() -> new ResourceNotFoundException("Receiver user not found: " + request.getReceiverId()));

        if (blockedUserRepository.existsByUserIdAndBlockedUserId(requesterId, request.getReceiverId()) ||
            blockedUserRepository.existsByUserIdAndBlockedUserId(request.getReceiverId(), requesterId)) {
            throw new BusinessException("Cannot request money from a blocked user");
        }

        PaymentRequest pr = new PaymentRequest();
        pr.setConversation(conversation);
        pr.setRequester(requester);
        pr.setReceiver(receiver);
        pr.setAmount(request.getAmount());
        pr.setReason(request.getReason());
        pr.setStatus(PaymentRequestStatus.PENDING);
        pr.setExpiresAt(LocalDateTime.now().plusDays(3));

        PaymentRequest saved = paymentRequestRepository.save(pr);

        PaymentRequestResponse response = mapToResponse(saved);
        messagingTemplate.convertAndSend("/topic/conversation." + conversation.getId() + ".request", response);

        log.info("Created payment request ID {} in conversation {}", saved.getId(), conversation.getId());
        return response;
    }

    @Override
    @Transactional
    public PaymentMessageResponse acceptRequest(UUID userId, UUID requestId) {
        PaymentRequest pr = paymentRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment request not found: " + requestId));

        if (!pr.getReceiver().getId().equals(userId)) {
            throw new ForbiddenException("Only the designated receiver can accept this payment request");
        }

        if (pr.getStatus() != PaymentRequestStatus.PENDING) {
            throw new BusinessException("Payment request is not pending (current status: " + pr.getStatus() + ")");
        }

        if (LocalDateTime.now().isAfter(pr.getExpiresAt())) {
            pr.setStatus(PaymentRequestStatus.EXPIRED);
            paymentRequestRepository.save(pr);
            throw new BusinessException("Payment request has expired");
        }

        // Execute payment transfer from acceptor (receiver) to requester
        SendPaymentChatRequest sendReq = new SendPaymentChatRequest();
        sendReq.setConversationId(pr.getConversation().getId());
        sendReq.setReceiverId(pr.getRequester().getId());
        sendReq.setAmount(pr.getAmount());
        sendReq.setCurrency("USD");
        sendReq.setPaymentMethod(PaymentMethod.WALLET);
        sendReq.setNote("Payment for request: " + (pr.getReason() != null ? pr.getReason() : "Direct request"));

        PaymentMessageResponse pmResponse = paymentConversationService.sendMoneyInChat(userId, sendReq);

        pr.setStatus(PaymentRequestStatus.ACCEPTED);
        paymentRequestRepository.save(pr);

        PaymentRequestResponse prResponse = mapToResponse(pr);
        messagingTemplate.convertAndSend("/topic/conversation." + pr.getConversation().getId() + ".request", prResponse);

        log.info("Accepted payment request ID {}", requestId);
        return pmResponse;
    }

    @Override
    @Transactional
    public PaymentRequestResponse rejectRequest(UUID userId, UUID requestId) {
        PaymentRequest pr = paymentRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment request not found: " + requestId));

        if (!pr.getReceiver().getId().equals(userId)) {
            throw new ForbiddenException("Only the designated receiver can reject this payment request");
        }

        if (pr.getStatus() != PaymentRequestStatus.PENDING) {
            throw new BusinessException("Payment request is not pending");
        }

        pr.setStatus(PaymentRequestStatus.REJECTED);
        PaymentRequest updated = paymentRequestRepository.save(pr);

        PaymentRequestResponse response = mapToResponse(updated);
        messagingTemplate.convertAndSend("/topic/conversation." + pr.getConversation().getId() + ".request", response);

        log.info("Rejected payment request ID {}", requestId);
        return response;
    }

    @Override
    @Transactional
    public PaymentRequestResponse cancelRequest(UUID userId, UUID requestId) {
        PaymentRequest pr = paymentRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment request not found: " + requestId));

        if (!pr.getRequester().getId().equals(userId)) {
            throw new ForbiddenException("Only the requester can cancel this payment request");
        }

        if (pr.getStatus() != PaymentRequestStatus.PENDING) {
            throw new BusinessException("Payment request is not pending");
        }

        pr.setStatus(PaymentRequestStatus.CANCELLED);
        PaymentRequest updated = paymentRequestRepository.save(pr);

        PaymentRequestResponse response = mapToResponse(updated);
        messagingTemplate.convertAndSend("/topic/conversation." + pr.getConversation().getId() + ".request", response);

        log.info("Cancelled payment request ID {}", requestId);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentRequestResponse getRequestById(UUID requestId, UUID userId) {
        PaymentRequest pr = paymentRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment request not found: " + requestId));

        return mapToResponse(pr);
    }

    private PaymentRequestResponse mapToResponse(PaymentRequest pr) {
        return PaymentRequestResponse.builder()
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
                .build();
    }
}
