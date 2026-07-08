package com.apexpay.controller;

import com.apexpay.dto.AccountStatementResponse;
import com.apexpay.dto.ApiResponse;
import com.apexpay.dto.ExportReportRequest;
import com.apexpay.security.UserPrincipal;
import com.apexpay.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api")
@PreAuthorize("isAuthenticated()")
@Tag(name = "Financial Statements & Exports", description = "Endpoints for generating transactional history reports and downloading CSV/Excel/PDF statements")
@SecurityRequirement(name = "Bearer Authentication")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/statements")
    @Operation(summary = "Generate Account Statement", description = "Calculates credits, debits, opening, and closing balances for a target date range.")
    public ResponseEntity<ApiResponse<AccountStatementResponse>> generateStatement(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam("startDate") String startDateStr,
            @RequestParam("endDate") String endDateStr) {
        
        LocalDate start = LocalDate.parse(startDateStr);
        LocalDate end = LocalDate.parse(endDateStr);
        
        AccountStatementResponse response = reportService.generateStatement(userPrincipal.getId(), start, end);
        return ResponseEntity.ok(ApiResponse.success("Account statement generated successfully", response));
    }

    @PostMapping("/reports/export")
    @Operation(summary = "Export Statements File", description = "Compiles statements and downloads them in CSV, EXCEL, or text PDF format.")
    public ResponseEntity<byte[]> exportTransactions(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody ExportReportRequest request) {
        
        byte[] fileBytes = reportService.exportTransactions(
                userPrincipal.getId(),
                request.format(),
                request.startDate(),
                request.endDate()
        );

        String filename = "statement_" + request.startDate() + "_to_" + request.endDate();
        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        
        if ("CSV".equalsIgnoreCase(request.format())) {
            mediaType = MediaType.parseMediaType("text/csv");
            filename += ".csv";
        } else if ("EXCEL".equalsIgnoreCase(request.format()) || "XLS".equalsIgnoreCase(request.format())) {
            mediaType = MediaType.parseMediaType("application/vnd.ms-excel");
            filename += ".xls";
        } else if ("PDF".equalsIgnoreCase(request.format())) {
            mediaType = MediaType.APPLICATION_PDF;
            filename += ".pdf";
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(mediaType)
                .body(fileBytes);
    }
}
