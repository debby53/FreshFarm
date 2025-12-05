package com.FreshFarmPlatform.demo.repository;

import com.FreshFarmPlatform.demo.model.cart.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
}

