package com.apexpay.service.chat.impl;

import com.apexpay.dto.chat.PresenceDTO;
import com.apexpay.service.chat.PresenceService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class PresenceServiceImpl implements PresenceService {

    private final Map<UUID, Boolean> onlineStatusMap = new ConcurrentHashMap<>();
    private final Map<UUID, LocalDateTime> lastSeenMap = new ConcurrentHashMap<>();

    @Override
    public void markUserOnline(UUID userId) {
        if (userId == null) return;
        onlineStatusMap.put(userId, true);
        lastSeenMap.put(userId, LocalDateTime.now());
        log.info("User {} is now ONLINE", userId);
    }

    @Override
    public void markUserOffline(UUID userId) {
        if (userId == null) return;
        onlineStatusMap.put(userId, false);
        lastSeenMap.put(userId, LocalDateTime.now());
        log.info("User {} is now OFFLINE", userId);
    }

    @Override
    public boolean isUserOnline(UUID userId) {
        return userId != null && onlineStatusMap.getOrDefault(userId, false);
    }

    @Override
    public PresenceDTO getUserPresence(UUID userId) {
        boolean online = isUserOnline(userId);
        LocalDateTime lastSeen = lastSeenMap.getOrDefault(userId, LocalDateTime.now());
        return PresenceDTO.builder()
                .userId(userId)
                .online(online)
                .lastSeen(lastSeen)
                .build();
    }
}
