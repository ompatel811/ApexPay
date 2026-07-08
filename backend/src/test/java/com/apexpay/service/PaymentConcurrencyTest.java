package com.apexpay.service;

import com.apexpay.entity.User;
import com.apexpay.entity.Wallet;
import com.apexpay.entity.enums.AccountStatus;
import com.apexpay.entity.enums.WalletStatus;
import com.apexpay.repository.UserRepository;
import com.apexpay.repository.WalletRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
public class PaymentConcurrencyTest {

    @Autowired
    private WalletTransferService walletTransferService;

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private UserRepository userRepository;

    private Wallet senderWallet;
    private Wallet receiverWallet;

    @BeforeEach
    void setUp() {
        // Clear database
        walletRepository.deleteAll();
        userRepository.deleteAll();

        User sender = new User();
        sender.setFullName("Concurrency Sender");
        sender.setUsername("c_sender");
        sender.setEmail("c_sender@apexpay.com");
        sender.setMobileNumber("+1111111110");
        sender.setPasswordHash("hash");
        sender.setAccountStatus(AccountStatus.ACTIVE);
        sender.setCreatedAt(LocalDateTime.now());
        sender.setUpdatedAt(LocalDateTime.now());
        User savedSender = userRepository.save(sender);

        User receiver = new User();
        receiver.setFullName("Concurrency Receiver");
        receiver.setUsername("c_receiver");
        receiver.setEmail("c_receiver@apexpay.com");
        receiver.setMobileNumber("+2222222220");
        receiver.setPasswordHash("hash");
        receiver.setAccountStatus(AccountStatus.ACTIVE);
        receiver.setCreatedAt(LocalDateTime.now());
        receiver.setUpdatedAt(LocalDateTime.now());
        User savedReceiver = userRepository.save(receiver);

        senderWallet = new Wallet();
        senderWallet.setUser(savedSender);
        senderWallet.setWalletNumber("APXC1");
        senderWallet.setBalance(new BigDecimal("100.0000")); // Initial balance $100
        senderWallet.setWalletStatus(WalletStatus.ACTIVE);
        senderWallet.setDailyTransferLimit(new BigDecimal("1000.0000"));
        senderWallet.setMonthlyTransferLimit(new BigDecimal("5000.0000"));
        senderWallet.setCreatedAt(LocalDateTime.now());
        senderWallet.setUpdatedAt(LocalDateTime.now());
        senderWallet = walletRepository.save(senderWallet);

        receiverWallet = new Wallet();
        receiverWallet.setUser(savedReceiver);
        receiverWallet.setWalletNumber("APXC2");
        receiverWallet.setBalance(new BigDecimal("0.0000")); // Initial balance $0
        receiverWallet.setWalletStatus(WalletStatus.ACTIVE);
        receiverWallet.setCreatedAt(LocalDateTime.now());
        receiverWallet.setUpdatedAt(LocalDateTime.now());
        receiverWallet = walletRepository.save(receiverWallet);
    }

    @Test
    void executeTransfer_ShouldPreventDoubleSpending_UnderHighConcurrency() throws InterruptedException {
        int threadCount = 5;
        BigDecimal transferAmount = new BigDecimal("30.0000"); // 5 * 30 = 150 (exceeds 100)

        ExecutorService executorService = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch endLatch = new CountDownLatch(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            executorService.execute(() -> {
                try {
                    startLatch.await(); // Wait for signal to start simultaneously
                    walletTransferService.executeTransfer(senderWallet.getId(), receiverWallet.getId(), transferAmount, "Concurrency test");
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    failureCount.incrementAndGet();
                } finally {
                    endLatch.countDown();
                }
            });
        }

        // Start all threads at once
        startLatch.countDown();
        endLatch.await(); // Wait for all threads to finish

        // 3 threads should succeed ($30 * 3 = $90). 2 threads should fail (insufficient balance).
        assertEquals(3, successCount.get(), "Exactly 3 transfers must succeed.");
        assertEquals(2, failureCount.get(), "Exactly 2 transfers must fail due to balance limits.");

        // Fetch final wallet balances
        Wallet finalSender = walletRepository.findById(senderWallet.getId()).orElseThrow();
        Wallet finalReceiver = walletRepository.findById(receiverWallet.getId()).orElseThrow();

        // Final balance checks
        assertEquals(0, finalSender.getBalance().compareTo(new BigDecimal("10.0000")),
                "Sender balance should be exactly $10.00");
        assertEquals(0, finalReceiver.getBalance().compareTo(new BigDecimal("90.0000")),
                "Receiver balance should be exactly $90.00");
    }
}
