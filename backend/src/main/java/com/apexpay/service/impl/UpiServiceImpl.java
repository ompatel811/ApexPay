package com.apexpay.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apexpay.dto.CreateUpiRequest;
import com.apexpay.dto.RequestMoneyRequest;
import com.apexpay.dto.SendMoneyRequest;
import com.apexpay.dto.SendMoneyResponse;
import com.apexpay.dto.UpiPayRequest;
import com.apexpay.dto.UpiRequestResponse;
import com.apexpay.dto.UpiResponse;
import com.apexpay.entity.BankAccount;
import com.apexpay.entity.UpiId;
import com.apexpay.entity.UpiRequest;
import com.apexpay.entity.User;
import com.apexpay.entity.enums.NotificationType;
import com.apexpay.exception.BusinessException;
import com.apexpay.exception.ForbiddenException;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.BankAccountRepository;
import com.apexpay.repository.UpiIdRepository;
import com.apexpay.repository.UpiRequestRepository;
import com.apexpay.repository.UserRepository;
import com.apexpay.service.AuditService;
import com.apexpay.service.NotificationService;
import com.apexpay.service.PaymentService;
import com.apexpay.service.UpiService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class UpiServiceImpl implements UpiService {

    private final UpiIdRepository upiIdRepository;
    private final UpiRequestRepository upiRequestRepository;
    private final BankAccountRepository bankAccountRepository;
    private final UserRepository userRepository;
    private final PaymentService paymentService;
    private final NotificationService notificationService;
    private final AuditService auditService;

    @Autowired
    public UpiServiceImpl(UpiIdRepository upiIdRepository,
                          UpiRequestRepository upiRequestRepository,
                          BankAccountRepository bankAccountRepository,
                          UserRepository userRepository,
                          PaymentService paymentService,
                          NotificationService notificationService,
                          AuditService auditService) {
        this.upiIdRepository = upiIdRepository;
        this.upiRequestRepository = upiRequestRepository;
        this.bankAccountRepository = bankAccountRepository;
        this.userRepository = userRepository;
        this.paymentService = paymentService;
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    @Override
    @Transactional
    public UpiResponse createUpiId(UUID userId, CreateUpiRequest request) {
        log.info("Creating UPI ID for user: {}, handle: {}", userId, request.upiHandle());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        // 1. Must have linked bank accounts
        List<BankAccount> banks = bankAccountRepository.findByUserId(userId);
        if (banks.isEmpty()) {
            throw new BusinessException("You must link a bank account before creating a UPI ID.");
        }

        String fullUpi = request.upiHandle().trim().toLowerCase() + "@apexpay";

        // 2. Uniqueness check
        if (upiIdRepository.existsByUpiId(fullUpi)) {
            throw new BusinessException("UPI ID is already taken. Please choose another handle.");
        }

        // 3. First UPI is primary
        boolean isFirst = upiIdRepository.findByUserId(userId).isEmpty();

        UpiId upiId = new UpiId();
        upiId.setUser(user);
        upiId.setUpiId(fullUpi);
        upiId.setIsPrimary(isFirst);
        upiId.setStatus("ACTIVE");
        upiId.setCreatedAt(LocalDateTime.now());
        upiId.setUpdatedAt(LocalDateTime.now());

        upiId = upiIdRepository.save(upiId);

        auditService.log("UPI_ID_CREATED", userId, "UpiId", upiId.getId());

        notificationService.sendNotification(user, "UPI ID Created", 
                "Your new UPI ID " + fullUpi + " has been successfully created.", 
                NotificationType.UPI_CREATED);

        return mapToResponse(upiId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UpiResponse> getUpiIds(UUID userId) {
        log.info("Fetching UPI IDs for user: {}", userId);
        return upiIdRepository.findByUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UpiResponse setDefaultUpi(UUID upiId, UUID userId) {
        log.info("Setting UPI ID {} as primary for user {}", upiId, userId);
        UpiId upi = upiIdRepository.findById(upiId)
                .orElseThrow(() -> new ResourceNotFoundException("UPI ID not found."));

        if (!upi.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You are not authorized to modify this UPI ID.");
        }

        // Deactivate previous primary
        Optional<UpiId> previousPrimaryOpt = upiIdRepository.findByUserIdAndIsPrimaryTrue(userId);
        if (previousPrimaryOpt.isPresent()) {
            UpiId prev = previousPrimaryOpt.get();
            prev.setIsPrimary(false);
            prev.setUpdatedAt(LocalDateTime.now());
            upiIdRepository.save(prev);
        }

        upi.setIsPrimary(true);
        upi.setUpdatedAt(LocalDateTime.now());
        UpiId updated = upiIdRepository.save(upi);

        auditService.log("UPI_PRIMARY_UPDATED", userId, "UpiId", updated.getId());

        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteUpiId(UUID upiId, UUID userId) {
        log.info("Deleting UPI ID {} for user {}", upiId, userId);
        UpiId upi = upiIdRepository.findById(upiId)
                .orElseThrow(() -> new ResourceNotFoundException("UPI ID not found."));

        if (!upi.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You are not authorized to delete this UPI ID.");
        }

        boolean wasPrimary = upi.getIsPrimary();
        upiIdRepository.delete(upi);

        // Assign another UPI as primary if exists
        if (wasPrimary) {
            List<UpiId> remaining = upiIdRepository.findByUserId(userId);
            if (!remaining.isEmpty()) {
                UpiId newPrimary = remaining.get(0);
                newPrimary.setIsPrimary(true);
                newPrimary.setUpdatedAt(LocalDateTime.now());
                upiIdRepository.save(newPrimary);
            }
        }

        auditService.log("UPI_ID_DELETED", userId, "UpiId", upiId);

        User user = userRepository.findById(userId).orElseThrow();
        notificationService.sendNotification(user, "UPI ID Deleted", 
                "Your UPI ID " + upi.getUpiId() + " has been deleted.", 
                NotificationType.UPI_UPDATED);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean checkUpiAvailability(String upiId) {
        String query = upiId.trim().toLowerCase();
        if (!query.contains("@")) {
            query = query + "@apexpay";
        }
        return !upiIdRepository.existsByUpiId(query);
    }

    @Override
    @Transactional
    public SendMoneyResponse payUsingUpi(UUID userId, UpiPayRequest request) {
        log.info("UPI Payment request from {} to {}, amount {}", request.senderUpi(), request.recipientUpi(), request.amount());

        // Validate Sender Ownership
        UpiId senderUpi = upiIdRepository.findByUpiId(request.senderUpi())
                .orElseThrow(() -> new ResourceNotFoundException("Sender UPI ID not found: " + request.senderUpi()));
        if (!senderUpi.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Unauthorized: You do not own this sender UPI ID.");
        }

        // Validate Recipient Existence
        UpiId recipientUpi = upiIdRepository.findByUpiId(request.recipientUpi())
                .orElseThrow(() -> new ResourceNotFoundException("Recipient UPI ID not found: " + request.recipientUpi()));

        if (senderUpi.getUpiId().equalsIgnoreCase(recipientUpi.getUpiId())) {
            throw new BusinessException("Cannot send money to yourself.");
        }

        // Re-use core wallet payment engine
        SendMoneyRequest coreRequest = new SendMoneyRequest(
                recipientUpi.getUpiId(), // Pass full UPI ID so resolution uses UPI path
                request.amount(),
                request.remarks(),
                request.idempotencyKey()
        );

        SendMoneyResponse response = paymentService.processTransfer(userId, coreRequest);

        // Send notifications
        notificationService.sendNotification(senderUpi.getUser(), "Payment Sent Successfully", 
                "Sent $" + request.amount() + " to " + recipientUpi.getUpiId(), 
                NotificationType.PAYMENT_SUCCESS);

        notificationService.sendNotification(recipientUpi.getUser(), "Payment Received", 
                "Received $" + request.amount() + " from " + senderUpi.getUpiId(), 
                NotificationType.PAYMENT_RECEIVED);

        return response;
    }

    @Override
    @Transactional
    public UpiRequestResponse requestMoney(UUID userId, RequestMoneyRequest request) {
        log.info("Collect Request from {} to {}, amount {}", request.requesterUpi(), request.payerUpi(), request.amount());

        UpiId requester = upiIdRepository.findByUpiId(request.requesterUpi())
                .orElseThrow(() -> new ResourceNotFoundException("Requester UPI ID not found."));
        if (!requester.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not own this requester UPI ID.");
        }

        UpiId payer = upiIdRepository.findByUpiId(request.payerUpi())
                .orElseThrow(() -> new ResourceNotFoundException("Payer UPI ID not found: " + request.payerUpi()));

        if (requester.getUpiId().equalsIgnoreCase(payer.getUpiId())) {
            throw new BusinessException("Cannot request money from yourself.");
        }

        UpiRequest upiRequest = new UpiRequest();
        upiRequest.setRequester(requester.getUser());
        upiRequest.setPayer(payer.getUser());
        upiRequest.setRequesterUpi(requester.getUpiId());
        upiRequest.setPayerUpi(payer.getUpiId());
        upiRequest.setAmount(request.amount());
        upiRequest.setRemarks(request.remarks());
        upiRequest.setStatus("PENDING");
        upiRequest.setCreatedAt(LocalDateTime.now());
        upiRequest.setUpdatedAt(LocalDateTime.now());

        upiRequest = upiRequestRepository.save(upiRequest);

        auditService.log("UPI_REQUEST_CREATED", userId, "UpiRequest", upiRequest.getId());

        // Notify payer about collect request
        String title = "Money Request Received";
        String msg = String.format("%s has requested $%s from you. Remarks: %s", 
                requester.getUser().getFullName(), request.amount(), request.remarks());
        notificationService.sendNotification(payer.getUser(), title, msg, NotificationType.REQUEST_RECEIVED);

        return mapToRequestResponse(upiRequest);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UpiRequestResponse> getUpiRequests(UUID userId) {
        log.info("Fetching UPI requests for user {}", userId);
        return upiRequestRepository.findByPayerIdOrRequesterId(userId, userId).stream()
                .map(this::mapToRequestResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SendMoneyResponse acceptUpiRequest(UUID userId, UUID requestId, String idempotencyKey) {
        log.info("Accepting UPI request {} by user {}", requestId, userId);

        UpiRequest upiRequest = upiRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("UPI request not found."));

        if (!upiRequest.getPayer().getId().equals(userId)) {
            throw new ForbiddenException("You are not authorized to accept this request.");
        }

        if (!"PENDING".equalsIgnoreCase(upiRequest.getStatus())) {
            throw new BusinessException("This request has already been processed (current status: " + upiRequest.getStatus() + ").");
        }

        // Re-use Payment Engine
        SendMoneyRequest coreRequest = new SendMoneyRequest(
                upiRequest.getRequesterUpi(),
                upiRequest.getAmount(),
                "Accepted Request: " + (upiRequest.getRemarks() != null ? upiRequest.getRemarks() : ""),
                idempotencyKey
        );

        SendMoneyResponse response = paymentService.processTransfer(userId, coreRequest);

        // Update Request Status
        upiRequest.setStatus("ACCEPTED");
        upiRequest.setUpdatedAt(LocalDateTime.now());
        upiRequestRepository.save(upiRequest);

        auditService.log("UPI_REQUEST_ACCEPTED", userId, "UpiRequest", requestId);

        // Notify Requester
        String title = "Request Accepted";
        String msg = String.format("%s accepted your request of $%s.", 
                upiRequest.getPayer().getFullName(), upiRequest.getAmount());
        notificationService.sendNotification(upiRequest.getRequester(), title, msg, NotificationType.REQUEST_ACCEPTED);

        return response;
    }

    @Override
    @Transactional
    public void rejectUpiRequest(UUID userId, UUID requestId) {
        log.info("Rejecting UPI request {} by user {}", requestId, userId);

        UpiRequest upiRequest = upiRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("UPI request not found."));

        if (!upiRequest.getPayer().getId().equals(userId)) {
            throw new ForbiddenException("You are not authorized to reject this request.");
        }

        if (!"PENDING".equalsIgnoreCase(upiRequest.getStatus())) {
            throw new BusinessException("This request has already been processed.");
        }

        upiRequest.setStatus("REJECTED");
        upiRequest.setUpdatedAt(LocalDateTime.now());
        upiRequestRepository.save(upiRequest);

        auditService.log("UPI_REQUEST_REJECTED", userId, "UpiRequest", requestId);

        // Notify Requester
        String title = "Request Rejected";
        String msg = String.format("%s rejected your request of $%s.", 
                upiRequest.getPayer().getFullName(), upiRequest.getAmount());
        notificationService.sendNotification(upiRequest.getRequester(), title, msg, NotificationType.REQUEST_REJECTED);
    }

    private UpiResponse mapToResponse(UpiId upi) {
        return new UpiResponse(
                upi.getId(),
                upi.getUpiId(),
                upi.getIsPrimary(),
                upi.getStatus(),
                upi.getCreatedAt()
        );
    }

    private UpiRequestResponse mapToRequestResponse(UpiRequest r) {
        return new UpiRequestResponse(
                r.getId(),
                r.getRequester().getId(),
                r.getRequester().getFullName(),
                r.getRequesterUpi(),
                r.getPayer().getId(),
                r.getPayer().getFullName(),
                r.getPayerUpi(),
                r.getAmount(),
                r.getRemarks(),
                r.getStatus(),
                r.getCreatedAt()
        );
    }
}
