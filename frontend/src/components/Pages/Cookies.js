import React from 'react';
import { Link } from 'react-router-dom';

const Cookies = () => {
  return (
    <div className="policy-page">
      <div className="policy-container">
        <h1>Cookie Policy</h1>
        <p className="last-updated">Last Updated: March 26, 2026</p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            This Cookie Policy explains how Comprehensive Local Ecosystem ("we," "our," or "us") 
            uses cookies and similar technologies to recognize you when you visit our web application.
          </p>
        </section>

        <section>
          <h2>2. What Are Cookies?</h2>
          <p>
            Cookies are small data files placed on your device when you visit a website. They help 
            the website remember information about your visit and make the site easier to use.
          </p>
        </section>

        <section>
          <h2>3. Cookies We Use</h2>
          
          <h3>3.1 Essential Cookies</h3>
          <p>These cookies are necessary for the Service to function:</p>
          
          <table className="cookie-table">
            <thead>
              <tr>
                <th>Cookie Name</th>
                <th>Purpose</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>accessToken</td>
                <td>Authentication - maintains your logged-in session</td>
                <td>15 minutes</td>
              </tr>
              <tr>
                <td>refreshToken</td>
                <td>Token refresh - allows automatic session renewal</td>
                <td>7 days</td>
              </tr>
            </tbody>
          </table>
          
          <h3>3.2 Cookie Characteristics</h3>
          <ul>
            <li><strong>Type:</strong> httpOnly cookies</li>
            <li><strong>Security:</strong> Secure (HTTPS only in production)</li>
            <li><strong>SameSite:</strong> Strict</li>
          </ul>
        </section>

        <section>
          <h2>4. How We Use Cookies</h2>
          <p>We use cookies to:</p>
          <ul>
            <li>Keep you authenticated during your session</li>
            <li>Maintain secure login state</li>
            <li>Automatically refresh your access token</li>
            <li>Track device sessions for security</li>
            <li>Prevent unauthorized access</li>
          </ul>
        </section>

        <section>
          <h2>5. Managing Cookies</h2>
          
          <h3>5.1 Browser Settings</h3>
          <p>You can control or delete cookies through your browser settings:</p>
          <ul>
            <li><strong>Chrome:</strong> Settings → Privacy → Cookies</li>
            <li><strong>Firefox:</strong> Options → Privacy → Cookies</li>
            <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
            <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
          </ul>
          
          <h3>5.2 Impact of Disabling Cookies</h3>
          <p>If you disable essential cookies:</p>
          <ul>
            <li>You will need to log in repeatedly</li>
            <li>Session refresh will not work</li>
            <li>Some features may not function properly</li>
          </ul>
        </section>

        <section>
          <h2>6. Third-Party Cookies</h2>
          <p>
            We do not use third-party advertising or tracking cookies. Our cookies are used solely 
            for authentication and session management.
          </p>
        </section>

        <section>
          <h2>7. Cookie Retention</h2>
          <table className="cookie-table">
            <thead>
              <tr>
                <th>Cookie Type</th>
                <th>Retention Period</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>accessToken</td>
                <td>15 minutes</td>
              </tr>
              <tr>
                <td>refreshToken</td>
                <td>7 days</td>
              </tr>
            </tbody>
          </table>
          <p>
            Refresh tokens are automatically deleted from our database after 7 days or upon logout.
          </p>
        </section>

        <section>
          <h2>8. Updates to This Policy</h2>
          <p>
            We may update this Cookie Policy periodically. Any changes will be posted on this page 
            with an updated "Last Updated" date.
          </p>
        </section>

        <section>
          <h2>9. Contact Us</h2>
          <p>
            For questions about this Cookie Policy, please contact us through the application 
            support channels.
          </p>
        </section>

        <div className="policy-links">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
        </div>
      </div>
    </div>
  );
};

export default Cookies;
