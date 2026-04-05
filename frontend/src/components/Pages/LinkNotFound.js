import React from 'react';
import { Link } from 'react-router-dom';
import './LinkNotFound.css';

function LinkNotFound() {
  return (
    <div className="link-not-found">
      <div className="link-not-found-content">
        <div className="link-not-found-icon">🔗</div>
        <h1>Nothing Here Yet</h1>
        <p>Sorry, this link doesn't lead anywhere right now.</p>
        <Link to="/home" className="link-not-found-button">
          Go Home
        </Link>
      </div>
    </div>
  );
}

export default LinkNotFound;
