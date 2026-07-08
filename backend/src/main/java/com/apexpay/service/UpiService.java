package com.apexpay.service;

import com.apexpay.dto.*;
import java.util.List;
import java.util.UUID;

public interface UpiService {
    UpiResponse createUpiId(UUID userId, CreateUpiRequest request);
    List<UpiResponse> getUpiIds(UUID userId);
    UpiResponse setDefaultUpi(UUID upiId, UUID userId);
    void deleteUpiId(UUID upiId, UUID userId);
    boolean checkUpiAvailability(String upiId);
    
    SendMoneyResponse payUsingUpi(UUID userId, UpiPayRequest request);
    
    UpiRequestResponse requestMoney(UUID userId, RequestMoneyRequest request);
    List<UpiRequestResponse> getUpiRequests(UUID userId);
    SendMoneyResponse acceptUpiRequest(UUID userId, UUID requestId, String idempotencyKey);
    void rejectUpiRequest(UUID userId, UUID requestId);
}
