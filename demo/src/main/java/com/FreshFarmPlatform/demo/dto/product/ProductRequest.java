package com.FreshFarmPlatform.demo.dto.product;

import com.FreshFarmPlatform.demo.model.product.ProductStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ProductRequest(
        @NotBlank String productName,
        @NotBlank String category,
        String description,
        @NotNull @Min(0) Double price,
        String unit,
        @NotNull @Min(0) Integer quantity,
        String imageUrl,
        Boolean available,
        ProductStatus status
) {}

