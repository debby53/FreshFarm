package com.FreshFarmPlatform.demo.repository;

import com.FreshFarmPlatform.demo.model.transaction.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
}

