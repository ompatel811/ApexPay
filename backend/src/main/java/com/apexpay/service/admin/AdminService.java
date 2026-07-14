package com.apexpay.service.admin;

import com.apexpay.dto.admin.*;
import com.apexpay.entity.User;
import com.apexpay.entity.Merchant;
import com.apexpay.entity.Transaction;
import com.apexpay.entity.Wallet;
import com.apexpay.entity.BankAccount;
import com.apexpay.entity.UpiId;
import com.apexpay.entity.QRCode;
import com.apexpay.entity.AuditLog;
import com.apexpay.entity.Notification;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface AdminService {
    
    // Auth & Profile
    AdminLoginResponse login(AdminLoginRequest request);
    AdminProfileResponse getProfile(UUID adminId);

    // Dashboard & Stats
    AdminDashboardResponse getDashboardData();

    // User Management
    List<User> getAllUsers();
    User getUserById(UUID id);
    User suspendUser(UUID id);
    User activateUser(UUID id);
    void deleteUser(UUID id);
    void resetUserPassword(UUID id, String newPassword);
    List<AuditLog> getUserActivity(UUID id);

    // Merchant Management
    List<Merchant> getAllMerchants();
    Merchant approveMerchant(UUID id);
    Merchant rejectMerchant(UUID id, String reason);
    Merchant suspendMerchant(UUID id);
    void deleteMerchant(UUID id);

    // Wallet Management
    List<Wallet> getAllWallets();
    Wallet freezeWallet(UUID id);
    Wallet unfreezeWallet(UUID id);
    Wallet adjustWalletBalance(UUID id, BigDecimal amount, String remarks);

    // Bank Management
    List<BankAccount> getAllLinkedBanks();
    BankAccount approveBankVerification(UUID id);
    BankAccount rejectBankVerification(UUID id);

    // UPI Management
    List<UpiId> getAllUpiIds();
    UpiId deactivateUpi(UUID id);
    UpiId activateUpi(UUID id);
    void deleteUpi(UUID id);

    // QR Management
    List<QRCode> getAllQrCodes();
    QRCode deactivateQr(UUID id);
    void deleteQr(UUID id);
    long getQrUsage(UUID id);

    // Settings
    List<PlatformSettingDto> getSettings();
    PlatformSettingDto updateSetting(String key, String value, String username);

    // Audit Logs
    List<AuditLog> getAuditLogs();

    // System Health
    SystemHealthResponse getSystemHealth();
    List<SystemHealthResponse> getSystemHealthHistory();

    // Notifications
    Notification sendAdminNotification(AdminNotificationRequest request, String performedBy);
    void deleteNotification(UUID id);

    // Reports
    byte[] generateReport(String format, String type);
}
