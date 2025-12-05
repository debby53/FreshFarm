import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../services/client';
import { useAuth } from '../context/AuthContext';

const initialBuyer = {
  username: '',
  email: '',
  password: '',
  phone: '',
  address: '',
  deliveryAddress: '',
  preferredPayment: ''
};

const initialFarmer = {
  username: '',
  email: '',
  password: '',
  phone: '',
  address: '',
  farmName: '',
  location: '',
  description: ''
};

const initialAdmin = {
  username: '',
  email: '',
  password: '',
  phone: '',
  address: '',
  role: 'ADMIN'
};

const RegisterPage = () => {
  const [role, setRole] = useState('buyer');
  const [buyerForm, setBuyerForm] = useState(initialBuyer);
  const [farmerForm, setFarmerForm] = useState(initialFarmer);
  const [adminForm, setAdminForm] = useState(initialAdmin);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      let endpoint, payload;
      if (role === 'buyer') {
        endpoint = '/auth/register/buyer';
        payload = buyerForm;
      } else if (role === 'farmer') {
        endpoint = '/auth/register/farmer';
        payload = farmerForm;
      } else {
        endpoint = '/auth/register/admin';
        payload = adminForm;
      }
      const { data } = await client.post(endpoint, payload);
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error ?? 'Unable to register');
    }
  };

  const getForm = () => {
    if (role === 'buyer') return buyerForm;
    if (role === 'farmer') return farmerForm;
    return adminForm;
  };

  const getSetForm = () => {
    if (role === 'buyer') return setBuyerForm;
    if (role === 'farmer') return setFarmerForm;
    return setAdminForm;
  };

  const form = getForm();
  const setForm = getSetForm();

  return (
    <main className="content" style={{ maxWidth: '520px' }}>
      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          {['buyer', 'farmer', 'admin'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setRole(type)}
              style={{
                flex: 1,
                background: role === type ? '#1d976c' : '#e2e8f0',
                color: role === type ? 'white' : '#0f172a'
              }}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit}>
          {Object.entries(form)
            .filter(([key]) => {
              // Filter out fields based on role
              if (role === 'buyer') {
                return !['role'].includes(key);
              } else if (role === 'farmer') {
                return !['deliveryAddress', 'preferredPayment', 'role'].includes(key);
              } else {
                // Admin - only show basic fields
                return ['username', 'email', 'password', 'phone', 'address', 'role'].includes(key);
              }
            })
            .map(([key, value]) => (
              <label key={key} style={{ textTransform: 'capitalize' }}>
                {key.replace(/([A-Z])/g, ' $1').trim()}
                {key === 'role' ? (
                  <input
                    value={value}
                    disabled
                    style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                  />
                ) : (
                  <input
                    value={value}
                    onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    required={['username', 'email', 'password'].includes(key)}
                    type={key === 'password' ? 'password' : key === 'email' ? 'email' : 'text'}
                  />
                )}
              </label>
            ))}
          {error && <p style={{ color: '#f43f5e' }}>{error}</p>}
          <button type="submit">Create {role} account</button>
        </form>
      </div>
    </main>
  );
};

export default RegisterPage;

