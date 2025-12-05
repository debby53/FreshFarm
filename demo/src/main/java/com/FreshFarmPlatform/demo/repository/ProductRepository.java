package com.FreshFarmPlatform.demo.repository;

import com.FreshFarmPlatform.demo.model.product.Product;
import com.FreshFarmPlatform.demo.model.product.ProductStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByFarmerUserId(Long farmerId);
    
    // Simple query to get all products - useful for debugging
    List<Product> findAllByOrderByPostedDateDesc();

    @Query("""
            select distinct p from Product p
            left join fetch p.farmer f
            where (:keyword is null or lower(p.productName) like lower(concat('%', :keyword, '%')))
            and (:category is null or lower(p.category) = lower(:category))
            and (:minPrice is null or p.price >= :minPrice)
            and (:maxPrice is null or p.price <= :maxPrice)
            and (:location is null or f.location is null or lower(f.location) like lower(concat('%', :location, '%')))
            and (:availableOnly = false or p.available = true or (p.status is null or p.status = 'IN_STOCK'))
            and (:status is null or p.status = :status or (p.status is null and :status is null))
            order by p.postedDate desc
            """)
    List<Product> searchProducts(@Param("keyword") String keyword,
                                 @Param("category") String category,
                                 @Param("minPrice") Double minPrice,
                                 @Param("maxPrice") Double maxPrice,
                                 @Param("location") String location,
                                 @Param("availableOnly") boolean availableOnly,
                                 @Param("status") ProductStatus status);
}

