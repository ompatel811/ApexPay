package com.apexpay.service.admin;

import com.apexpay.dto.admin.*;
import com.apexpay.entity.Merchant;
import com.apexpay.entity.User;
import com.apexpay.entity.Wallet;
import com.apexpay.entity.admin.Blacklist;
import com.apexpay.entity.admin.FraudAlert;
import com.apexpay.entity.admin.Investigation;
import com.apexpay.entity.admin.Whitelist;
import com.apexpay.entity.enums.AccountStatus;
import com.apexpay.entity.enums.BusinessVerificationStatus;
import com.apexpay.entity.enums.WalletStatus;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.MerchantRepository;
import com.apexpay.repository.UserRepository;
import com.apexpay.repository.WalletRepository;
import com.apexpay.repository.admin.BlacklistRepository;
import com.apexpay.repository.admin.FraudAlertRepository;
import com.apexpay.repository.admin.InvestigationRepository;
import com.apexpay.repository.admin.WhitelistRepository;
import com.apexpay.entity.AuditLog;
import com.apexpay.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class FraudServiceImpl implements FraudService {

    @Autowired
    private FraudAlertRepository fraudAlertRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private MerchantRepository merchantRepository;

    @Autowired
    private BlacklistRepository blacklistRepository;

    @Autowired
    private WhitelistRepository whitelistRepository;

    @Autowired
    private InvestigationRepository investigationRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Override
    public List<FraudAlertResponse> getAllAlerts() {
        return fraudAlertRepository.findTop50ByOrderByCreatedAtDesc().stream()
                .map(this::mapToAlertResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<User> getHighRiskUsers() {
        List<UUID> ids = fraudAlertRepository.findHighRiskUserIds();
        return userRepository.findAllById(ids);
    }

    @Override
    public FraudAlertResponse reviewAlert(FraudReviewRequest request, String performedBy) {
        FraudAlert alert = fraudAlertRepository.findById(request.alertId())
                .orElseThrow(() -> new ResourceNotFoundException("Fraud alert not found"));

        alert.setStatus(request.status());
        alert = fraudAlertRepository.save(alert);

        // If status is INVESTIGATING, ensure investigation is initiated
        if ("INVESTIGATING".equalsIgnoreCase(request.status())) {
            if (investigationRepository.findByAlertId(alert.getId()).isEmpty()) {
                Investigation inv = new Investigation();
                inv.setAlert(alert);
                inv.setStatus("INVESTIGATING");
                inv.setAssignedTo(performedBy);
                inv.setNotes(request.notes());
                inv.setCreatedAt(LocalDateTime.now());
                inv.setUpdatedAt(LocalDateTime.now());
                investigationRepository.save(inv);
            }
        } else if ("CLOSED_RESOLVED".equalsIgnoreCase(request.status()) || "CLOSED_FALSE_POSITIVE".equalsIgnoreCase(request.status())) {
            investigationRepository.findByAlertId(alert.getId()).ifPresent(inv -> {
                inv.setStatus(request.status());
                inv.setNotes(inv.getNotes() + "\n\nResolved by: " + performedBy + "\nNotes: " + request.notes());
                investigationRepository.save(inv);
            });
        }

        logAudit("REVIEW_ALERT", performedBy, "FraudAlert", alert.getId().toString());

        // Notify over WebSocket
        FraudAlertResponse response = mapToAlertResponse(alert);
        messagingTemplate.convertAndSend("/topic/admin/fraud", response);

        return response;
    }

    @Override
    public void blockEntity(BlacklistRequest request, String performedBy) {
        Blacklist entry = new Blacklist();
        entry.setType(request.type());
        entry.setItemValue(request.itemValue());
        entry.setReason(request.reason());
        entry.setCreatedAt(LocalDateTime.now());
        blacklistRepository.save(entry);

        logAudit("BLOCK_ENTITY", performedBy, "Blacklist", request.type() + ":" + request.itemValue());

        // Trigger side-effects if user or wallet matches
        if ("USER".equalsIgnoreCase(request.type())) {
            userRepository.findByUsername(request.itemValue()).ifPresent(u -> {
                u.setAccountStatus(AccountStatus.BLOCKED);
                userRepository.save(u);
            });
        } else if ("WALLET".equalsIgnoreCase(request.type())) {
            walletRepository.findByWalletNumber(request.itemValue()).ifPresent(w -> {
                w.setWalletStatus(WalletStatus.FROZEN);
                walletRepository.save(w);
            });
        }
    }

    @Override
    public void freezeEntity(String type, UUID entityId, String performedBy) {
        if ("USER".equalsIgnoreCase(type)) {
            User user = userRepository.findById(entityId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            user.setAccountStatus(AccountStatus.BLOCKED);
            userRepository.save(user);
            logAudit("FREEZE_USER", performedBy, "User", entityId.toString());
        } else if ("WALLET".equalsIgnoreCase(type)) {
            Wallet wallet = walletRepository.findById(entityId)
                    .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));
            wallet.setWalletStatus(WalletStatus.FROZEN);
            walletRepository.save(wallet);
            logAudit("FREEZE_WALLET", performedBy, "Wallet", entityId.toString());
        } else if ("MERCHANT".equalsIgnoreCase(type)) {
            Merchant merchant = merchantRepository.findById(entityId)
                    .orElseThrow(() -> new ResourceNotFoundException("Merchant not found"));
            merchant.setVerificationStatus(BusinessVerificationStatus.SUSPENDED);
            merchantRepository.save(merchant);
            logAudit("FREEZE_MERCHANT", performedBy, "Merchant", entityId.toString());
        } else {
            throw new IllegalArgumentException("Invalid freeze type: " + type);
        }
    }

    @Override
    public void whitelistEntity(WhitelistRequest request, String performedBy) {
        Whitelist entry = new Whitelist();
        entry.setType(request.type());
        entry.setItemValue(request.itemValue());
        entry.setDescription(request.description());
        entry.setCreatedAt(LocalDateTime.now());
        whitelistRepository.save(entry);

        logAudit("WHITELIST_ENTITY", performedBy, "Whitelist", request.type() + ":" + request.itemValue());
    }

    @Override
    public InvestigationResponse getInvestigation(UUID id) {
        Investigation inv = investigationRepository.findById(id)
                .or(() -> investigationRepository.findByAlertId(id))
                .orElseThrow(() -> new ResourceNotFoundException("Investigation case not found"));

        return mapToInvestigationResponse(inv);
    }

    @Override
    public InvestigationResponse updateInvestigation(UUID id, String status, String notes, String performedBy) {
        Investigation inv = investigationRepository.findById(id)
                .or(() -> investigationRepository.findByAlertId(id))
                .orElseThrow(() -> new ResourceNotFoundException("Investigation case not found"));

        inv.setStatus(status);
        inv.setNotes(inv.getNotes() + "\n\nUpdated by " + performedBy + ": " + notes);
        inv = investigationRepository.save(inv);

        // Update corresponding alert status
        FraudAlert alert = inv.getAlert();
        alert.setStatus(status);
        fraudAlertRepository.save(alert);

        logAudit("UPDATE_INVESTIGATION", performedBy, "Investigation", inv.getId().toString());

        return mapToInvestigationResponse(inv);
    }

    private FraudAlertResponse mapToAlertResponse(FraudAlert alert) {
        return new FraudAlertResponse(
                alert.getId(),
                alert.getTransaction() != null ? alert.getTransaction().getId() : null,
                alert.getTransaction() != null ? alert.getTransaction().getTransactionReference() : null,
                alert.getTransaction() != null ? alert.getTransaction().getAmount() : null,
                alert.getUser() != null ? alert.getUser().getId() : null,
                alert.getUser() != null ? alert.getUser().getUsername() : null,
                alert.getWallet() != null ? alert.getWallet().getId() : null,
                alert.getWallet() != null ? alert.getWallet().getWalletNumber() : null,
                alert.getMerchant() != null ? alert.getMerchant().getId() : null,
                alert.getMerchant() != null ? alert.getMerchant().getBusinessName() : null,
                alert.getRiskScore(),
                alert.getRiskLevel(),
                alert.getReason(),
                alert.getAction(),
                alert.getStatus(),
                alert.getCreatedAt()
        );
    }

    private InvestigationResponse mapToInvestigationResponse(Investigation inv) {
        return new InvestigationResponse(
                inv.getId(),
                mapToAlertResponse(inv.getAlert()),
                inv.getStatus(),
                inv.getAssignedTo(),
                inv.getNotes(),
                inv.getCreatedAt(),
                inv.getUpdatedAt()
        );
    }

    private void logAudit(String action, String performedBy, String entityName, String entityId) {
        AuditLog audit = new AuditLog();
        audit.setAction(action);
        audit.setPerformedBy(performedBy);
        audit.setEntityName(entityName);
        audit.setEntityId(entityId);
        audit.setTimestamp(LocalDateTime.now());
        auditLogRepository.save(audit);
    }
}
