import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './CookiePopup.css';

const CookiePopup = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const cookieNoticeSeen = localStorage.getItem('cookieNoticeSeen');
    if (!cookieNoticeSeen) {
      setIsVisible(true);
    }
  }, []);

  const handleAcknowledge = () => {
    localStorage.setItem('cookieNoticeSeen', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="cookie-popup-overlay">
      <div className="cookie-popup">
        <div className="cookie-popup-header">
          <h3>🍪 Cookie Notice</h3>
        </div>
        <div className="cookie-popup-content">
          <p>
            We use only <strong>strictly necessary cookies</strong> required to authenticate
            you and keep you signed in. No consent is required for these under the ePrivacy
            Directive — we are informing you, not asking permission.
          </p>
          <p>
            We also store a small amount of data in your browser's{' '}
            <code>localStorage</code> (theme preference, dismissal of this notice). We do not
            use advertising or third-party tracking cookies. Full details are in our{' '}
            <Link to="/cookies" onClick={() => setIsVisible(false)}>Cookie Policy</Link>.
          </p>
          <p className="cookie-popup-info">
            <strong>Note:</strong> Acknowledging this notice only dismisses it from view. It
            does not create a contract and does not waive your right to lodge a complaint
            with your supervisory authority.
          </p>
        </div>
        <div className="cookie-popup-actions">
          <button className="cookie-btn cookie-btn-accept" onClick={handleAcknowledge}>
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookiePopup;
