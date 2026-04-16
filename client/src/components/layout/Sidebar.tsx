import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard, Users, FileText, ArrowLeftRight,
  ClipboardList, Shield, Settings, ChevronLeft, ChevronRight, Church
} from 'lucide-react';

const navItems = [
  { label: 'Overview', items: [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  ]},
  { label: 'Fund Management', items: [
    { path: '/donors', icon: Users, label: 'Donors' },
    { path: '/grants', icon: FileText, label: 'Grants' },
    { path: '/transactions', icon: ArrowLeftRight, label: 'Fund Tracking' },
  ]},
  { label: 'Governance', items: [
    { path: '/reports', icon: ClipboardList, label: 'Reports' },
    { path: '/audit', icon: Shield, label: 'Audit Trail' },
  ]},
  { label: 'System', items: [
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]},
];

const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useApp();
  const location = useLocation();

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Church size={20} color="white" />
        </div>
        {!sidebarCollapsed && (
          <div className="brand-text">
            <h1>RCZ Tracker</h1>
            <span>Donor Fund Management</span>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.label}>
            {!sidebarCollapsed && (
              <div className="nav-section-label">{section.label}</div>
            )}
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon size={20} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          {!sidebarCollapsed && <span style={{ marginLeft: 8, fontSize: '0.825rem' }}>Collapse</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
