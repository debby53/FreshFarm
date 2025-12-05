package com.FreshFarmPlatform.demo.dto.user;

import com.FreshFarmPlatform.demo.model.user.UserType;

import java.time.LocalDateTime;

public record UserProfileResponse(
        Long userId,
        String username,
        String email,
        String phone,
        String address,
        UserType userType,
        LocalDateTime registeredDate
) {}

