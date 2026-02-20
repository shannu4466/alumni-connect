package com.alumni.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ConnectionActionDTO {
    @NotBlank(message = "Action is required (ACCEPT or REJECT)")
    private String action;
}