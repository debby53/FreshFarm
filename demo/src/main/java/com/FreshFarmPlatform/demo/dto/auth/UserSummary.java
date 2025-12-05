package com.FreshFarmPlatform.demo.dto.auth;

import com.FreshFarmPlatform.demo.model.user.UserType;

public record UserSummary(
        Long id,
        String username,
        String email,
        UserType userType
) {}

