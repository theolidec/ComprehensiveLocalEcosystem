// IMPORTANT: This component is the user-facing rendition of /PRIVACY.md at the
// repository root. Both files MUST be kept in sync — the rendered page is what
// binds you contractually with users. If you change one, change the other.
import React from 'react';
import { Link } from 'react-router-dom';

const Privacy = () => {
  return (
    <div className="policy-page">
      <div className="policy-container">
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last Updated: May 18, 2026</p>

        <section>
          <h2>0. Self-Hosted Software Notice</h2>
          <p>
            Comprehensive Local Ecosystem is open-source software distributed under the MIT License.
            It is intended to be <strong>self-hosted</strong> by individuals or organisations on
            their own infrastructure. There is no central hosted service operated by the project
            authors.
          </p>
          <p>
            In this document, <strong>"the Operator"</strong> means the natural or legal person who
            deploys and runs an instance of this software for themselves or for others.{' '}
            <strong>"You"</strong> means the data subject — the user of an instance.
          </p>
          <p>
            For any given instance, <strong>the Operator is the data controller</strong> within the
            meaning of Article 4(7) of the EU General Data Protection Regulation (GDPR). Operators
            must complete Section 1 below with their own identity and contact details before making
            the instance available to other users. The project authors are <strong>not</strong> the
            controller of any data you submit to an instance.
          </p>
          <p>
            This document is a <strong>template</strong> — Operators are responsible for verifying
            its accuracy against their own deployment, customising it where necessary, and obtaining
            independent legal advice for any non-trivial or commercial use.
          </p>
        </section>

        <section>
          <h2>1. Identity and Contact Details of the Controller (Art. 13(1)(a)–(b))</h2>
          <p>
            The Operator of this instance must complete this section before public deployment.
            Until completed, treat the placeholders below as outstanding obligations:
          </p>
          <ul>
            <li><strong>Controller name:</strong> <em>[Operator legal name to be inserted]</em></li>
            <li><strong>Postal address:</strong> <em>[Operator postal address to be inserted]</em></li>
            <li><strong>Email for privacy enquiries:</strong> <em>[Operator privacy contact email to be inserted]</em></li>
            <li><strong>Data Protection Officer (DPO):</strong> Not appointed unless required under GDPR Art. 37. If appointed, the Operator must list the DPO's contact details here.</li>
          </ul>
        </section>

        <section>
          <h2>2. Introduction</h2>
          <p>
            This Privacy Policy explains how this instance of Comprehensive Local Ecosystem
            collects, uses, discloses, and safeguards your information when you use it.
          </p>
          <p>
            By accessing or using the Service, you agree to this Privacy Policy. If you do not
            agree with the terms of this policy, please do not use the Service.
          </p>
        </section>

        <section>
          <h2>3. Information We Collect</h2>

          <h3>3.1 Personal Information</h3>
          <ul>
            <li><strong>Account Information:</strong> Email address, name, and password (hashed)</li>
            <li><strong>Login Data:</strong> Last login timestamp, login attempts, device information (IP address, user-agent)</li>
            <li><strong>Calendar Data:</strong> Events, categories, and preferences you create</li>
            <li><strong>Password Manager Data:</strong> Encrypted passwords, password categories, and associated metadata</li>
            <li><strong>File Manager Data:</strong> File metadata (names, sizes, types), folder structure, and user content</li>
            <li><strong>Wishlist Data:</strong> Wishlist items, categories, reservations, public sharing preferences, and display settings (such as default items per page and cookie persistence preferences)</li>
            <li><strong>Calculator Data:</strong> Saved calculator states and mathematical objects (stored locally)</li>
          </ul>

          <h3>3.2 Automatically Collected Information</h3>
          <ul>
            <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
            <li><strong>Session Tracking:</strong> IP addresses and User-Agent strings are stored in refresh tokens to track device sessions and prevent unauthorized access</li>
            <li><strong>Usage Data:</strong> Access times, pages viewed, features used</li>
            <li><strong>Cookies:</strong> Authentication tokens (access and refresh tokens stored as httpOnly cookies)</li>
          </ul>
        </section>

        <section>
          <h2>4. Legal Basis for Processing (Art. 6 &amp; 13(1)(c))</h2>
          <p>The Operator processes your personal data on the following legal bases:</p>
          <table className="cookie-table">
            <thead>
              <tr>
                <th>Processing purpose</th>
                <th>Legal basis (Art. 6(1))</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Creating and maintaining your account; authenticating you; running the features you use</td>
                <td>(b) performance of the contract you enter into by registering</td>
              </tr>
              <tr>
                <td>Storing IP addresses and User-Agent strings in refresh tokens; logging failed login attempts; account lockout</td>
                <td>(f) the Operator's legitimate interest in keeping the Service secure and preventing unauthorised access</td>
              </tr>
              <tr>
                <td>Storing display preferences (e.g., wishlist items per page) in cookies</td>
                <td>(a) your consent, withdrawable at any time in Settings</td>
              </tr>
              <tr>
                <td>Sending service-related communications (security alerts, password resets)</td>
                <td>(b) performance of the contract</td>
              </tr>
              <tr>
                <td>Complying with legal obligations the Operator may be subject to</td>
                <td>(c) compliance with a legal obligation</td>
              </tr>
            </tbody>
          </table>
          <p>
            The Service does <strong>not</strong> process special-category data (Art. 9) or perform
            automated decision-making with legal or similarly significant effects (Art. 22). See
            Section 12.
          </p>
        </section>

        <section>
          <h2>5. How We Use Your Information</h2>
          <p>The Operator uses your information to:</p>
          <ul>
            <li>Provide and maintain the Service</li>
            <li>Authenticate your account and manage sessions</li>
            <li>Improve and personalize your experience</li>
            <li>Send you service-related communications</li>
            <li>Monitor and analyze usage patterns</li>
            <li>Detect and prevent fraud or unauthorized access</li>
          </ul>
        </section>

        <section>
          <h2>6. Data Storage and Security</h2>

          <h3>6.1 Data Storage</h3>
          <ul>
            <li>Your personal data is stored in a MongoDB database operated by the Operator</li>
            <li>Passwords are hashed using bcrypt with 12 salt rounds (the hash is irreversible; the Operator cannot recover your password)</li>
            <li>Authentication tokens are stored as httpOnly, secure cookies</li>
          </ul>

          <h3>6.2 Security Measures</h3>
          <ul>
            <li>JWT-based authentication with 15-minute access tokens</li>
            <li>Refresh tokens valid for 7 days with device tracking</li>
            <li>Rate limiting to prevent brute force attacks</li>
            <li>Account locking after 5 failed login attempts</li>
            <li>HTTPS encryption in production environments</li>
            <li>Helmet.js security headers</li>
            <li>Sensitive payment-card and saved-password fields are encrypted at rest</li>
          </ul>
        </section>

        <section>
          <h2>7. Data Sharing and Recipients (Art. 13(1)(e))</h2>
          <p>
            The Operator does not sell, trade, or otherwise transfer your personal information to
            outside parties except:
          </p>
          <ul>
            <li><strong>Service providers (sub-processors)</strong> acting on the Operator's instructions — e.g., the hosting provider running the database server, an email-delivery provider used for transactional email (if configured by the Operator), and similar infrastructure suppliers. The Operator must list current sub-processors here for their instance.</li>
            <li><strong>Legal obligations</strong> when required by applicable law or a binding order from a competent authority.</li>
            <li><strong>Protection of rights</strong> — to defend the Operator's legal rights, safety, or property, or those of users.</li>
          </ul>
          <p>The project authors are not recipients of any user data.</p>
        </section>

        <section>
          <h2>8. International Transfers (Art. 13(1)(f), 44–49)</h2>
          <p>
            Whether your data is transferred outside the European Economic Area (EEA) depends
            entirely on <strong>where the Operator hosts the instance and which sub-processors
            they use</strong>. The Operator must complete this section for their deployment:
          </p>
          <ul>
            <li><strong>Hosting region for this instance:</strong> <em>[Operator to specify, e.g., "EU — Frankfurt, Germany" or "USA — us-east-1"]</em></li>
            <li><strong>Sub-processors involved in transfers:</strong> <em>[Operator to list]</em></li>
            <li><strong>Safeguards (if transfers leave the EEA):</strong> Standard Contractual Clauses (Commission Implementing Decision (EU) 2021/914), supplementary measures per Schrems II, and/or adequacy decisions where applicable.</li>
          </ul>
          <p>If no transfers leave the EEA, the Operator should state so explicitly here.</p>
        </section>

        <section>
          <h2>9. Your Rights</h2>
          <p>Under the GDPR you have the right to:</p>
          <ul>
            <li><strong>Access</strong> your personal data (Art. 15) — View all data the Operator holds about you</li>
            <li><strong>Rectify</strong> inaccurate data (Art. 16) — Update your name or email address</li>
            <li><strong>Erase</strong> your data (Art. 17, "right to be forgotten") — Permanently delete your account and all associated data</li>
            <li><strong>Restrict processing</strong> (Art. 18) — Ask the Operator to pause processing in defined circumstances</li>
            <li><strong>Data portability</strong> (Art. 20) — Download a copy of the data you provided in a structured, machine-readable format (JSON)</li>
            <li><strong>Object</strong> to processing based on legitimate interests (Art. 21)</li>
            <li><strong>Withdraw consent</strong> at any time (Art. 7(3)) for any processing based on consent, without affecting the lawfulness of processing carried out before withdrawal</li>
          </ul>
          <p>
            To exercise these rights, use the built-in features in your account settings or contact
            the Operator using the address in Section 1. The Operator will respond within one month
            (Art. 12(3)).
          </p>

          <h3>Using Your Rights</h3>
          <ul>
            <li><strong>Access:</strong> Go to Settings → Account → View My Data</li>
            <li><strong>Correct:</strong> Go to Settings → Account → Edit Profile</li>
            <li><strong>Export:</strong> Go to Settings → Account → Download My Data</li>
            <li><strong>Delete:</strong> Go to Settings → Account → Delete Account (requires password confirmation)</li>
          </ul>
          <p>
            <em>Note on Art. 20 portability:</em> encrypted credential vault entries (saved passwords
            and payment-card details) are exported as ciphertext that only this instance can decrypt.
            To obtain plaintext copies, view the entry in the application before requesting deletion.
          </p>
        </section>

        <section>
          <h2>10. Data Retention</h2>
          <ul>
            <li><strong>Account data:</strong> Retained while account is active; permanently deleted within 30 days of an erasure request</li>
            <li><strong>Authentication tokens:</strong> Automatically expire (15 minutes for access, 7 days for refresh); expired refresh tokens are pruned daily by an automated job</li>
            <li><strong>Login history:</strong> Retained for up to 90 days for security incident review, then purged</li>
            <li><strong>Calendar data:</strong> Retained until you delete it or your account</li>
            <li><strong>Password data:</strong> Retained until you delete passwords or your account</li>
            <li><strong>File data:</strong> Retained until you delete files or your account; trash items purged after 30 days</li>
            <li><strong>Wishlist data:</strong> Retained until you delete items or your account</li>
            <li><strong>Calculator states:</strong> Stored locally in your browser, retained until cleared</li>
          </ul>
        </section>

        <section>
          <h2>11. Children's Privacy</h2>
          <p>
            The Service is not intended for users under 13 years of age (or the higher age threshold
            set by your Member State under GDPR Art. 8 — up to 16 in some jurisdictions). The
            Operator does not knowingly collect personal information from children below the
            applicable age. If the Operator becomes aware that such data has been collected without
            verifiable parental consent, it will be deleted promptly.
          </p>
        </section>

        <section>
          <h2>12. Automated Decision-Making (Art. 13(2)(f) &amp; 22)</h2>
          <p>
            The Service does <strong>not</strong> carry out automated decision-making, including
            profiling, that produces legal effects concerning you or similarly significantly affects
            you within the meaning of Art. 22 GDPR.
          </p>
        </section>

        <section>
          <h2>13. Right to Lodge a Complaint (Art. 13(2)(d))</h2>
          <p>
            Without prejudice to any other administrative or judicial remedy, you have the right to
            lodge a complaint with a supervisory authority — in particular in the EU Member State of
            your habitual residence, place of work, or place of the alleged infringement.
          </p>
          <p>For reference, the supervisory authority in <strong>Sweden</strong> is:</p>
          <blockquote>
            Integritetsskyddsmyndigheten (IMY) —{' '}
            <a href="https://www.imy.se/" target="_blank" rel="noopener noreferrer">https://www.imy.se/</a>
          </blockquote>
          <p>
            A full list of EU/EEA supervisory authorities is published by the European Data
            Protection Board at{' '}
            <a href="https://edpb.europa.eu/about-edpb/about-edpb/members_en" target="_blank" rel="noopener noreferrer">edpb.europa.eu/about-edpb/about-edpb/members_en</a>.
          </p>
        </section>

        <section>
          <h2>14. Changes to This Policy</h2>
          <p>
            The Operator may update this Privacy Policy from time to time. Material changes will be
            communicated by posting the updated policy on this page and updating the "Last Updated"
            date. Where required by law, the Operator will obtain renewed consent.
          </p>
        </section>

        <section>
          <h2>15. Contact Us</h2>
          <p>
            For any questions about this Privacy Policy or to exercise your rights, contact the
            Operator using the address in Section 1.
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
