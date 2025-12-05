import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../services/client';
import { useAuth } from '../context/AuthContext';

const OrderDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const orderPlaced = location.state?.orderPlaced;

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => (await client.get(`/orders/${id}`)).data,
    enabled: !!id,
    refetchInterval: 10000 // Refetch every 10 seconds to see status updates
  });

  const cancelOrder = useMutation({
    mutationFn: () => client.put(`/orders/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      alert('Order cancelled');
    },
    onError: (error) => {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order');
    }
  });

  if (isLoading) {
    return (
      <main className="content">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading order details...</p>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="content">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3>Order not found</h3>
          <button onClick={() => navigate('/orders')} style={{ marginTop: '1rem' }}>
            Back to Orders
          </button>
        </div>
      </main>
    );
  }

  const canCancel = order.status === 'PENDING';

  return (
    <main className="content">
      <button onClick={() => navigate('/orders')} style={{ marginBottom: '1rem', background: '#e2e8f0' }}>
        ← Back to Orders
      </button>

      {orderPlaced && (
        <div className="card" style={{ background: '#dcfce7', border: '1px solid #16a34a', marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#166534', marginTop: 0 }}>Order Placed Successfully!</h3>
          <p style={{ color: '#166534', margin: 0 }}>
            Your order has been placed. Order number: <strong>#{order.orderId}</strong>
          </p>
        </div>
      )}

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>Order #{order.orderId}</h2>
            <p style={{ color: '#64748b', margin: '0.5rem 0 0 0' }}>
              Placed on {new Date(order.orderDate).toLocaleString()}
            </p>
          </div>
          <span
            style={{
              background: order.status === 'PENDING' ? '#fef9c3' : 
                          order.status === 'IN_PROGRESS' ? '#dbeafe' :
                          order.status === 'TRANSFER' ? '#e0e7ff' :
                          order.status === 'DELIVERED' ? '#dcfce7' : '#fee2e2',
              color: order.status === 'PENDING' ? '#92400e' : 
                     order.status === 'IN_PROGRESS' ? '#1e40af' :
                     order.status === 'TRANSFER' ? '#4338ca' :
                     order.status === 'DELIVERED' ? '#166534' : '#b91c1c',
              padding: '0.5rem 1rem',
              borderRadius: '999px',
              fontWeight: 'bold'
            }}
          >
            {order.status?.replace('_', ' ') || order.status}
          </span>
        </div>

        {canCancel && (
          <button
            onClick={() => {
              if (window.confirm('Cancel this order?')) {
                cancelOrder.mutate();
              }
            }}
            style={{ background: '#fee2e2', color: '#b91c1c', marginTop: '1rem' }}
            disabled={cancelOrder.isPending}
          >
            {cancelOrder.isPending ? 'Cancelling...' : 'Cancel Order'}
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ marginTop: 0 }}>Order Items</h3>
            {order.items?.map((item) => (
              <div key={item.orderItemId} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, marginBottom: '0.25rem' }}>{item.productName}</h4>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                    {item.category} • ${item.priceAtOrder?.toFixed(2)} per {item.unit ?? 'unit'}
                  </p>
                  <p style={{ margin: '0.5rem 0 0 0', fontWeight: 'bold' }}>
                    Quantity: {item.quantity} × ${item.priceAtOrder?.toFixed(2)} = ${item.subtotal?.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Delivery Information</h3>
            <p><strong>Method:</strong> {order.deliveryMethod}</p>
            {order.deliveryAddress && (
              <p><strong>Address:</strong> {order.deliveryAddress}</p>
            )}
            {order.deliveryDate && (
              <p><strong>Delivery Date:</strong> {new Date(order.deliveryDate).toLocaleDateString()}</p>
            )}
            {order.deliveryNotes && (
              <div style={{ marginTop: '0.5rem' }}>
                <strong>Notes:</strong>
                <p style={{ color: '#64748b', margin: '0.25rem 0 0 0' }}>{order.deliveryNotes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ height: 'fit-content' }}>
          <h3 style={{ marginTop: 0 }}>Order Summary</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Subtotal:</span>
            <span>${order.totalAmount?.toFixed(2)}</span>
          </div>
          <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '1rem', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <strong>Total:</strong>
              <strong style={{ fontSize: '1.25rem', color: '#16a34a' }}>${order.totalAmount?.toFixed(2)}</strong>
            </div>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
              Payment: {order.paymentMethod || 'Cash on Delivery'}
            </p>
          </div>
          {order.farmerId && (
            <button
              onClick={() => navigate(`/messages/${order.farmerId}`)}
              style={{ width: '100%', marginTop: '1rem', background: '#e2e8f0', color: '#0f172a' }}
            >
              Message Farmer
            </button>
          )}
        </div>
      </div>
    </main>
  );
};

export default OrderDetailsPage;

