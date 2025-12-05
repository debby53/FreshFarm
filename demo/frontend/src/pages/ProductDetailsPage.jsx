import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../services/client';
import { useAuth } from '../context/AuthContext';

const ProductDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data } = await client.get(`/products`);
      const found = data.find(p => (p.id ?? p.productId) == id);
      if (!found) throw new Error('Product not found');
      return found;
    },
    enabled: !!id
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews', id],
    queryFn: async () => {
      const { data } = await client.get(`/reviews/product/${id}`);
      return data;
    },
    enabled: !!id
  });

  const createReview = useMutation({
    mutationFn: (reviewData) => client.post('/reviews', reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', id] });
      setShowReviewForm(false);
      setReviewComment('');
      setReviewRating(5);
      alert('Review submitted successfully!');
    },
    onError: (error) => {
      console.error('Error creating review:', error);
      alert(error.response?.data?.error || 'Failed to submit review. Please try again.');
    }
  });

  const handleSubmitReview = () => {
    if (!user) {
      alert('Please login to submit a review');
      navigate('/login');
      return;
    }
    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      alert('Please select a rating between 1 and 5');
      return;
    }
    createReview.mutate({
      productId: Number(id),
      rating: reviewRating,
      comment: reviewComment.trim() || null
    });
  };

  // Calculate average rating
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;
  
  // Check if current user has already reviewed
  const userReview = user ? reviews.find(r => r.buyerId === user.userId) : null;

  const addToCart = useMutation({
    mutationFn: (qty) => client.post('/cart/items', { productId: id, quantity: qty }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      alert('Added to cart!');
    },
    onError: (error) => {
      console.error('Error adding to cart:', error);
      alert('Failed to add to cart. Please try again.');
    }
  });

  const handleAddToCart = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (quantity > product.quantity) {
      alert(`Only ${product.quantity} ${product.unit ?? 'units'} available`);
      return;
    }
    addToCart.mutate(quantity);
  };

  if (isLoading) {
    return (
      <main className="content">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading product details...</p>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="content">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3>Product not found</h3>
          <button onClick={() => navigate('/marketplace')} style={{ marginTop: '1rem' }}>
            Back to Marketplace
          </button>
        </div>
      </main>
    );
  }

  const canAdd = product.status === 'IN_STOCK' && product.quantity > 0;

  return (
    <main className="content">
      <button onClick={() => navigate(-1)} style={{ marginBottom: '1rem', background: '#e2e8f0' }}>
        ← Back
      </button>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div className="card">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.productName}
              style={{ width: '100%', borderRadius: 12, marginBottom: '1rem' }}
            />
          ) : (
            <div style={{ width: '100%', height: 400, background: '#f1f5f9', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <p style={{ color: '#94a3b8' }}>No image available</p>
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ marginBottom: '1rem' }}>
            <span
              style={{
                background: product.status === 'IN_STOCK' ? '#dcfce7' : product.status === 'SOLD' ? '#fee2e2' : '#fff7ed',
                color: product.status === 'IN_STOCK' ? '#166534' : product.status === 'SOLD' ? '#b91c1c' : '#92400e',
                fontSize: '0.75rem',
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                fontWeight: 'bold',
                display: 'inline-block',
                marginBottom: '0.5rem'
              }}
            >
              {product.status?.replace('_', ' ') ?? 'IN STOCK'}
            </span>
            <h1 style={{ margin: '0.5rem 0' }}>{product.productName}</h1>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a', margin: '0.5rem 0' }}>
              ${product.price?.toFixed(2)} per {product.unit ?? 'unit'}
            </p>
            <p style={{ color: '#64748b', margin: '0.5rem 0' }}>
              {product.category} • {product.quantity} {product.unit ?? 'units'} available
            </p>
            {averageRating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>⭐ {averageRating}</span>
                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: 8 }}>
            <h3 style={{ marginTop: 0 }}>Description</h3>
            <p style={{ color: '#475569', lineHeight: '1.6' }}>
              {product.description || 'No description provided.'}
            </p>
          </div>

          {product.postedDate && (
            <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#64748b' }}>
              Posted: {new Date(product.postedDate).toLocaleDateString()}
            </div>
          )}

          {canAdd && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Quantity
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ padding: '0.5rem 1rem', background: '#e2e8f0' }}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={product.quantity}
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setQuantity(Math.min(Math.max(1, val), product.quantity));
                  }}
                  style={{ width: '80px', textAlign: 'center', padding: '0.5rem' }}
                />
                <button
                  onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                  style={{ padding: '0.5rem 1rem', background: '#e2e8f0' }}
                >
                  +
                </button>
                <span style={{ marginLeft: '1rem', color: '#64748b' }}>
                  Max: {product.quantity}
                </span>
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>
                Subtotal: <strong>${(product.price * quantity).toFixed(2)}</strong>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {canAdd && (
              <>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={handleAddToCart}
                    disabled={addToCart.isPending}
                    style={{ flex: 1, padding: '0.75rem', fontSize: '1rem', background: '#e2e8f0', color: '#0f172a' }}
                  >
                    {addToCart.isPending ? 'Adding...' : 'Add to Cart'}
                  </button>
                  <button
                    onClick={() => navigate('/checkout', { 
                      state: { 
                        directOrder: true,
                        product: {
                          productId: product.id ?? product.productId,
                          productName: product.productName,
                          price: product.price,
                          imageUrl: product.imageUrl,
                          category: product.category,
                          unit: product.unit
                        },
                        quantity: quantity
                      }
                    })}
                    style={{ flex: 1, padding: '0.75rem', fontSize: '1rem', fontWeight: 'bold' }}
                  >
                    Order Now
                  </button>
                </div>
                <button
                  onClick={() => navigate(`/messages/${product.farmerId}`)}
                  style={{ width: '100%', padding: '0.75rem', background: '#e2e8f0', color: '#0f172a' }}
                >
                  Message Farmer
                </button>
              </>
            )}
            {!canAdd && (
              <button
                onClick={() => navigate(`/messages/${product.farmerId}`)}
                style={{ width: '100%', padding: '0.75rem', background: '#e2e8f0', color: '#0f172a' }}
              >
                Message Farmer
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Farmer Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <strong>Farmer Name:</strong>
            <p style={{ margin: '0.5rem 0', color: '#64748b' }}>{product.farmerName || 'N/A'}</p>
          </div>
          {product.farmerLocation && (
            <div>
              <strong>Location:</strong>
              <p style={{ margin: '0.5rem 0', color: '#64748b' }}>{product.farmerLocation}</p>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Reviews</h3>
          {user && user.userType === 'BUYER' && !userReview && !showReviewForm && (
            <button
              onClick={() => setShowReviewForm(true)}
              style={{ padding: '0.5rem 1rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}
            >
              Write a Review
            </button>
          )}
        </div>

        {averageRating && (
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>{averageRating}</span>
              <div>
                <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.25rem' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span key={star} style={{ fontSize: '1.2rem', color: star <= Math.round(averageRating) ? '#fbbf24' : '#e5e7eb' }}>
                      ⭐
                    </span>
                  ))}
                </div>
                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                </span>
              </div>
            </div>
          </div>
        )}

        {showReviewForm && user && user.userType === 'BUYER' && (
          <div className="card" style={{ marginBottom: '1.5rem', background: '#f8fafc' }}>
            <h4 style={{ marginTop: 0 }}>Write a Review</h4>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Rating *
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    style={{
                      fontSize: '1.5rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: star <= reviewRating ? '#fbbf24' : '#e5e7eb',
                      padding: 0
                    }}
                  >
                    ⭐
                  </button>
                ))}
                <span style={{ marginLeft: '0.5rem', color: '#64748b' }}>{reviewRating} / 5</span>
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Comment (Optional)
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience with this product..."
                rows={4}
                style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleSubmitReview}
                disabled={createReview.isPending}
                style={{ padding: '0.5rem 1rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}
              >
                {createReview.isPending ? 'Submitting...' : 'Submit Review'}
              </button>
              <button
                onClick={() => {
                  setShowReviewForm(false);
                  setReviewComment('');
                  setReviewRating(5);
                }}
                style={{ padding: '0.5rem 1rem', background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: 8, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {userReview && (
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <strong>Your Review</strong>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <span key={star} style={{ color: star <= userReview.rating ? '#fbbf24' : '#e5e7eb' }}>⭐</span>
                ))}
              </div>
            </div>
            {userReview.comment && (
              <p style={{ margin: '0.5rem 0 0 0', color: '#475569' }}>{userReview.comment}</p>
            )}
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              {new Date(userReview.reviewDate).toLocaleDateString()}
            </p>
          </div>
        )}

        {reviewsLoading ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>No reviews yet. Be the first to review this product!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reviews.map((review) => (
              <div key={review.reviewId} style={{ padding: '1rem', background: '#f8fafc', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <strong>User #{review.buyerId}</strong>
                    <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} style={{ color: star <= review.rating ? '#fbbf24' : '#e5e7eb' }}>⭐</span>
                      ))}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    {new Date(review.reviewDate).toLocaleDateString()}
                  </span>
                </div>
                {review.comment && (
                  <p style={{ margin: '0.5rem 0 0 0', color: '#475569', lineHeight: '1.6' }}>{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default ProductDetailsPage;

