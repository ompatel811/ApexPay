package com.apexpay.service.admin;

import com.apexpay.dto.SendMoneyRequest;
import com.apexpay.entity.Transaction;
import com.apexpay.entity.User;
import com.apexpay.entity.Wallet;
import com.apexpay.entity.admin.FraudAlert;
import com.apexpay.entity.admin.FraudRule;
import com.apexpay.entity.enums.TransactionStatus;
import com.apexpay.repository.TransactionRepository;
import com.apexpay.repository.UserRepository;
import com.apexpay.repository.WalletRepository;
import com.apexpay.repository.admin.BlacklistRepository;
import com.apexpay.repository.admin.FraudAlertRepository;
import com.apexpay.repository.admin.FraudRuleRepository;
import com.apexpay.repository.admin.WhitelistRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
public class RiskEngineServiceImpl implements RiskEngineService {

    @Autowired
    private FraudRuleRepository fraudRuleRepository;

    @Autowired
    private BlacklistRepository blacklistRepository;

    @Autowired
    private WhitelistRepository whitelistRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FraudAlertRepository fraudAlertRepository;

    @Override
    @Transactional
    public FraudAlert evaluateTransaction(UUID senderUserId, SendMoneyRequest request) {
        log.info("Evaluating transaction risk for sender: {}, Amount: {}", senderUserId, request.amount());

        User user = userRepository.findById(senderUserId).orElse(null);
        Wallet wallet = walletRepository.findByUserId(senderUserId).orElse(null);

        // Fetch client details from servlet context
        HttpServletRequest httpRequest = getCurrentRequest();
        String ipAddress = "127.0.0.1";
        String deviceName = "Unknown Device";

        if (httpRequest != null) {
            ipAddress = httpRequest.getRemoteAddr();
            String userAgent = httpRequest.getHeader("User-Agent");
            if (userAgent != null && !userAgent.isBlank()) {
                deviceName = userAgent;
            }
        }

        // Initialize risk score details
        int score = 0;
        StringBuilder reasonBuilder = new StringBuilder();

        // 1. Whitelist Check: If sender device/IP or wallet is whitelisted, reduce score or return LOW risk directly.
        boolean isWhitelisted = false;
        if (wallet != null && whitelistRepository.existsByTypeAndItemValue("WALLET", wallet.getWalletNumber())) {
            isWhitelisted = true;
            log.info("Wallet is whitelisted. Bypassing critical blocking rules.");
        }
        if (whitelistRepository.existsByTypeAndItemValue("DEVICE", deviceName) || whitelistRepository.existsByTypeAndItemValue("IP", ipAddress)) {
            isWhitelisted = true;
            log.info("IP/Device is whitelisted. Bypassing critical blocking rules.");
        }

        // 2. Blacklist checks (IP, Device, User, Wallet)
        if (blacklistRepository.existsByTypeAndItemValue("IP", ipAddress)) {
            score = 100;
            reasonBuilder.append("Blacklisted IP address: ").append(ipAddress).append(". ");
            return saveAndReturnAlert(user, wallet, score, "CRITICAL", reasonBuilder.toString(), "FREEZE_USER");
        }
        if (blacklistRepository.existsByTypeAndItemValue("DEVICE", deviceName)) {
            score = 100;
            reasonBuilder.append("Blacklisted device: ").append(deviceName).append(". ");
            return saveAndReturnAlert(user, wallet, score, "CRITICAL", reasonBuilder.toString(), "FREEZE_USER");
        }
        if (user != null && blacklistRepository.existsByTypeAndItemValue("USER", user.getUsername())) {
            score = 100;
            reasonBuilder.append("Blacklisted user account: ").append(user.getUsername()).append(". ");
            return saveAndReturnAlert(user, wallet, score, "CRITICAL", reasonBuilder.toString(), "FREEZE_USER");
        }
        if (wallet != null && blacklistRepository.existsByTypeAndItemValue("WALLET", wallet.getWalletNumber())) {
            score = 100;
            reasonBuilder.append("Blacklisted wallet: ").append(wallet.getWalletNumber()).append(". ");
            return saveAndReturnAlert(user, wallet, score, "CRITICAL", reasonBuilder.toString(), "FREEZE_WALLET");
        }

        // 3. Evaluate Configured Rules
        // Rule: Single Transaction Limit Exceeded
        Optional<FraudRule> txLimitRule = fraudRuleRepository.findByRuleKey("TX_LIMIT");
        if (txLimitRule.isPresent() && txLimitRule.get().getIsEnabled()) {
            BigDecimal threshold = new BigDecimal(txLimitRule.get().getThresholdValue());
            if (request.amount().compareTo(threshold) > 0) {
                score += 35;
                reasonBuilder.append("Transaction amount exceeds rule threshold (").append(threshold).append("). ");
            }
        }

        // Rule: High Frequency check (5 Transactions in 30 seconds)
        Optional<FraudRule> velocityRule = fraudRuleRepository.findByRuleKey("TX_VELOCITY_30S");
        if (velocityRule.isPresent() && velocityRule.get().getIsEnabled()) {
            int threshold = Integer.parseInt(velocityRule.get().getThresholdValue());
            long recentTxCount = transactionRepository.countBySenderUserIdAndCreatedAtAfter(senderUserId, LocalDateTime.now().minusSeconds(30));
            if (recentTxCount >= threshold) {
                score += 40;
                reasonBuilder.append("Velocity check triggered: ").append(recentTxCount).append(" transactions in 30s. ");
            }
        }

        // Rule: Multiple Failed Payments (3 Failed in 10 minutes)
        Optional<FraudRule> failedRule = fraudRuleRepository.findByRuleKey("FAILED_PAYMENTS");
        if (failedRule.isPresent() && failedRule.get().getIsEnabled()) {
            int threshold = Integer.parseInt(failedRule.get().getThresholdValue());
            long failedCount = transactionRepository.countBySenderUserIdAndStatusAndCreatedAtAfter(senderUserId, TransactionStatus.FAILED, LocalDateTime.now().minusMinutes(10));
            if (failedCount >= threshold) {
                score += 30;
                reasonBuilder.append("Frequent failed transactions: ").append(failedCount).append(" failures in 10 min. ");
            }
        }

        // Rule: Wallet Balance Anomaly (Transaction > 10x average size)
        Optional<FraudRule> anomalyRule = fraudRuleRepository.findByRuleKey("BALANCE_ANOMALY");
        if (anomalyRule.isPresent() && anomalyRule.get().getIsEnabled()) {
            double thresholdMult = Double.parseDouble(anomalyRule.get().getThresholdValue());
            List<Transaction> userTxHistory = transactionRepository.findSuccessTransactionsByUserId(senderUserId);
            if (userTxHistory.size() >= 3) {
                BigDecimal sum = BigDecimal.ZERO;
                for (Transaction t : userTxHistory) {
                    sum = sum.add(t.getAmount());
                }
                BigDecimal avg = sum.divide(BigDecimal.valueOf(userTxHistory.size()), 4, RoundingMode.HALF_UP);
                BigDecimal anomalyThreshold = avg.multiply(BigDecimal.valueOf(thresholdMult));
                if (request.amount().compareTo(anomalyThreshold) > 0) {
                    score += 25;
                    reasonBuilder.append("Wallet balance anomaly: Transfer is >").append(thresholdMult).append("x the user's historical average. ");
                }
            }
        }

        // Rule: QR Reuse Check (5 scans in 1 minute)
        Optional<FraudRule> qrRule = fraudRuleRepository.findByRuleKey("QR_REUSE");
        if (qrRule.isPresent() && qrRule.get().getIsEnabled() && "QR".equalsIgnoreCase(request.recipientIdentifier())) {
            int threshold = Integer.parseInt(qrRule.get().getThresholdValue());
            long qrCount = transactionRepository.countByCategoryAndCreatedAtAfter("QR", LocalDateTime.now().minusMinutes(1));
            if (qrCount >= threshold) {
                score += 25;
                reasonBuilder.append("QR reuse detected: QR code scanned ").append(qrCount).append(" times in 1 minute. ");
            }
        }

        // Adjust score if whitelisted (reduction)
        if (isWhitelisted) {
            score = Math.max(0, score - 30);
        }

        // Cap score at 100
        score = Math.min(100, score);

        // Map to risk levels and action
        String riskLevel = "LOW";
        String action = "ALLOW";

        if (score >= 85) {
            riskLevel = "CRITICAL";
            action = score >= 95 ? "FREEZE_WALLET" : "BLOCK";
        } else if (score >= 60) {
            riskLevel = "HIGH";
            action = "BLOCK";
        } else if (score >= 30) {
            riskLevel = "MEDIUM";
            action = "REVIEW";
        }

        String finalReason = reasonBuilder.toString().isBlank() ? "Normal transaction activity." : reasonBuilder.toString().trim();
        log.info("Risk evaluation complete. Score: {}, Level: {}, Action: {}", score, riskLevel, action);

        return saveAndReturnAlert(user, wallet, score, riskLevel, finalReason, action);
    }

    private FraudAlert saveAndReturnAlert(User user, Wallet wallet, int score, String riskLevel, String reason, String action) {
        FraudAlert alert = new FraudAlert();
        alert.setUser(user);
        alert.setWallet(wallet);
        alert.setRiskScore(score);
        alert.setRiskLevel(riskLevel);
        alert.setReason(reason);
        alert.setAction(action);
        alert.setStatus("PENDING_REVIEW");
        alert.setCreatedAt(LocalDateTime.now());
        
        // Save alert if risk is MEDIUM or above
        if (score >= 30) {
            alert = fraudAlertRepository.save(alert);
        }
        return alert;
    }

    private HttpServletRequest getCurrentRequest() {
        try {
            RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
            if (attrs instanceof ServletRequestAttributes) {
                return ((ServletRequestAttributes) attrs).getRequest();
            }
        } catch (Exception e) {
            log.debug("No servlet request context bound to current thread: {}", e.getMessage());
        }
        return null;
    }
}
