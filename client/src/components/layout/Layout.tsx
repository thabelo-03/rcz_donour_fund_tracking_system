import React from 'react';
import { useApp } from '../../context/AppContext';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { sidebarCollapsed } = useApp();

  return (
    <div className="app-layout">
      <Sidebar />
      <Header />
      <main className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
