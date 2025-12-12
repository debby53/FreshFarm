package com.FreshFarmPlatform.demo.repository;

import com.FreshFarmPlatform.demo.model.product.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByFarmerUserId(Long farmerId);
    
    // Simple query to get all products - useful for debugging
    List<Product> findAllByOrderByPostedDateDesc();

    @Query(value = """
            select distinct p.* from products p
            left join farmers f on f.user_id = p.farmer_id
            left join users u on f.user_id = u.user_id
            where (:keyword is null or lower(p.product_name::text) like lower('%' || :keyword || '%'))
            and (:category is null or lower(p.category::text) = lower(:category))
            and (:minPrice is null or p.price >= :minPrice)
            and (:maxPrice is null or p.price <= :maxPrice)
            and (:location is null or f.location is null or lower(f.location::text) like lower('%' || :location || '%'))
            and (:availableOnly = false or p.available = true or (p.status is null or p.status::text = 'IN_STOCK'))
            and (:status is null or p.status::text = :status or (p.status is null and :status is null))
            order by p.posted_date desc
            """, nativeQuery = true)
    List<Product> searchProducts(@Param("keyword") String keyword,
                                 @Param("category") String category,
                                 @Param("minPrice") Double minPrice,
                                 @Param("maxPrice") Double maxPrice,
                                 @Param("location") String location,
                                 @Param("availableOnly") boolean availableOnly,
                                 @Param("status") String status);
}

