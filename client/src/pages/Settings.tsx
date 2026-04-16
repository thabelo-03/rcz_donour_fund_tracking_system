import React, { useEffect, useState } from 'react';
import { authAPI } from '../api';
import { useApp } from '../context/AppContext';
import { User, Shield, Database, Globe, Key } from 'lucide-react';

const Settings: React.FC = () => {
  const { user } = useApp();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authAPI.getUsers().then(u => { setUsers(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const formatRole = (r: string) => r.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const roleColors: Record<string, string> = {
    admin: 'badge-danger', finance_officer: 'badge-info', treasurer: 'badge-accent',
    auditor: 'badge-warning', project_manager: 'badge-success'
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">System configuration and user management</p>
        </div>
      </div>

      <div className="data-grid" style={{ marginBottom: 24 }}>
        {/* Profile Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Your Profile</h3>
            <User size={18} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div className="user-avatar" style={{ width: 56, height: 56, fontSize: '1.1rem' }}>
              {user?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <div className="font-bold" style={{ fontSize: '1.1rem' }}>{user?.name}</div>
              <div className="text-sm text-secondary">{user?.email}</div>
              <span className={`badge ${roleColors[user?.role || ''] || 'badge-neutral'}`} style={{ marginTop: 4 }}>
                {formatRole(user?.role || '')}
              </span>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span className="text-sm text-secondary">Department</span>
              <span className="text-sm font-semibold">{user?.department || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span className="text-sm text-secondary">Congregation</span>
              <span className="text-sm font-semibold">{user?.congregation || '—'}</span>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">System Information</h3>
            <Database size={18} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {[
              { label: 'System', value: 'RCZ Donor Fund Tracker v1.0', icon: Globe },
              { label: 'Database', value: 'MongoDB Atlas', icon: Database },
              { label: 'Security', value: 'JWT Authentication', icon: Key },
              { label: 'Framework', value: 'COSO Internal Control', icon: Shield },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <item.icon size={16} style={{ color: 'var(--accent)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="text-xs text-secondary">{item.label}</div>
                  <div className="text-sm font-semibold">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">System Users</h3>
          <span className="badge badge-primary">{users.length} users</span>
        </div>
        {loading ? (
          <div className="loader"><div className="spinner"></div></div>
        ) : (
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Congregation</th><th>Status</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="user-avatar" style={{ width: 32, height: 32, fontSize: '0.65rem' }}>
                        {u.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="font-semibold text-sm">{u.name}</span>
                    </div>
                  </td>
                  <td className="text-sm text-secondary">{u.email}</td>
                  <td><span className={`badge ${roleColors[u.role] || 'badge-neutral'}`} style={{ fontSize: '0.7rem' }}>{formatRole(u.role)}</span></td>
                  <td className="text-sm">{u.department || '—'}</td>
                  <td className="text-sm">{u.congregation || '—'}</td>
                  <td><span className={`badge ${u.isActive ? 'badge-success' : 'badge-neutral'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Role Access Matrix */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <h3 className="card-title">Role Access Matrix (Segregation of Duties)</h3>
          <Shield size={18} style={{ color: 'var(--accent)' }} />
        </div>
        <table>
          <thead>
            <tr>
              <th>Permission</th>
              <th>Admin</th>
              <th>Finance Officer</th>
              <th>Treasurer</th>
              <th>Auditor</th>
              <th>Project Manager</th>
            </tr>
          </thead>
          <tbody>
            {[
              { perm: 'View Dashboard', roles: [true, true, true, true, true] },
              { perm: 'Manage Donors', roles: [true, true, false, false, false] },
              { perm: 'Create Grants', roles: [true, true, false, false, true] },
              { perm: 'Approve Transactions', roles: [true, true, true, false, false] },
              { perm: 'Flag Transactions', roles: [true, false, false, true, false] },
              { perm: 'View Audit Trail', roles: [true, false, false, true, false] },
              { perm: 'Generate Reports', roles: [true, true, true, true, true] },
              { perm: 'Manage Users', roles: [true, false, false, false, false] },
              { perm: 'Delete Records', roles: [true, false, false, false, false] },
            ].map((row, i) => (
              <tr key={i}>
                <td className="text-sm font-semibold">{row.perm}</td>
                {row.roles.map((allowed, j) => (
                  <td key={j} style={{ textAlign: 'center' }}>
                    {allowed ? <span style={{ color: 'var(--success)', fontSize: '1.1rem' }}>✓</span> : <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Settings;
