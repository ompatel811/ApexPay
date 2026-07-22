package com.apexpay.service.chat;

import com.apexpay.dto.chat.ShareReceiptRequest;

import java.util.Map;
import java.util.UUID;

public interface ReceiptShareService {

    Map<String, Object> shareReceipt(UUID senderId, ShareReceiptRequest request);
}
