import React, { createContext, useContext, useState, useCallback } from 'react';

const CalendarActionsContext = createContext(null);

export const useCalendarActions = () => {
  const context = useContext(CalendarActionsContext);
  if (!context) {
    throw new Error('useCalendarActions must be used within a CalendarActionsProvider');
  }
  return context;
};

export const CalendarActionsProvider = ({ children }) => {
  const [actions, setActions] = useState({
    onImport: null,
    onExport: null,
    onCreateTestEvents: null,
    onRemoveTestEvents: null,
    onAddEvent: null,
    fileInputRef: null
  });

  const [isCalendarPage, setIsCalendarPage] = useState(false);

  const registerActions = useCallback((newActions) => {
    setActions(newActions);
  }, []);

  const clearActions = useCallback(() => {
    setActions({
      onImport: null,
      onExport: null,
      onCreateTestEvents: null,
      onRemoveTestEvents: null,
      onAddEvent: null,
      fileInputRef: null
    });
  }, []);

  const value = {
    ...actions,
    registerActions,
    clearActions,
    isCalendarPage,
    setIsCalendarPage
  };

  return (
    <CalendarActionsContext.Provider value={value}>
      {children}
    </CalendarActionsContext.Provider>
  );
};
