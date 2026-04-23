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
            We use essential cookies to ensure our Service works properly. These cookies are 
            required for authentication and session management. By continuing to use our 
            application, you agree to our use of cookies as described in our{' '}
            <Link to="/cookies" onClick={() => setIsVisible(false)}>Cookie Policy</Link>.
          </p>
          <p className="cookie-popup-info">
            <strong>Note:</strong> Essential cookies cannot be declined as they are necessary 
            for the Service to function. They are httpOnly and secure.
          </p>
        </div>
        <div className="cookie-popup-actions">
          <button className="cookie-btn cookie-btn-accept" onClick={handleAccept}>
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookiePopup;
