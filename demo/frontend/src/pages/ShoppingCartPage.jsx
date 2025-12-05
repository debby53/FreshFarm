import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../services/client';
import { useAuth } from '../context/AuthContext';

const ShoppingCartPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedItems, setSelectedItems] = useState(new Set());

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => (await client.get('/cart')).data,
    enabled: !!user
  });

  const updateQuantity = useMutation({
    mutationFn: ({ cartItemId, quantity }) => client.patch('/cart/items', { cartItemId, quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    }
  });

  const removeItem = useMutation({
    mutationFn: (cartItemId) => client.delete(`/cart/items/${cartItemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    }
  });

  const clearCart = useMutation({
    mutationFn: () => client.delete('/cart'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      alert('Cart cleared!');
    }
  });

  const handleQuantityChange = (item, newQuantity) => {
    if (newQuantity < 1) {
      if (window.confirm('Remove this item from cart?')) {
        removeItem.mutate(item.cartItemId);
        // Remove from selection if it was selected
        const newSelected = new Set(selectedItems);
        newSelected.delete(item.cartItemId);
        setSelectedItems(newSelected);
      }
      return;
    }
    if (newQuantity > item.availableQuantity) {
      alert(`Only ${item.availableQuantity} available`);
      return;
    }
    updateQuantity.mutate({ cartItemId: item.cartItemId, quantity: newQuantity });
  };

  const handleItemSelect = (cartItemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(cartItemId)) {
      newSelected.delete(cartItemId);
    } else {
      newSelected.add(cartItemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (!cart || !cart.items) return;
    if (selectedItems.size === cart.items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cart.items.map(item => item.cartItemId)));
    }
  };

  const handleProceedToCheckout = () => {
    if (selectedItems.size === 0) {
      alert('Please select at least one item to proceed to checkout');
      return;
    }
    navigate('/checkout', { state: { selectedItemIds: Array.from(selectedItems) } });
  };

  // Calculate totals for selected items only
  const selectedCartItems = cart?.items?.filter(item => selectedItems.has(item.cartItemId)) || [];
  const selectedTotal = selectedCartItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);

  if (!user) {
    return (
      <main className="content">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3>Please login to view your cart</h3>
          <button onClick={() => navigate('/login')} style={{ marginTop: '1rem' }}>
            Go to Login
          </button>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="content">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading cart...</p>
        </div>
      </main>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <main className="content">
        <h2>Shopping Cart</h2>
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3 style={{ color: '#64748b', marginBottom: '0.5rem' }}>Your cart is empty</h3>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>Add some products to get started!</p>
          <button onClick={() => navigate('/marketplace')}>
            Browse Products
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Shopping Cart</h2>
        <button onClick={() => navigate('/marketplace')} style={{ background: '#e2e8f0' }}>
          Continue Shopping
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div>
          {cart.items.length > 0 && (
            <div className="card" style={{ marginBottom: '1rem', padding: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={cart.items.length > 0 && selectedItems.size === cart.items.length}
                  onChange={handleSelectAll}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <strong>Select All ({cart.items.length} items)</strong>
              </label>
            </div>
          )}
          {cart.items.map((item) => (
            <div key={item.cartItemId} className="card" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', paddingTop: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={selectedItems.has(item.cartItemId)}
                  onChange={() => handleItemSelect(item.cartItemId)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.productName}
                  style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8 }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <h3 style={{ margin: 0, marginBottom: '0.25rem' }}>{item.productName}</h3>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                      {item.category} • ${item.price?.toFixed(2)} per {item.unit ?? 'unit'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('Remove this item?')) {
                        removeItem.mutate(item.cartItemId);
                        const newSelected = new Set(selectedItems);
                        newSelected.delete(item.cartItemId);
                        setSelectedItems(newSelected);
                      }
                    }}
                    style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                    disabled={removeItem.isPending}
                  >
                    Remove
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      onClick={() => handleQuantityChange(item, item.quantity - 1)}
                      style={{ padding: '0.25rem 0.75rem', background: '#e2e8f0' }}
                      disabled={updateQuantity.isPending}
                    >
                      -
                    </button>
                    <span style={{ minWidth: '40px', textAlign: 'center', fontWeight: 'bold' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item, item.quantity + 1)}
                      style={{ padding: '0.25rem 0.75rem', background: '#e2e8f0' }}
                      disabled={updateQuantity.isPending || item.quantity >= item.availableQuantity}
                    >
                      +
                    </button>
                    <span style={{ marginLeft: '0.5rem', color: '#64748b', fontSize: '0.9rem' }}>
                      Max: {item.availableQuantity ?? item.quantity}
                    </span>
                  </div>
                  <strong style={{ fontSize: '1.1rem' }}>${item.subtotal?.toFixed(2)}</strong>
                </div>
              </div>
            </div>
          ))}

          <div className="card" style={{ marginTop: '1rem' }}>
            <button
              onClick={() => {
                if (window.confirm('Clear entire cart?')) {
                  clearCart.mutate();
                }
              }}
              style={{ background: '#fee2e2', color: '#b91c1c', width: '100%' }}
              disabled={clearCart.isPending}
            >
              {clearCart.isPending ? 'Clearing...' : 'Clear Cart'}
            </button>
          </div>
        </div>

        <div className="card" style={{ height: 'fit-content', position: 'sticky', top: '1rem' }}>
          <h3 style={{ marginTop: 0 }}>Order Summary</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Selected Items ({selectedItems.size}):</span>
            <span>${selectedTotal.toFixed(2)}</span>
          </div>
          <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>
            Total Items in Cart: {cart.items.length}
          </div>
          <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '1rem', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <strong>Total:</strong>
              <strong style={{ fontSize: '1.25rem', color: '#16a34a' }}>${selectedTotal.toFixed(2)}</strong>
            </div>
            <button
              onClick={handleProceedToCheckout}
              disabled={selectedItems.size === 0}
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                fontSize: '1rem', 
                fontWeight: 'bold',
                opacity: selectedItems.size === 0 ? 0.5 : 1,
                cursor: selectedItems.size === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              Proceed to Checkout ({selectedItems.size} {selectedItems.size === 1 ? 'item' : 'items'})
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ShoppingCartPage;

