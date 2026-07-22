package com.apexpay.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import com.apexpay.entity.User;
import com.apexpay.entity.Wallet;
import com.apexpay.entity.enums.AccountStatus;
import com.apexpay.entity.enums.WalletStatus;
import com.apexpay.repository.UserRepository;
import com.apexpay.repository.WalletRepository;

@SpringBootTest
public class PaymentTransactionRollbackTest {

    @Autowired
    private WalletTransferService walletTransferService;

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private UserRepository userRepository;

    @MockitoBean
    private LedgerService ledgerService; // Mock LedgerService to throw error and trigger rollback

    private Wallet senderWallet;
    private Wallet receiverWallet;

    @BeforeEach
    void setUp() {
        // Clear database setup
        walletRepository.deleteAll();
        userRepository.deleteAll();

        User sender = new User();
        sender.setFullName("Rollback Sender");
        sender.setUsername("r_sender");
        sender.setEmail("r_sender@apexpay.com");
        sender.setMobileNumber("+1111111111");
        sender.setPasswordHash("hash");
        sender.setAccountStatus(AccountStatus.ACTIVE);
        sender.setCreatedAt(LocalDateTime.now());
        sender.setUpdatedAt(LocalDateTime.now());
        User savedSender = userRepository.save(sender);

        User receiver = new User();
        receiver.setFullName("Rollback Receiver");
        receiver.setUsername("r_receiver");
        receiver.setEmail("r_receiver@apexpay.com");
        receiver.setMobileNumber("+2222222222");
        receiver.setPasswordHash("hash");
        receiver.setAccountStatus(AccountStatus.ACTIVE);
        receiver.setCreatedAt(LocalDateTime.now());
        receiver.setUpdatedAt(LocalDateTime.now());
        User savedReceiver = userRepository.save(receiver);

        senderWallet = new Wallet();
        senderWallet.setUser(savedSender);
        senderWallet.setWalletNumber("APXR1");
        senderWallet.setBalance(new BigDecimal("100.0000"));
        senderWallet.setWalletStatus(WalletStatus.ACTIVE);
        senderWallet.setDailyTransferLimit(new BigDecimal("1000.0000"));
        senderWallet.setMonthlyTransferLimit(new BigDecimal("5000.0000"));
        senderWallet.setCreatedAt(LocalDateTime.now());
        senderWallet.setUpdatedAt(LocalDateTime.now());
        senderWallet = walletRepository.save(senderWallet);

        receiverWallet = new Wallet();
        receiverWallet.setUser(savedReceiver);
        receiverWallet.setWalletNumber("APXR2");
        receiverWallet.setBalance(new BigDecimal("50.0000"));
        receiverWallet.setWalletStatus(WalletStatus.ACTIVE);
        receiverWallet.setCreatedAt(LocalDateTime.now());
        receiverWallet.setUpdatedAt(LocalDateTime.now());
        receiverWallet = walletRepository.save(receiverWallet);
    }

    @Test
    void executeTransfer_ShouldRollbackBalances_WhenLedgerServiceFails() {
        BigDecimal transferAmount = new BigDecimal("30.0000");

        // Force ledgerService to throw a runtime exception to check rollback
        doThrow(new RuntimeException("Simulated ledger database failure"))
                .when(ledgerService)
                .createLedgerEntries(any(), any(), any(), any());

        // Execute transfer and assert it throws RuntimeException
        assertThrows(RuntimeException.class, () ->
                walletTransferService.executeTransfer(senderWallet.getId(), receiverWallet.getId(), transferAmount, "Rollback Test")
        );

        // Fetch wallets again to check if balances rolled back
        Wallet senderWalletAfter = walletRepository.findById(senderWallet.getId()).orElseThrow();
        Wallet receiverWalletAfter = walletRepository.findById(receiverWallet.getId()).orElseThrow();

        // Balances must remain EXACTLY the same as before
        assertEquals(0, senderWalletAfter.getBalance().compareTo(new BigDecimal("100.0000")),
                "Sender balance should NOT be debited on failure.");
        assertEquals(0, receiverWalletAfter.getBalance().compareTo(new BigDecimal("50.0000")),
                "Receiver balance should NOT be credited on failure.");
    }
}
