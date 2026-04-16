import React from 'react';
import { useApp } from '../../context/AppContext';
import { Search, Bell, LogOut } from 'lucide-react';

const Header: React.FC = () => {
  const { user, logout, sidebarCollapsed } = useApp();

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const formatRole = (role: string) =>
    role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <header className={`header ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="header-search">
        <Search size={18} />
        <input type="text" placeholder="Search donors, grants, transactions..." />
      </div>

      <div className="header-actions">
        <button className="header-btn" title="Notifications">
          <Bell size={20} />
          <span className="badge"></span>
        </button>

        <div className="user-profile">
          <div className="user-avatar">
            {user ? getInitials(user.name) : 'U'}
          </div>
          <div className="user-info">
            <div className="name">{user?.name || 'User'}</div>
            <div className="role">{user ? formatRole(user.role) : ''}</div>
          </div>
        </div>

        <button className="header-btn" onClick={logout} title="Logout">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
