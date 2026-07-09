package com.apexpay.service;

import com.apexpay.dto.CreateRefundRequest;
import com.apexpay.dto.RefundResponse;
import java.util.List;
import java.util.UUID;

public interface RefundService {
    RefundResponse createRefund(UUID currentUserId, CreateRefundRequest request);
    RefundResponse approveRefund(UUID currentUserId, UUID refundId);
    RefundResponse rejectRefund(UUID currentUserId, UUID refundId, String reason);
    List<RefundResponse> getRefunds(UUID currentUserId);
}
