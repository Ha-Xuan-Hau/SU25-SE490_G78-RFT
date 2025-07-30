package com.rft.rft_be.dto.admin;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStaffActivityGroupDTO {
    private String staffId;
    private String fullName;
    private List<AdminStaffActivityDTO> activities;
}
