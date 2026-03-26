# Privacy Policy

**Last Updated:** March 26, 2026

## 1. Introduction

Comprehensive Local Ecosystem ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our web application.

By accessing or using our Service, you agree to this Privacy Policy. If you do not agree with the terms of this policy, please do not use our Service.

## 2. Information We Collect

### 2.1 Personal Information
- **Account Information**: Email address, name, and password (encrypted)
- **Login Data**: Last login timestamp, login attempts, device information (IP address, user-agent)
- **Calendar Data**: Events, categories, and preferences you create

### 2.2 Automatically Collected Information
- **Device Information**: IP address, browser type, operating system
- **Usage Data**: Access times, pages viewed, features used
- **Cookies**: Authentication tokens (access and refresh tokens stored as httpOnly cookies)

## 3. How We Use Your Information

We use your information to:
- Provide and maintain our Service
- Authenticate your account and manage sessions
- Improve and personalize your experience
- Send you service-related communications
- Monitor and analyze usage patterns
- Detect and prevent fraud or unauthorized access

## 4. Data Storage and Security

### 4.1 Data Storage
- Your personal data is stored in MongoDB database
- Passwords are hashed using bcrypt with 12 salt rounds
- Authentication tokens are stored as httpOnly, secure cookies

### 4.2 Security Measures
- JWT-based authentication with 15-minute access tokens
- Refresh tokens valid for 7 days with device tracking
- Rate limiting to prevent brute force attacks
- Account locking after 5 failed login attempts
- HTTPS encryption in production environments
- Helmet.js security headers

## 5. Data Sharing

We do not sell, trade, or otherwise transfer your personal information to outside parties except:
- Service providers who assist us in operating our application
- Legal obligations when required by law
- Protection of our rights, safety, or property

## 6. Your Rights

You have the right to:
- Access your personal data
- Correct inaccurate data
- Request deletion of your data
- Export your data
- Opt-out of marketing communications

To exercise these rights, please contact us through the application.

## 7. Data Retention

- Account data: Retained while account is active
- Authentication tokens: Automatically expire (15 minutes for access, 7 days for refresh)
- Login history: Retained for security purposes
- Calendar data: Retained until you delete it or your account

## 8. Children's Privacy

Our Service is not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13.

## 9. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date.

## 10. Contact Us

If you have questions about this Privacy Policy, please contact us through the application support channels.
