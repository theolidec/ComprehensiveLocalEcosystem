import React from 'react';
import { Link } from 'react-router-dom';

const Terms = () => {
  return (
    <div className="policy-page">
      <div className="policy-container">
        <h1>Terms of Service</h1>
        <p className="last-updated">Last Updated: March 26, 2026</p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using Comprehensive Local Ecosystem ("the Service"), you accept and 
            agree to be bound by the terms and provisions of this agreement.
          </p>
        </section>

        <section>
          <h2>2. Description of Service</h2>
          <p>Comprehensive Local Ecosystem is a web application providing:</p>
          <ul>
            <li>User authentication and account management</li>
            <li>Calendar and event management</li>
            <li>Category organization for events</li>
            <li>User settings and preferences</li>
          </ul>
        </section>

        <section>
          <h2>3. User Accounts</h2>
          
          <h3>3.1 Registration</h3>
          <ul>
            <li>You must provide accurate and complete registration information</li>
            <li>You are responsible for maintaining the security of your account</li>
            <li>You must be at least 13 years of age to create an account</li>
          </ul>
          
          <h3>3.2 Account Responsibilities</h3>
          <ul>
            <li>You are solely responsible for all activities under your account</li>
            <li>You must notify us immediately of any unauthorized use</li>
            <li>You must maintain the confidentiality of your password</li>
          </ul>
          
          <h3>3.3 Account Security</h3>
          <ul>
            <li>Accounts are locked after 5 failed login attempts</li>
            <li>Failed login attempts are tracked for security purposes</li>
            <li>We reserve the right to terminate accounts that violate these terms</li>
          </ul>
        </section>

        <section>
          <h2>4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to any part of the Service</li>
            <li>Interfere with or disrupt the Service</li>
            <li>Transmit viruses or other harmful code</li>
            <li>Collect or store personal data about other users without consent</li>
            <li>Impersonate any person or entity</li>
          </ul>
        </section>

        <section>
          <h2>5. User Content</h2>
          
          <h3>5.1 Your Content</h3>
          <ul>
            <li>You retain ownership of content you create (calendar events, categories)</li>
            <li>You are responsible for content you submit to the Service</li>
            <li>You grant us license to use content for Service operation</li>
          </ul>
          
          <h3>5.2 Content Guidelines</h3>
          <ul>
            <li>Content must not violate any third-party rights</li>
            <li>Content must not contain harmful, offensive, or illegal material</li>
            <li>We reserve the right to remove content that violates these terms</li>
          </ul>
        </section>

        <section>
          <h2>6. Intellectual Property</h2>
          <p>
            The Service and its original content are owned by us. Trademarks, logos, and service 
            marks are protected. You may not copy, modify, or distribute our property without permission.
          </p>
        </section>

        <section>
          <h2>7. Limitation of Liability</h2>
          <p>
            The Service is provided "as is" without warranties of any kind. We shall not be liable for:
          </p>
          <ul>
            <li>Indirect, incidental, or consequential damages</li>
            <li>Loss of data or profits</li>
            <li>Service interruptions or errors</li>
          </ul>
        </section>

        <section>
          <h2>8. Indemnification</h2>
          <p>
            You agree to indemnify and hold us harmless from any claims, damages, or expenses 
            arising from your use of the Service or violation of these terms.
          </p>
        </section>

        <section>
          <h2>9. Termination</h2>
          
          <h3>9.1 User Termination</h3>
          <ul>
            <li>You may delete your account at any time</li>
            <li>Upon deletion, your personal data will be removed</li>
          </ul>
          
          <h3>9.2 Service Termination</h3>
          <ul>
            <li>We may terminate or suspend your account for violations</li>
            <li>We may modify or discontinue the Service with notice</li>
          </ul>
        </section>

        <section>
          <h2>10. Modifications to Terms</h2>
          <p>
            We may modify these terms at any time. Continued use of the Service after modifications 
            constitutes acceptance of new terms.
          </p>
        </section>

        <section>
          <h2>11. Governing Law</h2>
          <p>
            These terms shall be governed by applicable laws. Any disputes shall be resolved in 
            accordance with legal requirements.
          </p>
        </section>

        <section>
          <h2>12. Contact Information</h2>
          <p>
            For questions about these Terms of Service, please contact us through the application.
          </p>
        </section>

        <div className="policy-links">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/cookies">Cookie Policy</Link>
        </div>
      </div>
    </div>
  );
};

export default Terms;
