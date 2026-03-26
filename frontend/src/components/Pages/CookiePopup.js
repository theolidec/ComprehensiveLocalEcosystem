import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './CookiePopup.css';

const CookiePopup = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
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
            We use cookies to ensure our Service works properly. By continuing to use our 
            application, you agree to our use of cookies as described in our{' '}
            <Link to="/cookies" onClick={() => setIsVisible(false)}>Cookie Policy</Link>.
          </p>
          <p className="cookie-popup-info">
            Essential cookies are used for authentication and session management. 
            They are httpOnly and secure.
          </p>
        </div>
        <div className="cookie-popup-actions">
          <button className="cookie-btn cookie-btn-accept" onClick={handleAccept}>
            Accept
          </button>
          <button className="cookie-btn cookie-btn-decline" onClick={handleDecline}>
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookiePopup;
