package com.FreshFarmPlatform.demo.controller;

import com.FreshFarmPlatform.demo.dto.product.ProductRequest;
import com.FreshFarmPlatform.demo.dto.product.ProductResponse;
import com.FreshFarmPlatform.demo.model.product.ProductStatus;
import com.FreshFarmPlatform.demo.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ResponseEntity<List<ProductResponse>> list(@RequestParam(required = false) String keyword,
                                                      @RequestParam(required = false) String category,
                                                      @RequestParam(required = false) Double minPrice,
                                                      @RequestParam(required = false) Double maxPrice,
                                                      @RequestParam(required = false) String location,
                                                      @RequestParam(required = false) Boolean availableOnly,
                                                      @RequestParam(required = false) ProductStatus status) {
        try {
            List<ProductResponse> products = productService.listProducts(keyword, category, minPrice, maxPrice, location, availableOnly, status);
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            // Log error for debugging
            System.err.println("Error fetching products: " + e.getMessage());
            e.printStackTrace();
            // Return empty list instead of error to prevent frontend crash
            return ResponseEntity.ok(List.of());
        }
    }

    @GetMapping("/farmer/{farmerId}")
    public ResponseEntity<List<ProductResponse>> farmerProducts(@PathVariable Long farmerId) {
        return ResponseEntity.ok(productService.listFarmerProducts(farmerId));
    }

    @GetMapping("/debug/all")
    public ResponseEntity<?> debugAllProducts() {
        try {
            // Return raw count and sample for debugging
            var allProducts = productService.listProducts(null, null, null, null, null, false, null);
            return ResponseEntity.ok(java.util.Map.of(
                "total", allProducts.size(),
                "products", allProducts,
                "message", "Debug endpoint - showing all products"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(java.util.Map.of(
                "error", e.getMessage(),
                "stackTrace", java.util.Arrays.toString(e.getStackTrace())
            ));
        }
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProductResponse> create(@Valid @RequestPart("product") ProductRequest request,
                                                  @RequestPart(value = "image", required = false) MultipartFile image) {
        return ResponseEntity.ok(productService.createProduct(request, image));
    }

    @PutMapping(value = "/{productId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProductResponse> update(@PathVariable Long productId,
                                                  @Valid @RequestPart("product") ProductRequest request,
                                                  @RequestPart(value = "image", required = false) MultipartFile image) {
        return ResponseEntity.ok(productService.updateProduct(productId, request, image));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> delete(@PathVariable Long productId) {
        productService.deleteProduct(productId);
        return ResponseEntity.noContent().build();
    }
}

