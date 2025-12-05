package com.FreshFarmPlatform.demo.dto.order;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record CreateOrderRequest(
        @NotEmpty List<OrderItemRequest> items,
        @NotBlank String deliveryMethod,
        String deliveryAddress,
        @NotBlank String paymentMethod,
        String deliveryNotes
) {}

