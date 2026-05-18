# Privacy Policy

**Last Updated:** May 18, 2026

## 0. Self-Hosted Software Notice

Comprehensive Local Ecosystem is open-source software distributed under the MIT License. It is intended to be **self-hosted** by individuals or organisations on their own infrastructure. There is no central hosted service operated by the project authors.

In this document, **"the Operator"** means the natural or legal person who deploys and runs an instance of this software for themselves or for others. **"You"** means the data subject — the user of an instance.

For any given instance, **the Operator is the data controller** within the meaning of Article 4(7) of the EU General Data Protection Regulation (GDPR). Operators must complete Section 1 below with their own identity and contact details before making the instance available to other users. The project authors are **not** the controller of any data you submit to an instance.

This document is a **template** — Operators are responsible for verifying its accuracy against their own deployment, customising it where necessary, and obtaining independent legal advice for any non-trivial or commercial use.

## 1. Identity and Contact Details of the Controller (Art. 13(1)(a)–(b))

The Operator of this instance must complete this section before public deployment. Until completed, treat the placeholders below as outstanding obligations:

- **Controller name:** _[Operator legal name to be inserted]_
- **Postal address:** _[Operator postal address to be inserted]_
- **Email for privacy enquiries:** _[Operator privacy contact email to be inserted]_
- **Data Protection Officer (DPO):** Not appointed unless required under GDPR Art. 37. If appointed, the Operator must list the DPO's contact details here.

## 2. Introduction

This Privacy Policy explains how this instance of Comprehensive Local Ecosystem collects, uses, discloses, and safeguards your information when you use it.

By accessing or using the Service, you agree to this Privacy Policy. If you do not agree with the terms of this policy, please do not use the Service.

## 3. Information We Collect

### 3.1 Personal Information
- **Account Information**: Email address, name, and password (hashed)
- **Login Data**: Last login timestamp, login attempts, device information (IP address, user-agent)
- **Calendar Data**: Events, categories, and preferences you create
- **Password Manager Data**: Encrypted passwords, password categories, and associated metadata
- **File Manager Data**: File metadata (names, sizes, types), folder structure, and user content
- **Wishlist Data**: Wishlist items, categories, reservations, public sharing preferences, and display settings (such as default items per page and cookie persistence preferences)
- **Calculator Data**: Saved calculator states and mathematical objects (stored locally)

### 3.2 Automatically Collected Information
- **Device Information**: IP address, browser type, operating system
- **Session Tracking**: IP addresses and User-Agent strings are stored in refresh tokens to track device sessions and prevent unauthorized access
- **Usage Data**: Access times, pages viewed, features used
- **Cookies**: Authentication tokens (access and refresh tokens stored as httpOnly cookies)

## 4. Legal Basis for Processing (Art. 6 & 13(1)(c))

The Operator processes your personal data on the following legal bases:

| Processing purpose | Legal basis (Art. 6(1)) |
|---|---|
| Creating and maintaining your account; authenticating you; running the features you use | (b) performance of the contract you enter into by registering |
| Storing IP addresses and User-Agent strings in refresh tokens; logging failed login attempts; account lockout | (f) the Operator's legitimate interest in keeping the Service secure and preventing unauthorised access |
| Storing display preferences (e.g., wishlist items per page) in cookies | (a) your consent, withdrawable at any time in Settings |
| Sending service-related communications (security alerts, password resets) | (b) performance of the contract |
| Complying with legal obligations the Operator may be subject to | (c) compliance with a legal obligation |

The Service does **not** process special-category data (Art. 9) or perform automated decision-making with legal or similarly significant effects (Art. 22). See Section 12.

## 5. How We Use Your Information

The Operator uses your information to:
- Provide and maintain the Service
- Authenticate your account and manage sessions
- Improve and personalize your experience
- Send you service-related communications
- Monitor and analyze usage patterns
- Detect and prevent fraud or unauthorized access

## 6. Data Storage and Security

### 6.1 Data Storage
- Your personal data is stored in a MongoDB database operated by the Operator
- Passwords are hashed using bcrypt with 12 salt rounds (the hash is irreversible; the Operator cannot recover your password)
- Authentication tokens are stored as httpOnly, secure cookies

### 6.2 Security Measures
- JWT-based authentication with 15-minute access tokens
- Refresh tokens valid for 7 days with device tracking
- Rate limiting to prevent brute force attacks
- Account locking after 5 failed login attempts
- HTTPS encryption in production environments
- Helmet.js security headers
- Sensitive payment-card and saved-password fields are encrypted at rest

## 7. Data Sharing and Recipients (Art. 13(1)(e))

The Operator does not sell, trade, or otherwise transfer your personal information to outside parties except:
- **Service providers (sub-processors)** acting on the Operator's instructions — e.g., the hosting provider running the database server, an email-delivery provider used for transactional email (if configured by the Operator), and similar infrastructure suppliers. The Operator must list current sub-processors here for their instance.
- **Legal obligations** when required by applicable law or a binding order from a competent authority.
- **Protection of rights** — to defend the Operator's legal rights, safety, or property, or those of users.

The project authors are not recipients of any user data.

## 8. International Transfers (Art. 13(1)(f), 44–49)

Whether your data is transferred outside the European Economic Area (EEA) depends entirely on **where the Operator hosts the instance and which sub-processors they use**. The Operator must complete this section for their deployment:

- **Hosting region for this instance:** _[Operator to specify, e.g., "EU — Frankfurt, Germany" or "USA — us-east-1"]_
- **Sub-processors involved in transfers:** _[Operator to list]_
- **Safeguards (if transfers leave the EEA):** Standard Contractual Clauses (Commission Implementing Decision (EU) 2021/914), supplementary measures per Schrems II, and/or adequacy decisions where applicable.

If no transfers leave the EEA, the Operator should state so explicitly here.

## 9. Your Rights

Under the GDPR you have the right to:
- **Access** your personal data (Art. 15) — View all data the Operator holds about you
- **Rectify** inaccurate data (Art. 16) — Update your name or email address
- **Erase** your data (Art. 17, "right to be forgotten") — Permanently delete your account and all associated data
- **Restrict processing** (Art. 18) — Ask the Operator to pause processing in defined circumstances
- **Data portability** (Art. 20) — Download a copy of the data you provided in a structured, machine-readable format (JSON)
- **Object** to processing based on legitimate interests (Art. 21)
- **Withdraw consent** at any time (Art. 7(3)) for any processing based on consent, without affecting the lawfulness of processing carried out before withdrawal

To exercise these rights, use the built-in features in your account settings or contact the Operator using the address in Section 1. The Operator will respond within one month (Art. 12(3)).

### Using Your Rights

- **Access**: Go to Settings → Account → View My Data
- **Correct**: Go to Settings → Account → Edit Profile
- **Export**: Go to Settings → Account → Download My Data
- **Delete**: Go to Settings → Account → Delete Account (requires password confirmation)

Note on Art. 20 portability: encrypted credential vault entries (saved passwords and payment-card details) are exported as ciphertext that only this instance can decrypt. To obtain plaintext copies, view the entry in the application before requesting deletion.

## 10. Data Retention

- Account data: Retained while account is active; permanently deleted within 30 days of an erasure request
- Authentication tokens: Automatically expire (15 minutes for access, 7 days for refresh); expired refresh tokens are pruned daily by an automated job
- Login history: Retained for up to 90 days for security incident review, then purged
- Calendar data: Retained until you delete it or your account
- Password data: Retained until you delete passwords or your account
- File data: Retained until you delete files or your account; trash items purged after 30 days
- Wishlist data: Retained until you delete items or your account
- Calculator states: Stored locally in your browser, retained until cleared

## 11. Children's Privacy

The Service is not intended for users under 13 years of age (or the higher age threshold set by your Member State under GDPR Art. 8 — up to 16 in some jurisdictions). The Operator does not knowingly collect personal information from children below the applicable age. If the Operator becomes aware that such data has been collected without verifiable parental consent, it will be deleted promptly.

## 12. Automated Decision-Making (Art. 13(2)(f) & 22)

The Service does **not** carry out automated decision-making, including profiling, that produces legal effects concerning you or similarly significantly affects you within the meaning of Art. 22 GDPR.

## 13. Right to Lodge a Complaint (Art. 13(2)(d))

Without prejudice to any other administrative or judicial remedy, you have the right to lodge a complaint with a supervisory authority — in particular in the EU Member State of your habitual residence, place of work, or place of the alleged infringement.

For reference, the supervisory authority in **Sweden** is:

> Integritetsskyddsmyndigheten (IMY) — https://www.imy.se/

A full list of EU/EEA supervisory authorities is published by the European Data Protection Board at https://edpb.europa.eu/about-edpb/about-edpb/members_en.

## 14. Changes to This Policy

The Operator may update this Privacy Policy from time to time. Material changes will be communicated by posting the updated policy on this page and updating the "Last Updated" date. Where required by law, the Operator will obtain renewed consent.

## 15. Contact Us

For any questions about this Privacy Policy or to exercise your rights, contact the Operator using the address in Section 1.
