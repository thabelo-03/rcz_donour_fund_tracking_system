import React, { useEffect, useState, useRef } from 'react';
import { reportAPI } from '../api';
import { DashboardStats } from '../types';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { DollarSign, Users, FileText, TrendingUp, AlertTriangle, CheckCircle, Clock, Shield } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler);

const AnimatedNumber: React.FC<{ value: number; prefix?: string; duration?: number }> = ({ value, prefix = '', duration = 1200 }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);
  useEffect(() => {
    const start = ref.current;
    const diff = value - start;
    const steps = 40;
    const stepTime = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (step >= steps) {
        clearInterval(timer);
        setDisplay(value);
        ref.current = value;
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <>{prefix}{display.toLocaleString()}</>;
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportAPI.getDashboard()
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-container"><div className="loader"><div className="spinner"></div></div></div>;
  if (!stats) return <div className="page-container"><div className="empty-state"><h3>Unable to load dashboard</h3></div></div>;

  const monthLabels = stats.byMonth.map(m => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[m._id.month - 1]} ${m._id.year}`;
  });

  const categoryColors = ['#10B981','#3B82F6','#F59E0B','#EF4444','#8B5CF6','#EC4899'];

  const doughnutData = {
    labels: stats.byCategory.map(c => c._id),
    datasets: [{
      data: stats.byCategory.map(c => c.total),
      backgroundColor: categoryColors.slice(0, stats.byCategory.length),
      borderWidth: 0,
      hoverOffset: 8
    }]
  };

  const lineData = {
    labels: monthLabels,
    datasets: [
      {
        label: 'Received',
        data: stats.byMonth.map(m => m.received),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16,185,129,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: 'Spent',
        data: stats.byMonth.map(m => m.spent),
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245,158,11,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { color: '#94A3B8', padding: 16, usePointStyle: true, font: { size: 12 } } }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748B', font: { size: 11 } } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748B', font: { size: 11 }, callback: (v: any) => `$${(v / 1000).toFixed(0)}k` } }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { position: 'bottom' as const, labels: { color: '#94A3B8', padding: 12, usePointStyle: true, font: { size: 11 } } }
    }
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const severityColor = (s: string) => {
    const map: Record<string, string> = { Low: 'var(--text-tertiary)', Medium: 'var(--info)', High: 'var(--warning)', Critical: 'var(--danger)' };
    return map[s] || 'var(--text-tertiary)';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of donor fund tracking and grant management</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card green animate-fade-in stagger-1" style={{ opacity: 0 }}>
          <div className="kpi-icon green"><DollarSign size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Total Funds Received</div>
            <div className="kpi-value"><AnimatedNumber value={stats.totalReceived} prefix="$" /></div>
            <span className="kpi-change positive">
              <TrendingUp size={12} /> Active tracking
            </span>
          </div>
        </div>
        <div className="kpi-card gold animate-fade-in stagger-2" style={{ opacity: 0 }}>
          <div className="kpi-icon gold"><FileText size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Active Grants</div>
            <div className="kpi-value"><AnimatedNumber value={stats.activeGrants} /></div>
            <span className="kpi-change positive">
              {stats.totalGrants} total grants
            </span>
          </div>
        </div>
        <div className="kpi-card blue animate-fade-in stagger-3" style={{ opacity: 0 }}>
          <div className="kpi-icon blue"><Users size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Active Donors</div>
            <div className="kpi-value"><AnimatedNumber value={stats.totalDonors} /></div>
            <span className="kpi-change positive">
              <CheckCircle size={12} /> Partner network
            </span>
          </div>
        </div>
        <div className="kpi-card red animate-fade-in stagger-4" style={{ opacity: 0 }}>
          <div className="kpi-icon red"><AlertTriangle size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Pending Approvals</div>
            <div className="kpi-value"><AnimatedNumber value={stats.pendingApprovals} /></div>
            {stats.flaggedTransactions > 0 && (
              <span className="kpi-change negative">
                <AlertTriangle size={12} /> {stats.flaggedTransactions} flagged
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Financial Summary Bar */}
      <div className="card animate-fade-in" style={{ marginBottom: 20, opacity: 0, animationDelay: '0.25s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div className="text-xs text-secondary mb-2">Total Received</div>
            <div className="font-bold" style={{ fontSize: '1.2rem', color: 'var(--success)' }}>${stats.totalReceived.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-secondary mb-2">Total Spent</div>
            <div className="font-bold" style={{ fontSize: '1.2rem', color: 'var(--warning)' }}>${stats.totalSpent.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-secondary mb-2">Balance Available</div>
            <div className="font-bold" style={{ fontSize: '1.2rem', color: 'var(--info)' }}>${stats.balance.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-secondary mb-2">Utilization Rate</div>
            <div className="font-bold" style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>
              {stats.totalReceived > 0 ? Math.round((stats.totalSpent / stats.totalReceived) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="data-grid" style={{ marginBottom: 24 }}>
        <div className="card animate-fade-in" style={{ opacity: 0, animationDelay: '0.3s' }}>
          <div className="card-header">
            <h3 className="card-title">Monthly Fund Flow</h3>
            <span className="badge badge-info">Trend</span>
          </div>
          <div className="chart-container">
            <Line data={lineData} options={chartOptions} />
          </div>
        </div>
        <div className="card animate-fade-in" style={{ opacity: 0, animationDelay: '0.35s' }}>
          <div className="card-header">
            <h3 className="card-title">Fund Allocation by Category</h3>
            <span className="badge badge-accent">Distribution</span>
          </div>
          <div className="chart-container">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Recent Activity & Audit */}
      <div className="data-grid">
        <div className="card animate-fade-in" style={{ opacity: 0, animationDelay: '0.4s' }}>
          <div className="card-header">
            <h3 className="card-title">Recent Transactions</h3>
            <span className="badge badge-primary">{stats.recentTransactions.length}</span>
          </div>
          <div className="activity-feed">
            {stats.recentTransactions.slice(0, 6).map((tx, i) => (
              <div className="activity-item" key={i}>
                <div className="activity-dot" style={{
                  background: tx.type === 'Expenditure' ? 'var(--warning)' :
                    tx.type === 'Donation Received' ? 'var(--success)' : 'var(--info)'
                }}></div>
                <div style={{ flex: 1 }}>
                  <div className="activity-text">
                    <strong style={{ color: tx.type === 'Expenditure' ? 'var(--warning)' : 'var(--success)' }}>
                      ${tx.amount.toLocaleString()}
                    </strong> — {tx.description.slice(0, 50)}
                  </div>
                  <div className="activity-time">
                    {tx.type} · {formatTime(tx.date || tx.createdAt || '')}
                  </div>
                </div>
                <span className={`badge badge-${tx.status === 'Completed' ? 'success' : tx.status === 'Flagged' ? 'danger' : 'warning'}`} style={{ fontSize: '0.65rem' }}>
                  {tx.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card animate-fade-in" style={{ opacity: 0, animationDelay: '0.45s' }}>
          <div className="card-header">
            <h3 className="card-title">Audit Activity</h3>
            <Shield size={18} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <div className="activity-feed">
            {stats.recentAudit.slice(0, 6).map((entry, i) => (
              <div className="activity-item" key={i}>
                <div className="activity-dot" style={{ background: severityColor(entry.severity) }}></div>
                <div style={{ flex: 1 }}>
                  <div className="activity-text">{entry.description}</div>
                  <div className="activity-time">
                    {entry.performedBy} · {formatTime(entry.timestamp)}
                  </div>
                </div>
                <span className={`badge badge-${entry.severity === 'Critical' ? 'danger' : entry.severity === 'High' ? 'warning' : 'neutral'}`} style={{ fontSize: '0.65rem' }}>
                  {entry.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
