package com.apexpay.service.admin;

import com.apexpay.dto.admin.*;
import com.apexpay.entity.*;
import com.apexpay.entity.admin.*;
import com.apexpay.entity.enums.*;
import com.apexpay.exception.InvalidCredentialsException;
import com.apexpay.exception.ResourceNotFoundException;
import com.apexpay.repository.*;
import com.apexpay.repository.admin.*;
import com.apexpay.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class AdminServiceImpl implements AdminService {

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MerchantRepository merchantRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private BankAccountRepository bankAccountRepository;

    @Autowired
    private UpiIdRepository upiIdRepository;

    @Autowired
    private QRCodeRepository qrCodeRepository;

    @Autowired
    private PlatformSettingRepository platformSettingRepository;

    @Autowired
    private SystemHealthRepository systemHealthRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Override
    public AdminLoginResponse login(AdminLoginRequest request) {
        AdminUser adminUser = adminUserRepository.findByUsername(request.usernameOrEmail())
                .or(() -> adminUserRepository.findByEmail(request.usernameOrEmail()))
                .orElseThrow(() -> new InvalidCredentialsException("Invalid username or password"));

        if (adminUser.getStatus() != AccountStatus.ACTIVE) {
            throw new InvalidCredentialsException("Admin account is suspended or blocked");
        }

        if (!passwordEncoder.matches(request.password(), adminUser.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid username or password");
        }

        // Generate Token
        String token = jwtTokenProvider.generateAccessTokenForUser(
                adminUser.getId(),
                adminUser.getUsername(),
                adminUser.getEmail()
        );

        AdminProfileResponse profile = mapToProfileResponse(adminUser);
        
        // Log Login Action
        logAudit("ADMIN_LOGIN", adminUser.getUsername(), "AdminUser", adminUser.getId().toString());

        return new AdminLoginResponse(token, "Bearer", profile);
    }

    @Override
    public AdminProfileResponse getProfile(UUID adminId) {
        AdminUser adminUser = adminUserRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found with ID: " + adminId));
        return mapToProfileResponse(adminUser);
    }

    @Override
    public AdminDashboardResponse getDashboardData() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByAccountStatus(AccountStatus.ACTIVE);
        long blockedUsers = userRepository.countByAccountStatus(AccountStatus.BLOCKED);
        long totalMerchants = merchantRepository.count();
        long totalWallets = walletRepository.count();

        List<Transaction> transactions = transactionRepository.findAll();
        long todayTransactions = 0;
        long pendingTransactions = 0;
        long failedTransactions = 0;
        long qrPayments = 0;
        long upiPayments = 0;
        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal platformBalance = BigDecimal.ZERO;

        LocalDateTime startOfToday = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);

        for (Transaction t : transactions) {
            if (t.getCreatedAt().isAfter(startOfToday)) {
                todayTransactions++;
            }
            if (t.getPaymentStatus() == TransactionStatus.PENDING) {
                pendingTransactions++;
            } else if (t.getPaymentStatus() == TransactionStatus.FAILED) {
                failedTransactions++;
            }

            if (t.getPaymentStatus() == TransactionStatus.SUCCESS) {
                // Revenue simulated as 0.5% of transaction volume
                totalRevenue = totalRevenue.add(t.getAmount().multiply(new BigDecimal("0.005")));
            }

            // QR code payments are categorized under "QR"
            if ("QR".equalsIgnoreCase(t.getCategory())) {
                qrPayments++;
            }
            if (t.getPaymentMethod() == PaymentMethod.UPI) {
                upiPayments++;
            }
        }

        List<Wallet> wallets = walletRepository.findAll();
        for (Wallet w : wallets) {
            platformBalance = platformBalance.add(w.getBalance());
        }

        return new AdminDashboardResponse(
                totalUsers,
                activeUsers,
                blockedUsers,
                totalMerchants,
                totalWallets,
                todayTransactions,
                pendingTransactions,
                failedTransactions,
                qrPayments,
                upiPayments,
                totalRevenue,
                platformBalance
        );
    }

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public User getUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));
    }

    @Override
    public User suspendUser(UUID id) {
        User user = getUserById(id);
        user.setAccountStatus(AccountStatus.SUSPENDED);
        user = userRepository.save(user);
        logAudit("SUSPEND_USER", "SYSTEM", "User", id.toString());
        
        // Push notification update
        messagingTemplate.convertAndSend("/topic/admin/users", "User suspended: " + user.getUsername());
        
        return user;
    }

    @Override
    public User activateUser(UUID id) {
        User user = getUserById(id);
        user.setAccountStatus(AccountStatus.ACTIVE);
        user = userRepository.save(user);
        logAudit("ACTIVATE_USER", "SYSTEM", "User", id.toString());

        // Push notification update
        messagingTemplate.convertAndSend("/topic/admin/users", "User activated: " + user.getUsername());

        return user;
    }

    @Override
    public void deleteUser(UUID id) {
        User user = getUserById(id);
        userRepository.delete(user);
        logAudit("DELETE_USER", "SYSTEM", "User", id.toString());
        messagingTemplate.convertAndSend("/topic/admin/users", "User deleted: " + user.getUsername());
    }

    @Override
    public void resetUserPassword(UUID id, String newPassword) {
        User user = getUserById(id);
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        logAudit("RESET_PASSWORD", "SYSTEM", "User", id.toString());
    }

    @Override
    public List<AuditLog> getUserActivity(UUID id) {
        User user = getUserById(id);
        return auditLogRepository.findByPerformedBy(user.getUsername());
    }

    @Override
    public List<Merchant> getAllMerchants() {
        return merchantRepository.findAll();
    }

    @Override
    public Merchant approveMerchant(UUID id) {
        Merchant merchant = merchantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Merchant not found"));
        merchant.setVerificationStatus(BusinessVerificationStatus.APPROVED);
        merchant.setApprovedDate(LocalDateTime.now());
        merchant = merchantRepository.save(merchant);
        logAudit("APPROVE_MERCHANT", "SYSTEM", "Merchant", id.toString());

        messagingTemplate.convertAndSend("/topic/admin/merchants", "Merchant approved: " + merchant.getBusinessName());
        return merchant;
    }

    @Override
    public Merchant rejectMerchant(UUID id, String reason) {
        Merchant merchant = merchantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Merchant not found"));
        merchant.setVerificationStatus(BusinessVerificationStatus.REJECTED);
        merchant.setRejectedReason(reason);
        merchant = merchantRepository.save(merchant);
        logAudit("REJECT_MERCHANT", "SYSTEM", "Merchant", id.toString());

        messagingTemplate.convertAndSend("/topic/admin/merchants", "Merchant rejected: " + merchant.getBusinessName());
        return merchant;
    }

    @Override
    public Merchant suspendMerchant(UUID id) {
        Merchant merchant = merchantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Merchant not found"));
        // Suspend the owner user account
        if (merchant.getOwner() != null) {
            merchant.getOwner().setAccountStatus(AccountStatus.SUSPENDED);
            userRepository.save(merchant.getOwner());
        }
        merchant = merchantRepository.save(merchant);
        logAudit("SUSPEND_MERCHANT", "SYSTEM", "Merchant", id.toString());
        return merchant;
    }

    @Override
    public void deleteMerchant(UUID id) {
        Merchant merchant = merchantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Merchant not found"));
        merchantRepository.delete(merchant);
        logAudit("DELETE_MERCHANT", "SYSTEM", "Merchant", id.toString());
    }

    @Override
    public List<Wallet> getAllWallets() {
        return walletRepository.findAll();
    }

    @Override
    public Wallet freezeWallet(UUID id) {
        Wallet wallet = walletRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));
        wallet.setWalletStatus(WalletStatus.FROZEN);
        wallet = walletRepository.save(wallet);
        logAudit("FREEZE_WALLET", "SYSTEM", "Wallet", id.toString());
        return wallet;
    }

    @Override
    public Wallet unfreezeWallet(UUID id) {
        Wallet wallet = walletRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));
        wallet.setWalletStatus(WalletStatus.ACTIVE);
        wallet = walletRepository.save(wallet);
        logAudit("UNFREEZE_WALLET", "SYSTEM", "Wallet", id.toString());
        return wallet;
    }

    @Override
    public Wallet adjustWalletBalance(UUID id, BigDecimal amount, String remarks) {
        Wallet wallet = walletRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));
        wallet.setBalance(wallet.getBalance().add(amount));
        wallet = walletRepository.save(wallet);
        logAudit("ADJUST_WALLET_BALANCE", "SYSTEM", "Wallet", id.toString());

        // Create transaction entry to track adjustment
        Transaction trans = new Transaction();
        trans.setTransactionReference("ADJ-" + System.currentTimeMillis());
        trans.setAmount(amount.abs());
        trans.setTransactionType(amount.compareTo(BigDecimal.ZERO) > 0 ? TransactionType.DEPOSIT : TransactionType.WITHDRAW);
        trans.setPaymentMethod(PaymentMethod.WALLET);
        trans.setPaymentStatus(TransactionStatus.SUCCESS);
        trans.setSenderWallet(amount.compareTo(BigDecimal.ZERO) > 0 ? null : wallet);
        trans.setReceiverWallet(amount.compareTo(BigDecimal.ZERO) > 0 ? wallet : null);
        trans.setCategory("ADJUSTMENT");
        trans.setRemarks(remarks);
        transactionRepository.save(trans);

        messagingTemplate.convertAndSend("/topic/admin/transactions", "Wallet adjusted: " + wallet.getWalletNumber());

        return wallet;
    }

    @Override
    public List<BankAccount> getAllLinkedBanks() {
        return bankAccountRepository.findAll();
    }

    @Override
    public BankAccount approveBankVerification(UUID id) {
        BankAccount bank = bankAccountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bank account not found"));
        bank.setVerificationStatus(VerificationStatus.VERIFIED);
        bank = bankAccountRepository.save(bank);
        logAudit("APPROVE_BANK", "SYSTEM", "BankAccount", id.toString());
        return bank;
    }

    @Override
    public BankAccount rejectBankVerification(UUID id) {
        BankAccount bank = bankAccountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bank account not found"));
        bank.setVerificationStatus(VerificationStatus.FAILED);
        bank = bankAccountRepository.save(bank);
        logAudit("REJECT_BANK", "SYSTEM", "BankAccount", id.toString());
        return bank;
    }

    @Override
    public List<UpiId> getAllUpiIds() {
        return upiIdRepository.findAll();
    }

    @Override
    public UpiId deactivateUpi(UUID id) {
        UpiId upi = upiIdRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("UPI ID not found"));
        upi.setStatus("INACTIVE");
        upi = upiIdRepository.save(upi);
        logAudit("DEACTIVATE_UPI", "SYSTEM", "UpiId", id.toString());
        return upi;
    }

    @Override
    public UpiId activateUpi(UUID id) {
        UpiId upi = upiIdRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("UPI ID not found"));
        upi.setStatus("ACTIVE");
        upi = upiIdRepository.save(upi);
        logAudit("ACTIVATE_UPI", "SYSTEM", "UpiId", id.toString());
        return upi;
    }

    @Override
    public void deleteUpi(UUID id) {
        UpiId upi = upiIdRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("UPI ID not found"));
        upiIdRepository.delete(upi);
        logAudit("DELETE_UPI", "SYSTEM", "UpiId", id.toString());
    }

    @Override
    public List<QRCode> getAllQrCodes() {
        return qrCodeRepository.findAll();
    }

    @Override
    public QRCode deactivateQr(UUID id) {
        QRCode qr = qrCodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("QR Code not found"));
        qr.setStatus("INACTIVE");
        qr = qrCodeRepository.save(qr);
        logAudit("DEACTIVATE_QR", "SYSTEM", "QRCode", id.toString());
        return qr;
    }

    @Override
    public void deleteQr(UUID id) {
        QRCode qr = qrCodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("QR Code not found"));
        qrCodeRepository.delete(qr);
        logAudit("DELETE_QR", "SYSTEM", "QRCode", id.toString());
    }

    @Override
    public long getQrUsage(UUID id) {
        QRCode qr = qrCodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("QR Code not found"));
        // Simulate usage
        return Math.abs(qr.getId().hashCode() % 100);
    }

    @Override
    public List<PlatformSettingDto> getSettings() {
        return platformSettingRepository.findAll().stream()
                .map(s -> new PlatformSettingDto(s.getKey(), s.getValue(), s.getDescription()))
                .collect(Collectors.toList());
    }

    @Override
    public PlatformSettingDto updateSetting(String key, String value, String username) {
        PlatformSetting setting = platformSettingRepository.findByKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("Setting not found: " + key));
        setting.setValue(value);
        setting.setUpdatedBy(username);
        setting = platformSettingRepository.save(setting);

        logAudit("UPDATE_SETTING", username, "PlatformSetting", key);

        return new PlatformSettingDto(setting.getKey(), setting.getValue(), setting.getDescription());
    }

    @Override
    public List<AuditLog> getAuditLogs() {
        return auditLogRepository.findAll();
    }

    @Override
    public SystemHealthResponse getSystemHealth() {
        // Compute dynamic simulated metrics
        Random rand = new Random();
        double cpu = 15.0 + (rand.nextDouble() * 45.0); // 15% - 60%
        double mem = 35.0 + (rand.nextDouble() * 30.0); // 35% - 65%
        int latency = 10 + rand.nextInt(45); // 10ms - 55ms

        SystemHealth health = new SystemHealth();
        health.setCpuUsage(cpu);
        health.setMemoryUsage(mem);
        health.setApiResponseTimeMs(latency);
        health.setDatabaseStatus("HEALTHY");
        health.setRedisStatus("HEALTHY");
        health.setApplicationHealth("UP");
        health.setWebsocketStatus("CONNECTED");
        health.setTimestamp(LocalDateTime.now());

        systemHealthRepository.save(health);

        // Publish live health status on WebSocket
        SystemHealthResponse response = mapToHealthResponse(health);
        messagingTemplate.convertAndSend("/topic/admin/health", response);

        return response;
    }

    @Override
    public List<SystemHealthResponse> getSystemHealthHistory() {
        return systemHealthRepository.findTop30ByOrderByTimestampDesc().stream()
                .map(this::mapToHealthResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Notification sendAdminNotification(AdminNotificationRequest request, String performedBy) {
        Notification notification = new Notification();
        notification.setTitle(request.title());
        notification.setMessage(request.message());
        notification.setNotificationType(request.notificationType() != null ? 
                NotificationType.valueOf(request.notificationType()) : NotificationType.SYSTEM_NOTIFICATION);
        notification.setIsRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setUpdatedAt(LocalDateTime.now());

        if (request.userId() != null) {
            User user = userRepository.findById(request.userId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            notification.setUser(user);
            notification = notificationRepository.save(notification);
            
            // Push direct
            messagingTemplate.convertAndSendToUser(user.getUsername(), "/queue/notifications", notification);
        } else {
            // Broadcast - setting user to null signifies global system announcement
            notification.setUser(null);
            notification = notificationRepository.save(notification);

            // Push broadcast
            messagingTemplate.convertAndSend("/topic/notifications", notification);
        }

        logAudit("SEND_NOTIFICATION", performedBy, "Notification", notification.getId().toString());

        return notification;
    }

    @Override
    public void deleteNotification(UUID id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        notificationRepository.delete(notification);
        logAudit("DELETE_NOTIFICATION", "SYSTEM", "Notification", id.toString());
    }

    @Override
    public byte[] generateReport(String format, String type) {
        // Generate mock transaction records for reports in CSV, PDF, Excel text representations
        StringBuilder csv = new StringBuilder();
        csv.append("Transaction ID,Reference,Sender Wallet,Receiver Wallet,Amount,Type,Method,Status,Timestamp\n");

        List<Transaction> transactions = transactionRepository.findAll();
        for (Transaction t : transactions) {
            csv.append(String.format("%s,%s,%s,%s,%s,%s,%s,%s,%s\n",
                    t.getId(),
                    t.getTransactionReference(),
                    t.getSenderWallet() != null ? t.getSenderWallet().getWalletNumber() : "N/A",
                    t.getReceiverWallet() != null ? t.getReceiverWallet().getWalletNumber() : "N/A",
                    t.getAmount(),
                    t.getTransactionType(),
                    t.getPaymentMethod(),
                    t.getPaymentStatus(),
                    t.getCreatedAt()));
        }

        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    // Helper mappings
    private AdminProfileResponse mapToProfileResponse(AdminUser adminUser) {
        Set<String> roles = adminUser.getRoles().stream()
                .map(AdminRole::getName)
                .collect(Collectors.toSet());

        Set<String> permissions = adminUser.getRoles().stream()
                .flatMap(r -> r.getPermissions().stream())
                .map(Permission::getName)
                .collect(Collectors.toSet());

        return new AdminProfileResponse(
                adminUser.getId(),
                adminUser.getFullName(),
                adminUser.getUsername(),
                adminUser.getEmail(),
                adminUser.getStatus().name(),
                roles,
                permissions
        );
    }

    private SystemHealthResponse mapToHealthResponse(SystemHealth h) {
        return new SystemHealthResponse(
                h.getCpuUsage(),
                h.getMemoryUsage(),
                h.getApiResponseTimeMs(),
                h.getDatabaseStatus(),
                h.getRedisStatus(),
                h.getApplicationHealth(),
                h.getWebsocketStatus(),
                h.getTimestamp()
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
