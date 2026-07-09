package com.apexpay.service.impl;

import com.apexpay.dto.*;
import com.apexpay.entity.*;
import com.apexpay.entity.enums.*;
import com.apexpay.exception.BusinessException;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.*;
import com.apexpay.service.AuditService;
import com.apexpay.service.MerchantService;
import com.apexpay.service.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class MerchantServiceImpl implements MerchantService {

    private final MerchantRepository merchantRepository;
    private final MerchantWalletRepository merchantWalletRepository;
    private final MerchantRoleRepository merchantRoleRepository;
    private final MerchantEmployeeRepository merchantEmployeeRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final RefundRepository refundRepository;
    private final PaymentLinkRepository paymentLinkRepository;
    private final SettlementRepository settlementRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;

    public MerchantServiceImpl(MerchantRepository merchantRepository,
                               MerchantWalletRepository merchantWalletRepository,
                               MerchantRoleRepository merchantRoleRepository,
                               MerchantEmployeeRepository merchantEmployeeRepository,
                               UserRepository userRepository,
                               WalletRepository walletRepository,
                               TransactionRepository transactionRepository,
                               RefundRepository refundRepository,
                               PaymentLinkRepository paymentLinkRepository,
                               SettlementRepository settlementRepository,
                               AuditService auditService,
                               NotificationService notificationService,
                               PasswordEncoder passwordEncoder) {
        this.merchantRepository = merchantRepository;
        this.merchantWalletRepository = merchantWalletRepository;
        this.merchantRoleRepository = merchantRoleRepository;
        this.merchantEmployeeRepository = merchantEmployeeRepository;
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
        this.refundRepository = refundRepository;
        this.paymentLinkRepository = paymentLinkRepository;
        this.settlementRepository = settlementRepository;
        this.auditService = auditService;
        this.notificationService = notificationService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public MerchantProfileResponse registerMerchant(UUID ownerUserId, BusinessRegisterRequest request) {
        log.info("Registering merchant: {} for user: {}", request.businessName(), ownerUserId);

        if (merchantRepository.findByBusinessEmail(request.businessEmail()).isPresent()) {
            throw new BusinessException("Business email is already registered.");
        }
        if (merchantRepository.findByBusinessMobile(request.businessMobile()).isPresent()) {
            throw new BusinessException("Business mobile number is already registered.");
        }

        User owner = userRepository.findById(ownerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Owner user not found."));

        // 1. Create a Shadow User for the merchant business to hold the ledger wallet
        User shadowUser = new User();
        shadowUser.setFullName("Merchant: " + request.businessName());
        shadowUser.setUsername("mch_" + UUID.randomUUID().toString().replace("-", "").substring(0, 15));
        shadowUser.setEmail("mch_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10) + "@apexpay.com");
        shadowUser.setMobileNumber("+99" + (long)(Math.random() * 10000000000L));
        shadowUser.setPasswordHash(passwordEncoder.encode("shadow_system_pwd"));
        shadowUser.setAccountStatus(AccountStatus.ACTIVE);
        shadowUser = userRepository.save(shadowUser);

        // 2. Create standard platform Wallet for shadow user
        Wallet shadowWallet = new Wallet();
        shadowWallet.setUser(shadowUser);
        String walletNum = "MCH" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
        shadowWallet.setWalletNumber(walletNum);
        shadowWallet.setBalance(BigDecimal.ZERO);
        shadowWallet.setCurrency("USD");
        shadowWallet.setWalletStatus(WalletStatus.ACTIVE);
        shadowWallet = walletRepository.save(shadowWallet);

        // 3. Create Merchant Entity
        Merchant merchant = new Merchant();
        merchant.setBusinessName(request.businessName());
        merchant.setBusinessType(request.businessType());
        merchant.setBusinessEmail(request.businessEmail());
        merchant.setBusinessMobile(request.businessMobile());
        merchant.setGstNumber(request.gstNumber());
        merchant.setPanNumber(request.panNumber());
        merchant.setOwner(owner);
        merchant.setBusinessAddress(request.businessAddress());
        merchant.setVerificationStatus(BusinessVerificationStatus.PENDING);
        merchant = merchantRepository.save(merchant);

        // 4. Create MerchantWallet
        MerchantWallet merchantWallet = new MerchantWallet();
        merchantWallet.setMerchant(merchant);
        merchantWallet.setWalletNumber(walletNum);
        merchantWallet.setBalance(BigDecimal.ZERO);
        merchantWallet.setCurrency("USD");
        merchantWallet.setWalletStatus(WalletStatus.ACTIVE);
        merchantWalletRepository.save(merchantWallet);

        // 5. Create MerchantEmployee association for owner
        MerchantRole ownerRole = merchantRoleRepository.findByName(MerchantRoleName.MERCHANT_OWNER)
                .orElseGet(() -> merchantRoleRepository.save(new MerchantRole(MerchantRoleName.MERCHANT_OWNER)));

        MerchantEmployee ownerEmployee = new MerchantEmployee();
        ownerEmployee.setMerchant(merchant);
        ownerEmployee.setUser(owner);
        ownerEmployee.setRole(ownerRole);
        ownerEmployee.setStatus(EmployeeStatus.ACTIVE);
        merchantEmployeeRepository.save(ownerEmployee);

        auditService.log("MERCHANT_REGISTER", ownerUserId, "Merchant", merchant.getId());

        return mapToProfileResponse(merchant, merchantWallet);
    }

    @Override
    @Transactional(readOnly = true)
    public MerchantProfileResponse getMerchantProfile(UUID currentUserId) {
        Merchant merchant = getActiveMerchantForUser(currentUserId);
        MerchantWallet wallet = merchantWalletRepository.findByMerchantId(merchant.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Merchant wallet not found."));
        return mapToProfileResponse(merchant, wallet);
    }

    @Override
    @Transactional
    public MerchantProfileResponse updateMerchantProfile(UUID currentUserId, BusinessProfileUpdateRequest request) {
        Merchant merchant = getActiveMerchantForUser(currentUserId);
        
        // Authorize: Only Owner/Admin can update profile
        validateRole(merchant.getId(), currentUserId, MerchantRoleName.MERCHANT_OWNER, MerchantRoleName.MERCHANT_ADMIN);

        merchant.setBusinessName(request.businessName());
        merchant.setBusinessEmail(request.businessEmail());
        merchant.setBusinessMobile(request.businessMobile());
        merchant.setBusinessAddress(request.businessAddress());
        if (request.businessLogo() != null) {
            merchant.setBusinessLogo(request.businessLogo());
        }

        merchant = merchantRepository.save(merchant);
        MerchantWallet wallet = merchantWalletRepository.findByMerchantId(merchant.getId()).orElseThrow();
        
        auditService.log("MERCHANT_UPDATE", currentUserId, "Merchant", merchant.getId());
        return mapToProfileResponse(merchant, wallet);
    }

    @Override
    @Transactional
    public MerchantProfileResponse submitKyc(UUID currentUserId, KycSubmitRequest request) {
        Merchant merchant = getActiveMerchantForUser(currentUserId);
        
        merchant.setPanUpload(request.panUpload());
        merchant.setGstUpload(request.gstUpload());
        merchant.setBusinessProof(request.businessProof());
        merchant.setIdentityProof(request.identityProof());
        merchant.setAddressProof(request.addressProof());
        merchant.setVerificationStatus(BusinessVerificationStatus.PENDING);
        
        merchant = merchantRepository.save(merchant);
        MerchantWallet wallet = merchantWalletRepository.findByMerchantId(merchant.getId()).orElseThrow();
        
        auditService.log("MERCHANT_KYC_SUBMIT", currentUserId, "Merchant", merchant.getId());
        return mapToProfileResponse(merchant, wallet);
    }

    @Override
    @Transactional
    public MerchantProfileResponse simulateKycVerification(UUID currentUserId, KycVerifySimulateRequest request) {
        Merchant merchant = getActiveMerchantForUser(currentUserId);

        BusinessVerificationStatus status = BusinessVerificationStatus.valueOf(request.status().toUpperCase());
        merchant.setVerificationStatus(status);
        if (status == BusinessVerificationStatus.APPROVED) {
            merchant.setApprovedDate(LocalDateTime.now());
            merchant.setRejectedReason(null);
        } else {
            merchant.setRejectedReason(request.rejectedReason());
            merchant.setApprovedDate(null);
        }

        merchant = merchantRepository.save(merchant);
        MerchantWallet wallet = merchantWalletRepository.findByMerchantId(merchant.getId()).orElseThrow();

        // WebSocket & Email Notification to Owner
        try {
            notificationService.sendNotification(
                    merchant.getOwner(),
                    "Business Verification " + (status == BusinessVerificationStatus.APPROVED ? "Approved" : "Rejected"),
                    status == BusinessVerificationStatus.APPROVED 
                        ? String.format("Congratulations! Your business '%s' has been verified successfully.", merchant.getBusinessName())
                        : String.format("Your business verification failed. Reason: %s", request.rejectedReason()),
                    NotificationType.SYSTEM_NOTIFICATION
            );
        } catch (Exception e) {
            log.error("Failed to dispatch KYC verification notifications", e);
        }

        auditService.log("MERCHANT_KYC_VERIFY_SIMULATION", currentUserId, "Merchant", merchant.getId());
        return mapToProfileResponse(merchant, wallet);
    }

    @Override
    @Transactional(readOnly = true)
    public Merchant getActiveMerchantForUser(UUID userId) {
        // Check if user is owner of a merchant
        Optional<Merchant> ownerMerchant = merchantRepository.findByOwnerId(userId);
        if (ownerMerchant.isPresent()) {
            return ownerMerchant.get();
        }

        // Check if user is employee of a merchant
        return merchantRepository.findMerchantByEmployeeUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No active merchant business associated with this account."));
    }

    @Override
    @Transactional(readOnly = true)
    public MerchantDashboardResponse getDashboardMetrics(UUID currentUserId) {
        Merchant merchant = getActiveMerchantForUser(currentUserId);
        MerchantWallet mWallet = merchantWalletRepository.findByMerchantId(merchant.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Merchant wallet not found."));

        // Fetch actual balance from core ledger wallet table
        Wallet shadowWallet = walletRepository.findByWalletNumber(mWallet.getWalletNumber()).orElseThrow();
        BigDecimal balance = shadowWallet.getBalance();

        // Get successful payment links count/values
        List<PaymentLink> links = paymentLinkRepository.findByMerchantIdOrderByCreatedAtDesc(merchant.getId());
        List<Refund> refundsList = refundRepository.findByMerchantIdOrderByCreatedAtDesc(merchant.getId());

        LocalDateTime startOfToday = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime startOfWeek = LocalDateTime.now().minusDays(7);
        LocalDateTime startOfMonth = LocalDateTime.now().minusDays(30);

        BigDecimal todaySales = BigDecimal.ZERO;
        BigDecimal weeklySales = BigDecimal.ZERO;
        BigDecimal monthlySales = BigDecimal.ZERO;
        BigDecimal totalRevenue = BigDecimal.ZERO;
        long totalTransactionsCount = 0;
        long pendingPaymentsCount = 0;

        for (PaymentLink link : links) {
            if (link.getStatus() == PaymentLinkStatus.SUCCESS) {
                BigDecimal amt = link.getAmount();
                totalRevenue = totalRevenue.add(amt);
                totalTransactionsCount++;

                LocalDateTime paidTime = link.getUpdatedAt();
                if (paidTime.isAfter(startOfToday)) {
                    todaySales = todaySales.add(amt);
                }
                if (paidTime.isAfter(startOfWeek)) {
                    weeklySales = weeklySales.add(amt);
                }
                if (paidTime.isAfter(startOfMonth)) {
                    monthlySales = monthlySales.add(amt);
                }
            } else if (link.getStatus() == PaymentLinkStatus.PENDING) {
                pendingPaymentsCount++;
            }
        }

        BigDecimal totalRefunds = refundsList.stream()
                .filter(r -> r.getStatus() == RefundStatus.APPROVED)
                .map(Refund::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Convert PaymentLinks to DTO responses
        List<PaymentLinkResponse> recentPayments = links.stream()
                .limit(5)
                .map(l -> new PaymentLinkResponse(
                        l.getId(), l.getReferenceNumber(), l.getAmount(), l.getCurrency(),
                        l.getExpiry(), l.getDescription(), l.getStatus().name(),
                        l.getCustomerName(), l.getCustomerEmail(), l.getCustomerMobile(),
                        "/pay/" + l.getReferenceNumber(),
                        l.getTransaction() != null ? l.getTransaction().getId() : null,
                        merchant.getBusinessName(), l.getCreatedAt()
                ))
                .collect(Collectors.toList());

        return new MerchantDashboardResponse(
                todaySales, weeklySales, monthlySales, totalRevenue, totalRefunds,
                totalTransactionsCount, pendingPaymentsCount, balance, recentPayments,
                merchant.getVerificationStatus().name()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public MerchantAnalyticsResponse getMerchantAnalytics(UUID currentUserId) {
        Merchant merchant = getActiveMerchantForUser(currentUserId);
        List<PaymentLink> links = paymentLinkRepository.findByMerchantIdOrderByCreatedAtDesc(merchant.getId());
        List<Refund> refundsList = refundRepository.findByMerchantIdOrderByCreatedAtDesc(merchant.getId());

        // 1. Revenue & Customer Trends (last 7 days breakdown)
        Map<String, BigDecimal> revDayMap = new LinkedHashMap<>();
        Map<String, Long> custDayMap = new LinkedHashMap<>();
        Map<String, BigDecimal> refundDayMap = new LinkedHashMap<>();

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd");
        for (int i = 6; i >= 0; i--) {
            String dateLabel = LocalDateTime.now().minusDays(i).format(formatter);
            revDayMap.put(dateLabel, BigDecimal.ZERO);
            custDayMap.put(dateLabel, 0L);
            refundDayMap.put(dateLabel, BigDecimal.ZERO);
        }

        BigDecimal totalSuccessAmt = BigDecimal.ZERO;
        long totalSuccessCount = 0;
        long totalAttemptedCount = links.size();

        for (PaymentLink link : links) {
            String dateLabel = link.getCreatedAt().format(formatter);
            if (link.getStatus() == PaymentLinkStatus.SUCCESS) {
                totalSuccessCount++;
                totalSuccessAmt = totalSuccessAmt.add(link.getAmount());
                if (revDayMap.containsKey(dateLabel)) {
                    revDayMap.put(dateLabel, revDayMap.get(dateLabel).add(link.getAmount()));
                    custDayMap.put(dateLabel, custDayMap.get(dateLabel) + 1);
                }
            }
        }

        for (Refund refund : refundsList) {
            String dateLabel = refund.getCreatedAt().format(formatter);
            if (refund.getStatus() == RefundStatus.APPROVED && refundDayMap.containsKey(dateLabel)) {
                refundDayMap.put(dateLabel, refundDayMap.get(dateLabel).add(refund.getAmount()));
            }
        }

        List<AnalyticsTrendItem> revenueTrend = revDayMap.entrySet().stream()
                .map(e -> new AnalyticsTrendItem(e.getKey(), e.getValue()))
                .collect(Collectors.toList());

        List<AnalyticsTrendItem> customerTrend = custDayMap.entrySet().stream()
                .map(e -> new AnalyticsTrendItem(e.getKey(), BigDecimal.valueOf(e.getValue())))
                .collect(Collectors.toList());

        List<AnalyticsTrendItem> refundTrend = refundDayMap.entrySet().stream()
                .map(e -> new AnalyticsTrendItem(e.getKey(), e.getValue()))
                .collect(Collectors.toList());

        BigDecimal successRate = totalAttemptedCount == 0 
                ? BigDecimal.valueOf(100) 
                : BigDecimal.valueOf(totalSuccessCount * 100.0 / totalAttemptedCount).setScale(2, RoundingMode.HALF_UP);

        BigDecimal averageOrderValue = totalSuccessCount == 0 
                ? BigDecimal.ZERO 
                : totalSuccessAmt.divide(BigDecimal.valueOf(totalSuccessCount), 4, RoundingMode.HALF_UP);

        // 2. Monthly Revenue Trends (last 6 months breakdown)
        Map<String, BigDecimal> monthlyRevMap = new LinkedHashMap<>();
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM yyyy");
        for (int i = 5; i >= 0; i--) {
            String monthLabel = LocalDateTime.now().minusMonths(i).format(monthFormatter);
            monthlyRevMap.put(monthLabel, BigDecimal.ZERO);
        }

        for (PaymentLink link : links) {
            if (link.getStatus() == PaymentLinkStatus.SUCCESS) {
                String monthLabel = link.getCreatedAt().format(monthFormatter);
                if (monthlyRevMap.containsKey(monthLabel)) {
                    monthlyRevMap.put(monthLabel, monthlyRevMap.get(monthLabel).add(link.getAmount()));
                }
            }
        }

        List<AnalyticsTrendItem> monthlyRevenue = monthlyRevMap.entrySet().stream()
                .map(e -> new AnalyticsTrendItem(e.getKey(), e.getValue()))
                .collect(Collectors.toList());

        return new MerchantAnalyticsResponse(
                revenueTrend, customerTrend, successRate, refundTrend, averageOrderValue, monthlyRevenue
        );
    }

    private MerchantProfileResponse mapToProfileResponse(Merchant m, MerchantWallet w) {
        // Fetch core balance
        Wallet shadowWallet = walletRepository.findByWalletNumber(w.getWalletNumber()).orElseThrow();
        return new MerchantProfileResponse(
                m.getId(), m.getBusinessName(), m.getBusinessType(), m.getBusinessEmail(),
                m.getBusinessMobile(), m.getGstNumber(), m.getPanNumber(),
                m.getOwner().getId(), m.getOwner().getFullName(), m.getBusinessAddress(),
                m.getBusinessLogo(), m.getVerificationStatus().name(), m.getRejectedReason(),
                m.getApprovedDate(), m.getPanUpload(), m.getGstUpload(), m.getBusinessProof(),
                m.getIdentityProof(), m.getAddressProof(), w.getWalletNumber(),
                shadowWallet.getBalance(), w.getCurrency(), m.getCreatedAt()
        );
    }

    private void validateRole(UUID merchantId, UUID userId, MerchantRoleName... allowedRoles) {
        MerchantEmployee emp = merchantEmployeeRepository.findByMerchantIdAndUserId(merchantId, userId)
                .orElseThrow(() -> new BusinessException("You are not an employee of this business."));
        
        boolean authorized = Arrays.stream(allowedRoles)
                .anyMatch(r -> emp.getRole().getName() == r);
        
        if (!authorized) {
            throw new BusinessException("Unauthorized action for your role.");
        }
    }
}
