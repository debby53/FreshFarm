package com.FreshFarmPlatform.demo.dto.order;

import com.FreshFarmPlatform.demo.model.order.OrderStatus;

import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        Long orderId,
        LocalDateTime orderDate,
        Double totalAmount,
        String deliveryMethod,
        String deliveryAddress,
        OrderStatus status,
        LocalDateTime deliveryDate,
        List<OrderItemResponse> items,
        String paymentMethod,
        String deliveryNotes,
        Long farmerId
) {}

