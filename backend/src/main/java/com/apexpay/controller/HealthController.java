package com.apexpay.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    @GetMapping
    public Map<String, Object> checkHealth() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        
        // Database check
        try {
            Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            status.put("database", result != null && result == 1 ? "UP" : "DOWN");
        } catch (Exception e) {
            status.put("database", "DOWN: " + e.getMessage());
        }

        // Redis check
        try {
            if (redisTemplate != null && redisTemplate.getConnectionFactory() != null) {
                String ping = redisTemplate.getConnectionFactory().getConnection().ping();
                status.put("redis", "PONG".equals(ping) || "OK".equals(ping) ? "UP" : "DOWN");
            } else {
                status.put("redis", "DOWN: Redis connection factory not configured");
            }
        } catch (Exception e) {
            status.put("redis", "DOWN: " + e.getMessage());
        }

        return status;
    }
}
