import React from 'react';

const Row = ({ children, className = '' }) => {
  return (
    <div className={`layout-row ${className}`} style={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
      {children}
    </div>
  );
};

export default Row;
