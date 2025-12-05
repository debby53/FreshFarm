package com.FreshFarmPlatform.demo.dto.order;

public record OrderItemResponse(
        Long orderItemId,
        Long productId,
        String productName,
        String category,
        String imageUrl,
        String unit,
        Integer quantity,
        Double priceAtOrder,
        Double subtotal
) {}

