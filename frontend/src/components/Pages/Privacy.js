import React from 'react';
import { Link } from 'react-router-dom';

const Privacy = () => {
  return (
    <div className="policy-page">
      <div className="policy-container">
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last Updated: March 26, 2026</p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            Comprehensive Local Ecosystem ("we," "our," or "us") is committed to protecting your privacy. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
            when you use our web application.
          </p>
          <p>
            By accessing or using our Service, you agree to this Privacy Policy. If you do not agree 
            with the terms of this policy, please do not use our Service.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          
          <h3>2.1 Personal Information</h3>
          <ul>
            <li><strong>Account Information:</strong> Email address, name, and password (encrypted)</li>
            <li><strong>Login Data:</strong> Last login timestamp, login attempts, device information (IP address, user-agent)</li>
            <li><strong>Calendar Data:</strong> Events, categories, and preferences you create</li>
          </ul>
          
          <h3>2.2 Automatically Collected Information</h3>
          <ul>
            <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
            <li><strong>Usage Data:</strong> Access times, pages viewed, features used</li>
            <li><strong>Cookies:</strong> Authentication tokens (access and refresh tokens stored as httpOnly cookies)</li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Provide and maintain our Service</li>
            <li>Authenticate your account and manage sessions</li>
            <li>Improve and personalize your experience</li>
            <li>Send you service-related communications</li>
            <li>Monitor and analyze usage patterns</li>
            <li>Detect and prevent fraud or unauthorized access</li>
          </ul>
        </section>

        <section>
          <h2>4. Data Storage and Security</h2>
          
          <h3>4.1 Data Storage</h3>
          <ul>
            <li>Your personal data is stored in MongoDB database</li>
            <li>Passwords are hashed using bcrypt with 12 salt rounds</li>
            <li>Authentication tokens are stored as httpOnly, secure cookies</li>
          </ul>
          
          <h3>4.2 Security Measures</h3>
          <ul>
            <li>JWT-based authentication with 15-minute access tokens</li>
            <li>Refresh tokens valid for 7 days with device tracking</li>
            <li>Rate limiting to prevent brute force attacks</li>
            <li>Account locking after 5 failed login attempts</li>
            <li>HTTPS encryption in production environments</li>
            <li>Helmet.js security headers</li>
          </ul>
        </section>

        <section>
          <h2>5. Data Sharing</h2>
          <p>
            We do not sell, trade, or otherwise transfer your personal information to outside parties except:
          </p>
          <ul>
            <li>Service providers who assist us in operating our application</li>
            <li>Legal obligations when required by law</li>
            <li>Protection of our rights, safety, or property</li>
          </ul>
        </section>

        <section>
          <h2>6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Export your data</li>
            <li>Opt-out of marketing communications</li>
          </ul>
          <p>To exercise these rights, please contact us through the application.</p>
        </section>

        <section>
          <h2>7. Data Retention</h2>
          <ul>
            <li><strong>Account data:</strong> Retained while account is active</li>
            <li><strong>Authentication tokens:</strong> Automatically expire (15 minutes for access, 7 days for refresh)</li>
            <li><strong>Login history:</strong> Retained for security purposes</li>
            <li><strong>Calendar data:</strong> Retained until you delete it or your account</li>
          </ul>
        </section>

        <section>
          <h2>8. Children's Privacy</h2>
          <p>
            Our Service is not intended for users under 13 years of age. We do not knowingly collect 
            personal information from children under 13.
          </p>
        </section>

        <section>
          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes 
            by posting the new policy on this page and updating the "Last Updated" date.
          </p>
        </section>

        <section>
          <h2>10. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us through the application 
            support channels.
          </p>
        </section>

        <div className="policy-links">
          <Link to="/terms">Terms of Service</Link>
          <Link to="/cookies">Cookie Policy</Link>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
