package com.apexpay.service;

import com.apexpay.dto.BankAccountResponse;
import com.apexpay.dto.LinkBankAccountRequest;

import java.util.List;
import java.util.UUID;

public interface BankAccountService {
    BankAccountResponse linkBankAccount(UUID userId, LinkBankAccountRequest request);
    List<BankAccountResponse> getBankAccounts(UUID userId);
    BankAccountResponse setPrimaryBankAccount(UUID accountId, UUID userId);
    void deleteBankAccount(UUID accountId, UUID userId);
}
