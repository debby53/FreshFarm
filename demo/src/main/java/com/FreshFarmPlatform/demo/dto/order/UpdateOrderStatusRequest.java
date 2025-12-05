package com.FreshFarmPlatform.demo.dto.order;

import com.FreshFarmPlatform.demo.model.order.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateOrderStatusRequest(
        @NotNull OrderStatus status
) {}

