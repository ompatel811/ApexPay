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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.apexpay.dto.GenerateQRCodeRequest;
import com.apexpay.dto.GenerateQRCodeResponse;
import com.apexpay.dto.QRPaymentRequest;
import com.apexpay.entity.User;
import com.apexpay.entity.Wallet;
import com.apexpay.entity.enums.AccountStatus;
import com.apexpay.entity.enums.WalletStatus;
import com.apexpay.repository.UserRepository;
import com.apexpay.repository.WalletRepository;
import com.apexpay.repository.IdempotencyKeyRepository;
import com.apexpay.repository.TransactionRepository;
import com.apexpay.repository.QRCodeRepository;
import com.apexpay.security.JwtTokenProvider;
import com.apexpay.service.QRCodeService;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
public class QRCodeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private IdempotencyKeyRepository idempotencyKeyRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private QRCodeRepository qrCodeRepository;

    @Autowired
    private QRCodeService qrCodeService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    private String token;
    private User sender;
    private User receiver;
    private Wallet senderWallet;
    private Wallet receiverWallet;

    @BeforeEach
    void setUp() {
        idempotencyKeyRepository.deleteAll();
        transactionRepository.deleteAll();
        qrCodeRepository.deleteAll();
        walletRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Create Senders & Receivers
        sender = new User();
        sender.setFullName("QR Controller Sender");
        sender.setUsername("qrc_sender");
        sender.setEmail("qrc_sender@apexpay.com");
        sender.setMobileNumber("+9999999999");
        sender.setPasswordHash("hash");
        sender.setAccountStatus(AccountStatus.ACTIVE);
        sender.setCreatedAt(LocalDateTime.now());
        sender.setUpdatedAt(LocalDateTime.now());
        sender = userRepository.save(sender);

        receiver = new User();
        receiver.setFullName("QR Controller Receiver");
        receiver.setUsername("qrc_receiver");
        receiver.setEmail("qrc_receiver@apexpay.com");
        receiver.setMobileNumber("+8888888888");
        receiver.setPasswordHash("hash");
        receiver.setAccountStatus(AccountStatus.ACTIVE);
        receiver.setCreatedAt(LocalDateTime.now());
        receiver.setUpdatedAt(LocalDateTime.now());
        receiver = userRepository.save(receiver);

        senderWallet = new Wallet();
        senderWallet.setUser(sender);
        senderWallet.setWalletNumber("APXQCO1");
        senderWallet.setBalance(new BigDecimal("300.0000"));
        senderWallet.setWalletStatus(WalletStatus.ACTIVE);
        senderWallet.setDailyTransferLimit(new BigDecimal("1000.0000"));
        senderWallet.setMonthlyTransferLimit(new BigDecimal("5000.0000"));
        senderWallet.setCreatedAt(LocalDateTime.now());
        senderWallet.setUpdatedAt(LocalDateTime.now());
        senderWallet = walletRepository.save(senderWallet);

        receiverWallet = new Wallet();
        receiverWallet.setUser(receiver);
        receiverWallet.setWalletNumber("APXQCO2");
        receiverWallet.setBalance(new BigDecimal("100.0000"));
        receiverWallet.setWalletStatus(WalletStatus.ACTIVE);
        receiverWallet.setCreatedAt(LocalDateTime.now());
        receiverWallet.setUpdatedAt(LocalDateTime.now());
        receiverWallet = walletRepository.save(receiverWallet);

        // 2. Generate Auth Token
        token = jwtTokenProvider.generateAccessTokenForUser(sender.getId(), sender.getUsername(), sender.getEmail());
    }

    @Test
    void generatePersonalQR_ShouldReturnSuccess() throws Exception {
        mockMvc.perform(post("/api/qr/generate")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.qrType").value("PERSONAL"))
                .andExpect(jsonPath("$.data.qrImageBase64").isNotEmpty());
    }

    @Test
    void generateDynamicQR_ShouldSaveRecordAndReturnData() throws Exception {
        GenerateQRCodeRequest request = new GenerateQRCodeRequest(
                "DYNAMIC", new BigDecimal("50.00"), "USD", "Invoice #9", 10
        );

        mockMvc.perform(post("/api/qr/generate-dynamic")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.qrType").value("DYNAMIC"))
                .andExpect(jsonPath("$.data.amount").value(50.00))
                .andExpect(jsonPath("$.data.referenceNumber").isNotEmpty());
    }

    @Test
    void executeQRPayment_ShouldSettleTransfer() throws Exception {
        // 1. Generate dynamic QR Code for receiver
        GenerateQRCodeRequest request = new GenerateQRCodeRequest(
                "DYNAMIC", new BigDecimal("30.00"), "USD", "Invoice #10", 10
        );
        GenerateQRCodeResponse response = qrCodeService.generateDynamicQR(receiver.getId(), request);

        // 2. Pay it via controller endpoint
        QRPaymentRequest payRequest = new QRPaymentRequest(
                response.id(),
                response.qrData(),
                null,
                "Controller QR Pay",
                "qrc-idemp-1"
        );

        mockMvc.perform(post("/api/qr/pay")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("SUCCESS"))
                .andExpect(jsonPath("$.data.amount").value(30.00));
    }
}
