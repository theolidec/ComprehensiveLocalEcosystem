import React from 'react';
import { usePageActions } from '../../contexts/PageActionsContext';
import { ChevronRight } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ inline = false }) => {
  const { items, customContent, customContent2 } = usePageActions();

  if (inline) {
    return (
      <aside className="sidebar-inline">
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
        {customContent2 && (
          <div className="sidebar-custom-content sidebar-custom-content-2">
            {customContent2}
          </div>
        )}
      </aside>
    );
  }

  return (
    <aside className="sidebar">
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
      {customContent2 && (
        <div className="sidebar-custom-content sidebar-custom-content-2">
          {customContent2}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
