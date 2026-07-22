package com.apexpay.controller;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.apexpay.dto.SendMoneyRequest;
import com.apexpay.entity.User;
import com.apexpay.entity.Wallet;
import com.apexpay.entity.enums.AccountStatus;
import com.apexpay.entity.enums.WalletStatus;
import com.apexpay.repository.UserRepository;
import com.apexpay.repository.WalletRepository;
import com.apexpay.security.JwtTokenProvider;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
public class PaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    private String jwtToken;
    private User sender;
    private User receiver;
    private Wallet senderWallet;
    private Wallet receiverWallet;

    @BeforeEach
    void setUp() {
        walletRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Create Senders & Receivers
        sender = new User();
        sender.setFullName("Controller Sender");
        sender.setUsername("co_sender");
        sender.setEmail("co_sender@apexpay.com");
        sender.setMobileNumber("+3333333333");
        sender.setPasswordHash("hash");
        sender.setAccountStatus(AccountStatus.ACTIVE);
        sender.setCreatedAt(LocalDateTime.now());
        sender.setUpdatedAt(LocalDateTime.now());
        sender = userRepository.save(sender);

        receiver = new User();
        receiver.setFullName("Controller Receiver");
        receiver.setUsername("co_receiver");
        receiver.setEmail("co_receiver@apexpay.com");
        receiver.setMobileNumber("+4444444444");
        receiver.setPasswordHash("hash");
        receiver.setAccountStatus(AccountStatus.ACTIVE);
        receiver.setCreatedAt(LocalDateTime.now());
        receiver.setUpdatedAt(LocalDateTime.now());
        receiver = userRepository.save(receiver);

        senderWallet = new Wallet();
        senderWallet.setUser(sender);
        senderWallet.setWalletNumber("APXCO1");
        senderWallet.setBalance(new BigDecimal("100.0000"));
        senderWallet.setWalletStatus(WalletStatus.ACTIVE);
        senderWallet.setDailyTransferLimit(new BigDecimal("1000.0000"));
        senderWallet.setMonthlyTransferLimit(new BigDecimal("5000.0000"));
        senderWallet.setCreatedAt(LocalDateTime.now());
        senderWallet.setUpdatedAt(LocalDateTime.now());
        senderWallet = walletRepository.save(senderWallet);

        receiverWallet = new Wallet();
        receiverWallet.setUser(receiver);
        receiverWallet.setWalletNumber("APXCO2");
        receiverWallet.setBalance(new BigDecimal("50.0000"));
        receiverWallet.setWalletStatus(WalletStatus.ACTIVE);
        receiverWallet.setCreatedAt(LocalDateTime.now());
        receiverWallet.setUpdatedAt(LocalDateTime.now());
        receiverWallet = walletRepository.save(receiverWallet);

        // 2. Generate authentication JWT Token for sender
        jwtToken = jwtTokenProvider.generateAccessTokenForUser(sender.getId(), sender.getUsername(), sender.getEmail());
    }

    @Test
    void sendMoney_ShouldReturnSuccess_WhenDetailsAreValid() throws Exception {
        SendMoneyRequest request = new SendMoneyRequest(
                "co_receiver",
                new BigDecimal("20.00"),
                "Gift",
                "co-idemp-1"
        );

        mockMvc.perform(post("/api/payments/send")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Payment completed successfully"))
                .andExpect(jsonPath("$.data.status").value("SUCCESS"))
                .andExpect(jsonPath("$.data.amount").value(20.00));
    }

    @Test
    void validatePayment_ShouldReturnValid_WhenCheckPasses() throws Exception {
        SendMoneyRequest request = new SendMoneyRequest(
                "co_receiver",
                new BigDecimal("15.00"),
                "Dry Run",
                "co-idemp-2"
        );

        mockMvc.perform(post("/api/payments/validate")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.valid").value(true))
                .andExpect(jsonPath("$.data.receiverName").value("Controller Receiver"));
    }

    @Test
    void getHistory_ShouldReturnPaginatedList() throws Exception {
        mockMvc.perform(get("/api/payments/history")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.transactions").isArray());
    }
}
