package com.FreshFarmPlatform.demo.dto.cart;

public record CartItemResponse(
        Long cartItemId,
        Long productId,
        String productName,
        Integer quantity,
        Double price,
        Double subtotal,
        String imageUrl,
        String category,
        String unit,
        Integer availableQuantity
) {}

