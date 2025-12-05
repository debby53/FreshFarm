package com.FreshFarmPlatform.demo.dto.review;

import java.time.LocalDateTime;

public record ReviewResponse(
        Long reviewId,
        Long productId,
        Long buyerId,
        int rating,
        String comment,
        LocalDateTime reviewDate
) {}

