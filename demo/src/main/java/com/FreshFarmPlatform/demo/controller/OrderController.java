package com.FreshFarmPlatform.demo.controller;

import com.FreshFarmPlatform.demo.dto.order.CreateOrderRequest;
import com.FreshFarmPlatform.demo.dto.order.OrderResponse;
import com.FreshFarmPlatform.demo.dto.order.UpdateOrderStatusRequest;
import com.FreshFarmPlatform.demo.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        try {
            System.out.println("Received order request: " + request);
            System.out.println("Items count: " + (request.items() != null ? request.items().size() : 0));
            if (request.items() != null) {
                request.items().forEach(item -> 
                    System.out.println("Item: productId=" + item.productId() + ", quantity=" + item.quantity())
                );
            }
            System.out.println("Delivery method: " + request.deliveryMethod());
            System.out.println("Payment method: " + request.paymentMethod());
            return ResponseEntity.ok(orderService.createOrder(request));
        } catch (Exception e) {
            System.err.println("Error in createOrder: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @GetMapping("/me")
    public ResponseEntity<List<OrderResponse>> myOrders() {
        return ResponseEntity.ok(orderService.getMyOrders());
    }

    @GetMapping("/farmer")
    public ResponseEntity<List<OrderResponse>> farmerOrders() {
        return ResponseEntity.ok(orderService.getFarmerOrders());
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(orderService.getOrder(orderId));
    }

    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<OrderResponse> cancelOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(orderService.cancelOrder(orderId));
    }

    @PatchMapping("/{orderId}/status")
    public ResponseEntity<OrderResponse> updateStatus(@PathVariable Long orderId,
                                                      @Valid @RequestBody UpdateOrderStatusRequest request) {
        try {
            System.out.println("Updating order " + orderId + " status to: " + request.status());
            return ResponseEntity.ok(orderService.updateStatus(orderId, request));
        } catch (Exception e) {
            System.err.println("Error updating order status: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}

