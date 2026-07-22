package com.apexpay.controller;

import com.apexpay.dto.*;
import com.apexpay.security.UserPrincipal;
import com.apexpay.service.AiService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class AiControllerTest {

    @Mock
    private AiService aiService;

    @InjectMocks
    private AiController aiController;

    private UserPrincipal userPrincipal;
    private UUID userId;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        userId = UUID.randomUUID();
        userPrincipal = new UserPrincipal(
                userId,
                "John Doe",
                "johndoe",
                "john@example.com",
                "+1234567890",
                "passwordHash",
                Collections.emptyList()
        );
    }

    @Test
    void chat_ShouldReturnReply_WhenValid() {
        ChatRequest request = new ChatRequest("Suggest a monthly budget.");
        ChatResponse mockResponse = new ChatResponse("Suggest a limit of ₹5000", LocalDateTime.now());

        when(aiService.chat(eq(userId), any(ChatRequest.class))).thenReturn(mockResponse);

        ResponseEntity<ApiResponse<ChatResponse>> response = aiController.chat(userPrincipal, request);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().success());
        assertEquals("Suggest a limit of ₹5000", response.getBody().data().response());
        verify(aiService, times(1)).chat(eq(userId), any(ChatRequest.class));
    }

    @Test
    void getInsights_ShouldReturnInsights_WhenAuthorized() {
        FinancialInsightResponse mockInsight = new FinancialInsightResponse(
                UUID.randomUUID(),
                "SPENDING",
                "Top Expense Category: FOOD",
                "You have spent 30% of expenses on FOOD",
                LocalDateTime.now()
        );

        when(aiService.getInsights(userId)).thenReturn(Collections.singletonList(mockInsight));

        ResponseEntity<ApiResponse<List<FinancialInsightResponse>>> response = aiController.getInsights(userPrincipal);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertEquals(1, response.getBody().data().size());
        assertEquals("SPENDING", response.getBody().data().get(0).type());
    }

    @Test
    void getSummary_ShouldReturnSummary_WhenAuthorized() {
        FinancialSummaryResponse mockSummary = new FinancialSummaryResponse(
                BigDecimal.valueOf(10000),
                BigDecimal.valueOf(4000),
                BigDecimal.valueOf(6000),
                BigDecimal.valueOf(60),
                "FRIDAY",
                "Starbucks",
                "UPI",
                Collections.emptyMap()
        );

        when(aiService.getSummary(userId)).thenReturn(mockSummary);

        ResponseEntity<ApiResponse<FinancialSummaryResponse>> response = aiController.getSummary(userPrincipal);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertEquals(BigDecimal.valueOf(10000), response.getBody().data().totalIncome());
    }
}
