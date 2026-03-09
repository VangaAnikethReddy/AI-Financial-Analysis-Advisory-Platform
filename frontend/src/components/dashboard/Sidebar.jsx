import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { TrendingUp, LayoutDashboard, Upload, FileText, LogOut } from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const loc = useLocation();
  const active = path => loc.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon"><TrendingUp size={18} /></div>
        <div>
          <div className="logo-text">FinInsight AI</div>
          <div className="logo-sub">Financial Analysis & Advisory Platform</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <Link to="/"        className={active('/')}>       <LayoutDashboard size={16}/> Dashboard </Link>
        <Link to="/upload"  className={active('/upload')}>  <Upload size={16}/>         Upload Data</Link>
        <Link to="/reports" className={active('/reports')}> <FileText size={16}/>       My Reports </Link>
      </nav>

      <div className="sidebar-user">
        <div className="user-chip">
          <div className="avatar">{user?.full_name?.[0]?.toUpperCase() || 'U'}</div>
          <div style={{minWidth:0}}>
            <div className="user-name">{user?.full_name}</div>
            <div className="user-email">{user?.company || user?.email}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={logout}>
          <LogOut size={14}/> Sign Out
        </button>
      </div>
    </aside>
  );
}
