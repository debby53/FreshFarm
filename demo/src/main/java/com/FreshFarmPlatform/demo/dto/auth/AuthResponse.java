package com.FreshFarmPlatform.demo.dto.auth;

public record AuthResponse(
        String token,
        UserSummary user
) {}

