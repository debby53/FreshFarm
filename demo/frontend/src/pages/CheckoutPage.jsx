import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../services/client';
import { useAuth } from '../context/AuthContext';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [deliveryMethod, setDeliveryMethod] = useState('PICKUP');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.deliveryAddress || '');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Check if this is a direct order (not from cart)
  const directOrder = location.state?.directOrder;
  const directProduct = location.state?.product;
  const [directQuantity, setDirectQuantity] = useState(location.state?.quantity || 1);
  const selectedItemIds = location.state?.selectedItemIds || null;

  const { data: cart, isLoading: cartLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => (await client.get('/cart')).data,
    enabled: !!user && !directOrder
  });

  // If direct order, set quantity
  useEffect(() => {
    if (directOrder && directQuantity) {
      // Quantity is already set from state
    }
  }, [directOrder, directQuantity]);

  const placeOrder = useMutation({
    mutationFn: (orderData) => {
      console.log('Placing order with data:', orderData);
      return client.post('/orders', orderData);
    },
    onSuccess: (response) => {
      console.log('Order placed successfully:', response.data);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      navigate(`/orders/${response.data.orderId}`, { state: { orderPlaced: true } });
    },
    onError: (error) => {
      console.error('Error placing order:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to place order. Please try again.';
      
      if (error.response?.data) {
        const data = error.response.data;
        // Handle validation errors
        if (data.errors) {
          const errorList = Object.entries(data.errors)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join('\n');
          errorMessage = `Validation errors:\n${errorList}`;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.message) {
          errorMessage = data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    }
  });

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    
    // Validate delivery address for delivery method
    if (deliveryMethod === 'DELIVERY') {
      if (!deliveryAddress || !deliveryAddress.trim()) {
        alert('Please enter a delivery address. Delivery address is required for delivery orders.');
        return;
      }
      if (deliveryAddress.trim().length < 10) {
        alert('Please provide a complete delivery address (at least 10 characters)');
        return;
      }
    }
    
    // Validate payment method
    if (!paymentMethod) {
      alert('Please select a payment method');
      return;
    }

    let orderData;
    
    if (directOrder && directProduct) {
      // Direct order from product page
      if (!directProduct.productId) {
        alert('Invalid product information');
        return;
      }
        // Validate quantity for direct order
        if (directQuantity < 1 || !Number.isInteger(directQuantity)) {
          alert('Quantity must be at least 1');
          return;
        }
        
        if (!directProduct.productId) {
          alert('Invalid product information');
          return;
        }
        
        orderData = {
          items: [{
            productId: Number(directProduct.productId), // Ensure it's a number
            quantity: Number(directQuantity) // Ensure it's a number
          }],
          deliveryMethod: deliveryMethod.toUpperCase(), // Ensure uppercase
          deliveryAddress: deliveryMethod === 'DELIVERY' ? deliveryAddress.trim() : null,
          paymentMethod: paymentMethod.toUpperCase(), // Ensure uppercase
          deliveryNotes: (deliveryNotes && deliveryNotes.trim()) || null
        };
        
        // Validate order data
        if (!orderData.items || orderData.items.length === 0) {
          alert('Order must contain at least one item');
          return;
        }
        
        if (orderData.items.some(item => !item.productId || item.quantity < 1)) {
          alert('Invalid product or quantity');
          return;
        }
    } else {
      // Order from cart
      if (!cart || cart.items.length === 0) {
        alert('Your cart is empty');
        return;
      }
      // Validate cart items
      if (!cart.items || cart.items.length === 0) {
        alert('Your cart is empty');
        return;
      }
      
      // Filter items based on selection if selectedItemIds is provided
      let itemsToOrder = cart.items;
      if (selectedItemIds && selectedItemIds.length > 0) {
        itemsToOrder = cart.items.filter(item => selectedItemIds.includes(item.cartItemId));
        if (itemsToOrder.length === 0) {
          alert('No items selected for order');
          return;
        }
      }
      
      orderData = {
        items: itemsToOrder.map(item => ({
          productId: Number(item.productId), // Ensure it's a number
          quantity: Number(item.quantity) // Ensure it's a number
        })).filter(item => item.productId && item.quantity > 0), // Filter out invalid items
        deliveryMethod: deliveryMethod.toUpperCase(), // Ensure uppercase
        deliveryAddress: deliveryMethod === 'DELIVERY' ? deliveryAddress.trim() : null,
        paymentMethod: paymentMethod.toUpperCase(), // Ensure uppercase
        deliveryNotes: (deliveryNotes && deliveryNotes.trim()) || null
      };
      
      // Validate order data
      if (!orderData.items || orderData.items.length === 0) {
        alert('No valid items in order');
        return;
      }
    }

    if (window.confirm('Place this order?')) {
      placeOrder.mutate(orderData);
    }
  };

  if (!user) {
    return (
      <main className="content">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3>Please login to checkout</h3>
          <button onClick={() => navigate('/login')}>Go to Login</button>
        </div>
      </main>
    );
  }

  if (cartLoading && !directOrder) {
    return (
      <main className="content">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  if (!directOrder && (!cart || cart.items.length === 0)) {
    return (
      <main className="content">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3>Your cart is empty</h3>
          <button onClick={() => navigate('/cart')} style={{ marginTop: '1rem' }}>
            Go to Cart
          </button>
        </div>
      </main>
    );
  }

  // Calculate order summary
  let orderItems;
  if (directOrder && directProduct) {
    orderItems = [{ 
      productId: directProduct.productId, 
      productName: directProduct.productName,
      price: directProduct.price,
      imageUrl: directProduct.imageUrl,
      category: directProduct.category,
      unit: directProduct.unit,
      quantity: directQuantity,
      subtotal: (directProduct.price || 0) * directQuantity
    }];
  } else if (selectedItemIds && selectedItemIds.length > 0) {
    // Show only selected items
    orderItems = (cart?.items || []).filter(item => selectedItemIds.includes(item.cartItemId));
  } else {
    // Show all cart items (fallback)
    orderItems = cart?.items || [];
  }
  
  const totalAmount = orderItems.reduce((sum, item) => sum + (item.subtotal || (item.price * item.quantity)), 0);

  return (
    <main className="content">
      <h2>Checkout</h2>
      
      <form onSubmit={handlePlaceOrder} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div>
          {directOrder && directProduct && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <h3 style={{ marginTop: 0 }}>Product Details</h3>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {directProduct.imageUrl && (
                  <img
                    src={directProduct.imageUrl}
                    alt={directProduct.productName}
                    style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0 }}>{directProduct.productName}</h4>
                  <p style={{ margin: '0.25rem 0', color: '#64748b' }}>
                    {directProduct.category} • ${directProduct.price?.toFixed(2)} per {directProduct.unit ?? 'unit'}
                  </p>
                </div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Quantity *
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setDirectQuantity(Math.max(1, directQuantity - 1))}
                    style={{ padding: '0.5rem 1rem', background: '#e2e8f0' }}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={directQuantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setDirectQuantity(Math.max(1, val));
                    }}
                    style={{ width: '80px', textAlign: 'center', padding: '0.5rem' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setDirectQuantity(directQuantity + 1)}
                    style={{ padding: '0.5rem 1rem', background: '#e2e8f0' }}
                  >
                    +
                  </button>
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>
                  Subtotal: <strong>${((directProduct.price || 0) * directQuantity).toFixed(2)}</strong>
                </div>
              </div>
            </div>
          )}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ marginTop: 0 }}>Delivery Method *</h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', cursor: 'pointer' }}>
              <input
                type="radio"
                value="PICKUP"
                checked={deliveryMethod === 'PICKUP'}
                onChange={(e) => setDeliveryMethod(e.target.value)}
              />
              <span>Pickup from Farmer</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                value="DELIVERY"
                checked={deliveryMethod === 'DELIVERY'}
                onChange={(e) => setDeliveryMethod(e.target.value)}
              />
              <span>Home Delivery</span>
            </label>
          </div>

          {deliveryMethod === 'DELIVERY' && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <h3 style={{ marginTop: 0 }}>Delivery Address *</h3>
              <textarea
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Enter your complete delivery address (required for delivery orders)"
                required={deliveryMethod === 'DELIVERY'}
                rows={4}
                style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <small style={{ color: '#64748b', display: 'block', marginTop: '0.5rem' }}>
                Please provide a complete address including street, city, and any landmarks
              </small>
            </div>
          )}

          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ marginTop: 0 }}>Payment Method</h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', cursor: 'pointer' }}>
              <input
                type="radio"
                value="CASH"
                checked={paymentMethod === 'CASH'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span>Cash on Delivery</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', cursor: 'pointer' }}>
              <input
                type="radio"
                value="MOBILE_MONEY"
                checked={paymentMethod === 'MOBILE_MONEY'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span>Mobile Money</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                value="BANK_TRANSFER"
                checked={paymentMethod === 'BANK_TRANSFER'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span>Bank Transfer</span>
            </label>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Delivery Notes (Optional)</h3>
            <textarea
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="Any special instructions for delivery..."
              rows={3}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid #e2e8f0' }}
            />
          </div>
        </div>

        <div className="card" style={{ height: 'fit-content', position: 'sticky', top: '1rem' }}>
          <h3 style={{ marginTop: 0 }}>Order Summary</h3>
          <div style={{ marginBottom: '1rem' }}>
            {orderItems.map((item, index) => (
              <div key={item.cartItemId || index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <span>{item.productName} × {item.quantity}</span>
                <span>${(item.subtotal || (item.price * item.quantity))?.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <strong>Total:</strong>
              <strong style={{ fontSize: '1.25rem', color: '#16a34a' }}>${totalAmount.toFixed(2)}</strong>
            </div>
            <button
              type="submit"
              disabled={placeOrder.isPending}
              style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', fontWeight: 'bold' }}
            >
              {placeOrder.isPending ? 'Placing Order...' : 'Place Order'}
            </button>
            <button
              type="button"
              onClick={() => navigate(directOrder ? '/marketplace' : '/cart')}
              style={{ width: '100%', marginTop: '0.5rem', background: '#e2e8f0', color: '#0f172a' }}
            >
              {directOrder ? 'Back to Marketplace' : 'Back to Cart'}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
};

export default CheckoutPage;

