package com.alumni.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyAnalyticsDTO {
    private String month;
    private long newUsers;
    private long newReferrals;
    private long newConnections;
}