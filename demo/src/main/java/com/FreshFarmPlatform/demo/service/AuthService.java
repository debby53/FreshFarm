package com.FreshFarmPlatform.demo.service;

import com.FreshFarmPlatform.demo.config.JwtService;
import com.FreshFarmPlatform.demo.dto.auth.*;
import com.FreshFarmPlatform.demo.exception.BadRequestException;
import com.FreshFarmPlatform.demo.model.cart.Cart;
import com.FreshFarmPlatform.demo.model.user.*;
import com.FreshFarmPlatform.demo.repository.BuyerRepository;
import com.FreshFarmPlatform.demo.repository.CartRepository;
import com.FreshFarmPlatform.demo.repository.FarmerRepository;
import com.FreshFarmPlatform.demo.repository.UserRepository;
import com.FreshFarmPlatform.demo.security.PlatformUserDetails;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final FarmerRepository farmerRepository;
    private final BuyerRepository buyerRepository;
    private final CartRepository cartRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       FarmerRepository farmerRepository,
                       BuyerRepository buyerRepository,
                       CartRepository cartRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.farmerRepository = farmerRepository;
        this.buyerRepository = buyerRepository;
        this.cartRepository = cartRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse registerFarmer(RegisterFarmerRequest request) {
        validateUniqueUser(request.username(), request.email());
        Farmer farmer = Farmer.builder()
                .username(request.username())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .phone(request.phone())
                .address(request.address())
                .userType(UserType.FARMER)
                .farmName(request.farmName())
                .location(request.location())
                .description(request.description())
                .rating(0.0)
                .build();
        Farmer saved = farmerRepository.save(farmer);
        return buildAuthResponse(saved);
    }

    @Transactional
    public AuthResponse registerBuyer(RegisterBuyerRequest request) {
        validateUniqueUser(request.username(), request.email());
        Buyer buyer = Buyer.builder()
                .username(request.username())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .phone(request.phone())
                .address(request.address())
                .userType(UserType.BUYER)
                .deliveryAddress(request.deliveryAddress())
                .preferredPayment(request.preferredPayment())
                .build();
        Buyer saved = buyerRepository.save(buyer);
        Cart cart = Cart.builder()
                .buyer(saved)
                .totalAmount(0.0)
                .build();
        cartRepository.save(cart);
        return buildAuthResponse(saved);
    }

    @Transactional
    public AuthResponse registerAdmin(RegisterAdminRequest request) {
        validateUniqueUser(request.username(), request.email());
        Admin admin = Admin.builder()
                .username(request.username())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .phone(request.phone())
                .address(request.address())
                .userType(UserType.ADMIN)
                .role(request.role())
                .build();
        Admin saved = userRepository.save(admin);
        return buildAuthResponse(saved);
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );
        PlatformUserDetails principal = (PlatformUserDetails) authentication.getPrincipal();
        return buildTokenResponse(principal.getUser());
    }

    private void validateUniqueUser(String username, String email) {
        if (userRepository.existsByUsername(username)) {
            throw new BadRequestException("Username already taken");
        }
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email already registered");
        }
    }

    private AuthResponse buildAuthResponse(User user) {
        return buildTokenResponse(user);
    }

    private AuthResponse buildTokenResponse(User user) {
        String token = jwtService.generateToken(new com.FreshFarmPlatform.demo.security.PlatformUserDetails(user));
        UserSummary summary = new UserSummary(user.getUserId(), user.getUsername(), user.getEmail(), user.getUserType());
        return new AuthResponse(token, summary);
    }
}

