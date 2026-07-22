package com.apexpay.service.chat;

import com.apexpay.dto.chat.ShareQRRequest;

import java.util.Map;
import java.util.UUID;

public interface QRShareService {

    Map<String, Object> shareQR(UUID senderId, ShareQRRequest request);
}
