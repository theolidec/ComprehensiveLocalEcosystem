// IMPORTANT: This component is the user-facing rendition of /TERMS.md at the
// repository root. Both files MUST be kept in sync — the rendered page is what
// binds you contractually with users. If you change one, change the other.
import React from 'react';
import { Link } from 'react-router-dom';

const Terms = () => {
  return (
    <div className="policy-page">
      <div className="policy-container">
        <h1>Terms of Service</h1>
        <p className="last-updated">Last Updated: May 18, 2026</p>

        <section>
          <h2>0. Self-Hosted Software Notice</h2>
          <p>
            Comprehensive Local Ecosystem is open-source software distributed under the MIT License
            (see <code>LICENSE</code> at the repository root). It is intended to be{' '}
            <strong>self-hosted</strong>: any natural or legal person (the "Operator") may deploy
            an instance for themselves or for others.
          </p>
          <p>
            This document is a <strong>template</strong> governing the relationship between an
            Operator and the end users of that Operator's instance. The project authors are{' '}
            <strong>not</strong> a party to that relationship and provide no warranty or service
            obligation beyond those granted by the MIT License covering the source code itself.
          </p>
          <p>
            Operators must complete the placeholders in Sections 1, 11, and 12 before making the
            Service available to other users.
          </p>
        </section>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using this instance of Comprehensive Local Ecosystem ("the Service"),
            you accept and agree to be bound by the terms and provisions of this agreement, as
            configured by the Operator named in Section 12.
          </p>
          <p>If you do not accept these terms, you must not register an account or use the Service.</p>
        </section>

        <section>
          <h2>2. Description of Service</h2>
          <p>Comprehensive Local Ecosystem is a web application providing:</p>
          <ul>
            <li>User authentication and account management</li>
            <li>Calendar and event management</li>
            <li>Category organization for events</li>
            <li>User settings and preferences</li>
            <li>Password manager with encrypted storage</li>
            <li>File manager with upload, download, and sharing capabilities</li>
            <li>Wishlist management with public sharing and reservations</li>
            <li>Interactive graphing calculator for mathematical visualization</li>
            <li>Social features including user following and public profiles</li>
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
            <li>You retain ownership of content you create (calendar events, categories, files, passwords, wishlists, calculator states)</li>
            <li>You are responsible for content you submit to the Service</li>
            <li>You grant us license to use content for Service operation</li>
            <li>File uploads must comply with all applicable laws and regulations</li>
            <li>Public wishlist items may be viewed by other users</li>
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

          <h3>6.1 Source code</h3>
          <p>
            The <strong>source code</strong> of Comprehensive Local Ecosystem is licensed under the
            MIT License. Anyone is free to copy, modify, fork, and redistribute the source code
            under the terms of that licence. Nothing in these Terms restricts the rights you have
            under the MIT License with respect to the source code.
          </p>

          <h3>6.2 The hosted instance, deployment, and Operator's marks</h3>
          <p>What is <strong>not</strong> covered by the MIT License, and what these Terms protect, is:</p>
          <ul>
            <li>The Operator's running deployment, infrastructure, and configuration of the Service</li>
            <li>Any trademarks, logos, service marks, brand names, and domain names of the Operator</li>
            <li>Any content created or curated by the Operator that is not part of the upstream open-source repository</li>
            <li>Other users' personal data and submitted content</li>
          </ul>
          <p>
            You may not copy, scrape, mirror, or pass off the Operator's deployment as your own
            without permission, and you may not use the Operator's marks without permission. These
            restrictions do not apply to the source code, which you may obtain and self-host under
            the MIT License.
          </p>
        </section>

        <section>
          <h2>7. Limitation of Liability</h2>
          <p>
            <strong>To the maximum extent permitted by applicable law</strong>, the Service is
            provided "as is" and "as available" without warranties of any kind, and the Operator
            shall not be liable for:
          </p>
          <ul>
            <li>Indirect, incidental, special, or consequential damages</li>
            <li>Loss of data, profits, revenue, or business opportunity</li>
            <li>Service interruptions or errors not caused by the Operator's gross negligence or wilful misconduct</li>
          </ul>
          <p>
            <strong>Consumer-protection carve-out.</strong> If you use the Service as a consumer
            (i.e., for purposes outside your trade, business, craft, or profession) and you reside
            in a jurisdiction whose mandatory consumer-protection rules limit or prohibit the
            exclusions above, those mandatory rules prevail and the exclusions apply only to the
            extent permitted by such law. In particular, nothing in this Section 7 limits liability
            for:
          </p>
          <ul>
            <li>Death or personal injury caused by negligence</li>
            <li>Fraud or fraudulent misrepresentation</li>
            <li>Gross negligence or wilful misconduct</li>
            <li>Any other liability that cannot be limited or excluded under applicable consumer law (including, for EU/EEA consumers, mandatory provisions of Council Directive 93/13/EEC and Directive 2011/83/EU)</li>
          </ul>
        </section>

        <section>
          <h2>8. Indemnification</h2>
          <p>
            You agree to indemnify and hold the Operator harmless from third-party claims, damages,
            or expenses to the extent arising from (a) your unlawful use of the Service or (b) your
            wilful or grossly negligent breach of these Terms. This obligation does not extend to
            claims caused by the Operator's own negligence or wilful misconduct, and — where you
            act as a consumer — only applies to the extent permitted by mandatory consumer-protection
            law.
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
          <h2>11. Governing Law and Dispute Resolution</h2>

          <h3>11.1 Choice of law</h3>
          <p>
            These terms shall be governed by the laws of the country in which the Operator is
            established — by default, <strong>the laws of Sweden</strong> —{' '}
            <strong>without prejudice to the mandatory consumer-protection provisions of the country
            in which you, as a consumer, have your habitual residence</strong> (Article 6 of
            Regulation (EC) No 593/2008, "Rome I"). Where mandatory consumer-protection rules of
            your country of residence offer you greater protection, those rules apply notwithstanding
            the choice of law above.
          </p>

          <h3>11.2 Jurisdiction</h3>
          <p>
            Any disputes shall be resolved before the competent courts of the Operator's country of
            establishment. Consumers retain any non-derogable right to bring or be sued in the courts
            of the country of their habitual residence under Articles 17–19 of Regulation (EU) No
            1215/2012 ("Brussels Ia").
          </p>

          <h3>11.3 Online dispute resolution (EU consumers)</h3>
          <p>
            For EU consumers, the European Commission provides an Online Dispute Resolution (ODR)
            platform pursuant to Regulation (EU) No 524/2013, accessible at:
          </p>
          <blockquote>
            <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer">
              https://ec.europa.eu/consumers/odr/
            </a>
          </blockquote>
          <p>
            The Operator is not currently obliged to participate in alternative dispute resolution
            proceedings before a consumer arbitration board, but will respond in good faith to any
            communication received via the ODR platform.
          </p>
        </section>

        <section>
          <h2>12. Contact Information</h2>
          <p>
            For questions about these Terms of Service, please contact the Operator. The Operator
            must complete the entries below before public deployment:
          </p>
          <ul>
            <li><strong>Operator legal name:</strong> <em>[Operator legal name to be inserted]</em></li>
            <li><strong>Operator postal address:</strong> <em>[Operator postal address to be inserted]</em></li>
            <li><strong>Operator contact email:</strong> <em>[Operator contact email to be inserted]</em></li>
          </ul>
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
