package com.FreshFarmPlatform.demo.repository;

import com.FreshFarmPlatform.demo.model.user.Buyer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BuyerRepository extends JpaRepository<Buyer, Long> {
}

