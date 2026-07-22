package com.apexpay.service;

import com.apexpay.dto.*;
import com.apexpay.entity.Merchant;
import com.apexpay.entity.User;
import com.apexpay.entity.Wallet;
import com.apexpay.entity.enums.AccountStatus;
import com.apexpay.entity.enums.WalletStatus;
import com.apexpay.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class MerchantPlatformIntegrationTest {

    @Autowired
    private MerchantService merchantService;

    @Autowired
    private PaymentLinkService paymentLinkService;

    @Autowired
    private RefundService refundService;

    @Autowired
    private SettlementService settlementService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private MerchantRepository merchantRepository;

    @Autowired
    private MerchantEmployeeRepository merchantEmployeeRepository;

    @Autowired
    private PaymentLinkRepository paymentLinkRepository;

    @Autowired
    private RefundRepository refundRepository;

    @Autowired
    private SettlementRepository settlementRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private WalletLedgerRepository walletLedgerRepository;

    private User owner;
    private User customer;
    private Wallet customerWallet;

    @BeforeEach
    void setUp() {
        // Clean database tables in reverse order
        settlementRepository.deleteAll();
        refundRepository.deleteAll();
        paymentLinkRepository.deleteAll();
        walletLedgerRepository.deleteAll();
        transactionRepository.deleteAll();
        merchantEmployeeRepository.deleteAll();
        merchantRepository.deleteAll();
        walletRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Setup Merchant Owner User
        owner = new User();
        owner.setFullName("Merchant Owner");
        owner.setUsername("merchant_owner");
        owner.setEmail("owner@apexpay.com");
        owner.setMobileNumber("+1234567890");
        owner.setPasswordHash("encoded_password");
        owner.setAccountStatus(AccountStatus.ACTIVE);
        owner.setCreatedAt(LocalDateTime.now());
        owner.setUpdatedAt(LocalDateTime.now());
        owner = userRepository.save(owner);

        // 2. Setup Customer User with Wallet
        customer = new User();
        customer.setFullName("Regular Customer");
        customer.setUsername("customer_user");
        customer.setEmail("customer@apexpay.com");
        customer.setMobileNumber("+9876543210");
        customer.setPasswordHash("customer_password");
        customer.setAccountStatus(AccountStatus.ACTIVE);
        customer.setCreatedAt(LocalDateTime.now());
        customer.setUpdatedAt(LocalDateTime.now());
        customer = userRepository.save(customer);

        customerWallet = new Wallet();
        customerWallet.setUser(customer);
        customerWallet.setWalletNumber("APXCS101");
        customerWallet.setBalance(new BigDecimal("500.0000"));
        customerWallet.setDailyTransferLimit(new BigDecimal("1000.0000"));
        customerWallet.setMonthlyTransferLimit(new BigDecimal("5000.0000"));
        customerWallet.setWalletStatus(WalletStatus.ACTIVE);
        customerWallet.setCreatedAt(LocalDateTime.now());
        customerWallet.setUpdatedAt(LocalDateTime.now());
        customerWallet = walletRepository.save(customerWallet);
    }

    @Test
    void testEntireMerchantCoreLifecycle() {
        // --- 1. Business Registration ---
        BusinessRegisterRequest regReq = new BusinessRegisterRequest(
                "Acme Corp", "PRIVATE_LIMITED", "acme@acme.com", "+14155552671",
                "123 Industrial Way, CA", "27AAAAA1111A1Z1", "AAAAA1111A"
        );
        MerchantProfileResponse mProfile = merchantService.registerMerchant(owner.getId(), regReq);
        assertNotNull(mProfile);
        assertEquals("Acme Corp", mProfile.businessName());
        assertEquals("PENDING", mProfile.verificationStatus());
        assertNotNull(mProfile.walletNumber());
        assertTrue(mProfile.walletNumber().startsWith("MCH"));

        // --- 2. KYC Submission & Simulated Verification ---
        KycSubmitRequest kycReq = new KycSubmitRequest(
                "pan_path", "gst_path", "biz_proof", "id_proof", "addr_proof"
        );
        mProfile = merchantService.submitKyc(owner.getId(), kycReq);
        assertEquals("PENDING", mProfile.verificationStatus());

        KycVerifySimulateRequest verifyReq = new KycVerifySimulateRequest("APPROVED", null);
        mProfile = merchantService.simulateKycVerification(owner.getId(), verifyReq);
        assertEquals("APPROVED", mProfile.verificationStatus());

        // --- 3. Payment Link Generation ---
        CreatePaymentLinkRequest linkReq = new CreatePaymentLinkRequest(
                new BigDecimal("150.0000"), "USD", 24, "Invoice #101",
                "Jane Doe", "jane@doe.com", "+1987654321"
        );
        PaymentLinkResponse linkRes = paymentLinkService.createPaymentLink(owner.getId(), linkReq);
        assertNotNull(linkRes);
        assertEquals("PENDING", linkRes.status());
        assertNotNull(linkRes.referenceNumber());

        // --- 4. Customer Invoice Checkout Payment ---
        SendMoneyResponse payRes = paymentLinkService.payPaymentLink(
                linkRes.referenceNumber(), customer.getId(), UUID.randomUUID().toString()
        );
        assertNotNull(payRes);
        assertEquals("SUCCESS", payRes.status());

        // Check updated balances
        Wallet updatedCustomerWallet = walletRepository.findById(customerWallet.getId()).orElseThrow();
        assertEquals(0, new BigDecimal("350.0000").compareTo(updatedCustomerWallet.getBalance()));

        Merchant merchant = merchantRepository.findById(mProfile.id()).orElseThrow();
        Wallet shadowWallet = walletRepository.findByWalletNumber(merchant.getWallet().getWalletNumber()).orElseThrow();
        assertEquals(0, new BigDecimal("150.0000").compareTo(shadowWallet.getBalance()));

        // --- 5. Dashboard Metrics & Analytics Validation ---
        MerchantDashboardResponse dashboard = merchantService.getDashboardMetrics(owner.getId());
        assertEquals(0, new BigDecimal("150.0000").compareTo(dashboard.totalRevenue()));
        assertEquals(0, new BigDecimal("150.0000").compareTo(dashboard.todaySales()));
        assertEquals(1, dashboard.totalTransactionsCount());

        MerchantAnalyticsResponse analytics = merchantService.getMerchantAnalytics(owner.getId());
        assertNotNull(analytics);
        assertEquals(0, new BigDecimal("150.0000").compareTo(analytics.averageOrderValue()));
        assertEquals(0, new BigDecimal("100").compareTo(analytics.paymentSuccessRate()));

        // --- 6. Refund Creation & Approval ---
        CreateRefundRequest refReq = new CreateRefundRequest(
                payRes.transactionId(), new BigDecimal("50.0000"), "Partial refund request"
        );
        RefundResponse refundRes = refundService.createRefund(owner.getId(), refReq);
        assertNotNull(refundRes);
        assertEquals("PENDING", refundRes.status());

        RefundResponse appRefund = refundService.approveRefund(owner.getId(), refundRes.id());
        assertEquals("APPROVED", appRefund.status());

        // Verify refunded balances
        updatedCustomerWallet = walletRepository.findById(customerWallet.getId()).orElseThrow();
        assertEquals(0, new BigDecimal("400.0000").compareTo(updatedCustomerWallet.getBalance()));

        shadowWallet = walletRepository.findByWalletNumber(merchant.getWallet().getWalletNumber()).orElseThrow();
        assertEquals(0, new BigDecimal("100.0000").compareTo(shadowWallet.getBalance()));

        // --- 7. Settlement payout ---
        SettlementResponse settlement = settlementService.triggerManualSettlement(owner.getId());
        assertNotNull(settlement);
        assertEquals("SETTLED", settlement.status());
        assertEquals(0, new BigDecimal("100.0000").compareTo(settlement.amount()));

        // Merchant wallet balance should now be zeroed
        shadowWallet = walletRepository.findByWalletNumber(merchant.getWallet().getWalletNumber()).orElseThrow();
        assertEquals(0, BigDecimal.ZERO.compareTo(shadowWallet.getBalance()));
    }

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        settlementRepository.deleteAll();
        refundRepository.deleteAll();
        paymentLinkRepository.deleteAll();
        walletLedgerRepository.deleteAll();
        transactionRepository.deleteAll();
        merchantEmployeeRepository.deleteAll();
        merchantRepository.deleteAll();
        walletRepository.deleteAll();
        userRepository.deleteAll();
    }
}
