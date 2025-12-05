import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import client from '../services/client';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => (await client.get('/cart')).data,
    enabled: !!user && user.userType === 'BUYER'
  });

  const cartItemCount = cart?.items?.length || 0;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header style={{ padding: '1.5rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
      <div style={{ width: 'min(1100px, 100%)', margin: '0 auto', display: 'flex', alignItems: 'center' }}>
        <Link to="/" style={{ fontWeight: 700, fontSize: '1.5rem', color: '#1d976c' }}>
          FreshFarm
        </Link>
        <nav style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/">Marketplace</Link>
          {user && <Link to="/dashboard">Dashboard</Link>}
          {user && <Link to="/settings">Settings</Link>}
          {user && user.userType === 'BUYER' && (
            <>
              <Link to="/orders">Orders</Link>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => navigate('/cart')}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.25rem', padding: '0.5rem', position: 'relative' }}
                >
                  🛒
                  {cartItemCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        background: '#f43f5e',
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {cartItemCount > 9 ? '9+' : cartItemCount}
                    </span>
                  )}
                </button>
              </div>
            </>
          )}
          {!user && (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
          {user && (
            <button onClick={handleLogout} style={{ background: '#f43f5e' }}>
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;

