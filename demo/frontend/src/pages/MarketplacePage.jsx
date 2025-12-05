import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import client from '../services/client';
import { useAuth } from '../context/AuthContext';

const fetchProducts = async (filters) => {
  try {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== '' && value !== null && value !== undefined)
    );
    console.log('Fetching products with params:', params);
    const { data } = await client.get('/products', { params });
    console.log('Products received:', data);
    return data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    console.error('Error details:', error.response?.data || error.message);
    // Return empty array on error instead of crashing
    return [];
  }
};

const categories = ['All', 'Vegetables', 'Fruits', 'Cereals', 'Tubers', 'Herbs'];
const statusFilters = ['All', 'IN_STOCK', 'OUT_OF_STOCK', 'SOLD'];

const MarketplacePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filters, setFilters] = useState({ keyword: '', category: 'All', minPrice: '', maxPrice: '', status: 'All' });
  const queryFilters = useMemo(
    () => ({
      keyword: filters.keyword || undefined,
      category: filters.category === 'All' ? undefined : filters.category,
      minPrice: filters.minPrice || undefined,
      maxPrice: filters.maxPrice || undefined,
      status: filters.status === 'All' ? undefined : filters.status
    }),
    [filters]
  );
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products', queryFilters],
    queryFn: () => fetchProducts(queryFilters),
    retry: 2,
    refetchOnWindowFocus: false
  });

  const handleAdd = async (productId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await client.post('/cart/items', { productId, quantity: 1 });
      alert('Added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add to cart. Please try again.');
    }
  };

  const handleOrderNow = (product) => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/checkout', {
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
        quantity: 1
      }
    });
  };

  return (
    <>
      <Hero />
      <main className="content">
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>Fresh marketplace</h2>
            <p style={{ color: '#64748b' }}>Browse seasonal products from registered farmers</p>
          </div>
          <button onClick={() => navigate('/dashboard')}>Go to dashboard</button>
        </div>
        <div className="card" style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <input
            placeholder="Search by product name"
            value={filters.keyword}
            onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
          />
          <select value={filters.category} onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Min price"
            value={filters.minPrice}
            onChange={(e) => setFilters((prev) => ({ ...prev, minPrice: e.target.value }))}
          />
          <input
            type="number"
            placeholder="Max price"
            value={filters.maxPrice}
            onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))}
          />
          <select value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
            {statusFilters.map((status) => (
              <option key={status} value={status}>
                {status === 'All' ? 'All statuses' : status.replace('_', ' ')}
              </option>
            ))}
          </select>
          <button onClick={() => setFilters({ keyword: '', category: 'All', minPrice: '', maxPrice: '', status: 'All' })}>Clear filters</button>
        </div>
        {isLoading && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: '#64748b' }}>Loading products...</p>
          </div>
        )}
        {error && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', background: '#fee2e2', border: '1px solid #f43f5e' }}>
            <h3 style={{ color: '#b91c1c', marginBottom: '0.5rem' }}>Error loading products</h3>
            <p style={{ color: '#991b1b', marginBottom: '1rem' }}>
              {error.response?.data?.message || error.message || 'Failed to fetch products. Please check console for details.'}
            </p>
            <button 
              onClick={() => window.location.reload()}
              style={{ marginTop: '1rem' }}
            >
              Retry
            </button>
          </div>
        )}
        {!isLoading && !error && products.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <h3 style={{ color: '#64748b', marginBottom: '0.5rem' }}>No products found</h3>
            <p style={{ color: '#94a3b8' }}>
              {Object.values(queryFilters).some(v => v !== undefined) 
                ? 'Try adjusting your filters to see more products.' 
                : 'No products available yet. Check back soon!'}
            </p>
            {Object.values(queryFilters).some(v => v !== undefined) && (
              <button 
                onClick={() => setFilters({ keyword: '', category: 'All', minPrice: '', maxPrice: '', status: 'All' })}
                style={{ marginTop: '1rem' }}
              >
                Clear all filters
              </button>
            )}
            <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#64748b' }}>
              <p>Debug: Check browser console for API response details</p>
              <button 
                onClick={async () => {
                  try {
                    const debug = await client.get('/products/debug/all');
                    console.log('Debug endpoint response:', debug.data);
                    alert('Check console for debug info');
                  } catch (e) {
                    console.error('Debug endpoint error:', e);
                    alert('Debug endpoint failed - check console');
                  }
                }}
                style={{ marginTop: '0.5rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                Test Debug Endpoint
              </button>
            </div>
          </div>
        )}
        {!isLoading && products.length > 0 && (
          <>
            <div style={{ marginBottom: '1rem', color: '#64748b' }}>
              Showing {products.length} product{products.length !== 1 ? 's' : ''}
            </div>
            <div className="grid grid-3">
              {products.map((product) => (
                <ProductCard 
                  key={product.id ?? product.productId} 
                  product={product} 
                  onAdd={handleAdd}
                  onViewDetails={() => navigate(`/products/${product.id ?? product.productId}`)}
                  onOrderNow={handleOrderNow}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
};

export default MarketplacePage;

