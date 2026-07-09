package com.apexpay.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.apexpay.dto.GenerateQRCodeRequest;
import com.apexpay.dto.GenerateQRCodeResponse;
import com.apexpay.dto.QRPaymentRequest;
import com.apexpay.dto.QRPaymentResponse;
import com.apexpay.entity.QRCode;
import com.apexpay.entity.User;
import com.apexpay.entity.Wallet;
import com.apexpay.entity.enums.AccountStatus;
import com.apexpay.entity.enums.WalletStatus;
import com.apexpay.repository.QRCodeRepository;
import com.apexpay.repository.UserRepository;
import com.apexpay.repository.WalletRepository;

@SpringBootTest
@SuppressWarnings("null")
public class QRPaymentIntegrationTest {

    @Autowired
    private QRPaymentService qrPaymentService;

    @Autowired
    private QRCodeService qrCodeService;

    @Autowired
    private QRCodeRepository qrCodeRepository;

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private UserRepository userRepository;

    private User sender;
    private User receiver;
    private Wallet senderWallet;
    private Wallet receiverWallet;

    @BeforeEach
    @SuppressWarnings("unused")
    void setUp() {
        qrCodeRepository.deleteAll();
        walletRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Create Sender
        sender = new User();
        sender.setFullName("QR Sender");
        sender.setUsername("qr_sender");
        sender.setEmail("qr_sender@apexpay.com");
        sender.setMobileNumber("+1122334455");
        sender.setPasswordHash("hash");
        sender.setAccountStatus(AccountStatus.ACTIVE);
        sender.setCreatedAt(LocalDateTime.now());
        sender.setUpdatedAt(LocalDateTime.now());
        sender = userRepository.save(sender);

        senderWallet = new Wallet();
        senderWallet.setUser(sender);
        senderWallet.setWalletNumber("APXQS1");
        senderWallet.setBalance(new BigDecimal("500.0000"));
        senderWallet.setWalletStatus(WalletStatus.ACTIVE);
        senderWallet.setDailyTransferLimit(new BigDecimal("1000.0000"));
        senderWallet.setMonthlyTransferLimit(new BigDecimal("5000.0000"));
        senderWallet.setCreatedAt(LocalDateTime.now());
        senderWallet.setUpdatedAt(LocalDateTime.now());
        senderWallet = walletRepository.save(senderWallet);

        // 2. Create Receiver
        receiver = new User();
        receiver.setFullName("QR Receiver");
        receiver.setUsername("qr_receiver");
        receiver.setEmail("qr_receiver@apexpay.com");
        receiver.setMobileNumber("+5544332211");
        receiver.setPasswordHash("hash");
        receiver.setAccountStatus(AccountStatus.ACTIVE);
        receiver.setCreatedAt(LocalDateTime.now());
        receiver.setUpdatedAt(LocalDateTime.now());
        receiver = userRepository.save(receiver);

        receiverWallet = new Wallet();
        receiverWallet.setUser(receiver);
        receiverWallet.setWalletNumber("APXQR2");
        receiverWallet.setBalance(new BigDecimal("50.0000"));
        receiverWallet.setWalletStatus(WalletStatus.ACTIVE);
        receiverWallet.setCreatedAt(LocalDateTime.now());
        receiverWallet.setUpdatedAt(LocalDateTime.now());
        receiverWallet = walletRepository.save(receiverWallet);
    }

    @Test
    @SuppressWarnings("null")
    void executeQRPayment_ShouldTransferBalancesAndMarkQRAsUsed() {
        BigDecimal payAmt = new BigDecimal("120.0000");

        // 1. Generate dynamic QR Code for Receiver
        GenerateQRCodeRequest genReq = new GenerateQRCodeRequest("DYNAMIC", payAmt, "USD", "Invoice #1", 15);
        GenerateQRCodeResponse genRes = qrCodeService.generateDynamicQR(receiver.getId(), genReq);

        assertNotNull(genRes.id());
        assertNotNull(genRes.qrData());

        // 2. Execute Payment from Sender using Scanned Payload
        QRPaymentRequest payReq = new QRPaymentRequest(
                genRes.id(),
                genRes.qrData(),
                null, // Amount locked in DYNAMIC payload, sender leaves it null
                "Scan Pay Test",
                UUID.randomUUID().toString()
        );

        QRPaymentResponse payRes = qrPaymentService.executeQRPayment(sender.getId(), payReq);

        assertNotNull(payRes.transactionId());
        assertEquals("SUCCESS", payRes.status());
        assertEquals(0, payRes.amount().compareTo(payAmt));

        // 3. Verify balance deducts / additions
        Wallet senderWalletAfter = walletRepository.findById(senderWallet.getId()).orElseThrow();
        Wallet receiverWalletAfter = walletRepository.findById(receiverWallet.getId()).orElseThrow();

        assertEquals(0, senderWalletAfter.getBalance().compareTo(new BigDecimal("380.0000")), "Sender should be debited $120");
        assertEquals(0, receiverWalletAfter.getBalance().compareTo(new BigDecimal("170.0000")), "Receiver should be credited $120");

        // 4. Verify dynamic QR Code status changed to USED
        QRCode dbQr = qrCodeRepository.findById(genRes.id()).orElseThrow();
        assertEquals("USED", dbQr.getStatus(), "QR code state must be updated to USED to prevent double-spending.");
    }
}
