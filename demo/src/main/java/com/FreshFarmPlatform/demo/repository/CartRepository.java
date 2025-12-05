package com.FreshFarmPlatform.demo.repository;

import com.FreshFarmPlatform.demo.model.cart.Cart;
import com.FreshFarmPlatform.demo.model.user.Buyer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Long> {
    Optional<Cart> findByBuyer(Buyer buyer);
}

