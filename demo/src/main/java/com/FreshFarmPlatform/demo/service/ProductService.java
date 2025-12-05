package com.FreshFarmPlatform.demo.service;

import com.FreshFarmPlatform.demo.dto.product.ProductRequest;
import com.FreshFarmPlatform.demo.dto.product.ProductResponse;
import com.FreshFarmPlatform.demo.exception.BadRequestException;
import com.FreshFarmPlatform.demo.exception.ResourceNotFoundException;
import com.FreshFarmPlatform.demo.model.product.Product;
import com.FreshFarmPlatform.demo.model.product.ProductStatus;
import com.FreshFarmPlatform.demo.model.user.Farmer;
import com.FreshFarmPlatform.demo.model.user.User;
import com.FreshFarmPlatform.demo.model.user.UserType;
import com.FreshFarmPlatform.demo.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final UserService userService;
    private final FileStorageService fileStorageService;

    public ProductService(ProductRepository productRepository,
                          UserService userService,
                          FileStorageService fileStorageService) {
        this.productRepository = productRepository;
        this.userService = userService;
        this.fileStorageService = fileStorageService;
    }

    @Transactional
    public ProductResponse createProduct(ProductRequest request, MultipartFile image) {
        User current = userService.getCurrentUser();
        if (current.getUserType() != UserType.FARMER) {
            throw new BadRequestException("Only farmers can create products");
        }
        Product product = Product.builder()
                .productName(request.productName())
                .category(request.category())
                .description(request.description())
                .price(request.price())
                .unit(request.unit())
                .quantity(request.quantity())
                .imageUrl(resolveImageUrl(request.imageUrl(), image))
                .status(resolveStatus(request.status(), request.available()))
                .available(resolveAvailability(request.status(), request.available()))
                .farmer((Farmer) current)
                .build();
        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse updateProduct(Long productId, ProductRequest request, MultipartFile image) {
        Product product = getOwnedProduct(productId);
        product.setProductName(request.productName());
        product.setCategory(request.category());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setUnit(request.unit());
        product.setQuantity(request.quantity());
        String imageUrl = resolveImageUrl(request.imageUrl(), image);
        if (imageUrl != null) {
            product.setImageUrl(imageUrl);
        }
        if (request.status() != null || request.available() != null) {
            ProductStatus status = resolveStatus(request.status(), request.available());
            product.setStatus(status);
            product.setAvailable(resolveAvailability(status, request.available()));
        }
        return toResponse(productRepository.save(product));
    }

    @Transactional
    public void deleteProduct(Long productId) {
        Product product = getOwnedProduct(productId);
        productRepository.delete(product);
    }

    public List<ProductResponse> listProducts(String keyword,
                                              String category,
                                              Double minPrice,
                                              Double maxPrice,
                                              String location,
                                              Boolean availableOnly,
                                              ProductStatus status) {
        try {
            boolean onlyAvailable = Boolean.TRUE.equals(availableOnly);
            List<Product> products = productRepository.searchProducts(
                            sanitize(keyword),
                            sanitize(category),
                            minPrice,
                            maxPrice,
                            sanitize(location),
                            onlyAvailable,
                            status);
            
            // Log for debugging
            System.out.println("Found " + products.size() + " products with filters: keyword=" + keyword + 
                             ", category=" + category + ", status=" + status);
            
            return products.stream()
                    .map(this::toResponse)
                    .toList();
        } catch (Exception e) {
            System.err.println("Error in listProducts: " + e.getMessage());
            e.printStackTrace();
            // Fallback: return all products if query fails
            return productRepository.findAllByOrderByPostedDateDesc().stream()
                    .map(this::toResponse)
                    .toList();
        }
    }

    public List<ProductResponse> listFarmerProducts(Long farmerId) {
        return productRepository.findByFarmerUserId(farmerId).stream().map(this::toResponse).toList();
    }

    private Product getOwnedProduct(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        User current = userService.getCurrentUser();
        if (!product.getFarmer().getUserId().equals(current.getUserId())) {
            throw new BadRequestException("You can only modify your products");
        }
        return product;
    }

    private String resolveImageUrl(String providedUrl, MultipartFile image) {
        if (image != null && !image.isEmpty()) {
            return fileStorageService.store(image);
        }
        if (providedUrl == null || providedUrl.isBlank()) {
            return null;
        }
        return providedUrl;
    }

    private ProductResponse toResponse(Product product) {
        String farmerLocation = null;
        if (product.getFarmer() != null && product.getFarmer().getLocation() != null) {
            farmerLocation = product.getFarmer().getLocation();
        }
        return new ProductResponse(
                product.getProductId(),
                product.getProductName(),
                product.getCategory(),
                product.getDescription(),
                product.getPrice(),
                product.getUnit(),
                product.getQuantity(),
                product.getImageUrl(),
                product.getAvailable(),
                product.getStatus(),
                product.getPostedDate(),
                product.getFarmer() != null ? product.getFarmer().getUserId() : null,
                product.getFarmer() != null ? product.getFarmer().getUsername() : null,
                farmerLocation
        );
    }

    private String sanitize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private ProductStatus resolveStatus(ProductStatus requestedStatus, Boolean availableFlag) {
        if (requestedStatus != null) {
            return requestedStatus;
        }
        if (availableFlag != null) {
            return availableFlag ? ProductStatus.IN_STOCK : ProductStatus.OUT_OF_STOCK;
        }
        return ProductStatus.IN_STOCK;
    }

    private boolean resolveAvailability(ProductStatus status, Boolean availableFlag) {
        if (availableFlag != null) {
            return availableFlag;
        }
        return status == ProductStatus.IN_STOCK;
    }
}

