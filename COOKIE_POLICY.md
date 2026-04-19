# Cookie Policy

**Last Updated:** April 17, 2026

## 1. Introduction

This Cookie Policy explains how Oasis ("we," "our," or "us") uses cookies and similar technologies to recognize you when you visit our web application.

## 2. What Are Cookies?

Cookies are small data files placed on your device when you visit a website. They help the website remember information about your visit and make the site easier to use.

## 3. Cookies We Use

### 3.1 Essential Cookies
These cookies are necessary for the Service to function:

| Cookie Name | Purpose | Duration |
|-------------|---------|----------|
| accessToken | Authentication - maintains your logged-in session | 15 minutes |
| refreshToken | Token refresh - allows automatic session renewal | 7 days |

- **Type**: httpOnly cookies
- **Security**: Secure (HTTPS only in production)
- **SameSite**: Strict

### 3.2 Cookie Characteristics
- **httpOnly**: Cannot be accessed via JavaScript (prevents XSS attacks)
- **Secure**: Only transmitted over HTTPS connections
- **SameSite**: Strict - not sent with cross-site requests

## 4. How We Use Cookies

We use cookies to:
- Keep you authenticated during your session
- Maintain secure login state
- Automatically refresh your access token
- Track device sessions for security
- Prevent unauthorized access

## 5. Managing Cookies

### 5.1 Browser Settings
You can control or delete cookies through your browser settings:
- **Chrome**: Settings → Privacy → Cookies
- **Firefox**: Options → Privacy → Cookies
- **Safari**: Preferences → Privacy → Cookies
- **Edge**: Settings → Cookies and site permissions

### 5.2 Impact of Disabling Cookies
If you disable essential cookies:
- You will need to log in repeatedly
- Session refresh will not work
- Some features may not function properly

## 6. Third-Party Cookies

We do not use third-party advertising or tracking cookies. Our cookies are used solely for authentication and session management.

## 7. Cookie Retention

| Cookie Type | Retention Period |
|-------------|------------------|
| accessToken | 15 minutes |
| refreshToken | 7 days |

Refresh tokens are automatically deleted from our database after 7 days or upon logout.

## 8. Updates to This Policy

We may update this Cookie Policy periodically. Any changes will be posted on this page with an updated "Last Updated" date.

## 9. Contact Us

For questions about this Cookie Policy, please contact us through the application support channels.
