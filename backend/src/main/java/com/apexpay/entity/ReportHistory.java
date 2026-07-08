package com.apexpay.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

/**
 * Entity representing report generation history logs.
 */
@Getter
@Setter
@Entity
@Table(name = "report_history")
public class ReportHistory extends BaseEntity {

    @NotNull(message = "User association is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotBlank(message = "Report type is required")
    @Column(name = "report_type", nullable = false)
    private String reportType;

    @NotNull(message = "Start date is required")
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Size(max = 512, message = "File path must be less than 512 characters")
    @Column(name = "file_path")
    private String filePath;
}
