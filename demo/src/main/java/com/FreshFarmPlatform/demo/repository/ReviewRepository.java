package com.FreshFarmPlatform.demo.repository;

import com.FreshFarmPlatform.demo.model.review.Review;
import com.FreshFarmPlatform.demo.model.product.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProduct(Product product);
}

