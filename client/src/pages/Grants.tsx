import React, { useEffect, useState } from 'react';
import { grantAPI, donorAPI } from '../api';
import { Grant, Donor } from '../types';
import { Plus, Search, X, Calendar, DollarSign } from 'lucide-react';
import { useApp } from '../context/AppContext';

const statusColors: Record<string, string> = {
  Applied: 'badge-info', Approved: 'badge-accent', Active: 'badge-success',
  Reporting: 'badge-warning', Closed: 'badge-neutral', Suspended: 'badge-danger'
};
const catColors: Record<string, string> = {
  Education: 'badge-info', Health: 'badge-success', 'Humanitarian Relief': 'badge-danger',
  'Community Development': 'badge-primary', Infrastructure: 'badge-accent', 'Capacity Building': 'badge-warning'
};
const statusOrder = ['Applied', 'Approved', 'Active', 'Reporting', 'Closed'];

const Grants: React.FC = () => {
  const { user } = useApp();
  const [grants, setGrants] = useState<Grant[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState<Grant | null>(null);
  const [form, setForm] = useState({
    title: '', donor: '', description: '', category: 'Education',
    totalAmount: '', fundType: 'Restricted', startDate: '', endDate: '',
    reportingFrequency: 'Quarterly', projectManager: '', congregation: '', conditions: ''
  });

  const isAdmin = user?.role === 'admin';
  const isFinance = user?.role === 'finance_officer';
  const isProjectManager = user?.role === 'project_manager';

  const canAddGrant = isAdmin || isFinance || isProjectManager;
  const canEditGrant = isAdmin || isFinance || isProjectManager;
  const canDeleteGrant = isAdmin; // not used in UI yet, but good to have

  const fetchGrants = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filterStatus) params.set('status', filterStatus);
    if (filterCat) params.set('category', filterCat);
    grantAPI.getAll(params.toString())
      .then(g => { setGrants(g); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchGrants(); donorAPI.getAll().then(setDonors).catch(() => {}); }, [search, filterStatus, filterCat]);

  const openCreate = () => {
    setSelectedGrant(null);
    setForm({ title: '', donor: '', description: '', category: 'Education', totalAmount: '', fundType: 'Restricted', startDate: '', endDate: '', reportingFrequency: 'Quarterly', projectManager: '', congregation: '', conditions: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await grantAPI.create({ ...form, totalAmount: Number(form.totalAmount) });
      setShowModal(false);
      fetchGrants();
    } catch (err) { console.error(err); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    await grantAPI.updateStatus(id, status);
    fetchGrants();
  };

  const getDonorName = (d: any) => (typeof d === 'object' && d?.name) ? d.name : '—';

  if (loading) return <div className="page-container"><div className="loader"><div className="spinner"></div></div></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Grants</h1>
          <p className="page-subtitle">Track grant lifecycles, milestones, and compliance</p>
        </div>
        {canAddGrant && (
          <button className="btn btn-accent" onClick={openCreate}><Plus size={18} /> New Grant</button>
        )}
      </div>

      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input placeholder="Search grants..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {statusOrder.concat('Suspended').map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">All Categories</option>
          {['Education','Health','Humanitarian Relief','Community Development','Infrastructure','Capacity Building'].map(c =>
            <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Grant Cards */}
      <div className="data-grid">
        {grants.map((g, i) => {
          const spent = g.totalAmount > 0 ? Math.round((g.amountSpent / g.totalAmount) * 100) : 0;
          const currentIdx = statusOrder.indexOf(g.status);
          return (
            <div className="card animate-fade-in" key={g._id} style={{ opacity: 0, animationDelay: `${i * 0.06}s`, cursor: 'pointer' }}
              onClick={() => setSelectedGrant(selectedGrant?._id === g._id ? null : g)}>
              <div className="flex justify-between items-center mb-2">
                <span className={`badge ${statusColors[g.status] || 'badge-neutral'}`}>{g.status}</span>
                <span className="text-xs text-secondary">{g.grantNumber}</span>
              </div>
              <h3 className="font-bold" style={{ fontSize: '1rem', marginBottom: 8 }}>{g.title}</h3>
              <div className="flex items-center gap-2 mb-2">
                <span className={`badge ${catColors[g.category] || 'badge-neutral'}`} style={{ fontSize: '0.65rem' }}>{g.category}</span>
                <span className="text-xs text-secondary">· {getDonorName(g.donor)}</span>
              </div>

              {/* Status Pipeline */}
              <div className="pipeline mb-4 mt-4">
                {statusOrder.map((s, idx) => (
                  <div key={s} className={`pipeline-step ${idx < currentIdx ? 'completed' : idx === currentIdx ? 'active' : ''}`}>{s}</div>
                ))}
              </div>

              {/* Financial Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div>
                  <div className="text-xs text-secondary">Total Budget</div>
                  <div className="font-bold">${g.totalAmount.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-secondary">Spent</div>
                  <div className="font-bold" style={{ color: 'var(--info)' }}>${(g.amountSpent || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-secondary">Balance</div>
                  <div className="font-bold" style={{ color: 'var(--success)' }}>${g.amountRemaining.toLocaleString()}</div>
                </div>
              </div>

              <div className="text-xs text-secondary mb-2">Utilization: {spent}%</div>
              <div className="progress-bar" style={{ height: 6 }}>
                <div className={`progress-fill ${spent >= 90 ? 'red' : spent >= 60 ? 'gold' : 'green'}`} style={{ width: `${spent}%` }}></div>
              </div>

              {/* Milestones Preview */}
              {g.milestones && g.milestones.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div className="text-xs font-semibold text-secondary mb-2">Milestones ({g.milestones.filter(m => m.status === 'Completed').length}/{g.milestones.length})</div>
                  {g.milestones.slice(0, 3).map((m, idx) => (
                    <div key={idx} className="flex items-center gap-2" style={{ padding: '4px 0', fontSize: '0.8rem' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: m.status === 'Completed' ? 'var(--success)' : m.status === 'In Progress' ? 'var(--accent)' : 'var(--text-tertiary)' }}></div>
                      <span className={m.status === 'Completed' ? 'text-secondary' : ''}>{m.title}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              {canEditGrant && selectedGrant?._id === g._id && g.status !== 'Closed' && (
                <div className="flex gap-2" style={{ marginTop: 16 }}>
                  {g.status === 'Applied' && <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); handleStatusChange(g._id, 'Approved'); }}>Approve</button>}
                  {g.status === 'Approved' && <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); handleStatusChange(g._id, 'Active'); }}>Activate</button>}
                  {g.status === 'Active' && <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); handleStatusChange(g._id, 'Reporting'); }}>Move to Reporting</button>}
                  {g.status === 'Reporting' && <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); handleStatusChange(g._id, 'Closed'); }}>Close Grant</button>}
                  <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)' }} onClick={(e) => { e.stopPropagation(); handleStatusChange(g._id, 'Suspended'); }}>Suspend</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {grants.length === 0 && <div className="card"><div className="empty-state"><h3>No grants found</h3></div></div>}

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Grant</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Grant Title *</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Primary School Infrastructure Upgrade" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Donor *</label>
                    <select value={form.donor} onChange={e => setForm({ ...form, donor: e.target.value })} required>
                      <option value="">Select Donor</option>
                      {donors.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      {['Education','Health','Humanitarian Relief','Community Development','Infrastructure','Capacity Building'].map(c =>
                        <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Total Amount (USD) *</label>
                    <input type="number" value={form.totalAmount} onChange={e => setForm({ ...form, totalAmount: e.target.value })} required placeholder="50000" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fund Type</label>
                    <select value={form.fundType} onChange={e => setForm({ ...form, fundType: e.target.value })}>
                      <option value="Restricted">Restricted</option>
                      <option value="Unrestricted">Unrestricted</option>
                      <option value="Temporarily Restricted">Temporarily Restricted</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Project Manager</label>
                    <input value={form.projectManager} onChange={e => setForm({ ...form, projectManager: e.target.value })} placeholder="Name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reporting Frequency</label>
                    <select value={form.reportingFrequency} onChange={e => setForm({ ...form, reportingFrequency: e.target.value })}>
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Semi-Annual">Semi-Annual</option>
                      <option value="Annual">Annual</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Grant description..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-accent">Create Grant</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Grants;
