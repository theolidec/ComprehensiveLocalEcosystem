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
    customContent2: null,
    isOpen: false
  });

  const registerPageActions = useCallback((newActions, customContent = null, customContent2 = null) => {
    setActions({
      items: newActions,
      customContent,
      customContent2,
      isOpen: newActions.length > 0 || customContent !== null || customContent2 !== null
    });
  }, []);

  const clearPageActions = useCallback(() => {
    setActions({ items: [], customContent: null, customContent2: null, isOpen: false });
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
