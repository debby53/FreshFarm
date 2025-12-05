package com.FreshFarmPlatform.demo.model.product;

import com.FreshFarmPlatform.demo.model.user.Farmer;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long productId;

    @Column(nullable = false)
    private String productName;

    @Column(nullable = false)
    private String category;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private Double price;

    private String unit;

    private Integer quantity;

    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = true, length = 30)
    private ProductStatus status;

    @Column(nullable = false)
    private LocalDateTime postedDate;

    @Column(nullable = false)
    private Boolean available;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farmer_id")
    private Farmer farmer;

    @PrePersist
    @PreUpdate
    void onSave() {
        if (postedDate == null) {
            postedDate = LocalDateTime.now();
        }
        if (status == null) {
            status = ProductStatus.IN_STOCK;
        }
        available = status == ProductStatus.IN_STOCK;
    }
}

