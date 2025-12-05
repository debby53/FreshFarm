import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import client from '../services/client';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import StatCard from '../components/StatCard';

const orderStatuses = ['PENDING', 'IN_PROGRESS', 'TRANSFER', 'DELIVERED'];

const OrderCard = ({ order, onStatusUpdate, isUpdating }) => {
  const getStatusColor = (status) => {
    const colors = {
      PENDING: { bg: '#fef9c3', color: '#92400e' },
      IN_PROGRESS: { bg: '#dbeafe', color: '#1e40af' },
      TRANSFER: { bg: '#e0e7ff', color: '#4338ca' },
      DELIVERED: { bg: '#dcfce7', color: '#166534' },
      CANCELLED: { bg: '#fee2e2', color: '#b91c1c' }
    };
    return colors[status] || { bg: '#e2e8f0', color: '#0f172a' };
  };

  const statusStyle = getStatusColor(order.status);

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div>
          <h4 style={{ margin: 0, marginBottom: '0.25rem' }}>Order #{order.orderId}</h4>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
            {new Date(order.orderDate).toLocaleDateString()} • {order.deliveryMethod}
          </p>
        </div>
        <span
          style={{
            background: statusStyle.bg,
            color: statusStyle.color,
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            fontSize: '0.85rem',
            fontWeight: 'bold'
          }}
        >
          {order.status?.replace('_', ' ')}
        </span>
      </div>
      
      <div style={{ marginBottom: '0.75rem' }}>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
          {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''} • ${order.totalAmount?.toFixed(2)}
        </p>
        {order.deliveryAddress && (
          <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
            Address: {order.deliveryAddress}
          </p>
        )}
        {order.items && order.items.length > 0 && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>
            <strong>Items:</strong>
            {order.items.map((item, idx) => (
              <span key={idx} style={{ marginLeft: '0.5rem' }}>
                {item.productName} (×{item.quantity})
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Update Status:</span>
          <select
            value={order.status}
            onChange={(e) => onStatusUpdate(order.orderId, e.target.value)}
            disabled={isUpdating}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              fontSize: '0.9rem',
              cursor: isUpdating ? 'not-allowed' : 'pointer'
            }}
          >
            {orderStatuses.map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
};

const productCategories = ['Vegetables', 'Fruits', 'Cereals', 'Tubers', 'Herbs'];
const productStatuses = ['IN_STOCK', 'OUT_OF_STOCK', 'SOLD'];

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [productForm, setProductForm] = useState({
    productName: '',
    category: productCategories[0],
    description: '',
    price: '',
    unit: 'kg',
    quantity: 1,
    status: 'IN_STOCK',
    imageUrl: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [farmerSearch, setFarmerSearch] = useState('');
  const [reportPeriod, setReportPeriod] = useState('MONTHLY');

  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: async () => (await client.get('/cart')).data,
    enabled: user?.userType === 'BUYER'
  });

  const ordersQuery = useQuery({
    queryKey: ['orders', user?.userType],
    queryFn: async () =>
      user?.userType === 'FARMER'
        ? (await client.get('/orders/farmer')).data
        : (await client.get('/orders/me')).data,
    enabled: ['BUYER', 'FARMER'].includes(user?.userType)
  });

  const productsQuery = useQuery({
    queryKey: ['farmer-products', user?.id],
    queryFn: async () => (await client.get(`/products/farmer/${user.id}`)).data,
    enabled: user?.userType === 'FARMER'
  });

  // Admin queries
  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => (await client.get('/admin/users')).data,
    enabled: user?.userType === 'ADMIN'
  });

  const transactionsQuery = useQuery({
    queryKey: ['admin-transactions'],
    queryFn: async () => (await client.get('/admin/transactions')).data,
    enabled: user?.userType === 'ADMIN'
  });

  const reportQuery = useQuery({
    queryKey: ['admin-report', reportPeriod],
    queryFn: async () => (await client.get(`/admin/reports?period=${reportPeriod}`)).data,
    enabled: user?.userType === 'ADMIN'
  });

  const adminStats = useMemo(() => {
    if (!usersQuery.data || !transactionsQuery.data || !reportQuery.data) {
      return { totalUsers: 0, totalTransactions: 0, totalRevenue: 0 };
    }
    return {
      totalUsers: usersQuery.data.length,
      totalTransactions: transactionsQuery.data.length,
      totalRevenue: reportQuery.data.totalRevenue || 0
    };
  }, [usersQuery.data, transactionsQuery.data, reportQuery.data]);

  const deleteUser = useMutation({
    mutationFn: (userId) => client.delete(`/admin/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      alert('User deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting user:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to delete user. This user may have related data (orders, products, etc.) that needs to be handled first.';
      alert(errorMessage);
    }
  });

  const resetForm = () => {
    setProductForm({
      productName: '',
      category: productCategories[0],
      description: '',
      price: '',
      unit: 'kg',
      quantity: 1,
      status: 'IN_STOCK',
      imageUrl: ''
    });
    setImageFile(null);
    setImagePreview(null);
    setEditingProductId(null);
  };

  const createProduct = useMutation({
    mutationFn: (formData) => client.post('/products', formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['farmer-products'] });
      resetForm();
      alert('Product created successfully!');
    },
    onError: (error) => {
      console.error('Error creating product:', error);
      alert('Failed to create product. Please check the console for details.');
    }
  });

  const updateProduct = useMutation({
    mutationFn: ({ id, formData }) => client.put(`/products/${id}`, formData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['farmer-products'] });
      if (!variables?.silent) {
        resetForm();
        alert('Product updated successfully!');
      }
    },
    onError: (error) => {
      console.error('Error updating product:', error);
      if (!error.config?.silent) {
        alert('Failed to update product. Please check the console for details.');
      }
    }
  });

  const deleteProduct = useMutation({
    mutationFn: (id) => client.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['farmer-products'] });
      alert('Product deleted successfully!');
    },
    onError: (error) => {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please check the console for details.');
    }
  });

  const updateOrderStatus = useMutation({
    mutationFn: ({ orderId, status }) => {
      console.log('Updating order status:', { orderId, status });
      return client.patch(`/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['farmer-products'] });
      alert('Order status updated successfully!');
    },
    onError: (error) => {
      console.error('Error updating order status:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update order status. Please try again.';
      console.error('Full error response:', error.response?.data);
      alert(`Error: ${errorMessage}`);
    }
  });

  const handleOrderStatusUpdate = (orderId, newStatus) => {
    updateOrderStatus.mutate({ orderId, status: newStatus });
  };

  const handleSubmitProduct = (event) => {
    event.preventDefault();
    const payload = {
      ...productForm,
      price: Number(productForm.price),
      quantity: Number(productForm.quantity),
      available: productForm.status === 'IN_STOCK'
    };
    const formData = new FormData();
    formData.append('product', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    if (imageFile) {
      formData.append('image', imageFile);
    }
    if (editingProductId) {
      updateProduct.mutate({ id: editingProductId, formData });
    } else {
      createProduct.mutate(formData);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProductId(product.id ?? product.productId);
    setProductForm({
      productName: product.productName,
      category: product.category,
      description: product.description ?? '',
      price: product.price,
      unit: product.unit ?? 'kg',
      quantity: product.quantity ?? 1,
      status: product.status ?? 'IN_STOCK',
      imageUrl: product.imageUrl ?? ''
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleDeleteProduct = (productId) => {
    if (window.confirm('Delete this product?')) {
      deleteProduct.mutate(productId);
    }
  };

  const handleStatusChange = (product, status) => {
    const productId = product.id ?? product.productId;
    const payload = {
      productName: product.productName,
      category: product.category,
      description: product.description ?? '',
      price: product.price,
      unit: product.unit ?? 'kg',
      quantity: product.quantity ?? 1,
      imageUrl: product.imageUrl ?? '',
      available: status === 'IN_STOCK',
      status
    };
    const formData = new FormData();
    formData.append('product', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    updateProduct.mutate({ id: productId, formData, silent: true });
  };

  const filteredFarmerProducts = useMemo(() => {
    const term = farmerSearch.toLowerCase();
    return (productsQuery.data ?? []).filter((product) =>
      product.productName.toLowerCase().includes(term)
    );
  }, [productsQuery.data, farmerSearch]);

  return (
    <main className="content">
      <h2>Welcome back, {user?.username}</h2>
      <p style={{ color: '#64748b' }}>Role: {user?.userType}</p>

      {user?.userType === 'BUYER' && (
        <>
          <div className="grid grid-3" style={{ marginBottom: '1.5rem' }}>
            <StatCard label="Cart items" value={cartQuery.data?.items?.length ?? 0} />
            <StatCard label="Total orders" value={ordersQuery.data?.length ?? 0} accent="#2563eb" />
            <StatCard 
              label="Pending orders" 
              value={ordersQuery.data?.filter(o => o.status === 'PENDING' || o.status === 'IN_PROGRESS').length ?? 0} 
              accent="#f97316" 
            />
          </div>
          <div className="card" style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <button onClick={() => navigate('/marketplace')} style={{ padding: '1rem', background: '#dcfce7', color: '#166534' }}>
              Browse Products
            </button>
            <button onClick={() => navigate('/cart')} style={{ padding: '1rem', background: '#dbeafe', color: '#1e40af' }}>
              View Cart ({cartQuery.data?.items?.length ?? 0})
            </button>
            <button onClick={() => navigate('/orders')} style={{ padding: '1rem', background: '#e0e7ff', color: '#4338ca' }}>
              My Orders
            </button>
          </div>
          <section className="card" style={{ marginBottom: '1.5rem' }}>
            <h3>Cart</h3>
            {cartQuery.data?.items?.map((item) => (
              <div
                key={item.cartItemId}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #e2e8f0' }}
              >
                <span>
                  {item.productName} × {item.quantity}
                </span>
                <strong>${item.subtotal.toFixed(2)}</strong>
              </div>
            ))}
          </section>
          <section className="card">
            <h3>Orders</h3>
            {ordersQuery.data?.map((order) => (
              <article key={order.orderId} style={{ borderBottom: '1px solid #e2e8f0', padding: '1rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>#{order.orderId}</strong>
                  <span>{order.status}</span>
                </div>
                <small>{order.deliveryMethod}</small>
                <p>${order.totalAmount?.toFixed(2)}</p>
              </article>
            ))}
          </section>
        </>
      )}

      {user?.userType === 'FARMER' && (
        <>
          <div className="grid grid-3" style={{ marginBottom: '1.5rem' }}>
            <StatCard label="Total Products" value={productsQuery.data?.length ?? 0} />
            <StatCard
              label="In Stock"
              value={productsQuery.data?.filter((p) => p.status === 'IN_STOCK').length ?? 0}
              accent="#16a34a"
            />
            <StatCard
              label="Orders Received"
              value={ordersQuery.data?.length ?? 0}
              accent="#2563eb"
            />
          </div>
          <section className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <h3>{editingProductId ? 'Edit product' : 'Create product'}</h3>
              {editingProductId && (
                <button type="button" onClick={resetForm} style={{ background: '#e2e8f0', color: '#0f172a' }}>
                  Cancel edit
                </button>
              )}
            </div>
            <form onSubmit={handleSubmitProduct}>
              <label>
                Product name
                <input
                  value={productForm.productName}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, productName: e.target.value }))}
                  required
                />
              </label>
              <label>
                Category
                <select
                  value={productForm.category}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, category: e.target.value }))}
                  required
                >
                  {productCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Description
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </label>
              <label>
                Price
                <input
                  type="number"
                  value={productForm.price}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, price: e.target.value }))}
                  required
                />
              </label>
              <label>
                Quantity
                <input
                  type="number"
                  value={productForm.quantity}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, quantity: e.target.value }))}
                  required
                />
              </label>
              <label>
                Unit
                <input value={productForm.unit} onChange={(e) => setProductForm((prev) => ({ ...prev, unit: e.target.value }))} />
              </label>
               <label>
                Status
                <select value={productForm.status} onChange={(e) => setProductForm((prev) => ({ ...prev, status: e.target.value }))}>
                  {productStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </label>
              {(imagePreview || (productForm.imageUrl && !imageFile)) && (
                <div style={{ marginBottom: '1rem' }}>
                  <small style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    {imagePreview ? 'New image preview:' : 'Current image:'}
                  </small>
                  <img
                    src={imagePreview || productForm.imageUrl}
                    alt="Product preview"
                    style={{ width: '100%', maxWidth: 300, height: 200, objectFit: 'cover', borderRadius: 12, border: '1px solid #e2e8f0' }}
                  />
                </div>
              )}
              <label>
                Upload image
                <input type="file" accept="image/*" onChange={handleImageChange} />
                <small style={{ display: 'block', marginTop: '0.25rem', color: '#64748b' }}>
                  {imageFile ? `Selected: ${imageFile.name}` : 'Select an image file (optional)'}
                </small>
              </label>
              <button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
                {editingProductId ? (updateProduct.isPending ? 'Updating...' : 'Update product') : createProduct.isPending ? 'Saving...' : 'Publish product'}
              </button>
            </form>
          </section>
          <section className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0 }}>My Products ({filteredFarmerProducts.length})</h3>
              <input
                placeholder="Search my products..."
                value={farmerSearch}
                onChange={(e) => setFarmerSearch(e.target.value)}
                style={{ flex: 1, minWidth: 200, maxWidth: 400 }}
              />
            </div>
          </section>
          <section className="grid grid-3" style={{ marginBottom: '1.5rem' }}>
            {productsQuery.isLoading ? (
              <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
                <p style={{ color: '#64748b' }}>Loading products...</p>
              </div>
            ) : filteredFarmerProducts.length === 0 ? (
              <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
                <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                  {farmerSearch ? 'No products match your search.' : 'No products yet.'}
                </p>
                {!farmerSearch && (
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Create your first product using the form above!</p>
                )}
              </div>
            ) : (
              filteredFarmerProducts.map((product) => (
                <div key={product.id ?? product.productId} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt={product.productName}
                      style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12 }}
                    />
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div>
                      <h4 style={{ margin: 0 }}>{product.productName}</h4>
                      <small style={{ color: '#64748b' }}>{product.category}</small>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                      <strong>${product.price?.toFixed(2)}</strong>
                      <span
                        style={{
                          background: product.status === 'IN_STOCK' ? '#dcfce7' : product.status === 'SOLD' ? '#fee2e2' : '#fff7ed',
                          color: product.status === 'IN_STOCK' ? '#166534' : product.status === 'SOLD' ? '#b91c1c' : '#92400e',
                          fontSize: '0.75rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '999px',
                          fontWeight: 'bold'
                        }}
                      >
                        {product.status?.replace('_', ' ') ?? 'IN STOCK'}
                      </span>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>
                    {product.description ?? 'No description provided yet.'}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', color: '#64748b' }}>
                    <span>
                      {product.quantity} {product.unit ?? 'units'} available
                    </span>
                  </div>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <small style={{ fontWeight: 'bold' }}>Update Status:</small>
                    <select
                      value={product.status ?? 'IN_STOCK'}
                      onChange={(e) => handleStatusChange(product, e.target.value)}
                      disabled={updateProduct.isPending}
                      style={{ padding: '0.5rem', borderRadius: 8, border: '1px solid #e2e8f0' }}
                    >
                      {productStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => handleEditProduct(product)}
                      style={{ flex: 1, padding: '0.5rem 1rem', background: '#2563eb', color: 'white' }}
                      disabled={createProduct.isPending || updateProduct.isPending}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(product.id ?? product.productId)}
                      style={{ flex: 1, padding: '0.5rem 1rem', background: '#fee2e2', color: '#b91c1c' }}
                      disabled={deleteProduct.isPending || createProduct.isPending || updateProduct.isPending}
                    >
                      {deleteProduct.isPending ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>
          <section className="card">
            <h3>Recent Orders</h3>
            {ordersQuery.isLoading && <p style={{ color: '#64748b' }}>Loading orders...</p>}
            {!ordersQuery.isLoading && (!ordersQuery.data || ordersQuery.data.length === 0) && (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>No orders yet</p>
            )}
            {!ordersQuery.isLoading && ordersQuery.data && ordersQuery.data.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {ordersQuery.data.map((order) => (
                  <OrderCard 
                    key={order.orderId} 
                    order={order} 
                    onStatusUpdate={handleOrderStatusUpdate}
                    isUpdating={updateOrderStatus.isPending}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {user?.userType === 'ADMIN' && (
        <>
          <div className="grid grid-3" style={{ marginBottom: '1.5rem' }}>
            <StatCard label="Total Users" value={adminStats.totalUsers ?? 0} />
            <StatCard label="Total Transactions" value={adminStats.totalTransactions ?? 0} accent="#2563eb" />
            <StatCard label="Total Revenue" value={`$${adminStats.totalRevenue?.toFixed(2) ?? '0.00'}`} accent="#16a34a" />
          </div>
          
          <section className="card" style={{ marginBottom: '1.5rem' }}>
            <h3>User Management</h3>
            {usersQuery.isLoading && <p>Loading users...</p>}
            {usersQuery.isError && <p style={{ color: '#ef4444' }}>Error loading users.</p>}
            {!usersQuery.isLoading && !usersQuery.isError && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Username</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Email</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Type</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Registered</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersQuery.data?.map((u) => (
                      <tr key={u.userId} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.75rem' }}>{u.username}</td>
                        <td style={{ padding: '0.75rem' }}>{u.email}</td>
                        <td style={{ padding: '0.75rem' }}>{u.userType}</td>
                        <td style={{ padding: '0.75rem' }}>{new Date(u.registeredDate).toLocaleDateString()}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete user ${u.username}?`)) {
                                deleteUser.mutate(u.userId);
                              }
                            }}
                            style={{ padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#b91c1c', fontSize: '0.85rem' }}
                            disabled={deleteUser.isPending}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="card" style={{ marginBottom: '1.5rem' }}>
            <h3>Transaction Monitoring</h3>
            {transactionsQuery.isLoading && <p>Loading transactions...</p>}
            {transactionsQuery.isError && <p style={{ color: '#ef4444' }}>Error loading transactions.</p>}
            {!transactionsQuery.isLoading && !transactionsQuery.isError && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Transaction ID</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Order ID</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Amount</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Payment Method</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Buyer</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactionsQuery.data?.map((t) => (
                      <tr key={t.transactionId} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.75rem' }}>#{t.transactionId}</td>
                        <td style={{ padding: '0.75rem' }}>#{t.orderId ?? 'N/A'}</td>
                        <td style={{ padding: '0.75rem' }}>${t.amount?.toFixed(2)}</td>
                        <td style={{ padding: '0.75rem' }}>{t.paymentMethod}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span
                            style={{
                              background: t.status === 'COMPLETED' ? '#dcfce7' : '#fef9c3',
                              color: t.status === 'COMPLETED' ? '#166534' : '#92400e',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '999px',
                              fontSize: '0.85rem'
                            }}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>{t.buyerName}</td>
                        <td style={{ padding: '0.75rem' }}>{new Date(t.transactionDate).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Sales Reports</h3>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select
                  value={reportPeriod}
                  onChange={(e) => setReportPeriod(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: 8 }}
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
                <button
                  onClick={() => reportQuery.refetch()}
                  disabled={reportQuery.isLoading}
                  style={{ padding: '0.5rem 1rem' }}
                >
                  {reportQuery.isLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>
            {reportQuery.isLoading && <p>Generating report...</p>}
            {reportQuery.isError && <p style={{ color: '#ef4444' }}>Error generating report.</p>}
            {!reportQuery.isLoading && !reportQuery.isError && reportQuery.data && (
              <div>
                <div className="grid grid-3" style={{ marginBottom: '1.5rem' }}>
                  <StatCard label="Total Revenue" value={`$${reportQuery.data.totalRevenue?.toFixed(2) ?? '0.00'}`} accent="#16a34a" />
                  <StatCard label="Total Orders" value={reportQuery.data.totalOrders ?? 0} accent="#2563eb" />
                  <StatCard label="Total Products" value={reportQuery.data.totalProducts ?? 0} />
                </div>
                
                {reportQuery.data.topProducts && reportQuery.data.topProducts.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4>Top Products</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {reportQuery.data.topProducts.map((p, idx) => (
                        <div key={idx} style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: 8 }}>
                          <strong>{p.productName}</strong> - {p.quantitySold} units sold
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {reportQuery.data.topFarmers && reportQuery.data.topFarmers.length > 0 && (
                  <div>
                    <h4>Top Farmers</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {reportQuery.data.topFarmers.map((f, idx) => (
                        <div key={idx} style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: 8 }}>
                          <strong>{f.farmerName}</strong> - ${f.revenue?.toFixed(2)} revenue
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
};

export default DashboardPage;

