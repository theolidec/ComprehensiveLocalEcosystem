import React, { createContext, useContext, useState, useCallback } from 'react';

const PageActionsContext = createContext(null);

export const usePageActions = () => {
  const context = useContext(PageActionsContext);
  if (!context) {
    throw new Error('usePageActions must be used within a PageActionsProvider');
  }
  return context;
};

export const PageActionsProvider = ({ children }) => {
  const [actions, setActions] = useState({
    items: [],
    customContent: null,
    isOpen: false
  });

  const registerPageActions = useCallback((newActions, customContent = null) => {
    setActions({
      items: newActions,
      customContent,
      isOpen: newActions.length > 0 || customContent !== null
    });
  }, []);

  const clearPageActions = useCallback(() => {
    setActions({ items: [], customContent: null, isOpen: false });
  }, []);

  const toggleSidebar = useCallback(() => {
    setActions(prev => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  const value = {
    ...actions,
    registerPageActions,
    clearPageActions,
    toggleSidebar
  };

  return (
    <PageActionsContext.Provider value={value}>
      {children}
    </PageActionsContext.Provider>
  );
};
