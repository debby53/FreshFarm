package com.FreshFarmPlatform.demo.dto.admin;

import java.util.List;
import java.util.Map;

public record ReportResponse(
        String reportType,
        String period,
        Double totalRevenue,
        Long totalOrders,
        Long totalUsers,
        Long totalProducts,
        List<Map<String, Object>> topProducts,
        List<Map<String, Object>> topFarmers,
        Map<String, Long> ordersByStatus,
        Map<String, Double> revenueByCategory
) {}

