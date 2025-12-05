package com.FreshFarmPlatform.demo.dto.product;

import com.FreshFarmPlatform.demo.model.product.ProductStatus;

import java.time.LocalDateTime;

public record ProductResponse(
        Long id,
        String productName,
        String category,
        String description,
        Double price,
        String unit,
        Integer quantity,
        String imageUrl,
        Boolean available,
        ProductStatus status,
        LocalDateTime postedDate,
        Long farmerId,
        String farmerName,
        String farmerLocation
) {}

