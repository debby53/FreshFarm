package com.FreshFarmPlatform.demo.dto.cart;

import java.time.LocalDateTime;
import java.util.List;

public record CartResponse(
        Long cartId,
        LocalDateTime createdDate,
        Double totalAmount,
        List<CartItemResponse> items
) {}

