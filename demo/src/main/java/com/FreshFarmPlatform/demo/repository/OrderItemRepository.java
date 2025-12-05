package com.FreshFarmPlatform.demo.repository;

import com.FreshFarmPlatform.demo.model.order.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
}

