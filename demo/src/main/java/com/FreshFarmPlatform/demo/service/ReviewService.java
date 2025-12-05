package com.FreshFarmPlatform.demo.service;

import com.FreshFarmPlatform.demo.dto.review.ReviewRequest;
import com.FreshFarmPlatform.demo.dto.review.ReviewResponse;
import com.FreshFarmPlatform.demo.exception.BadRequestException;
import com.FreshFarmPlatform.demo.exception.ResourceNotFoundException;
import com.FreshFarmPlatform.demo.model.product.Product;
import com.FreshFarmPlatform.demo.model.review.Review;
import com.FreshFarmPlatform.demo.model.user.Admin;
import com.FreshFarmPlatform.demo.model.user.Buyer;
import com.FreshFarmPlatform.demo.model.user.User;
import com.FreshFarmPlatform.demo.model.user.UserType;
import com.FreshFarmPlatform.demo.repository.ProductRepository;
import com.FreshFarmPlatform.demo.repository.ReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserService userService;

    public ReviewService(ReviewRepository reviewRepository,
                         ProductRepository productRepository,
                         UserService userService) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.userService = userService;
    }

    @Transactional
    public ReviewResponse createReview(ReviewRequest request) {
        User user = userService.getCurrentUser();
        if (user.getUserType() != UserType.BUYER) {
            throw new BadRequestException("Only buyers can review products");
        }
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        Review review = Review.builder()
                .buyer((Buyer) user)
                .product(product)
                .rating(request.rating())
                .comment(request.comment())
                .build();
        return toResponse(reviewRepository.save(review));
    }

    @Transactional
    public ReviewResponse updateReview(Long reviewId, ReviewRequest request) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        User user = userService.getCurrentUser();
        if (!review.getBuyer().getUserId().equals(user.getUserId())) {
            throw new BadRequestException("You can update only your reviews");
        }
        review.setRating(request.rating());
        review.setComment(request.comment());
        return toResponse(reviewRepository.save(review));
    }

    @Transactional
    public void deleteReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        User user = userService.getCurrentUser();
        if (!review.getBuyer().getUserId().equals(user.getUserId()) && user.getUserType() != UserType.ADMIN) {
            throw new BadRequestException("You cannot delete this review");
        }
        if (user.getUserType() == UserType.ADMIN) {
            review.setModeratedBy((Admin) user);
        }
        reviewRepository.delete(review);
    }

    public List<ReviewResponse> productReviews(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        return reviewRepository.findByProduct(product).stream()
                .map(this::toResponse)
                .toList();
    }

    private ReviewResponse toResponse(Review review) {
        return new ReviewResponse(
                review.getReviewId(),
                review.getProduct().getProductId(),
                review.getBuyer().getUserId(),
                review.getRating(),
                review.getComment(),
                review.getReviewDate()
        );
    }
}

