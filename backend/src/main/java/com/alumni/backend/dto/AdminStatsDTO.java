package com.alumni.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsDTO {
    private long totalUsers;
    private long totalStudents;
    private long totalAlumni;
    private long activeReferrals;
    private long connectionsMade;
    private long pendingAlumni;
    private long hiredReferrals;
    private double successRate;
}