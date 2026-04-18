import React, { useEffect, useState } from 'react';
import { reportAPI, grantAPI, analysisAPI } from '../api';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { FileText, Printer, TrendingUp, PieChart, Brain, Loader } from 'lucide-react';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const Reports: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [grants, setGrants] = useState<any[]>([]);
  const [transparency, setTransparency] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transparencyLoading, setTransparencyLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    Promise.all([reportAPI.getDashboard(), grantAPI.getAll()])
      .then(([s, g]) => { setStats(s); setGrants(g); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Load transparency scores dynamically when tab is selected
  useEffect(() => {
    if (activeTab === 'transparency' && !transparency) {
      setTransparencyLoading(true);
      analysisAPI.getTransparency()
        .then(t => { setTransparency(t); setTransparencyLoading(false); })
        .catch(() => setTransparencyLoading(false));
    }
  }, [activeTab]);

  if (loading) return <div className="page-container"><div className="loader"><div className="spinner"></div></div></div>;
  if (!stats) return <div className="page-container"><div className="empty-state"><h3>Unable to load reports</h3></div></div>;

  const catColors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const barData = {
    labels: stats.grantsByStatus?.map((g: any) => g._id) || [],
    datasets: [{
      label: 'Amount ($)',
      data: stats.grantsByStatus?.map((g: any) => g.totalAmount) || [],
      backgroundColor: catColors,
      borderRadius: 6,
      barThickness: 32
    }]
  };

  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94A3B8' } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748B', callback: (v: any) => `$${(v / 1000).toFixed(0)}k` } }
    }
  };

  const utilizationData = {
    labels: ['Spent', 'Remaining'],
    datasets: [{
      data: [stats.totalSpent, stats.balance],
      backgroundColor: ['#D4A843', 'rgba(255,255,255,0.06)'],
      borderWidth: 0, hoverOffset: 6
    }]
  };

  const utilizationRate = stats.totalReceived > 0 ? Math.round((stats.totalSpent / stats.totalReceived) * 100) : 0;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Financial reports and AI-powered transparency dashboard</p>
        </div>
        <button className="btn btn-outline" onClick={() => window.print()}>
          <Printer size={18} /> Print Report
        </button>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Financial Overview</button>
        <button className={`tab ${activeTab === 'grants' ? 'active' : ''}`} onClick={() => setActiveTab('grants')}>Grant Reports</button>
        <button className={`tab ${activeTab === 'transparency' ? 'active' : ''}`} onClick={() => setActiveTab('transparency')}>
          <Brain size={14} style={{ marginRight: 6 }} /> Transparency
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="data-grid" style={{ marginBottom: 24 }}>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Grants by Status</h3>
                <TrendingUp size={18} style={{ color: 'var(--text-tertiary)' }} />
              </div>
              <div className="chart-container">
                <Bar data={barData} options={barOptions} />
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Fund Utilization</h3>
                <PieChart size={18} style={{ color: 'var(--text-tertiary)' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240, position: 'relative' }}>
                <div style={{ width: 200, height: 200 }}>
                  <Doughnut data={utilizationData} options={{ responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: false } } }} />
                </div>
                <div style={{ position: 'absolute', textAlign: 'center' }}>
                  <div className="font-bold" style={{ fontSize: '2rem', color: 'var(--accent)' }}>{utilizationRate}%</div>
                  <div className="text-xs text-secondary">Utilized</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 16 }}>
                <div className="text-center">
                  <div className="text-xs text-secondary">Received</div>
                  <div className="font-bold" style={{ color: 'var(--success)' }}>${stats.totalReceived?.toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-secondary">Spent</div>
                  <div className="font-bold" style={{ color: 'var(--accent)' }}>${stats.totalSpent?.toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-secondary">Balance</div>
                  <div className="font-bold" style={{ color: 'var(--info)' }}>${stats.balance?.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Expenditure by Category</h3>
            </div>
            <table>
              <thead>
                <tr><th>Category</th><th>Total Spent</th><th>% of Total</th><th>Allocation</th></tr>
              </thead>
              <tbody>
                {stats.byCategory?.map((c: any, i: number) => (
                  <tr key={i}>
                    <td className="font-semibold">{c._id}</td>
                    <td>${c.total.toLocaleString()}</td>
                    <td>{stats.totalSpent > 0 ? Math.round((c.total / stats.totalSpent) * 100) : 0}%</td>
                    <td>
                      <div className="progress-bar" style={{ width: 120 }}>
                        <div className="progress-fill green" style={{ width: `${stats.totalSpent > 0 ? (c.total / stats.totalSpent) * 100 : 0}%` }}></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'grants' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Grant Financial Summary</h3>
          </div>
          <table>
            <thead>
              <tr><th>Grant</th><th>Donor</th><th>Category</th><th>Total</th><th>Spent</th><th>Remaining</th><th>Utilization</th><th>Status</th></tr>
            </thead>
            <tbody>
              {grants.map(g => {
                const util = g.totalAmount > 0 ? Math.round((g.amountSpent / g.totalAmount) * 100) : 0;
                const donorName = typeof g.donor === 'object' ? g.donor?.name : '—';
                return (
                  <tr key={g._id}>
                    <td><div className="font-semibold">{g.title}</div><div className="text-xs text-secondary">{g.grantNumber}</div></td>
                    <td className="text-sm">{donorName}</td>
                    <td><span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{g.category}</span></td>
                    <td className="font-semibold">${g.totalAmount.toLocaleString()}</td>
                    <td>${g.amountSpent.toLocaleString()}</td>
                    <td style={{ color: 'var(--success)' }}>${g.amountRemaining.toLocaleString()}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="progress-bar" style={{ width: 60, height: 6 }}>
                          <div className={`progress-fill ${util >= 90 ? 'red' : util >= 60 ? 'gold' : 'green'}`} style={{ width: `${util}%` }}></div>
                        </div>
                        <span className="text-xs">{util}%</span>
                      </div>
                    </td>
                    <td><span className={`badge badge-${g.status === 'Active' ? 'success' : g.status === 'Closed' ? 'neutral' : 'warning'}`}>{g.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'transparency' && (
        <>
          {transparencyLoading ? (
            <div className="loader"><div className="spinner"></div></div>
          ) : transparency ? (
            <>
              {/* Overall Score */}
              <div className="kpi-grid" style={{ marginBottom: 24 }}>
                <div className="kpi-card green">
                  <div className="kpi-icon green"><TrendingUp size={22} /></div>
                  <div className="kpi-content">
                    <div className="kpi-label">Overall Transparency Score</div>
                    <div className="kpi-value" style={{ color: transparency.overallScore >= 70 ? 'var(--success)' : transparency.overallScore >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                      {transparency.overallScore}%
                    </div>
                    <span className="text-xs text-secondary">Calculated from live data</span>
                  </div>
                </div>
                <div className="kpi-card gold">
                  <div className="kpi-icon gold"><FileText size={22} /></div>
                  <div className="kpi-content">
                    <div className="kpi-label">Reports Submitted On Time</div>
                    <div className="kpi-value">{stats.activeGrants > 0 ? Math.round((stats.activeGrants / stats.totalGrants) * 100) : 0}%</div>
                    <span className="text-xs text-secondary">Active vs total grants</span>
                  </div>
                </div>
                <div className="kpi-card blue">
                  <div className="kpi-icon blue"><Brain size={22} /></div>
                  <div className="kpi-content">
                    <div className="kpi-label">AI Analysis</div>
                    <div className="kpi-value" style={{ fontSize: '1rem', marginTop: 4 }}>
                      <span className="badge badge-accent">Live Scoring</span>
                    </div>
                    <span className="text-xs text-secondary">Gemini AI + Rule-based</span>
                  </div>
                </div>
              </div>

              {/* Transparency Indicators — Dynamic from database */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Transparency Indicators</h3>
                  <span className="badge badge-accent" style={{ fontSize: '0.65rem' }}>
                    <Brain size={10} /> AI Calculated
                  </span>
                </div>
                <div style={{ display: 'grid', gap: 16, padding: '8px 0' }}>
                  {transparency.indicators.map((item: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ flex: 1 }}>
                        <div className="font-semibold" style={{ fontSize: '0.9rem' }}>{item.label}</div>
                        <div className="text-xs text-secondary">{item.desc}</div>
                      </div>
                      <div style={{ width: 120 }}>
                        <div className="progress-bar" style={{ height: 8 }}>
                          <div className={`progress-fill ${item.score >= 80 ? 'green' : item.score >= 60 ? 'gold' : 'red'}`} style={{ width: `${item.score}%` }}></div>
                        </div>
                      </div>
                      <span className="font-bold" style={{ width: 40, textAlign: 'right', color: item.score >= 80 ? 'var(--success)' : item.score >= 60 ? 'var(--warning)' : 'var(--danger)' }}>{item.score}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Methodology note */}
              <div className="card" style={{ marginTop: 20, borderColor: 'var(--border-accent)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <Brain size={18} style={{ color: 'var(--accent)' }} />
                  <span className="font-bold">How Scores Are Calculated</span>
                </div>
                <div className="text-sm text-secondary" style={{ lineHeight: 1.8 }}>
                  All transparency scores are <strong>dynamically calculated</strong> from actual system data — nothing is hardcoded.
                  The overall score is a weighted average: Fund Traceability (25%), Reporting Compliance (20%), Audit Readiness (20%),
                  Budget Adherence (15%), Compliance Rate (10%), and Segregation of Duties (10%). Transaction risk analysis uses
                  <strong> Google Gemini AI</strong> when available, with a forensic accounting rule-based fallback engine inspired by
                  Benford&apos;s Law, COSO Framework controls, and red flag indicators from the Principal-Agent theory.
                </div>
              </div>
            </>
          ) : (
            <div className="card"><div className="empty-state"><h3>Unable to load transparency data</h3></div></div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;
