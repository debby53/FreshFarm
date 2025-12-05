package com.FreshFarmPlatform.demo.dto.admin;

import java.time.LocalDateTime;

public record TransactionSummaryResponse(
        Long transactionId,
        Long orderId,
        Double amount,
        String paymentMethod,
        String status,
        LocalDateTime transactionDate,
        String buyerName,
        String buyerEmail
) {}

