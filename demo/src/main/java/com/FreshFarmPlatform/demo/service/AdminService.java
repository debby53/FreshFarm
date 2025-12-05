package com.FreshFarmPlatform.demo.service;

import com.FreshFarmPlatform.demo.dto.admin.ReportResponse;
import com.FreshFarmPlatform.demo.dto.admin.TransactionSummaryResponse;
import com.FreshFarmPlatform.demo.dto.admin.UserManagementResponse;
import com.FreshFarmPlatform.demo.exception.BadRequestException;
import com.FreshFarmPlatform.demo.exception.ResourceNotFoundException;
import com.FreshFarmPlatform.demo.model.order.Order;
import com.FreshFarmPlatform.demo.model.order.OrderStatus;
import com.FreshFarmPlatform.demo.model.product.Product;
import com.FreshFarmPlatform.demo.model.transaction.Transaction;
import com.FreshFarmPlatform.demo.model.user.User;
import com.FreshFarmPlatform.demo.model.user.UserType;
import com.FreshFarmPlatform.demo.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final TransactionRepository transactionRepository;
    private final ProductRepository productRepository;
    private final UserService userService;
    private final CartRepository cartRepository;
    private final MessageRepository messageRepository;
    private final ReviewRepository reviewRepository;
    private final CartItemRepository cartItemRepository;
    private final OrderItemRepository orderItemRepository;

    public AdminService(UserRepository userRepository,
                       OrderRepository orderRepository,
                       TransactionRepository transactionRepository,
                       ProductRepository productRepository,
                       UserService userService,
                       CartRepository cartRepository,
                       MessageRepository messageRepository,
                       ReviewRepository reviewRepository,
                       CartItemRepository cartItemRepository,
                       OrderItemRepository orderItemRepository) {
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.transactionRepository = transactionRepository;
        this.userService = userService;
        this.cartRepository = cartRepository;
        this.messageRepository = messageRepository;
        this.reviewRepository = reviewRepository;
        this.cartItemRepository = cartItemRepository;
        this.orderItemRepository = orderItemRepository;
    }

    private void ensureAdmin() {
        User current = userService.getCurrentUser();
        if (current.getUserType() != UserType.ADMIN) {
            throw new BadRequestException("Only admins can access this resource");
        }
    }

    public List<UserManagementResponse> getAllUsers() {
        ensureAdmin();
        return userRepository.findAll().stream()
                .map(user -> new UserManagementResponse(
                        user.getUserId(),
                        user.getUsername(),
                        user.getEmail(),
                        user.getPhone(),
                        user.getAddress(),
                        user.getUserType(),
                        user.getRegisteredDate(),
                        true // Assuming all users are active by default
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public UserManagementResponse deactivateUser(Long userId) {
        ensureAdmin();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        // In a real system, you'd have an 'active' field. For now, we'll just return the user.
        return new UserManagementResponse(
                user.getUserId(),
                user.getUsername(),
                user.getEmail(),
                user.getPhone(),
                user.getAddress(),
                user.getUserType(),
                user.getRegisteredDate(),
                false
        );
    }

    @Transactional
    public void deleteUser(Long userId) {
        ensureAdmin();
        User current = userService.getCurrentUser();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getUserId().equals(current.getUserId())) {
            throw new BadRequestException("Cannot delete your own account");
        }
        
        // Delete related entities based on user type
        if (user.getUserType() == UserType.BUYER) {
            // Delete cart and cart items
            cartRepository.findByBuyer((com.FreshFarmPlatform.demo.model.user.Buyer) user)
                    .ifPresent(cart -> {
                        cartItemRepository.deleteAll(cart.getItems());
                        cartRepository.delete(cart);
                    });
            
            // Delete orders and related entities
            List<Order> orders = orderRepository.findByBuyer((com.FreshFarmPlatform.demo.model.user.Buyer) user);
            for (Order order : orders) {
                // Delete transaction first
                if (order.getTransaction() != null) {
                    transactionRepository.delete(order.getTransaction());
                }
                // Delete order items explicitly to avoid constraint issues
                if (order.getItems() != null && !order.getItems().isEmpty()) {
                    orderItemRepository.deleteAll(order.getItems());
                }
            }
            // Delete orders
            orderRepository.deleteAll(orders);
            
            // Delete reviews by this buyer
            List<com.FreshFarmPlatform.demo.model.review.Review> reviews = reviewRepository.findAll().stream()
                    .filter(r -> r.getBuyer() != null && r.getBuyer().getUserId().equals(userId))
                    .collect(Collectors.toList());
            reviewRepository.deleteAll(reviews);
        } else if (user.getUserType() == UserType.FARMER) {
            // Delete products and related entities
            List<Product> products = productRepository.findByFarmerUserId(userId);
            for (Product product : products) {
                // Delete reviews for this product
                List<com.FreshFarmPlatform.demo.model.review.Review> productReviews = reviewRepository.findByProduct(product);
                reviewRepository.deleteAll(productReviews);
                
                // Delete cart items that reference this product
                List<com.FreshFarmPlatform.demo.model.cart.CartItem> cartItems = cartItemRepository.findAll().stream()
                        .filter(ci -> ci.getProduct() != null && ci.getProduct().getProductId().equals(product.getProductId()))
                        .collect(Collectors.toList());
                cartItemRepository.deleteAll(cartItems);
                
                // Update cart totals after removing items
                cartItems.forEach(item -> {
                    if (item.getCart() != null) {
                        com.FreshFarmPlatform.demo.model.cart.Cart cart = item.getCart();
                        cart.getItems().remove(item);
                        cart.setTotalAmount(cart.getItems().stream()
                                .mapToDouble(ci -> ci.getSubtotal() != null ? ci.getSubtotal() : 0.0)
                                .sum());
                        cartRepository.save(cart);
                    }
                });
            }
            productRepository.deleteAll(products);
        }
        
        // Delete messages (as sender or recipient)
        List<com.FreshFarmPlatform.demo.model.message.Message> messages = messageRepository.findBySenderOrRecipientOrderBySentDateDesc(user, user);
        messageRepository.deleteAll(messages);
        
        // Finally delete the user (this will also delete the subclass table entry)
        userRepository.delete(user);
    }

    public List<TransactionSummaryResponse> getAllTransactions() {
        ensureAdmin();
        return transactionRepository.findAll().stream()
                .map(transaction -> {
                    Order order = transaction.getOrder();
                    return new TransactionSummaryResponse(
                            transaction.getTransactionId(),
                            order != null ? order.getOrderId() : null,
                            transaction.getAmount(),
                            transaction.getPaymentMethod(),
                            transaction.getStatus(),
                            transaction.getTransactionDate(),
                            order != null && order.getBuyer() != null ? order.getBuyer().getUsername() : "Unknown",
                            order != null && order.getBuyer() != null ? order.getBuyer().getEmail() : "Unknown"
                    );
                })
                .collect(Collectors.toList());
    }

    public ReportResponse generateReport(String period) {
        ensureAdmin();
        LocalDateTime startDate;
        LocalDateTime endDate = LocalDateTime.now();

        switch (period.toUpperCase()) {
            case "DAILY":
                startDate = endDate.minusDays(1);
                break;
            case "WEEKLY":
                startDate = endDate.minusWeeks(1);
                break;
            case "MONTHLY":
                startDate = endDate.minusMonths(1);
                break;
            default:
                startDate = endDate.minusMonths(1);
        }

        List<Order> orders = orderRepository.findAll().stream()
                .filter(order -> order.getOrderDate().isAfter(startDate) && order.getOrderDate().isBefore(endDate))
                .collect(Collectors.toList());

        Double totalRevenue = orders.stream()
                .mapToDouble(order -> order.getTotalAmount() != null ? order.getTotalAmount() : 0.0)
                .sum();

        Long totalOrders = (long) orders.size();
        Long totalUsers = userRepository.count();
        Long totalProducts = productRepository.count();

        // Top products by quantity sold
        Map<Long, Long> productSales = new HashMap<>();
        orders.forEach(order -> {
            if (order.getItems() != null) {
                order.getItems().forEach(item -> {
                    productSales.merge(item.getProduct().getProductId(), (long) item.getQuantity(), Long::sum);
                });
            }
        });

        List<Map<String, Object>> topProducts = productSales.entrySet().stream()
                .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
                .limit(5)
                .map(entry -> {
                    Product product = productRepository.findById(entry.getKey()).orElse(null);
                    Map<String, Object> map = new HashMap<>();
                    map.put("productId", entry.getKey());
                    map.put("productName", product != null ? product.getProductName() : "Unknown");
                    map.put("quantitySold", entry.getValue());
                    return map;
                })
                .collect(Collectors.toList());

        // Top farmers by revenue
        Map<Long, Double> farmerRevenue = new HashMap<>();
        orders.forEach(order -> {
            if (order.getItems() != null) {
                order.getItems().forEach(item -> {
                    Long farmerId = item.getProduct().getFarmer().getUserId();
                    farmerRevenue.merge(farmerId, item.getSubtotal(), Double::sum);
                });
            }
        });

        List<Map<String, Object>> topFarmers = farmerRevenue.entrySet().stream()
                .sorted(Map.Entry.<Long, Double>comparingByValue().reversed())
                .limit(5)
                .map(entry -> {
                    User farmer = userRepository.findById(entry.getKey()).orElse(null);
                    Map<String, Object> map = new HashMap<>();
                    map.put("farmerId", entry.getKey());
                    map.put("farmerName", farmer != null ? farmer.getUsername() : "Unknown");
                    map.put("revenue", entry.getValue());
                    return map;
                })
                .collect(Collectors.toList());

        // Orders by status
        Map<String, Long> ordersByStatus = orders.stream()
                .collect(Collectors.groupingBy(
                        order -> order.getStatus().name(),
                        Collectors.counting()
                ));

        // Revenue by category
        Map<String, Double> revenueByCategory = new HashMap<>();
        orders.forEach(order -> {
            if (order.getItems() != null) {
                order.getItems().forEach(item -> {
                    String category = item.getProduct().getCategory();
                    revenueByCategory.merge(category, item.getSubtotal(), Double::sum);
                });
            }
        });

        return new ReportResponse(
                "SALES_REPORT",
                period,
                totalRevenue,
                totalOrders,
                totalUsers,
                totalProducts,
                topProducts,
                topFarmers,
                ordersByStatus,
                revenueByCategory
        );
    }
}

