import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import client from '../services/client';
import { useAuth } from '../context/AuthContext';

const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', 'buyer'],
    queryFn: async () => (await client.get('/orders/me')).data,
    enabled: !!user,
    refetchInterval: 10000 // Refetch every 10 seconds to see status updates
  });

  const getStatusColor = (status) => {
    const colors = {
      PENDING: '#fef9c3',
      IN_PROGRESS: '#dbeafe',
      TRANSFER: '#e0e7ff',
      DELIVERED: '#dcfce7',
      CANCELLED: '#fee2e2'
    };
    return colors[status] || '#e2e8f0';
  };

  const getStatusTextColor = (status) => {
    const colors = {
      PENDING: '#92400e',
      IN_PROGRESS: '#1e40af',
      TRANSFER: '#4338ca',
      DELIVERED: '#166534',
      CANCELLED: '#b91c1c'
    };
    return colors[status] || '#0f172a';
  };

  if (!user) {
    return (
      <main className="content">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3>Please login to view orders</h3>
          <button onClick={() => navigate('/login')}>Go to Login</button>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="content">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading orders...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="content">
      <h2>My Orders</h2>

      {orders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3 style={{ color: '#64748b', marginBottom: '0.5rem' }}>No orders yet</h3>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>Start shopping to see your orders here!</p>
          <button onClick={() => navigate('/marketplace')}>
            Browse Products
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map((order) => (
            <div
              key={order.orderId}
              className="card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/orders/${order.orderId}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, marginBottom: '0.25rem' }}>Order #{order.orderId}</h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                    {new Date(order.orderDate).toLocaleDateString()} • {order.deliveryMethod}
                  </p>
                </div>
                <span
                  style={{
                    background: getStatusColor(order.status),
                    color: getStatusTextColor(order.status),
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold'
                  }}
                >
                  {order.status}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <div>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                    {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                  </p>
                  {order.deliveryAddress && (
                    <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                      {order.deliveryAddress}
                    </p>
                  )}
                </div>
                <strong style={{ fontSize: '1.1rem' }}>${order.totalAmount?.toFixed(2)}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default OrderHistoryPage;

