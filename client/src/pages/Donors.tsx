import React, { useEffect, useState } from 'react';
import { donorAPI } from '../api';
import { Donor } from '../types';
import { Plus, Search, Mail, Globe, User, TrendingUp, X } from 'lucide-react';

const statusBadge = (s: string) => {
  const map: Record<string, string> = { Active: 'badge-success', Inactive: 'badge-neutral', Prospective: 'badge-info' };
  return map[s] || 'badge-neutral';
};
const typeBadge = (t: string) => {
  const map: Record<string, string> = { International: 'badge-info', NGO: 'badge-primary', 'Faith-Based': 'badge-accent', Local: 'badge-success', Government: 'badge-warning', Individual: 'badge-neutral' };
  return map[t] || 'badge-neutral';
};

const Donors: React.FC = () => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editDonor, setEditDonor] = useState<Donor | null>(null);
  const [form, setForm] = useState({ name: '', type: 'International', email: '', country: '', contactPerson: '', phone: '', notes: '' });

  const fetchDonors = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filterType) params.set('type', filterType);
    donorAPI.getAll(params.toString())
      .then(d => { setDonors(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchDonors(); }, [search, filterType]);

  const openCreate = () => {
    setEditDonor(null);
    setForm({ name: '', type: 'International', email: '', country: '', contactPerson: '', phone: '', notes: '' });
    setShowModal(true);
  };

  const openEdit = (d: Donor) => {
    setEditDonor(d);
    setForm({ name: d.name, type: d.type, email: d.email || '', country: d.country || '', contactPerson: d.contactPerson || '', phone: d.phone || '', notes: d.notes || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editDonor) {
        await donorAPI.update(editDonor._id, form);
      } else {
        await donorAPI.create(form);
      }
      setShowModal(false);
      fetchDonors();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this donor?')) return;
    await donorAPI.delete(id);
    fetchDonors();
  };

  if (loading) return <div className="page-container"><div className="loader"><div className="spinner"></div></div></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Donors</h1>
          <p className="page-subtitle">Manage donor profiles and track contributions</p>
        </div>
        <button className="btn btn-accent" onClick={openCreate}><Plus size={18} /> Add Donor</button>
      </div>

      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input type="text" placeholder="Search donors..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 38 }} />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          <option value="International">International</option>
          <option value="NGO">NGO</option>
          <option value="Faith-Based">Faith-Based</option>
          <option value="Local">Local</option>
          <option value="Government">Government</option>
          <option value="Individual">Individual</option>
        </select>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Donor</th>
              <th>Type</th>
              <th>Country</th>
              <th>Total Donated</th>
              <th>Active Grants</th>
              <th>Confidence</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {donors.map((d, i) => (
              <tr key={d._id} className="animate-fade-in" style={{ opacity: 0, animationDelay: `${i * 0.04}s` }}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="user-avatar" style={{ width: 36, height: 36, fontSize: '0.7rem' }}>
                      {d.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-semibold" style={{ fontSize: '0.875rem' }}>{d.name}</div>
                      {d.contactPerson && <div className="text-xs text-secondary">{d.contactPerson}</div>}
                    </div>
                  </div>
                </td>
                <td><span className={`badge ${typeBadge(d.type)}`}>{d.type}</span></td>
                <td><span className="text-secondary">{d.country || '—'}</span></td>
                <td><span className="font-semibold">${d.totalDonated.toLocaleString()}</span></td>
                <td><span className="text-accent font-semibold">{d.activeGrants}</span></td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="progress-bar" style={{ width: 60, height: 6 }}>
                      <div className={`progress-fill ${d.confidenceScore >= 80 ? 'green' : d.confidenceScore >= 60 ? 'gold' : 'red'}`}
                        style={{ width: `${d.confidenceScore}%` }}></div>
                    </div>
                    <span className="text-xs">{d.confidenceScore}%</span>
                  </div>
                </td>
                <td><span className={`badge ${statusBadge(d.status)}`}>{d.status}</span></td>
                <td>
                  <div className="flex gap-2">
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(d)}>Edit</button>
                    <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(d._id)}>Del</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {donors.length === 0 && <div className="empty-state"><h3>No donors found</h3><p className="text-secondary">Add your first donor to get started</p></div>}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editDonor ? 'Edit Donor' : 'Add New Donor'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Donor Name *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. World Council of Churches" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Type *</label>
                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                      <option value="International">International</option>
                      <option value="NGO">NGO</option>
                      <option value="Faith-Based">Faith-Based</option>
                      <option value="Local">Local</option>
                      <option value="Government">Government</option>
                      <option value="Individual">Individual</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Country</label>
                    <input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="e.g. Zimbabwe" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@donor.org" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Person</label>
                    <input value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} placeholder="Full name" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Additional notes..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-accent">{editDonor ? 'Update' : 'Create'} Donor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Donors;
