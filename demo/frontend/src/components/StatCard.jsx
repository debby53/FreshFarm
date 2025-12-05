const StatCard = ({ label, value, accent = '#1d976c' }) => (
  <div className="card">
    <p style={{ color: '#64748b', margin: 0 }}>{label}</p>
    <h2 style={{ margin: '0.5rem 0', color: accent }}>{value}</h2>
  </div>
);

export default StatCard;

