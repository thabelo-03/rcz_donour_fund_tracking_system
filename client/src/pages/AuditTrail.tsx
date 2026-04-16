import React, { useEffect, useState } from 'react';
import { auditAPI } from '../api';
import { AuditEntry } from '../types';
import { Search, Shield, AlertTriangle, Info, AlertOctagon } from 'lucide-react';

const severityBadge: Record<string, string> = {
  Low: 'badge-neutral', Medium: 'badge-info', High: 'badge-warning', Critical: 'badge-danger'
};
const actionColors: Record<string, string> = {
  CREATE: '#10B981', UPDATE: '#3B82F6', DELETE: '#EF4444', APPROVE: '#D4A843',
  REJECT: '#EF4444', FLAG: '#F59E0B', LOGIN: '#64748B', LOGOUT: '#64748B',
  EXPORT: '#8B5CF6', VIEW: '#64748B'
};

const AuditTrail: React.FC = () => {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterEntity, setFilterEntity] = useState('');

  const fetchData = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filterAction) params.set('action', filterAction);
    if (filterSeverity) params.set('severity', filterSeverity);
    if (filterEntity) params.set('entity', filterEntity);
    Promise.all([auditAPI.getAll(params.toString()), auditAPI.getStats()])
      .then(([l, s]) => { setLogs(l); setStats(s); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [search, filterAction, filterSeverity, filterEntity]);

  const formatTime = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <div className="page-container"><div className="loader"><div className="spinner"></div></div></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Trail</h1>
          <p className="page-subtitle">Complete log of all system actions and changes</p>
        </div>
        <span className="badge badge-primary" style={{ fontSize: '0.8rem', padding: '6px 16px' }}>
          <Shield size={14} /> {stats?.total || 0} Total Entries
        </span>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="kpi-grid" style={{ marginBottom: 24 }}>
          {stats.bySeverity?.map((s: any) => (
            <div key={s._id} className={`kpi-card ${s._id === 'Critical' ? 'red' : s._id === 'High' ? 'gold' : s._id === 'Medium' ? 'blue' : 'green'}`}>
              <div className={`kpi-icon ${s._id === 'Critical' ? 'red' : s._id === 'High' ? 'gold' : s._id === 'Medium' ? 'blue' : 'green'}`}>
                {s._id === 'Critical' ? <AlertOctagon size={22} /> : s._id === 'High' ? <AlertTriangle size={22} /> : <Info size={22} />}
              </div>
              <div className="kpi-content">
                <div className="kpi-label">{s._id} Severity</div>
                <div className="kpi-value" style={{ fontSize: '1.4rem' }}>{s.count}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input placeholder="Search audit logs..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
        </div>
        <select value={filterAction} onChange={e => setFilterAction(e.target.value)}>
          <option value="">All Actions</option>
          {['CREATE','UPDATE','DELETE','APPROVE','REJECT','FLAG','LOGIN','EXPORT','VIEW'].map(a =>
            <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
          <option value="">All Severities</option>
          {['Low','Medium','High','Critical'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterEntity} onChange={e => setFilterEntity(e.target.value)}>
          <option value="">All Entities</option>
          {['Donor','Grant','Transaction','User','Report','System'].map(e =>
            <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Description</th>
              <th>Performed By</th>
              <th>Role</th>
              <th>Severity</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((entry, i) => (
              <tr key={entry._id} className="animate-fade-in" style={{ opacity: 0, animationDelay: `${i * 0.03}s` }}>
                <td>
                  <span className="text-xs" style={{ fontFamily: 'monospace', color: 'var(--text-tertiary)' }}>
                    {formatTime(entry.timestamp)}
                  </span>
                </td>
                <td>
                  <span className="badge" style={{
                    background: `${actionColors[entry.action]}18`,
                    color: actionColors[entry.action],
                    fontSize: '0.7rem'
                  }}>
                    {entry.action}
                  </span>
                </td>
                <td className="text-sm font-semibold">{entry.entity}</td>
                <td className="text-sm text-secondary" style={{ maxWidth: 280 }}>{entry.description}</td>
                <td className="text-sm">{entry.performedBy}</td>
                <td className="text-xs text-secondary" style={{ textTransform: 'capitalize' }}>{entry.role?.replace(/_/g, ' ') || '—'}</td>
                <td><span className={`badge ${severityBadge[entry.severity]}`}>{entry.severity}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <div className="empty-state"><h3>No audit entries found</h3></div>}
      </div>
    </div>
  );
};

export default AuditTrail;
