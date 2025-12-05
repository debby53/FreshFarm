package com.FreshFarmPlatform.demo.service;

import com.FreshFarmPlatform.demo.dto.order.CreateOrderRequest;
import com.FreshFarmPlatform.demo.dto.order.OrderItemRequest;
import com.FreshFarmPlatform.demo.dto.order.OrderItemResponse;
import com.FreshFarmPlatform.demo.dto.order.OrderResponse;
import com.FreshFarmPlatform.demo.dto.order.UpdateOrderStatusRequest;
import com.FreshFarmPlatform.demo.exception.BadRequestException;
import com.FreshFarmPlatform.demo.exception.ResourceNotFoundException;
import com.FreshFarmPlatform.demo.model.order.Order;
import com.FreshFarmPlatform.demo.model.order.OrderItem;
import com.FreshFarmPlatform.demo.model.order.OrderStatus;
import com.FreshFarmPlatform.demo.model.product.Product;
import com.FreshFarmPlatform.demo.model.transaction.Transaction;
import com.FreshFarmPlatform.demo.model.user.Buyer;
import com.FreshFarmPlatform.demo.model.user.Farmer;
import com.FreshFarmPlatform.demo.model.user.User;
import com.FreshFarmPlatform.demo.model.user.UserType;
import com.FreshFarmPlatform.demo.repository.OrderRepository;
import com.FreshFarmPlatform.demo.repository.ProductRepository;
import com.FreshFarmPlatform.demo.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final TransactionRepository transactionRepository;
    private final UserService userService;

    public OrderService(OrderRepository orderRepository,
                        ProductRepository productRepository,
                        TransactionRepository transactionRepository,
                        UserService userService) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.transactionRepository = transactionRepository;
        this.userService = userService;
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        User current = userService.getCurrentUser();
        if (current.getUserType() != UserType.BUYER) {
            throw new BadRequestException("Only buyers can place orders");
        }
        if (request.items() == null || request.items().isEmpty()) {
            throw new BadRequestException("Order must contain at least one item");
        }
        Buyer buyer = (Buyer) current;
        Order order = Order.builder()
                .buyer(buyer)
                .deliveryMethod(request.deliveryMethod())
                .deliveryAddress(request.deliveryAddress() != null ? request.deliveryAddress() : buyer.getDeliveryAddress())
                .deliveryNotes(request.deliveryNotes())
                .status(OrderStatus.PENDING)
                .items(new ArrayList<>())
                .build();
        double total = 0.0;
        for (OrderItemRequest itemRequest : request.items()) {
            Product product = productRepository.findById(itemRequest.productId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
            int available = product.getQuantity() == null ? 0 : product.getQuantity();
            if (available < itemRequest.quantity()) {
                throw new BadRequestException("Insufficient stock for " + product.getProductName());
            }
            product.setQuantity(available - itemRequest.quantity());
            productRepository.save(product);
            double subtotal = product.getPrice() * itemRequest.quantity();
            total += subtotal;
            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(itemRequest.quantity())
                    .priceAtOrder(product.getPrice())
                    .subtotal(subtotal)
                    .build();
            order.getItems().add(orderItem);
        }
        order.setTotalAmount(total);
        Order savedOrder = orderRepository.save(order);
        Transaction transaction = Transaction.builder()
                .order(savedOrder)
                .amount(total)
                .paymentMethod(request.paymentMethod())
                .status("PROCESSING")
                .build();
        transactionRepository.save(transaction);
        savedOrder.setTransaction(transaction);
        orderRepository.save(savedOrder);
        return toResponse(savedOrder);
    }

    public List<OrderResponse> getMyOrders() {
        User current = userService.getCurrentUser();
        if (current.getUserType() != UserType.BUYER) {
            throw new BadRequestException("Only buyers can view their orders");
        }
        return orderRepository.findByBuyer((Buyer) current).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<OrderResponse> getFarmerOrders() {
        User current = userService.getCurrentUser();
        if (current.getUserType() != UserType.FARMER) {
            throw new BadRequestException("Only farmers can view farmer orders");
        }
        Farmer farmer = (Farmer) current;
        return orderRepository.findAll().stream()
                .filter(order -> order.getItems().stream()
                        .anyMatch(item -> item.getProduct().getFarmer().getUserId().equals(farmer.getUserId())))
                .map(this::toResponse)
                .toList();
    }

    public OrderResponse getOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        User current = userService.getCurrentUser();
        // Check if user has access to this order
        if (current.getUserType() == UserType.BUYER && !order.getBuyer().getUserId().equals(current.getUserId())) {
            throw new BadRequestException("You cannot view this order");
        }
        if (current.getUserType() == UserType.FARMER && order.getItems().stream()
                .noneMatch(item -> item.getProduct().getFarmer().getUserId().equals(current.getUserId()))) {
            throw new BadRequestException("You cannot view this order");
        }
        return toResponse(order);
    }

    @Transactional
    public OrderResponse cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        User current = userService.getCurrentUser();
        if (current.getUserType() != UserType.BUYER || !order.getBuyer().getUserId().equals(current.getUserId())) {
            throw new BadRequestException("Only the buyer can cancel their order");
        }
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new BadRequestException("Only pending orders can be cancelled");
        }
        // Restore product quantities
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            product.setQuantity((product.getQuantity() == null ? 0 : product.getQuantity()) + item.getQuantity());
            productRepository.save(product);
        }
        order.setStatus(OrderStatus.CANCELLED);
        return toResponse(orderRepository.save(order));
    }

    @Transactional
    public OrderResponse updateStatus(Long orderId, UpdateOrderStatusRequest request) {
        // Fetch order with items eagerly loaded to avoid lazy loading issues
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        User current = userService.getCurrentUser();
        
        boolean canUpdate = false;
        if (current.getUserType() == UserType.ADMIN) {
            canUpdate = true;
        } else if (current.getUserType() == UserType.FARMER) {
            canUpdate = order.getItems() != null && order.getItems().stream()
                    .anyMatch(item -> item.getProduct() != null && 
                            item.getProduct().getFarmer() != null &&
                            item.getProduct().getFarmer().getUserId().equals(current.getUserId()));
        }
        
        if (!canUpdate) {
            throw new BadRequestException("You cannot update this order. Only the farmer who owns the products in this order can update it.");
        }
        
        System.out.println("Updating order " + orderId + " from " + order.getStatus() + " to " + request.status());
        order.setStatus(request.status());
        if (request.status() == OrderStatus.DELIVERED) {
            order.setDeliveryDate(java.time.LocalDateTime.now());
        }
        Order saved = orderRepository.save(order);
        System.out.println("Order status updated successfully to: " + saved.getStatus());
        return toResponse(saved);
    }

    private OrderResponse toResponse(Order order) {
        List<OrderItemResponse> items = order.getItems().stream()
                .map(item -> new OrderItemResponse(
                        item.getOrderItemId(),
                        item.getProduct().getProductId(),
                        item.getProduct().getProductName(),
                        item.getProduct().getCategory(),
                        item.getProduct().getImageUrl(),
                        item.getProduct().getUnit(),
                        item.getQuantity(),
                        item.getPriceAtOrder(),
                        item.getSubtotal()
                )).toList();
        
        Long farmerId = null;
        if (!order.getItems().isEmpty()) {
            farmerId = order.getItems().get(0).getProduct().getFarmer().getUserId();
        }
        
        String paymentMethod = null;
        if (order.getTransaction() != null) {
            paymentMethod = order.getTransaction().getPaymentMethod();
        }
        
        return new OrderResponse(
                order.getOrderId(),
                order.getOrderDate(),
                order.getTotalAmount(),
                order.getDeliveryMethod(),
                order.getDeliveryAddress(),
                order.getStatus(),
                order.getDeliveryDate(),
                items,
                paymentMethod,
                order.getDeliveryNotes(),
                farmerId
        );
    }
}

