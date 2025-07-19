package com.rft.rft_be.dto.admin;

import com.rft.rft_be.entity.User;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserSearchDTO {
    private String name;
    private String email;
    private User.Status status;
    private User.Role role;
    private Integer page = 0;
    private Integer size = 10;
    private String sortBy = "createdAt";
    private String sortDirection = "DESC";
} 