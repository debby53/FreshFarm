package com.FreshFarmPlatform.demo.service;

import com.FreshFarmPlatform.demo.dto.auth.UserSummary;
import com.FreshFarmPlatform.demo.dto.user.ChangePasswordRequest;
import com.FreshFarmPlatform.demo.dto.user.UpdateProfileRequest;
import com.FreshFarmPlatform.demo.dto.user.UserProfileResponse;
import com.FreshFarmPlatform.demo.exception.BadRequestException;
import com.FreshFarmPlatform.demo.exception.ResourceNotFoundException;
import com.FreshFarmPlatform.demo.model.user.User;
import com.FreshFarmPlatform.demo.repository.UserRepository;
import com.FreshFarmPlatform.demo.security.PlatformUserDetails;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserSummary getCurrentProfile() {
        User current = getCurrentUser();
        return new UserSummary(current.getUserId(), current.getUsername(), current.getEmail(), current.getUserType());
    }

    public UserProfileResponse getFullProfile() {
        User current = getCurrentUser();
        return new UserProfileResponse(
                current.getUserId(),
                current.getUsername(),
                current.getEmail(),
                current.getPhone(),
                current.getAddress(),
                current.getUserType(),
                current.getRegisteredDate()
        );
    }

    @Transactional
    public UserSummary updateProfile(UpdateProfileRequest request) {
        User user = getCurrentUser();
        if (request.username() != null && !request.username().equals(user.getUsername())) {
            if (userRepository.existsByUsername(request.username())) {
                throw new BadRequestException("Username already taken");
            }
            user.setUsername(request.username());
        }
        if (request.phone() != null) {
            user.setPhone(request.phone());
        }
        if (request.address() != null) {
            user.setAddress(request.address());
        }
        User saved = userRepository.save(user);
        return new UserSummary(saved.getUserId(), saved.getUsername(), saved.getEmail(), saved.getUserType());
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User user = getCurrentUser();
        
        // Verify current password
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }
        
        // Check if new password is different
        if (passwordEncoder.matches(request.newPassword(), user.getPassword())) {
            throw new BadRequestException("New password must be different from current password");
        }
        
        // Update password
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void deleteAccount() {
        User user = getCurrentUser();
        userRepository.delete(user);
    }

    public User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof PlatformUserDetails platformUserDetails) {
            return platformUserDetails.getUser();
        }
        throw new ResourceNotFoundException("No authenticated user found");
    }
}

