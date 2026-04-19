import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { usePageActions } from '../../contexts/PageActionsContext';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronRight, Clock } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ inline = false }) => {
  const { items, customContent } = usePageActions();
  const location = useLocation();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  const isHomePage = location.pathname === '/home' || location.pathname === '/';

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (inline) {
    return (
      <aside className="sidebar-inline">
        {isHomePage && (
          <div className="sidebar-welcome" style={{ padding: '16px', borderBottom: '1px solid var(--border-color, #e5e7eb)' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary, #111827)', marginBottom: '4px' }}>
              Welcome, {user?.name?.split(' ')[0] || 'User'}!
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary, #6b7280)', fontSize: '0.875rem' }}>
              <Clock size={14} />
              <span>{formatTime(currentTime)} · {formatDate(currentTime)}</span>
            </div>
          </div>
        )}
        <nav className="sidebar-nav">
          {items.map((action, index) => (
            <button
              key={index}
              className={`sidebar-action ${action.variant || 'default'}`}
              onClick={() => action.onClick?.()}
              title={action.label}
            >
              {action.icon && <span className="action-icon">{action.icon}</span>}
              <span className="action-label">{action.label}</span>
              {action.submenu && (
                <ChevronRight size={14} className="action-chevron" />
              )}
            </button>
          ))}
        </nav>
        {customContent && (
          <div className="sidebar-custom-content">
            {customContent}
          </div>
        )}
      </aside>
    );
  }

  return (
    <aside className="sidebar">
      {isHomePage && (
        <div className="sidebar-welcome" style={{ padding: '16px', borderBottom: '1px solid var(--border-color, #e5e7eb)' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary, #111827)', marginBottom: '4px' }}>
            Welcome, {user?.name?.split(' ')[0] || 'User'}!
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary, #6b7280)', fontSize: '0.875rem' }}>
            <Clock size={14} />
            <span>{formatTime(currentTime)} · {formatDate(currentTime)}</span>
          </div>
        </div>
      )}
      <nav className="sidebar-nav">
        {items.map((action, index) => (
          <button
            key={index}
            className={`sidebar-action ${action.variant || 'default'}`}
            onClick={() => action.onClick?.()}
            title={action.label}
          >
            {action.icon && <span className="action-icon">{action.icon}</span>}
            <span className="action-label">{action.label}</span>
            {action.submenu && (
              <ChevronRight size={14} className="action-chevron" />
            )}
          </button>
        ))}
      </nav>
      {customContent && (
        <div className="sidebar-custom-content">
          {customContent}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
