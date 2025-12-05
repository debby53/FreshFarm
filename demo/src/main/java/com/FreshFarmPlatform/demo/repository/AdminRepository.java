package com.FreshFarmPlatform.demo.repository;

import com.FreshFarmPlatform.demo.model.user.Admin;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminRepository extends JpaRepository<Admin, Long> {
}

