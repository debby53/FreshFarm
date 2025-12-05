const statusStyles = {
  IN_STOCK: { background: '#dcfce7', color: '#166534' },
  OUT_OF_STOCK: { background: '#fef9c3', color: '#92400e' },
  SOLD: { background: '#fee2e2', color: '#b91c1c' }
};

const ProductCard = ({ product, onAdd, onViewDetails, onOrderNow }) => {
  const statusStyle = statusStyles[product.status] ?? { background: '#e2e8f0', color: '#0f172a' };
  const canAdd = product.status === 'IN_STOCK';

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {product.imageUrl && (
        <img
          src={product.imageUrl.startsWith('http') ? product.imageUrl : `http://localhost:8080${product.imageUrl}`}
          alt={product.productName}
          style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12 }}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: 0 }}>{product.productName}</h3>
          <small style={{ color: '#64748b' }}>{product.category}</small>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
          <strong>${product.price?.toFixed(2)}</strong>
          <span
            style={{
              ...statusStyle,
              fontSize: '0.75rem',
              padding: '0.2rem 0.5rem',
              borderRadius: '999px',
              textTransform: 'capitalize'
            }}
          >
            {product.status?.toLowerCase().replace('_', ' ') ?? 'status'}
          </span>
        </div>
      </div>
      <p style={{ flex: 1 }}>{product.description ?? 'No description provided yet.'}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
        <span style={{ fontSize: '0.9rem', color: '#475569' }}>
          {product.quantity} {product.unit ?? 'units'} available
        </span>
      </div>
      {product.farmerName && (
        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
          By {product.farmerName}
          {product.farmerLocation && ` • ${product.farmerLocation}`}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {onViewDetails && (
            <button
              onClick={() => onViewDetails()}
              style={{ flex: 1, padding: '0.5rem 1rem', background: '#e2e8f0', color: '#0f172a', fontSize: '0.9rem' }}
            >
              View Details
            </button>
          )}
          {onAdd && (
            <button
              onClick={() => onAdd(product.id ?? product.productId)}
              style={{ flex: 1, padding: '0.5rem 1rem', opacity: canAdd ? 1 : 0.6, fontSize: '0.9rem' }}
              disabled={!canAdd}
            >
              {canAdd ? 'Add to cart' : 'Unavailable'}
            </button>
          )}
        </div>
        {onOrderNow && canAdd && (
          <button
            onClick={() => onOrderNow(product)}
            style={{ width: '100%', padding: '0.5rem 1rem', fontWeight: 'bold', fontSize: '0.9rem' }}
          >
            Order Now
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;

