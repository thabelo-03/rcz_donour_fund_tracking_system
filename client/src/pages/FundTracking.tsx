import React, { useEffect, useState } from 'react';
import { transactionAPI, donorAPI, grantAPI, analysisAPI } from '../api';
import { Transaction, Donor, Grant } from '../types';
import { useApp } from '../context/AppContext';
import { Plus, Search, X, AlertTriangle, CheckCircle, Flag, ArrowUpDown, Brain, Loader, Zap, ShieldAlert } from 'lucide-react';

const statusBadge: Record<string, string> = {
  Pending: 'badge-warning', Approved: 'badge-info', Completed: 'badge-success',
  Rejected: 'badge-danger', Flagged: 'badge-danger'
};

const FundTracking: React.FC = () => {
  const { user } = useApp();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [batchAnalyzing, setBatchAnalyzing] = useState(false);
  const [batchResult, setBatchResult] = useState<any>(null);
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
        initiatedBy: user?.name || 'Current User', initiatedDate: new Date()
      });
      setShowModal(false);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleApprove = async (id: string) => {
    await transactionAPI.approve(id, { approvalStatus: 'Approved', approvedBy: user?.name || 'Current User' });
    fetchData();
  };

  const handleFlag = async (id: string) => {
    await transactionAPI.flag(id, { isFlagged: true, flagReason: 'Requires investigation', flaggedBy: user?.name || 'Current User' });
    fetchData();
  };

  const handleReconcile = async (id: string) => {
    await transactionAPI.reconcile(id, user?.name || 'Current User');
    fetchData();
  };

  // AI Analysis — single transaction
  const handleAIAnalyze = async (id: string) => {
    setAnalyzingId(id);
    setAnalysisResult(null);
    try {
      const result = await analysisAPI.analyzeTransaction(id, user?.name || 'System', user?.role || 'admin');
      setAnalysisResult(result);
      fetchData(); // Refresh to show any auto-flagged updates
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzingId(null);
    }
  };

  // AI Batch Analysis
  const handleBatchAnalyze = async () => {
    setBatchAnalyzing(true);
    setBatchResult(null);
    try {
      const result = await analysisAPI.batchAnalyze(user?.name || 'System', user?.role || 'admin');
      setBatchResult(result);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setBatchAnalyzing(false);
    }
  };

  const getDonorName = (d: any) => (typeof d === 'object' && d?.name) ? d.name : '—';
  const getGrantTitle = (g: any) => (typeof g === 'object' && g?.title) ? g.title : '—';
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
  const riskColor = (level: string) => {
    const map: Record<string, string> = { Low: 'var(--success)', Medium: 'var(--info)', High: 'var(--warning)', Critical: 'var(--danger)' };
    return map[level] || 'var(--text-tertiary)';
  };

  const isAdmin = user?.role === 'admin';
  const isFinance = user?.role === 'finance_officer';
  const isTreasurer = user?.role === 'treasurer';
  const isProjectManager = user?.role === 'project_manager';

  const canAddTx = isAdmin || isFinance || isProjectManager;
  const canApprove = isAdmin || isFinance;
  const canFlag = isAdmin || isFinance || isTreasurer || isProjectManager;
  const canReconcile = isAdmin || isFinance;
  const canAnalyze = isAdmin || isFinance || isTreasurer || isProjectManager;

  if (loading) return <div className="page-container"><div className="loader"><div className="spinner"></div></div></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fund Tracking</h1>
          <p className="page-subtitle">Real-time transaction ledger with AI-powered risk analysis</p>
        </div>
        <div className="flex gap-3">
          {canAnalyze && (
            <button className="btn btn-outline" onClick={handleBatchAnalyze} disabled={batchAnalyzing}>
              {batchAnalyzing ? <Loader size={18} className="spin" /> : <Brain size={18} />}
              {batchAnalyzing ? 'Analyzing...' : 'AI Batch Analysis'}
            </button>
          )}
          {canAddTx && (
            <button className="btn btn-accent" onClick={() => setShowModal(true)}><Plus size={18} /> New Transaction</button>
          )}
        </div>
      </div>

      {/* Batch Analysis Result Banner */}
      {batchResult && (
        <div className="card animate-scale-in" style={{
          marginBottom: 20, borderColor: batchResult.flaggedCount > 0 ? 'var(--warning)' : 'var(--success)',
          background: batchResult.flaggedCount > 0 ? 'rgba(245,158,11,0.05)' : 'rgba(16,185,129,0.05)'
        }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain size={22} style={{ color: 'var(--accent)' }} />
              <div>
                <div className="font-bold">AI Batch Analysis Complete</div>
                <div className="text-sm text-secondary">
                  Analyzed {batchResult.totalAnalyzed} transactions — <span style={{ color: batchResult.flaggedCount > 0 ? 'var(--warning)' : 'var(--success)' }}>
                    {batchResult.flaggedCount} flagged for review
                  </span>
                </div>
              </div>
            </div>
            <button className="modal-close" onClick={() => setBatchResult(null)}><X size={18} /></button>
          </div>
        </div>
      )}

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
              <React.Fragment key={tx._id}>
                <tr className="animate-fade-in" style={{ opacity: 0, animationDelay: `${i * 0.03}s` }}>
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
                      {/* AI Analyze Button */}
                      {canAnalyze && (
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ padding: '4px 8px', color: 'var(--accent)' }}
                          title="AI Risk Analysis"
                          onClick={() => handleAIAnalyze(tx._id)}
                          disabled={analyzingId === tx._id}
                        >
                          {analyzingId === tx._id ? <Loader size={13} /> : <Brain size={13} />}
                        </button>
                      )}
                      {canApprove && tx.status === 'Pending' && (
                        <button className="btn btn-primary btn-sm" style={{ padding: '4px 10px', fontSize: '0.7rem' }} onClick={() => handleApprove(tx._id)}>Approve</button>
                      )}
                      {canFlag && !tx.isFlagged && tx.status !== 'Flagged' && (
                        <button className="btn btn-outline btn-sm" style={{ padding: '4px 8px', color: 'var(--danger)' }} title="Flag" onClick={() => handleFlag(tx._id)}>
                          <Flag size={13} />
                        </button>
                      )}
                      {canReconcile && !tx.reconciled && tx.status === 'Completed' && (
                        <button className="btn btn-outline btn-sm" style={{ padding: '4px 8px' }} title="Reconcile" onClick={() => handleReconcile(tx._id)}>
                          <CheckCircle size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>

                {/* AI Analysis Result Row */}
                {analysisResult && analysisResult.transaction?.id === tx._id && (
                  <tr>
                    <td colSpan={10} style={{ padding: 0 }}>
                      <div className="animate-scale-in" style={{
                        margin: '0 16px 12px',
                        padding: 20,
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${riskColor(analysisResult.analysis.riskLevel)}30`
                      }}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <ShieldAlert size={20} style={{ color: riskColor(analysisResult.analysis.riskLevel) }} />
                            <div>
                              <span className="font-bold">AI Risk Assessment</span>
                              <span className="badge" style={{
                                marginLeft: 8,
                                background: `${riskColor(analysisResult.analysis.riskLevel)}18`,
                                color: riskColor(analysisResult.analysis.riskLevel)
                              }}>
                                {analysisResult.analysis.riskLevel} Risk — {analysisResult.analysis.riskScore}/100
                              </span>
                              <span className="badge badge-neutral" style={{ marginLeft: 6, fontSize: '0.6rem' }}>
                                {analysisResult.analysis.analysisMethod === 'gemini-ai' ? '🤖 Gemini AI' : '📐 Rule-Based'}
                              </span>
                            </div>
                          </div>
                          <button className="modal-close" onClick={() => setAnalysisResult(null)}><X size={16} /></button>
                        </div>

                        <p className="text-sm" style={{ marginBottom: 12 }}>{analysisResult.analysis.summary}</p>

                        {analysisResult.analysis.anomalies?.length > 0 && (
                          <div style={{ marginBottom: 12 }}>
                            <div className="text-xs font-semibold" style={{ color: 'var(--warning)', marginBottom: 6 }}>⚠ Anomalies Detected</div>
                            {analysisResult.analysis.anomalies.map((a: string, i: number) => (
                              <div key={i} className="text-sm text-secondary" style={{ paddingLeft: 12, borderLeft: '2px solid var(--warning)', marginBottom: 4 }}>
                                {a}
                              </div>
                            ))}
                          </div>
                        )}

                        {analysisResult.analysis.complianceIssues?.length > 0 && (
                          <div style={{ marginBottom: 12 }}>
                            <div className="text-xs font-semibold" style={{ color: 'var(--danger)', marginBottom: 6 }}>🚨 Compliance Issues</div>
                            {analysisResult.analysis.complianceIssues.map((c: string, i: number) => (
                              <div key={i} className="text-sm text-secondary" style={{ paddingLeft: 12, borderLeft: '2px solid var(--danger)', marginBottom: 4 }}>
                                {c}
                              </div>
                            ))}
                          </div>
                        )}

                        {analysisResult.analysis.recommendations?.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold" style={{ color: 'var(--info)', marginBottom: 6 }}>💡 Recommendations</div>
                            {analysisResult.analysis.recommendations.map((r: string, i: number) => (
                              <div key={i} className="text-sm text-secondary" style={{ paddingLeft: 12, borderLeft: '2px solid var(--info)', marginBottom: 4 }}>
                                {r}
                              </div>
                            ))}
                          </div>
                        )}

                        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                          {/* Risk bar visualization */}
                          <div style={{ flex: 1 }}>
                            <div className="text-xs text-secondary mb-2">Risk Score</div>
                            <div className="progress-bar" style={{ height: 10 }}>
                              <div className={`progress-fill ${analysisResult.analysis.riskScore >= 70 ? 'red' : analysisResult.analysis.riskScore >= 40 ? 'gold' : 'green'}`}
                                style={{ width: `${analysisResult.analysis.riskScore}%` }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
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
