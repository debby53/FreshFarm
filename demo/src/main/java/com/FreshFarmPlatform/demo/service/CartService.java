package com.FreshFarmPlatform.demo.service;

import com.FreshFarmPlatform.demo.dto.cart.AddToCartRequest;
import com.FreshFarmPlatform.demo.dto.cart.CartItemResponse;
import com.FreshFarmPlatform.demo.dto.cart.CartResponse;
import com.FreshFarmPlatform.demo.dto.cart.UpdateCartItemRequest;
import com.FreshFarmPlatform.demo.exception.BadRequestException;
import com.FreshFarmPlatform.demo.exception.ResourceNotFoundException;
import com.FreshFarmPlatform.demo.model.cart.Cart;
import com.FreshFarmPlatform.demo.model.cart.CartItem;
import com.FreshFarmPlatform.demo.model.product.Product;
import com.FreshFarmPlatform.demo.model.user.Buyer;
import com.FreshFarmPlatform.demo.model.user.User;
import com.FreshFarmPlatform.demo.model.user.UserType;
import com.FreshFarmPlatform.demo.repository.CartItemRepository;
import com.FreshFarmPlatform.demo.repository.CartRepository;
import com.FreshFarmPlatform.demo.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserService userService;

    public CartService(CartRepository cartRepository,
                       CartItemRepository cartItemRepository,
                       ProductRepository productRepository,
                       UserService userService) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public CartResponse getCurrentCart() {
        Cart cart = getBuyerCart();
        return toResponse(cart);
    }

    @Transactional
    public CartResponse addItem(AddToCartRequest request) {
        Cart cart = getBuyerCart();
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        if (!Boolean.TRUE.equals(product.getAvailable())) {
            throw new BadRequestException("Product is not available");
        }
        CartItem item = cart.getItems().stream()
                .filter(ci -> ci.getProduct().getProductId().equals(product.getProductId()))
                .findFirst()
                .orElseGet(() -> {
                    CartItem newItem = CartItem.builder()
                            .cart(cart)
                            .product(product)
                            .quantity(0)
                            .subtotal(0.0)
                            .build();
                    cart.getItems().add(newItem);
                    return newItem;
                });
        item.setQuantity(item.getQuantity() + request.quantity());
        item.setSubtotal(item.getQuantity() * product.getPrice());
        cartItemRepository.save(item);
        recalculateTotal(cart);
        return toResponse(cartRepository.save(cart));
    }

    @Transactional
    public CartResponse updateQuantity(UpdateCartItemRequest request) {
        Cart cart = getBuyerCart();
        CartItem item = cart.getItems().stream()
                .filter(ci -> ci.getCartItemId().equals(request.cartItemId()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));
        if (request.quantity() <= 0) {
            cart.getItems().remove(item);
            cartItemRepository.delete(item);
        } else {
            item.setQuantity(request.quantity());
            item.setSubtotal(item.getQuantity() * item.getProduct().getPrice());
            cartItemRepository.save(item);
        }
        recalculateTotal(cart);
        return toResponse(cartRepository.save(cart));
    }

    @Transactional
    public CartResponse removeItem(Long cartItemId) {
        Cart cart = getBuyerCart();
        CartItem item = cart.getItems().stream()
                .filter(ci -> ci.getCartItemId().equals(cartItemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));
        cart.getItems().remove(item);
        cartItemRepository.delete(item);
        recalculateTotal(cart);
        return toResponse(cartRepository.save(cart));
    }

    @Transactional
    public CartResponse clearCart() {
        Cart cart = getBuyerCart();
        cart.getItems().clear();
        cart.setTotalAmount(0.0);
        return toResponse(cartRepository.save(cart));
    }

    private Cart getBuyerCart() {
        User user = userService.getCurrentUser();
        if (user.getUserType() != UserType.BUYER) {
            throw new BadRequestException("Only buyers have carts");
        }
        Buyer buyer = (Buyer) user;
        return cartRepository.findByBuyer(buyer)
                .orElseGet(() -> cartRepository.save(Cart.builder()
                        .buyer(buyer)
                        .totalAmount(0.0)
                        .build()));
    }

    private void recalculateTotal(Cart cart) {
        double total = cart.getItems().stream()
                .mapToDouble(CartItem::getSubtotal)
                .sum();
        cart.setTotalAmount(total);
    }

    private CartResponse toResponse(Cart cart) {
        List<CartItemResponse> items = cart.getItems().stream()
                .map(item -> new CartItemResponse(
                        item.getCartItemId(),
                        item.getProduct().getProductId(),
                        item.getProduct().getProductName(),
                        item.getQuantity(),
                        item.getProduct().getPrice(),
                        item.getSubtotal(),
                        item.getProduct().getImageUrl(),
                        item.getProduct().getCategory(),
                        item.getProduct().getUnit(),
                        item.getProduct().getQuantity()
                )).toList();
        return new CartResponse(cart.getCartId(), cart.getCreatedDate(), cart.getTotalAmount(), items);
    }
}

