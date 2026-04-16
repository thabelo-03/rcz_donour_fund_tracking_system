import React, { useEffect, useState } from 'react';
import { transactionAPI, donorAPI, grantAPI } from '../api';
import { Transaction, Donor, Grant } from '../types';
import { Plus, Search, X, AlertTriangle, CheckCircle, Flag, ArrowUpDown } from 'lucide-react';

const statusBadge: Record<string, string> = {
  Pending: 'badge-warning', Approved: 'badge-info', Completed: 'badge-success',
  Rejected: 'badge-danger', Flagged: 'badge-danger'
};

const FundTracking: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [form, setForm] = useState({
    type: 'Donation Received', amount: '', description: '', category: 'Education',
    donor: '', grant: '', paymentMethod: 'Bank Transfer', reference: '', congregation: '', notes: ''
  });

  const fetchData = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filterType) params.set('type', filterType);
    if (filterStatus) params.set('status', filterStatus);
    Promise.all([
      transactionAPI.getAll(params.toString()),
      transactionAPI.getStats(),
      donorAPI.getAll(),
      grantAPI.getAll()
    ]).then(([txns, s, d, g]) => {
      setTransactions(txns);
      setStats(s);
      setDonors(d);
      setGrants(g);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [search, filterType, filterStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await transactionAPI.create({
        ...form, amount: Number(form.amount),
        status: 'Pending', approvalStatus: 'Pending Review',
        initiatedBy: 'Current User', initiatedDate: new Date()
      });
      setShowModal(false);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleApprove = async (id: string) => {
    await transactionAPI.approve(id, { approvalStatus: 'Approved', approvedBy: 'Current User' });
    fetchData();
  };

  const handleFlag = async (id: string) => {
    await transactionAPI.flag(id, { isFlagged: true, flagReason: 'Requires investigation', flaggedBy: 'Current User' });
    fetchData();
  };

  const handleReconcile = async (id: string) => {
    await transactionAPI.reconcile(id, 'Current User');
    fetchData();
  };

  const getDonorName = (d: any) => (typeof d === 'object' && d?.name) ? d.name : '—';
  const getGrantTitle = (g: any) => (typeof g === 'object' && g?.title) ? g.title : '—';
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  if (loading) return <div className="page-container"><div className="loader"><div className="spinner"></div></div></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fund Tracking</h1>
          <p className="page-subtitle">Real-time transaction ledger and fund traceability</p>
        </div>
        <button className="btn btn-accent" onClick={() => setShowModal(true)}><Plus size={18} /> New Transaction</button>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="kpi-grid" style={{ marginBottom: 20 }}>
          <div className="kpi-card green">
            <div className="kpi-icon green"><CheckCircle size={22} /></div>
            <div className="kpi-content">
              <div className="kpi-label">Total Received</div>
              <div className="kpi-value" style={{ fontSize: '1.3rem' }}>${stats.totalReceived?.toLocaleString()}</div>
            </div>
          </div>
          <div className="kpi-card gold">
            <div className="kpi-icon gold"><ArrowUpDown size={22} /></div>
            <div className="kpi-content">
              <div className="kpi-label">Total Expenditure</div>
              <div className="kpi-value" style={{ fontSize: '1.3rem' }}>${stats.totalExpenditure?.toLocaleString()}</div>
            </div>
          </div>
          <div className="kpi-card blue">
            <div className="kpi-icon blue"><CheckCircle size={22} /></div>
            <div className="kpi-content">
              <div className="kpi-label">Reconciled</div>
              <div className="kpi-value" style={{ fontSize: '1.3rem' }}>{stats.reconciledRate}%</div>
            </div>
          </div>
          <div className="kpi-card red">
            <div className="kpi-icon red"><AlertTriangle size={22} /></div>
            <div className="kpi-content">
              <div className="kpi-label">Flagged</div>
              <div className="kpi-value" style={{ fontSize: '1.3rem' }}>{stats.flaggedCount}</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input placeholder="Search transactions..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          <option value="Donation Received">Donation Received</option>
          <option value="Grant Disbursement">Grant Disbursement</option>
          <option value="Expenditure">Expenditure</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
          <option value="Flagged">Flagged</option>
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Category</th>
              <th>Donor</th>
              <th>Grant</th>
              <th>Status</th>
              <th>Reconciled</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, i) => (
              <tr key={tx._id} className="animate-fade-in" style={{ opacity: 0, animationDelay: `${i * 0.03}s` }}>
                <td><span className="text-xs" style={{ fontFamily: 'monospace', color: 'var(--text-tertiary)' }}>{tx.transactionId?.slice(0, 14)}</span></td>
                <td className="text-sm">{formatDate(tx.date)}</td>
                <td>
                  <span className={`badge ${tx.type === 'Expenditure' ? 'badge-warning' : tx.type === 'Donation Received' ? 'badge-success' : 'badge-info'}`} style={{ fontSize: '0.7rem' }}>
                    {tx.type}
                  </span>
                </td>
                <td>
                  <span className="font-bold" style={{ color: tx.type === 'Expenditure' ? 'var(--warning)' : 'var(--success)' }}>
                    {tx.type === 'Expenditure' ? '-' : '+'}${tx.amount.toLocaleString()}
                  </span>
                </td>
                <td className="text-sm text-secondary">{tx.category}</td>
                <td className="text-sm">{getDonorName(tx.donor)}</td>
                <td className="text-sm truncate" style={{ maxWidth: 140 }}>{getGrantTitle(tx.grant)}</td>
                <td><span className={`badge ${statusBadge[tx.status] || 'badge-neutral'}`}>{tx.status}</span></td>
                <td>
                  {tx.reconciled ?
                    <CheckCircle size={16} style={{ color: 'var(--success)' }} /> :
                    <span className="text-xs text-secondary">—</span>
                  }
                </td>
                <td>
                  <div className="flex gap-2">
                    {tx.status === 'Pending' && (
                      <button className="btn btn-primary btn-sm" style={{ padding: '4px 10px', fontSize: '0.7rem' }} onClick={() => handleApprove(tx._id)}>Approve</button>
                    )}
                    {!tx.isFlagged && tx.status !== 'Flagged' && (
                      <button className="btn btn-outline btn-sm" style={{ padding: '4px 8px', color: 'var(--danger)' }} title="Flag" onClick={() => handleFlag(tx._id)}>
                        <Flag size={13} />
                      </button>
                    )}
                    {!tx.reconciled && tx.status === 'Completed' && (
                      <button className="btn btn-outline btn-sm" style={{ padding: '4px 8px' }} title="Reconcile" onClick={() => handleReconcile(tx._id)}>
                        <CheckCircle size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length === 0 && <div className="empty-state"><h3>No transactions found</h3></div>}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3 className="modal-title">Record Transaction</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Transaction Type *</label>
                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                      <option value="Donation Received">Donation Received</option>
                      <option value="Grant Disbursement">Grant Disbursement</option>
                      <option value="Expenditure">Expenditure</option>
                      <option value="Transfer">Transfer</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Amount (USD) *</label>
                    <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required placeholder="0.00" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required placeholder="Transaction description" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Donor</label>
                    <select value={form.donor} onChange={e => setForm({ ...form, donor: e.target.value })}>
                      <option value="">Select Donor</option>
                      {donors.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Grant</label>
                    <select value={form.grant} onChange={e => setForm({ ...form, grant: e.target.value })}>
                      <option value="">Select Grant</option>
                      {grants.map(g => <option key={g._id} value={g._id}>{g.title}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      {['Education','Health','Humanitarian Relief','Community Development','Infrastructure','Capacity Building','Administrative','Other'].map(c =>
                        <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
                      {['Bank Transfer','Cash','Cheque','Mobile Money','Online'].map(m =>
                        <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Reference</label>
                  <input value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} placeholder="e.g. INV-2025-001" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-accent">Record Transaction</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FundTracking;
