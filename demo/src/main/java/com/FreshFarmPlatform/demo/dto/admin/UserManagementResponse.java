package com.FreshFarmPlatform.demo.dto.admin;

import com.FreshFarmPlatform.demo.model.user.UserType;

import java.time.LocalDateTime;

public record UserManagementResponse(
        Long userId,
        String username,
        String email,
        String phone,
        String address,
        UserType userType,
        LocalDateTime registeredDate,
        Boolean active
) {}

