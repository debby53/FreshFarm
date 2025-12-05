package com.FreshFarmPlatform.demo.repository;

import com.FreshFarmPlatform.demo.model.user.Farmer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FarmerRepository extends JpaRepository<Farmer, Long> {
}

