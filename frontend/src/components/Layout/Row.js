import React from 'react';

const Row = ({ children, className = '' }) => {
  return (
    <div className={`layout-row ${className}`}>
      {children}
    </div>
  );
};

export default Row;
