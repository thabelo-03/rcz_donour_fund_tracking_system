import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Church, Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useApp();
  const [email, setEmail] = useState('admin@rcz.org.zw');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card animate-scale-in">
        <div className="login-brand">
          <div className="login-brand-icon">
            <Church size={28} color="white" />
          </div>
          <h2>RCZ Fund Tracker</h2>
          <p>Donor Fund Tracking & Grant Management</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: 'var(--danger-bg)', color: 'var(--danger)',
              padding: '10px 14px', borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem', marginBottom: 16
            }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email" required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password" required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer'
                }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-accent" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>Reformed Church in Zimbabwe</p>
          <p style={{ marginTop: 4, fontSize: '0.7rem' }}>Transparency · Accountability · Stewardship</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
