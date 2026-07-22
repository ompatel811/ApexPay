package com.apexpay.service.chat;

import com.apexpay.dto.chat.PresenceDTO;

import java.util.UUID;

public interface PresenceService {

    void markUserOnline(UUID userId);

    void markUserOffline(UUID userId);

    boolean isUserOnline(UUID userId);

    PresenceDTO getUserPresence(UUID userId);
}
